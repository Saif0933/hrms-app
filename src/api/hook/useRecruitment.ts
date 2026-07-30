import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

// Response types
export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface JobRequisition {
  id: string;
  title: string;
  department: string;
  status: string;
  applicants: number;
}

export interface Candidate {
  id: string;
  name: string;
  role: string;
  experience: string;
  email: string;
  stage: 'Applied' | 'Interview' | 'Offer' | 'Onboarding';
  bgvChecked: boolean;
  contractSigned: boolean;
  hardwareAssigned: boolean;
}

// Queries and Mutations

/**
 * Hook to retrieve job requisitions
 * GET /api/v1/recruitment/jobs
 */
export const useJobs = () => {
  return useQuery<BaseResponse<JobRequisition[]>, Error>({
    queryKey: ['jobRequisitions'],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<JobRequisition[]>>('/recruitment/jobs');
      return response.data;
    },
  });
};

/**
 * Hook to create a new job requisition
 * POST /api/v1/recruitment/jobs
 */
export const useCreateJob = () => {
  const queryClient = queryClientOrGet();
  return useMutation<BaseResponse<any>, Error, { title: string; department: string }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<any>>('/recruitment/jobs', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobRequisitions'] });
    },
  });
};

/**
 * Hook to retrieve candidates list
 * GET /api/v1/recruitment/candidates
 */
export const useCandidates = () => {
  return useQuery<BaseResponse<Candidate[]>, Error>({
    queryKey: ['candidates'],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<Candidate[]>>('/recruitment/candidates');
      return response.data;
    },
  });
};

/**
 * Hook to advance candidate stage
 * PATCH /api/v1/recruitment/candidates/:id/stage
 */
export const useAdvanceCandidate = () => {
  const queryClient = queryClientOrGet();
  return useMutation<BaseResponse<any>, Error, { id: string; stage: 'Applied' | 'Interview' | 'Offer' | 'Onboarding' }>({
    mutationFn: async ({ id, stage }) => {
      const response = await apiClient.patch<BaseResponse<any>>(`/recruitment/candidates/${id}/stage`, { stage });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
  });
};

/**
 * Hook to update candidate checklist status
 * PATCH /api/v1/recruitment/candidates/:id/checklist
 */
export const useUpdateCandidateChecklist = () => {
  const queryClient = queryClientOrGet();
  return useMutation<BaseResponse<any>, Error, { id: string; bgvChecked?: boolean; contractSigned?: boolean; hardwareAssigned?: boolean }>({
    mutationFn: async ({ id, ...checklist }) => {
      const response = await apiClient.patch<BaseResponse<any>>(`/recruitment/candidates/${id}/checklist`, checklist);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
  });
};

/**
 * Hook to reject / delete a candidate
 * DELETE /api/v1/recruitment/candidates/:id
 */
export const useRejectCandidate = () => {
  const queryClient = queryClientOrGet();
  return useMutation<BaseResponse<any>, Error, string>({
    mutationFn: async (id) => {
      const response = await apiClient.delete<BaseResponse<any>>(`/recruitment/candidates/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
    },
  });
};

// Helper function to resolve QueryClient dynamically to avoid initialization issues
function queryClientOrGet() {
  return useQueryClient();
}
