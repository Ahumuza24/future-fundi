from __future__ import annotations

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.core.models import (
    Learner,
    LearnerCourseEnrollment,
    LearningTask,
    Lesson,
    Module,
    Pathway,
    Program,
    School,
    Track,
    Unit,
)


class PrivacyAndGateIntegrationTests(TestCase):
    def setUp(self) -> None:
        user_model = get_user_model()
        self.school = School.objects.create(name="Privacy School", code="PS")
        self.learner_user = user_model.objects.create_user(
            username="learner",
            email="learner@example.com",
            password="pass",
            role="learner",
            tenant=self.school,
        )
        self.parent_user = user_model.objects.create_user(
            username="parent",
            email="parent@example.com",
            password="pass",
            role="parent",
            tenant=self.school,
        )
        self.learner = Learner.objects.create(
            first_name="Amina",
            last_name="Kato",
            user=self.learner_user,
            parent=self.parent_user,
            tenant=self.school,
        )
        self.pathway = Pathway.objects.create(name="Robotics", status=Pathway.STATUS_ACTIVE)
        self.track = Track.objects.create(pathway=self.pathway, title="Robot Programming")
        self.program = Program.objects.create(track=self.track, title="Robotics Foundations")
        self.module_one = Module.objects.create(
            name="Sensors",
            program=self.program,
            sequence_order=1,
            teacher_notes="Teacher-only module notes",
        )
        self.module_two = Module.objects.create(
            name="Actuators",
            program=self.program,
            sequence_order=2,
            teacher_notes="Locked teacher notes",
        )
        self.unit = Unit.objects.create(module=self.module_one, title="Sensor Basics")
        self.lesson = Lesson.objects.create(
            unit=self.unit,
            title="Read a Sensor",
            learner_content="Learner-facing content",
            teacher_content="Teacher-only lesson guide",
        )
        self.task = LearningTask.objects.create(
            lesson=self.lesson,
            title="Submit Sensor Reading",
            type=LearningTask.TYPE_SUBMISSION,
            learner_instructions="Upload your reading.",
            teacher_rubric="Teacher-only rubric",
            answer_key="42",
            evidence_required=True,
        )
        self.enrollment = LearnerCourseEnrollment.objects.create(
            learner=self.learner,
            course=self.pathway,
            is_active=True,
        )
        self.client = APIClient()

    def test_learners_and_parents_cannot_fetch_teacher_only_cms_content(self) -> None:
        urls = [
            f"/api/cms/modules/{self.module_one.id}/",
            f"/api/cms/lessons/{self.lesson.id}/",
            f"/api/cms/tasks/{self.task.id}/",
        ]

        for user in (self.learner_user, self.parent_user):
            self.client.force_authenticate(user)
            for url in urls:
                response = self.client.get(url)
                self.assertEqual(response.status_code, 403, url)

    def test_learner_cannot_fetch_cohort_comparison(self) -> None:
        self.client.force_authenticate(self.learner_user)

        response = self.client.get("/api/learner/dashboard/cohort-position/")

        self.assertEqual(response.status_code, 403)

    def test_pathway_learning_response_marks_locked_seven_layer_content(self) -> None:
        self.client.force_authenticate(self.learner_user)

        response = self.client.get(f"/api/pathway-learning/{self.enrollment.id}/learn/")

        self.assertEqual(response.status_code, 200)
        hierarchy = response.data["hierarchy"]
        modules = hierarchy["tracks"][0]["programs"][0]["modules"]
        self.assertTrue(modules[0]["gate"]["is_open"])
        self.assertFalse(modules[1]["gate"]["is_open"])
        self.assertFalse(modules[1]["access"]["can_open"])
        self.assertNotIn("teacher_notes", modules[0])
        lesson = modules[0]["units"][0]["lessons"][0]
        task = lesson["tasks"][0]
        self.assertNotIn("teacher_content", lesson)
        self.assertNotIn("teacher_rubric", task)
        self.assertNotIn("answer_key", task)
