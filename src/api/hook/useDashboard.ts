import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface DashboardKPIS {
  totalEmployees: number;
  activeEmployees: number;
  probationEmployees: number;
  leaveEmployees: number;
  resignedEmployees: number;
  pendingApprovalsCount: number;
}

export interface AttendanceTrendDay {
  name: string;
  Present: number;
  Late: number;
  Absent: number;
}

export interface DepartmentDistributionItem {
  name: string;
  value: number;
}

export interface CelebrationItem {
  id: string;
  name: string;
  type: string;
}

export interface DashboardCelebrations {
  birthdays: CelebrationItem[];
  anniversaries: CelebrationItem[];
}

export interface DashboardHoliday {
  id: string;
  name: string;
  type: string;
  date: string;
}

export interface PendingLeaveApproval {
  id: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
}

export interface PendingClaimApproval {
  id: string;
  employeeName: string;
  type: string;
  amount: number;
  date: string;
  reason: string;
}

export interface DashboardPendingApprovals {
  leaves: PendingLeaveApproval[];
  claims: PendingClaimApproval[];
}

export interface DashboardAuditLog {
  id: string;
  user: string;
  action: string;
  module: string;
  timestamp: string;
  details: string;
}

export interface DashboardData {
  kpis: DashboardKPIS;
  attendanceTrend: AttendanceTrendDay[];
  departmentDistribution: DepartmentDistributionItem[];
  genderDiversity: {
    male: number;
    female: number;
  };
  celebrations: DashboardCelebrations;
  upcomingHolidays: DashboardHoliday[];
  pendingApprovals: DashboardPendingApprovals;
  auditLogs: DashboardAuditLog[];
}

export const useDashboardData = () => {
  return useQuery<BaseResponse<DashboardData>, Error>({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<DashboardData>>('/dashboard');
      return response.data;
    },
  });
};

export const useLogAction = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<any>, Error, {
    user: string;
    action: string;
    module: string;
    details: string;
  }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<any>>('/dashboard/log', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    },
  });
};
