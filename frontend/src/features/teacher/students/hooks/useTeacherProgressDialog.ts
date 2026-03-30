import { useCallback, useMemo, useState } from 'react';
import { toast } from '@/lib/toast';
import { teacherStudentsService } from '../services/teacherStudentsService';
import type {
  TeacherBadgeFormState,
  TeacherEnrollment,
  TeacherModuleOption,
  TeacherProgressData,
  TeacherProgressFormState,
} from '../types';

const DEFAULT_BADGE_FORM: TeacherBadgeFormState = {
  badge_name: '',
  description: '',
};

const createInitialProgress = (
  enrollment: TeacherEnrollment,
  availableModules: TeacherModuleOption[],
): TeacherProgressData => ({
  id: `temp-${enrollment.id}`,
  level: enrollment.id,
  level_name: enrollment.current_level_name || 'Level 1',
  level_number: 1,
  modules_completed: 0,
  completed_module_ids: [],
  artifacts_submitted: 0,
  assessment_score: 0,
  completion_percentage: 0,
  teacher_confirmed: false,
  completed: false,
  available_modules: availableModules,
  requirements: {
    modules: { required: availableModules.length || 1, completed: 0, met: false },
    artifacts: { required: 3, submitted: 0, met: false },
    assessment: { required: 70, score: 0, met: false },
  },
});

const buildProgressForm = (progress: TeacherProgressData): TeacherProgressFormState => ({
  completed_module_ids: progress.completed_module_ids ?? [],
  artifacts: progress.artifacts_submitted ?? 0,
  score: progress.assessment_score ?? 0,
});

export const useTeacherProgressDialog = (studentId?: string) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<TeacherEnrollment | null>(null);
  const [currentProgress, setCurrentProgress] = useState<TeacherProgressData | null>(null);
  const [progressForm, setProgressForm] = useState<TeacherProgressFormState>({
    completed_module_ids: [],
    artifacts: 0,
    score: 0,
  });
  const [badgeForm, setBadgeForm] = useState<TeacherBadgeFormState>(DEFAULT_BADGE_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const resetState = useCallback(() => {
    setIsOpen(false);
    setSelectedEnrollment(null);
    setCurrentProgress(null);
    setProgressForm({ completed_module_ids: [], artifacts: 0, score: 0 });
    setBadgeForm(DEFAULT_BADGE_FORM);
  }, []);

  const hydrateProgress = useCallback((
    progress: TeacherProgressData | null,
    availableModules: TeacherModuleOption[],
  ): TeacherProgressData => {
    if (!progress) {
      throw new Error('No progress to hydrate');
    }
    const allowed = new Set(availableModules.map((module) => module.id));
    const completedModuleIds = Array.isArray(progress.completed_module_ids)
      ? progress.completed_module_ids
          .map((moduleId) => String(moduleId))
          .filter((moduleId) => allowed.has(moduleId))
      : [];

    return {
      ...progress,
      available_modules: availableModules,
      completed_module_ids: completedModuleIds,
    };
  }, []);

  const openDialog = useCallback(async (enrollment: TeacherEnrollment) => {
    try {
      setSelectedEnrollment(enrollment);
      setIsOpen(true);
      setLoading(true);
      setCurrentProgress(null);

      const [progressData, fallbackModules] = await Promise.all([
        teacherStudentsService.getEnrollmentProgress(enrollment.id),
        teacherStudentsService.getCourseModules(enrollment.course),
      ]);

      const activeProgress = progressData.length ? progressData[progressData.length - 1] : null;
      if (activeProgress) {
        const available = teacherStudentsService
          .getCourseModules(enrollment.course)
          .catch(() => fallbackModules);
        const modules = await available;
        const hydrated = hydrateProgress(activeProgress, modules);
        setCurrentProgress(hydrated);
        setProgressForm(buildProgressForm(hydrated));
      } else {
        const initial = createInitialProgress(enrollment, fallbackModules);
        setCurrentProgress(initial);
        setProgressForm(buildProgressForm(initial));
      }
    } catch (error) {
      console.error('Failed to open progress dialog', error);
      toast.error('Unable to load progress data.', 'Load Failed');
      resetState();
    } finally {
      setLoading(false);
    }
  }, [hydrateProgress, resetState]);

  const toggleModuleCompletion = useCallback((moduleId: string) => {
    setProgressForm((prev) => {
      const exists = prev.completed_module_ids.includes(moduleId);
      return {
        ...prev,
        completed_module_ids: exists
          ? prev.completed_module_ids.filter((id) => id !== moduleId)
          : [...prev.completed_module_ids, moduleId],
      };
    });
  }, []);

  const updateArtifacts = useCallback((value: number) => {
    setProgressForm((prev) => ({ ...prev, artifacts: Math.max(0, value) }));
  }, []);

  const updateScore = useCallback((value: number) => {
    setProgressForm((prev) => ({ ...prev, score: Math.min(100, Math.max(0, value)) }));
  }, []);

  const updateBadgeForm = useCallback((field: keyof TeacherBadgeFormState, value: string) => {
    setBadgeForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const saveProgress = useCallback(async () => {
    if (!currentProgress || !selectedEnrollment || saving) return;

    if (currentProgress.id.startsWith('temp-')) {
      toast.info(
        'Progress tracking will be created when the student starts this level. You can update it then.',
        'Not Yet Available',
      );
      resetState();
      return;
    }

    try {
      setSaving(true);
      await teacherStudentsService.updateProgress(currentProgress.id, {
        completed_module_ids: progressForm.completed_module_ids,
        artifacts_submitted: progressForm.artifacts,
        assessment_score: progressForm.score,
      });

      if (badgeForm.badge_name.trim()) {
        await teacherStudentsService.awardBadge({
          learner: studentId ?? '',
          badge_name: badgeForm.badge_name,
          description:
            badgeForm.description || `Awarded for progress in ${selectedEnrollment.course_name || 'this pathway'}`,
        });
      }

      toast.success('Progress updated successfully.', 'Saved');
      resetState();
    } catch (error) {
      console.error('Failed to save progress', error);
      toast.error('Failed to update progress. Please try again.', 'Update Failed');
    } finally {
      setSaving(false);
    }
  }, [badgeForm, currentProgress, progressForm, resetState, saving, selectedEnrollment, studentId]);

  const confirmCompletion = useCallback(async () => {
    if (!currentProgress || confirming) return;
    try {
      setConfirming(true);
      await teacherStudentsService.confirmCompletion(currentProgress.id);
      toast.success('Level completion confirmed.', 'Confirmed');
      resetState();
    } catch (error) {
      console.error('Failed to confirm completion', error);
      toast.error('Failed to confirm completion.', 'Confirmation Failed');
    } finally {
      setConfirming(false);
    }
  }, [confirming, currentProgress, resetState]);

  const canConfirm = useMemo(() => {
    if (!currentProgress) return false;
    const { requirements } = currentProgress;
    return (
      progressForm.completed_module_ids.length >= (requirements.modules.required || 0) &&
      progressForm.artifacts >= (requirements.artifacts.required || 0) &&
      progressForm.score >= (requirements.assessment.required || 0)
    );
  }, [currentProgress, progressForm.artifacts, progressForm.completed_module_ids.length, progressForm.score]);

  return {
    isOpen,
    loading,
    saving,
    confirming,
    selectedEnrollment,
    currentProgress,
    progressForm,
    badgeForm,
    openDialog,
    closeDialog: resetState,
    toggleModuleCompletion,
    updateArtifacts,
    updateScore,
    updateBadgeForm,
    saveProgress,
    confirmCompletion,
    canConfirm,
  };
};
