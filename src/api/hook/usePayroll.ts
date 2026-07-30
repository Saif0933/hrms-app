import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

// Enums & Types
export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PayrollCycle {
  id: string;
  month: string;
  year: number;
  status: 'PENDING_ATTENDANCE_LOCK' | 'PROCESSING_SALARIES' | 'DISBURSED';
  createdAt: string;
  updatedAt: string;
}

export interface PayrollRun {
  id: string;
  employeeId: string;
  cycleId: string;
  basic: number;
  hra: number;
  allowance: number;
  pf: number;
  pt: number;
  tds: number;
  bonus: number;
  arrear: number;
  deductions: number;
  netSalary: number;
  status: 'PENDING' | 'PAID' | 'HELD';
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    designation?: string | null;
    uan?: string | null;
    pan?: string | null;
    bankName?: string | null;
    bankAccount?: string | null;
    department?: {
      id: string;
      name: string;
    } | null;
  };
}

export interface PayrollExclusion {
  id: string;
  employeeId: string;
  cycleId: string;
  reason?: string | null;
  createdAt: string;
}

export interface PayrollCycleDetails {
  cycle: PayrollCycle;
  runs: PayrollRun[];
  exclusions: PayrollExclusion[];
  stats: {
    totalEpfWages: number;
    totalPfContribution: number;
    compliant: boolean;
  };
}

export interface LoanTransaction {
  id: string;
  loanId: string;
  amount: number;
  type: 'REPAYMENT' | 'DISBURSEMENT';
  createdAt: string;
}

export interface Loan {
  id: string;
  employeeId: string;
  principal: number;
  balance: number;
  emi: number;
  purpose?: string | null;
  status: 'ACTIVE' | 'PAID' | 'REJECTED';
  approvedDate: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: string;
    name: string;
    email: string;
  };
  transactions?: LoanTransaction[];
}

export interface TaxDeclaration {
  id: string;
  employeeId: string;
  financialYear: string;
  sec80C: number;
  sec80D: number;
  declaredHra: number;
  createdAt: string;
  updatedAt: string;
}

// Queries & Mutations

/**
 * Hook to retrieve or create a payroll cycle for a given month & year
 * GET /api/v1/payroll/cycle
 */
export const usePayrollCycle = (month: string, year: number) => {
  return useQuery<BaseResponse<PayrollCycleDetails>, Error>({
    queryKey: ['payrollCycle', month, year],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<PayrollCycleDetails>>('/payroll/cycle', {
        params: { month, year },
      });
      return response.data;
    },
    enabled: !!month && !!year,
  });
};

/**
 * Hook to update status of a payroll cycle
 * PATCH /api/v1/payroll/cycle/:id/status
 */
export const useUpdateCycleStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<PayrollCycleDetails>, Error, { id: string; status: string }>({
    mutationFn: async ({ id, status }) => {
      const response = await apiClient.patch<BaseResponse<PayrollCycleDetails>>(`/payroll/cycle/${id}/status`, {
        status,
      });
      return response.data;
    },
    onSuccess: (res) => {
      if (res.success && res.data) {
        queryClient.invalidateQueries({ queryKey: ['payrollCycle'] });
        queryClient.invalidateQueries({ queryKey: ['employees'] });
      }
    },
  });
};

/**
 * Hook to trigger arrears computation for a cycle
 * POST /api/v1/payroll/cycle/:cycleId/arrears
 */
export const useCalculateArrears = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<PayrollCycleDetails>, Error, string>({
    mutationFn: async (cycleId) => {
      const response = await apiClient.post<BaseResponse<PayrollCycleDetails>>(`/payroll/cycle/${cycleId}/arrears`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollCycle'] });
    },
  });
};

/**
 * Hook to toggle Hold / Stop Payment status for an employee in a cycle
 * POST /api/v1/payroll/cycle/:cycleId/hold
 */
export const useToggleStopPayment = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<PayrollCycleDetails>, Error, { cycleId: string; employeeId: string; reason?: string | null }>({
    mutationFn: async ({ cycleId, employeeId, reason }) => {
      const response = await apiClient.post<BaseResponse<PayrollCycleDetails>>(`/payroll/cycle/${cycleId}/hold`, {
        employeeId,
        reason,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollCycle'] });
    },
  });
};

/**
 * Hook to apply bulk salary revision (increment percentage)
 * POST /api/v1/payroll/revision
 */
export const useApplyBulkRevision = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<{ message: string; count: number }>, Error, { incrementPercentage: number; departmentId?: string | null }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<{ message: string; count: number }>>('/payroll/revision', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['payrollCycle'] });
    },
  });
};

/**
 * Hook to fetch loans ledger
 * GET /api/v1/payroll/loans
 */
export const useLoans = (employeeId?: string) => {
  return useQuery<BaseResponse<Loan[]>, Error>({
    queryKey: ['loans', employeeId],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<Loan[]>>('/payroll/loans', {
        params: { employeeId },
      });
      return response.data;
    },
  });
};

/**
 * Hook to apply/request a loan or cash advance
 * POST /api/v1/payroll/loans
 */
export const useApplyLoan = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<Loan>, Error, { employeeId: string; principal: number; emi: number; purpose?: string | null }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<Loan>>('/payroll/loans', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
  });
};

/**
 * Hook to fetch investment declaration of an employee
 * GET /api/v1/payroll/tax-declaration
 */
export const useTaxDeclaration = (employeeId: string, financialYear: string) => {
  return useQuery<BaseResponse<TaxDeclaration>, Error>({
    queryKey: ['taxDeclaration', employeeId, financialYear],
    queryFn: async () => {
      const response = await apiClient.get<BaseResponse<TaxDeclaration>>('/payroll/tax-declaration', {
        params: { employeeId, financialYear },
      });
      return response.data;
    },
    enabled: !!employeeId && !!financialYear,
  });
};

/**
 * Hook to save investment declaration
 * POST /api/v1/payroll/tax-declaration
 */
export const useSaveTaxDeclaration = () => {
  const queryClient = useQueryClient();
  return useMutation<BaseResponse<TaxDeclaration>, Error, { employeeId: string; financialYear: string; sec80C?: number; sec80D?: number; declaredHra?: number }>({
    mutationFn: async (payload) => {
      const response = await apiClient.post<BaseResponse<TaxDeclaration>>('/payroll/tax-declaration', payload);
      return response.data;
    },
    onSuccess: (res) => {
      if (res.success && res.data) {
        queryClient.invalidateQueries({
          queryKey: ['taxDeclaration', res.data.employeeId, res.data.financialYear],
        });
      }
    },
  });
};
