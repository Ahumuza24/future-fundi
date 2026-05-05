from __future__ import annotations

from apps.api.cms_serializers import ModuleCMSSerializer
from apps.core.models import Module
from django.test import TestCase


class CMSRuntimeTests(TestCase):
    def test_module_serializer_exposes_timestamp_fields(self) -> None:
        module = Module.objects.create(name="Evidence Basics")

        data = ModuleCMSSerializer(module).data

        self.assertIn("created_at", data)
        self.assertIn("updated_at", data)

    def test_modules_can_be_ordered_by_updated_at_for_peer_review_queue(self) -> None:
        module = Module.objects.create(name="Peer Reviewed Module")

        ordered = list(Module.objects.order_by("updated_at"))

        self.assertEqual(ordered, [module])
