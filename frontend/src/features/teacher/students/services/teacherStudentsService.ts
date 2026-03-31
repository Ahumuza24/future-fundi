import { courseApi, enrollmentApi, progressApi, teacherApi } from '@/lib/api';
import type {
  TeacherModuleOption,
  TeacherProgressData,
  TeacherStudentDetailResponse,
} from '../types';

export const teacherStudentsService = {
  async getStudentDetail(learnerId: string): Promise<TeacherStudentDetailResponse> {
    const response = await teacherApi.students.getById(learnerId);
    return response.data as TeacherStudentDetailResponse;
  },

  async getEnrollmentProgress(enrollmentId: string): Promise<TeacherProgressData[]> {
    const response = await enrollmentApi.getProgress(enrollmentId);
    return Array.isArray(response.data) ? (response.data as TeacherProgressData[]) : [];
  },

  async getCourseModules(courseId?: string): Promise<TeacherModuleOption[]> {
    if (!courseId) {
      return [];
    }
    const response = await courseApi.getById(courseId);
    const modules = response.data?.modules ?? [];
    return modules
      .filter((module: { id?: string }) => Boolean(module?.id))
      .map((module: { id: string | number; name?: string; badge_name?: string; description?: string }) => ({
        id: String(module.id),
        name: module.name || 'Untitled Module',
        badge_name: module.badge_name || '',
        description: module.description || '',
      }));
  },

  async updateProgress(progressId: string, payload: { completed_module_ids: string[]; artifacts_submitted: number; assessment_score: number }) {
    return progressApi.updateProgress(progressId, payload);
  },

  async confirmCompletion(progressId: string) {
    return progressApi.confirmCompletion(progressId);
  },

  async awardBadge(payload: { learner: string; badge_name: string; description?: string }) {
    return teacherApi.badges.award(payload);
  },
};
