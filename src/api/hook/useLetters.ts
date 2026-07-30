import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

// Response types
export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface IssuedLetter {
  id: string;
  templateType: 'offer' | 'warning' | 'experience';
  recipientName: string;
  recipientRole: string;
  joiningDate: string | null;
  salaryCtc: string | null;
  warningReason: string | null;
  createdAt: string;
}

// Queries and Mutations

/**
 * Hook to retrieve issued corporate letters
 * GET /api/v1/letters
 */
export const useIssuedLetters = () => {
  return useQuery<BaseResponse<IssuedLetter[]>, Error>({
    queryKey: ['issuedLetters'],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<IssuedLetter[]>>('/letters');
      return response.data;
    },
  });
};

/**
 * Hook to generate and issue a new letter template
 * POST /api/v1/letters/issue
 */
export const useIssueLetter = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, {
    templateType: 'offer' | 'warning' | 'experience';
    recipientName: string;
    recipientRole: string;
    joiningDate?: string | null;
    salaryCtc?: string | null;
    warningReason?: string | null;
  }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<any>>('/letters/issue', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issuedLetters'] });
    },
  });
};
