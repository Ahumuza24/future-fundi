from django.test import TestCase

from apps.core.models import Learner, Module, ModuleProgress, Pathway, Program, Track
from apps.core.services.learner_panel_service import LearnerPanelService
from apps.core.services.program_manager_service import ProgramManagerService


class LearnerPanelServiceTests(TestCase):
    def test_module_progress_uses_current_module_progress_fields(self):
        learner = Learner.objects.create(first_name="Amina", last_name="Kato")
        module = Module.objects.create(
            name="Sensors",
            outcome_statement="Learner can wire and read a sensor.",
        )
        ModuleProgress.objects.create(
            learner=learner,
            module=module,
            units_completed=2,
            units_total=4,
            completion_status=ModuleProgress.STATUS_IN_PROGRESS,
        )

        result = LearnerPanelService.module_progress(learner)

        self.assertIsNotNone(result)
        self.assertEqual(result["module_name"], "Sensors")
        self.assertEqual(result["completion_pct"], 50)
        self.assertEqual(result["status"], ModuleProgress.STATUS_IN_PROGRESS)


class ProgramManagerServiceTests(TestCase):
    def test_completion_rates_aggregate_by_completion_status(self):
        pathway = Pathway.objects.create(name="Robotics", status=Pathway.STATUS_ACTIVE)
        track = Track.objects.create(pathway=pathway, title="Robot Programming")
        program = Program.objects.create(track=track, title="Robotics Foundations")
        module = Module.objects.create(name="Sensors", program=program)
        complete_learner = Learner.objects.create(first_name="Amina", last_name="Kato")
        active_learner = Learner.objects.create(first_name="Brian", last_name="Okello")
        ModuleProgress.objects.create(
            learner=complete_learner,
            module=module,
            completion_status=ModuleProgress.STATUS_COMPLETE,
        )
        ModuleProgress.objects.create(
            learner=active_learner,
            module=module,
            completion_status=ModuleProgress.STATUS_IN_PROGRESS,
        )

        result = ProgramManagerService.completion_rates()

        self.assertEqual(
            result,
            [
                {
                    "pathway": "Robotics",
                    "module_name": "Sensors",
                    "learners_in_progress": 1,
                    "learners_complete": 1,
                    "completion_pct": 50,
                }
            ],
        )
