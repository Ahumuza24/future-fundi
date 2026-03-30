import { useQuery } from '@tanstack/react-query';
import { pathwayLearningService } from '../services/pathwayLearningService';
import type { PathwayData } from '../types';

const pathwayLearningKeys = {
  root: ['student', 'pathway'] as const,
  detail: (enrollmentId: string) => [...pathwayLearningKeys.root, enrollmentId] as const,
};

export const usePathwayLearning = (enrollmentId?: string) =>
  useQuery<PathwayData>({
    queryKey: enrollmentId ? pathwayLearningKeys.detail(enrollmentId) : pathwayLearningKeys.root,
    queryFn: () => {
      if (!enrollmentId) {
        throw new Error('enrollmentId is required to fetch pathway data');
      }
      return pathwayLearningService.getPathway(enrollmentId);
    },
    enabled: Boolean(enrollmentId),
  });
