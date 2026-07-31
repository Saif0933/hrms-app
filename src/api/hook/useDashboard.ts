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

export const MOCK_DASHBOARD_DATA: BaseResponse<DashboardData> = {
  success: true,
  message: 'Dashboard data retrieved successfully',
  data: {
    kpis: {
      totalEmployees: 148,
      activeEmployees: 142,
      probationEmployees: 6,
      leaveEmployees: 4,
      resignedEmployees: 2,
      pendingApprovalsCount: 5,
    },
    attendanceTrend: [
      { name: 'Mon', Present: 135, Late: 5, Absent: 8 },
      { name: 'Tue', Present: 138, Late: 3, Absent: 7 },
      { name: 'Wed', Present: 140, Late: 4, Absent: 4 },
      { name: 'Thu', Present: 136, Late: 6, Absent: 6 },
      { name: 'Fri', Present: 132, Late: 8, Absent: 8 },
    ],
    departmentDistribution: [
      { name: 'Engineering', value: 45 },
      { name: 'Human Resources', value: 12 },
      { name: 'Sales & Marketing', value: 38 },
      { name: 'Design', value: 15 },
      { name: 'Operations', value: 38 },
    ],
    genderDiversity: {
      male: 88,
      female: 60,
    },
    celebrations: {
      birthdays: [
        { id: '1', name: 'Alice Smith', type: 'Birthday' },
        { id: '2', name: 'Bob Johnson', type: 'Birthday' },
      ],
      anniversaries: [
        { id: '3', name: 'Charlie Brown (3 Yrs)', type: 'Work Anniversary' },
      ],
    },
    upcomingHolidays: [
      { id: 'h1', name: 'Independence Day', type: 'Public Holiday', date: '2026-08-15' },
      { id: 'h2', name: 'Ganesh Chaturthi', type: 'Gazetted Holiday', date: '2026-09-14' },
    ],
    pendingApprovals: {
      leaves: [
        { id: 'l1', employeeName: 'Sarah Jenkins', type: 'Casual Leave', startDate: '2026-08-02', endDate: '2026-08-04', days: 3, reason: 'Family event' },
        { id: 'l2', employeeName: 'Michael Scott', type: 'Sick Leave', startDate: '2026-08-01', endDate: '2026-08-01', days: 1, reason: 'Doctor appointment' },
      ],
      claims: [
        { id: 'c1', employeeName: 'Dwight Schrute', type: 'Travel Allowance', amount: 3500, date: '2026-07-28', reason: 'Client Visit' },
      ],
    },
    auditLogs: [
      { id: 'a1', user: 'John Doe', action: 'Check-in Registered', module: 'Attendance', timestamp: 'Today, 09:15 AM', details: 'Location: Main Office' },
      { id: 'a2', user: 'HR Admin', action: 'Casual Leave Approved', module: 'Leave Management', timestamp: 'Yesterday, 04:30 PM', details: '3 days approved' },
      { id: 'a3', user: 'Finance Lead', action: 'Expense Claim Processed', module: 'Claims', timestamp: '2 days ago', details: '₹3,500 reimbursed' },
    ],
  },
};

export const useDashboardData = () => {
  return useQuery<BaseResponse<DashboardData>, Error>({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<BaseResponse<DashboardData>>('/dashboard');
        return response.data;
      } catch (err) {
        console.log('Fetching /dashboard failed, using mock dashboard data');
        return MOCK_DASHBOARD_DATA;
      }
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

