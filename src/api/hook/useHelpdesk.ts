import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

// Response types
export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface HelpTicket {
  id: string;
  employeeName: string;
  employeeId: string;
  subject: string;
  description: string;
  category: 'IT' | 'HR' | 'Facilities' | 'Finance';
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Pending' | 'Resolved';
  slaHoursLeft: number;
  date: string;
}

// Queries and Mutations

/**
 * Hook to retrieve support tickets list
 * GET /api/v1/helpdesk
 */
export const useTickets = () => {
  return useQuery<BaseResponse<HelpTicket[]>, Error>({
    queryKey: ['helpTickets'],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<HelpTicket[]>>('/helpdesk');
      return response.data;
    },
  });
};

/**
 * Hook to raise a new support ticket
 * POST /api/v1/helpdesk
 */
export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, {
    employeeId: string;
    subject: string;
    description: string;
    category: 'IT' | 'HR' | 'Facilities' | 'Finance';
    priority: 'High' | 'Medium' | 'Low';
  }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<any>>('/helpdesk', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpTickets'] });
    },
  });
};

/**
 * Hook to resolve a support ticket
 * PATCH /api/v1/helpdesk/:id/resolve
 */
export const useResolveTicket = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, string>({
    mutationFn: async (id) => {
      const response = await apiClient.patch<BaseResponse<any>>(`/helpdesk/${id}/resolve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['helpTickets'] });
    },
  });
};
