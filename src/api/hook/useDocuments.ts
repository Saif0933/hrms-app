import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

// Response types
export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface VaultDoc {
  id: string;
  employeeId: string;
  name: string;
  category: 'Identity' | 'Contract' | 'Academic' | 'Tax';
  uploadedOn: string;
  expiresOn: string | null;
  status: 'Active' | 'Expiring Soon' | 'Expired';
}

// Queries and Mutations

/**
 * Hook to retrieve documents
 * GET /api/v1/documents
 */
export const useDocuments = (filters?: { employeeId?: string; category?: string }) => {
  return useQuery<BaseResponse<VaultDoc[]>, Error>({
    queryKey: ['vaultDocuments', filters],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<VaultDoc[]>>('/documents', {
        params: filters,
      });
      return response.data;
    },
    enabled: !!filters?.employeeId,
  });
};

/**
 * Hook to upload a document to the vault
 * POST /api/v1/documents/upload
 */
export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, {
    employeeId: string;
    name: string;
    category: 'Identity' | 'Contract' | 'Academic' | 'Tax';
    expiresOn?: string | null;
  }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<any>>('/documents/upload', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaultDocuments'] });
    },
  });
};

/**
 * Hook to delete a document from the vault
 * DELETE /api/v1/documents/:id
 */
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, string>({
    mutationFn: async (id) => {
      const response = await apiClient.delete<BaseResponse<any>>(`/documents/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaultDocuments'] });
    },
  });
};
