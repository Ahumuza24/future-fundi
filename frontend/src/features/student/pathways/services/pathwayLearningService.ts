import { studentApi } from '@/lib/api';
import type { PathwayData } from '../types';

export const pathwayLearningService = {
  async getPathway(enrollmentId: string): Promise<PathwayData> {
    const response = await studentApi.getPathwayLearning(enrollmentId);
    return response.data as PathwayData;
  },
};
