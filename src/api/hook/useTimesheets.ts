import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

// Response types
export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface TimesheetEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  project: string;
  task: string;
  monHours: number;
  tueHours: number;
  wedHours: number;
  thuHours: number;
  friHours: number;
  hours: number; // Total hours
  week: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

// Queries and Mutations

/**
 * Hook to retrieve timesheet entry logs
 * GET /api/v1/timesheets
 */
export const useTimesheets = (filters?: { employeeId?: string; status?: string }) => {
  return useQuery<BaseResponse<TimesheetEntry[]>, Error>({
    queryKey: ['timesheets', filters],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<TimesheetEntry[]>>('/timesheets', {
        params: filters,
      });
      return response.data;
    },
  });
};

/**
 * Hook to submit a new timesheet weekly log
 * POST /api/v1/timesheets/submit
 */
export const useSubmitTimesheet = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, {
    employeeId: string;
    project: string;
    task: string;
    monHours: number;
    tueHours: number;
    wedHours: number;
    thuHours: number;
    friHours: number;
    week: string;
  }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<any>>('/timesheets/submit', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });
};

/**
 * Hook to approve or reject a timesheet
 * PATCH /api/v1/timesheets/:id/status
 */
export const useUpdateTimesheetStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, { id: string; status: 'Approved' | 'Rejected' }>({
    mutationFn: async ({ id, status }) => {
      const response = await apiClient.patch<BaseResponse<any>>(`/timesheets/${id}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] });
    },
  });
};
