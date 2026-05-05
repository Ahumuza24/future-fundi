from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase

from apps.core.models import (
    Artifact,
    BadgeRecord,
    BadgeTemplate,
    Evidence,
    Learner,
    LearningTask,
    Lesson,
    MicrocredentialRecord,
    MicrocredentialTemplate,
    Module,
    Pathway,
    Program,
    School,
    Track,
    Unit,
)
from apps.core.services.recognition import (
    BadgeIssuanceService,
    MicrocredentialIssuanceService,
)


class EvidenceRecognitionServiceTests(TestCase):
    def setUp(self) -> None:
        user_model = get_user_model()
        self.school = School.objects.create(name="Test School", code="TS")
        self.teacher = user_model.objects.create_user(
            username="teacher",
            email="teacher@example.com",
            password="pass",
            role="teacher",
            tenant=self.school,
        )
        self.learner = Learner.objects.create(
            first_name="Amina",
            last_name="Kato",
            tenant=self.school,
        )
        pathway = Pathway.objects.create(name="Robotics", status=Pathway.STATUS_ACTIVE)
        track = Track.objects.create(pathway=pathway, title="Robot Programming")
        self.program = Program.objects.create(track=track, title="Robotics Foundations")
        self.module = Module.objects.create(name="Sensors", program=self.program)
        self.unit = Unit.objects.create(module=self.module, title="Sensor Basics")
        self.lesson = Lesson.objects.create(unit=self.unit, title="Read a Sensor")
        self.task = LearningTask.objects.create(
            lesson=self.lesson,
            title="Submit Sensor Reading",
            type=LearningTask.TYPE_SUBMISSION,
            learner_instructions="Upload your reading.",
            teacher_rubric="Teacher-only rubric",
            answer_key="42",
            evidence_required=True,
        )
        self.artifact = Artifact.objects.create(
            tenant=self.school,
            learner=self.learner,
            created_by=self.teacher,
            title="Sensor reading",
            status=Artifact.STATUS_APPROVED,
            module=self.module,
        )

    def test_evidence_links_artifact_to_hierarchy_and_verification(self) -> None:
        evidence = Evidence.objects.create(
            tenant=self.school,
            learner=self.learner,
            artifact=self.artifact,
            task=self.task,
            unit=self.unit,
            module=self.module,
            verification_status=Evidence.STATUS_VERIFIED,
            quality_rubric={"accuracy": "meets"},
            verifier=self.teacher,
            offline_reference="offline-card-001",
        )

        self.assertEqual(evidence.task, self.task)
        self.assertEqual(evidence.unit, self.unit)
        self.assertEqual(evidence.module, self.module)
        self.assertTrue(evidence.is_usable_for_recognition)

    def test_badge_service_requires_verified_evidence(self) -> None:
        template = BadgeTemplate.objects.create(unit=self.unit, title="Sensor Badge", criteria="Evidence")
        pending = Evidence.objects.create(
            tenant=self.school,
            learner=self.learner,
            artifact=self.artifact,
            task=self.task,
            unit=self.unit,
            module=self.module,
            verification_status=Evidence.STATUS_PENDING,
        )

        with self.assertRaises(ValidationError):
            BadgeIssuanceService.issue(
                template=template,
                learner=self.learner,
                issuer=self.teacher,
                evidence=[pending],
            )

    def test_badge_and_microcredential_services_link_evidence_append_only(self) -> None:
        evidence = Evidence.objects.create(
            tenant=self.school,
            learner=self.learner,
            artifact=self.artifact,
            task=self.task,
            unit=self.unit,
            module=self.module,
            verification_status=Evidence.STATUS_VERIFIED,
            verifier=self.teacher,
        )
        badge_template = BadgeTemplate.objects.create(
            unit=self.unit,
            title="Sensor Badge",
            criteria="Evidence",
        )
        badge = BadgeIssuanceService.issue(
            template=badge_template,
            learner=self.learner,
            issuer=self.teacher,
            evidence=[evidence],
        )

        self.assertEqual(badge.status, BadgeRecord.STATUS_ISSUED)
        self.assertEqual(list(badge.evidence.all()), [evidence])

        micro_template = MicrocredentialTemplate.objects.create(
            module=self.module,
            title="Sensors Microcredential",
        )
        micro = MicrocredentialIssuanceService.issue(
            template=micro_template,
            learner=self.learner,
            issuer=self.teacher,
            evidence=[evidence],
            badge_records=[badge],
        )

        self.assertEqual(micro.status, MicrocredentialRecord.STATUS_ISSUED)
        self.assertEqual(list(micro.evidence.all()), [evidence])

        with self.assertRaises(ValidationError):
            BadgeIssuanceService.issue_correction(
                original=badge,
                issuer=self.teacher,
                evidence=[evidence],
                reason="",
            )

        correction = BadgeIssuanceService.issue_correction(
            original=badge,
            issuer=self.teacher,
            evidence=[evidence],
            reason="Wrong offline reference on first issue.",
        )
        self.assertEqual(correction.correction_of, badge)
        self.assertEqual(correction.status, BadgeRecord.STATUS_ISSUED)
