import { studentApi } from '@/lib/api';
import { StudentArtifact, StudentDashboardData } from '../types';

const normalizeArtifactsResponse = (payload: unknown): StudentArtifact[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    return payload as StudentArtifact[];
  }

  if (
    typeof payload === 'object' &&
    payload !== null &&
    Array.isArray((payload as Record<string, unknown>).artifacts)
  ) {
    return (payload as { artifacts: StudentArtifact[] }).artifacts;
  }

  return [];
};

export const studentDashboardService = {
  async getDashboard(): Promise<StudentDashboardData> {
    const response = await studentApi.getDashboard();
    return response.data as StudentDashboardData;
  },

  async getArtifacts(): Promise<StudentArtifact[]> {
    const response = await studentApi.getArtifacts();
    return normalizeArtifactsResponse(response.data);
  },
};
