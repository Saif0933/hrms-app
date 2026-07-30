import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

// Response types
export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AssetRecord {
  id: string;
  name: string;
  category: 'Hardware' | 'Mobile' | 'Keycard' | 'Other';
  serial: string;
  assignedTo: string | null;
  employeeId: string | null;
  status: 'Assigned' | 'In Stock' | 'Maintenance';
}

// Queries and Mutations

/**
 * Hook to retrieve asset inventory ledger
 * GET /api/v1/assets
 */
export const useAssets = () => {
  return useQuery<BaseResponse<AssetRecord[]>, Error>({
    queryKey: ['assetsLedger'],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<AssetRecord[]>>('/assets');
      return response.data;
    },
  });
};

/**
 * Hook to register a new asset
 * POST /api/v1/assets
 */
export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, {
    name: string;
    category: 'Hardware' | 'Mobile' | 'Keycard' | 'Other';
    serial: string;
    employeeId?: string | null;
  }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<any>>('/assets', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetsLedger'] });
    },
  });
};

/**
 * Hook to assign or unassign an asset
 * PATCH /api/v1/assets/:id/assign
 */
export const useAssignAsset = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, { id: string; employeeId: string | null }>({
    mutationFn: async ({ id, employeeId }) => {
      const response = await apiClient.patch<BaseResponse<any>>(`/assets/${id}/assign`, { employeeId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assetsLedger'] });
    },
  });
};
