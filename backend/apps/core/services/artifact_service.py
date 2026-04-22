"""
Artifact creation and file-upload service.

Extracted from QuickArtifactViewSet.capture() in teacher_views.py.
All business logic for capturing a teacher artifact lives here.
"""

from __future__ import annotations

import json
import os
import uuid as uuid_lib
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.core.files.storage import default_storage
from django.core.files.uploadedfile import UploadedFile
from django.http import HttpRequest

if TYPE_CHECKING:
    from apps.core.models import Artifact, Learner, Module

# Max accepted link depth — prevents unbounded iteration
_MAX_LINKS = 20


class ArtifactService:
    """Create artifact records and persist associated media."""

    @staticmethod
    def capture(
        *,
        learner: "Learner",
        title: str,
        reflection: str,
        created_by: Any,
        tenant: Any,
        module: "Module | None",
        session_id: str | None,
        metrics: list[dict],
        uploaded_files: list[UploadedFile],
        raw_links: str | list,
        request: HttpRequest,
    ) -> "Artifact":
        """Create one Artifact row and attach files + links to its media_refs."""
        from apps.core.models import Artifact

        initial_metadata = ArtifactService._build_initial_metadata(session_id, metrics)
        artifact = ArtifactService._create_artifact_record(
            learner=learner,
            title=title,
            reflection=reflection,
            created_by=created_by,
            tenant=tenant,
            module=module,
            initial_metadata=initial_metadata,
        )
        media_refs = ArtifactService._save_uploaded_files(
            artifact=artifact,
            files=uploaded_files,
            initial_metadata=initial_metadata,
            request=request,
        )
        media_refs = ArtifactService._append_link_refs(media_refs, raw_links)

        artifact.media_refs = media_refs
        artifact.save(update_fields=["media_refs"])
        return artifact

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _build_initial_metadata(
        session_id: str | None, metrics: list[dict]
    ) -> dict:
        metadata: dict = {}
        if session_id:
            metadata["session_id"] = session_id
        if metrics:
            metadata["metrics"] = metrics
        return metadata

    @staticmethod
    def _create_artifact_record(
        *,
        learner: "Learner",
        title: str,
        reflection: str,
        created_by: Any,
        tenant: Any,
        module: "Module | None",
        initial_metadata: dict,
    ) -> "Artifact":
        from apps.core.models import Artifact

        return Artifact.objects.create(
            learner=learner,
            title=title,
            reflection=reflection,
            created_by=created_by,
            tenant=tenant,
            media_refs=[initial_metadata] if initial_metadata else [],
            module=module,
        )

    @staticmethod
    def _save_uploaded_files(
        *,
        artifact: "Artifact",
        files: list[UploadedFile],
        initial_metadata: dict,
        request: HttpRequest,
    ) -> list[dict]:
        media_refs: list[dict] = [initial_metadata] if initial_metadata else []
        base_url: str = getattr(settings, "MEDIA_URL", "/media/")

        for f in files:
            ArtifactService._validate_file_size(f)
            saved_path = ArtifactService._save_file(f, artifact.id)
            raw_request = getattr(request, "_request", request)
            file_url = raw_request.build_absolute_uri(f"{base_url}{saved_path}")
            media_refs.append({
                "type": f.content_type or "file",
                "url": file_url,
                "filename": f.name,
                "size": f.size,
                "path": saved_path,
            })
        return media_refs

    @staticmethod
    def _validate_file_size(f: UploadedFile) -> None:
        max_bytes: int = settings.MAX_UPLOAD_SIZE_BYTES
        if f.size > max_bytes:
            max_mb: int = settings.MAX_UPLOAD_SIZE_MB
            raise ValueError(f"File '{f.name}' exceeds the {max_mb} MB upload limit.")

    @staticmethod
    def _save_file(f: UploadedFile, artifact_id: Any) -> str:
        safe_name = os.path.basename(f.name) or "upload"
        unique_name = f"{uuid_lib.uuid4().hex}_{safe_name}"
        rel_path = f"artifacts/{artifact_id}/{unique_name}"
        return default_storage.save(rel_path, f)

    @staticmethod
    def _append_link_refs(media_refs: list[dict], raw_links: str | list) -> list[dict]:
        try:
            links = json.loads(raw_links) if isinstance(raw_links, str) else raw_links
            if not isinstance(links, list):
                return media_refs
            for lnk in links[:_MAX_LINKS]:
                if isinstance(lnk, dict) and lnk.get("url"):
                    media_refs.append({
                        "type": "link",
                        "url": lnk["url"],
                        "label": lnk.get("label", lnk["url"]),
                    })
        except (json.JSONDecodeError, ValueError):
            pass
        return media_refs
