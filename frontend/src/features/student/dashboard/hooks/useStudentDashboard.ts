import { useQuery, useQueryClient } from '@tanstack/react-query';
import { studentDashboardService } from '../services/studentDashboardService';
import type { StudentArtifact, StudentDashboardData } from '../types';

const studentDashboardKeys = {
  root: ['student', 'dashboard'] as const,
  data: () => [...studentDashboardKeys.root, 'data'] as const,
  artifacts: () => [...studentDashboardKeys.root, 'artifacts'] as const,
};

export const useStudentDashboardData = () =>
  useQuery<StudentDashboardData>({
    queryKey: studentDashboardKeys.data(),
    queryFn: studentDashboardService.getDashboard,
    staleTime: 5 * 60 * 1000,
  });

export const useStudentArtifacts = () =>
  useQuery<StudentArtifact[]>({
    queryKey: studentDashboardKeys.artifacts(),
    queryFn: studentDashboardService.getArtifacts,
    staleTime: 2 * 60 * 1000,
  });

export const useInvalidateStudentArtifacts = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: studentDashboardKeys.artifacts() });
};
