import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { learnerApi, artifactApi, dashboardApi } from './api';

// Learner Hooks
export const useLearners = () => {
  return useQuery({
    queryKey: ['learners'],
    queryFn: async () => {
      const response = await learnerApi.getAll();
      return response.data;
    },
  });
};

export const useLearner = (id: string) => {
  return useQuery({
    queryKey: ['learner', id],
    queryFn: async () => {
      const response = await learnerApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useLearnerTree = (id: string) => {
  return useQuery({
    queryKey: ['learner', id, 'tree'],
    queryFn: async () => {
      const response = await learnerApi.getTree(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 15 * 60 * 1000, // 15 minutes as per spec
  });
};

export const useLearnerPathway = (id: string) => {
  return useQuery({
    queryKey: ['learner', id, 'pathway'],
    queryFn: async () => {
      const response = await learnerApi.getPathway(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 30 * 60 * 1000, // 30 minutes as per spec
  });
};

export const useLearnerArtifacts = (id: string) => {
  return useQuery({
    queryKey: ['learner', id, 'artifacts'],
    queryFn: async () => {
      const response = await learnerApi.getArtifacts(id);
      return response.data;
    },
    enabled: !!id,
  });
};

// Artifact Hooks
export const useArtifacts = () => {
  return useQuery({
    queryKey: ['artifacts'],
    queryFn: async () => {
      const response = await artifactApi.getAll();
      return response.data;
    },
  });
};

export const useArtifact = (id: string) => {
  return useQuery({
    queryKey: ['artifact', id],
    queryFn: async () => {
      const response = await artifactApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateArtifact = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await artifactApi.create(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch artifacts
      queryClient.invalidateQueries({ queryKey: ['artifacts'] });
    },
  });
};

export const useUploadArtifactMedia = (artifactId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await artifactApi.uploadMedia(artifactId, formData);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate artifact data
      queryClient.invalidateQueries({ queryKey: ['artifact', artifactId] });
    },
  });
};

// Dashboard Hooks
export const useDashboardKpis = () => {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: async () => {
      const response = await dashboardApi.getKpis();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes as per spec
  });
};

export const useDashboardTrends = () => {
  return useQuery({
    queryKey: ['dashboard', 'trends'],
    queryFn: async () => {
      const response = await dashboardApi.getTrends();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDashboardImpactBrief = () => {
  return useQuery({
    queryKey: ['dashboard', 'impact-brief'],
    queryFn: async () => {
      const response = await dashboardApi.getImpactBrief();
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
