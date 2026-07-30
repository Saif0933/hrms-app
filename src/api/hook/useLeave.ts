import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

// Enums & Shared Types
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type HalfDaySession = 'FIRST_HALF' | 'SECOND_HALF';

export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Model Interfaces
export interface LeaveType {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  defaultDays: number;
  carryForward: boolean;
  maxCarryForward?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveAllocation {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  allocated: number;
  used: number;
  pending: number;
  carriedForward: number;
  createdAt: string;
  updatedAt: string;
  leaveType?: LeaveType;
  employee?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  halfDay: boolean;
  halfDaySession?: HalfDaySession | null;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  attachmentUrl?: string | null;
  appliedDate: string;
  approvedById?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  leaveType?: LeaveType;
  employee?: {
    id: string;
    name: string;
    email: string;
  };
  approvedBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

// Request DTO Interfaces
export interface CreateLeaveTypeRequest {
  name: string;
  code: string;
  description?: string;
  defaultDays: number;
  carryForward?: boolean;
  maxCarryForward?: number;
  isActive?: boolean;
}

export interface UpdateLeaveTypeRequest {
  name?: string;
  code?: string;
  description?: string;
  defaultDays?: number;
  carryForward?: boolean;
  maxCarryForward?: number;
  isActive?: boolean;
}

export interface AllocateLeaveRequest {
  employeeId: string;
  leaveTypeId: string;
  year: number;
  allocated: number;
  carriedForward?: number;
}

export interface SubmitLeaveRequest {
  employeeId: string;
  leaveTypeId: string;
  startDate: string; // ISO String format
  endDate: string;   // ISO String format
  halfDay?: boolean;
  halfDaySession?: HalfDaySession | null;
  reason: string;
  attachmentUrl?: string | null;
}

export interface ProcessLeaveRequest {
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

// ==========================================
// 1. Leave Type Hooks
// ==========================================

export const useLeaveTypes = (activeOnly?: boolean) => {
  return useQuery<BaseResponse<LeaveType[]>, Error>({
    queryKey: ['leaveTypes', { activeOnly }],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<LeaveType[]>>('/leaves/types', {
        params: { activeOnly },
      });
      return response.data;
    },
  });
};

export const useLeaveTypeById = (id?: string) => {
  return useQuery<BaseResponse<LeaveType>, Error>({
    queryKey: ['leaveType', id],
    queryFn: async () => {
      if (!id) throw new Error('Leave type ID is required');
      const response = await apiClient.get<BaseResponse<LeaveType>>(`/leaves/types/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateLeaveType = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<LeaveType>, Error, CreateLeaveTypeRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<BaseResponse<LeaveType>>('/leaves/types', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveTypes'] });
    },
  });
};

export const useUpdateLeaveType = () => {
  const queryClient = useQueryClient();
  return useMutation<
    BaseResponse<LeaveType>,
    Error,
    { id: string; data: UpdateLeaveTypeRequest }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<BaseResponse<LeaveType>>(`/leaves/types/${id}`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leaveTypes'] });
      queryClient.invalidateQueries({ queryKey: ['leaveType', variables.id] });
    },
  });
};

export const useDeleteLeaveType = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<LeaveType>, Error, string>({
    mutationFn: async (id) => {
      const response = await apiClient.delete<BaseResponse<LeaveType>>(`/leaves/types/${id}`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['leaveTypes'] });
      queryClient.invalidateQueries({ queryKey: ['leaveType', id] });
    },
  });
};

// ==========================================
// 2. Leave Allocation Hooks
// ==========================================

export const useLeaveAllocations = (filters?: { employeeId?: string; year?: number }) => {
  return useQuery<BaseResponse<LeaveAllocation[]>, Error>({
    queryKey: ['leaveAllocations', filters],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<LeaveAllocation[]>>('/leaves/allocations', {
        params: filters,
      });
      return response.data;
    },
  });
};

export const useAllocateLeave = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<LeaveAllocation>, Error, AllocateLeaveRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<BaseResponse<LeaveAllocation>>('/leaves/allocations', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveAllocations'] });
    },
  });
};

// ==========================================
// 3. Leave Request Hooks
// ==========================================

export const useLeaveRequests = (filters?: {
  employeeId?: string;
  leaveTypeId?: string;
  status?: LeaveStatus;
}) => {
  return useQuery<BaseResponse<LeaveRequest[]>, Error>({
    queryKey: ['leaveRequests', filters],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<LeaveRequest[]>>('/leaves/requests', {
        params: filters,
      });
      return response.data;
    },
  });
};

export const useLeaveRequestById = (id?: string) => {
  return useQuery<BaseResponse<LeaveRequest>, Error>({
    queryKey: ['leaveRequest', id],
    queryFn: async () => {
      if (!id) throw new Error('Leave request ID is required');
      const response = await apiClient.get<BaseResponse<LeaveRequest>>(`/leaves/requests/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useSubmitLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<LeaveRequest>, Error, SubmitLeaveRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.post<BaseResponse<LeaveRequest>>('/leaves/requests', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['leaveAllocations'] });
    },
  });
};

export const useProcessLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<
    BaseResponse<LeaveRequest>,
    Error,
    { id: string; data: ProcessLeaveRequest }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.patch<BaseResponse<LeaveRequest>>(
        `/leaves/requests/${id}/process`,
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['leaveRequest', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['leaveAllocations'] });
    },
  });
};

export const useCancelLeaveRequest = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<LeaveRequest>, Error, string>({
    mutationFn: async (id) => {
      const response = await apiClient.patch<BaseResponse<LeaveRequest>>(`/leaves/requests/${id}/cancel`);
      return response.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['leaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['leaveRequest', id] });
      queryClient.invalidateQueries({ queryKey: ['leaveAllocations'] });
    },
  });
};
