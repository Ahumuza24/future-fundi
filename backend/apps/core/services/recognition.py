from __future__ import annotations

from collections.abc import Iterable

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.core.models import (
    BadgeRecord,
    BadgeTemplate,
    CertificationRecord,
    CertificationTemplate,
    Evidence,
    Learner,
    MicrocredentialRecord,
    MicrocredentialTemplate,
)


def _validated_evidence(
    *, learner: Learner, evidence: Iterable[Evidence]
) -> list[Evidence]:
    rows = list(evidence)
    if not rows:
        raise ValidationError("Recognition issuance requires at least one evidence record.")

    for row in rows:
        if row.learner_id != learner.id:
            raise ValidationError("Evidence must belong to the learner receiving recognition.")
        if not row.is_usable_for_recognition:
            raise ValidationError("Evidence must be verified and backed by an approved artifact.")

    return rows


def _artifact_rows(evidence: list[Evidence]):
    return [row.artifact for row in evidence if row.artifact_id]


def _validate_correction(reason: str) -> str:
    clean_reason = reason.strip()
    if not clean_reason:
        raise ValidationError("Corrections require a non-empty correction reason.")
    return clean_reason


class BadgeIssuanceService:
    """Single write path for BadgeRecord issuance and corrections."""

    @staticmethod
    @transaction.atomic
    def issue(
        *,
        template: BadgeTemplate,
        learner: Learner,
        issuer,
        evidence: Iterable[Evidence],
        source: str = "digital",
        verification_ref: str = "",
        correction_of: BadgeRecord | None = None,
        correction_reason: str = "",
    ) -> BadgeRecord:
        evidence_rows = _validated_evidence(learner=learner, evidence=evidence)
        if correction_of is not None:
            correction_reason = _validate_correction(correction_reason)

        record = BadgeRecord.objects.create(
            template=template,
            learner=learner,
            issuer=issuer,
            status=BadgeRecord.STATUS_ISSUED,
            source=source,
            verification_ref=verification_ref,
            date_awarded=timezone.now(),
            correction_of=correction_of,
            correction_reason=correction_reason,
        )
        record.evidence.set(evidence_rows)
        record.artifacts.set(_artifact_rows(evidence_rows))
        record.full_clean()
        return record

    @staticmethod
    def issue_correction(
        *,
        original: BadgeRecord,
        issuer,
        evidence: Iterable[Evidence],
        reason: str,
    ) -> BadgeRecord:
        return BadgeIssuanceService.issue(
            template=original.template,
            learner=original.learner,
            issuer=issuer,
            evidence=evidence,
            source=original.source,
            verification_ref=original.verification_ref,
            correction_of=original,
            correction_reason=reason,
        )


class MicrocredentialIssuanceService:
    """Single write path for MicrocredentialRecord issuance and corrections."""

    @staticmethod
    @transaction.atomic
    def issue(
        *,
        template: MicrocredentialTemplate,
        learner: Learner,
        issuer,
        evidence: Iterable[Evidence],
        badge_records: Iterable[BadgeRecord] = (),
        correction_of: MicrocredentialRecord | None = None,
        correction_reason: str = "",
    ) -> MicrocredentialRecord:
        evidence_rows = _validated_evidence(learner=learner, evidence=evidence)
        if correction_of is not None:
            correction_reason = _validate_correction(correction_reason)
        if template.module is None:
            raise ValidationError("Microcredential template must be linked to a module.")

        record = MicrocredentialRecord.objects.create(
            template=template,
            learner=learner,
            module=template.module,
            issuer=issuer,
            status=MicrocredentialRecord.STATUS_ISSUED,
            date_issued=timezone.now(),
            correction_of=correction_of,
            correction_reason=correction_reason,
        )
        record.evidence.set(evidence_rows)
        record.artifacts.set(_artifact_rows(evidence_rows))
        record.badge_records.set(list(badge_records))
        record.full_clean()
        return record


class CertificationEligibilityService:
    """Eligibility and issuance checks for program certifications."""

    MIN_MICROCREDENTIALS = 3
    MAX_MICROCREDENTIALS = 5

    @classmethod
    def validate(
        cls,
        *,
        template: CertificationTemplate,
        learner: Learner,
        microcredential_records: Iterable[MicrocredentialRecord],
        capstone_evidence: Evidence,
    ) -> list[MicrocredentialRecord]:
        if template.program is None:
            raise ValidationError("Certification template must be linked to a program.")
        evidence_rows = _validated_evidence(learner=learner, evidence=[capstone_evidence])
        if not evidence_rows[0].artifact_id:
            raise ValidationError("Certification capstone evidence must link to an artifact.")

        records = list(microcredential_records)
        if not (cls.MIN_MICROCREDENTIALS <= len(records) <= cls.MAX_MICROCREDENTIALS):
            raise ValidationError("Certification requires 3 to 5 issued microcredentials.")
        for record in records:
            if record.learner_id != learner.id or record.status != MicrocredentialRecord.STATUS_ISSUED:
                raise ValidationError("Certification microcredentials must be issued to the learner.")
        return records

    @classmethod
    @transaction.atomic
    def issue(
        cls,
        *,
        template: CertificationTemplate,
        learner: Learner,
        reviewer,
        microcredential_records: Iterable[MicrocredentialRecord],
        capstone_evidence: Evidence,
        correction_of: CertificationRecord | None = None,
        correction_reason: str = "",
    ) -> CertificationRecord:
        records = cls.validate(
            template=template,
            learner=learner,
            microcredential_records=microcredential_records,
            capstone_evidence=capstone_evidence,
        )
        if correction_of is not None:
            correction_reason = _validate_correction(correction_reason)

        record = CertificationRecord.objects.create(
            template=template,
            learner=learner,
            program=template.program,
            reviewer=reviewer,
            capstone_artifact=capstone_evidence.artifact,
            status=CertificationRecord.STATUS_ISSUED,
            date_issued=timezone.now(),
            correction_of=correction_of,
            correction_reason=correction_reason,
        )
        record.microcredential_records.set(records)
        record.evidence.set([capstone_evidence])
        record.full_clean()
        return record
