import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

// Response types
export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface TravelClaim {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Travel' | 'Mileage' | 'Food' | 'Accommodation' | 'Other';
  amount: number;
  date: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  receiptUrl?: string;
}

// Queries and Mutations

/**
 * Hook to retrieve expense/travel claims
 * GET /api/v1/travel
 */
export const useClaims = (filters?: { employeeId?: string; status?: string }) => {
  return useQuery<BaseResponse<TravelClaim[]>, Error>({
    queryKey: ['travelClaims', filters],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<TravelClaim[]>>('/travel', {
        params: filters,
      });
      return response.data;
    },
  });
};

/**
 * Hook to submit a new expense claim
 * POST /api/v1/travel/apply
 */
export const useApplyClaim = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, { employeeId: string; type: string; amount: number; date: string; reason: string; receiptUrl?: string | null }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<any>>('/travel/apply', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travelClaims'] });
    },
  });
};

/**
 * Hook to approve or reject a travel claim
 * PATCH /api/v1/travel/:id/status
 */
export const useUpdateClaimStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, { id: string; status: 'Approved' | 'Rejected' }>({
    mutationFn: async ({ id, status }) => {
      const response = await apiClient.patch<BaseResponse<any>>(`/travel/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travelClaims'] });
    },
  });
};
