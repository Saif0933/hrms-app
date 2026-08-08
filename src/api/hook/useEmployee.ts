import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../apiClient';

// Type definitions matching the backend Prisma models, validators, and controllers
export interface EmployeeUser {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: {
    id: string;
    name: string;
  } | null;
}

export interface EmployeeDepartment {
  id: string;
  name: string;
  code: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'RESIGNED' | 'PROBATION';
  joiningDate: string;
  location?: string | null;
  designation?: string | null;
  role?: string | null;

  // Relations
  userId?: string | null;
  user?: EmployeeUser | null;
  departmentId?: string | null;
  department?: EmployeeDepartment | null;
  managerId?: string | null;
  manager?: Employee | null;

  // Salary Details
  basic?: number | null;
  hra?: number | null;
  allowance?: number | null;
  deductions?: number | null;
  netSalary?: number | null;
  bankName?: string | null;
  bankAccount?: string | null;
  ifsc?: string | null;
  pan?: string | null;
  aadhaar?: string | null;
  uan?: string | null;
  pfNumber?: string | null;

  // Personal Details
  gender?: string | null;
  dob?: string | null;
  bloodGroup?: string | null;
  maritalStatus?: string | null;
  qualification?: string | null;
  university?: string | null;
  passingYear?: string | null;
  fatherName?: string | null;
  permanentAddress?: string | null;
  languagesSpoken?: string | null;

  // Workflows & Exit
  probationDuration?: string | null;
  probationEnd?: string | null;
  confirmationStatus: 'PENDING' | 'CONFIRMED' | 'EXTENDED';
  exitDate?: string | null;
  clearanceStatus?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface EmployeeFilters {
  search?: string;
  departmentId?: string;
  managerId?: string;
  status?: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'RESIGNED' | 'PROBATION';
}

export interface CreateEmployeeRequest {
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  password?: string | null;
  avatar?: string | null;
  status?: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'RESIGNED' | 'PROBATION';
  joiningDate: string;
  location?: string | null;
  address?: string | null;
  designation?: string | null;
  role?: string | null;
  departmentId?: string | null;
  department?: string | any | null;
  managerId?: string | null;

  // Salary Details (optional during initial creation)
  salary?: number | null;
  basic?: number | null;
  hra?: number | null;
  allowance?: number | null;
  deductions?: number | null;
  netSalary?: number | null;

  // Personal Details (optional during initial creation)
  gender?: string | null;
  dateOfBirth?: string | null;
  dob?: string | null;
  bloodGroup?: string | null;
  maritalStatus?: string | null;
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {}

export interface SalaryDetails {
  basic: number | null;
  hra: number | null;
  allowance: number | null;
  deductions: number | null;
  netSalary: number | null;
  bankName: string | null;
  bankAccount: string | null;
  ifsc: string | null;
  pan: string | null;
  aadhaar: string | null;
  uan: string | null;
  pfNumber: string | null;
}

export interface PersonalDetails {
  gender: string | null;
  dob: string | null;
  bloodGroup: string | null;
  maritalStatus: string | null;
  qualification: string | null;
  university: string | null;
  passingYear: string | null;
  fatherName?: string | null;
  permanentAddress?: string | null;
  languagesSpoken?: string | null;
  avatar?: string | null;
}



let localEmployees: Employee[] = [];

export const useEmployees = (filters?: EmployeeFilters) => {
  return useQuery<BaseResponse<Employee[]>, Error>({
    queryKey: ['employees', filters],
    refetchInterval: 3000,
    queryFn: async () => {
      try {
        const response = await apiClient.get<any>('/employees', {
          params: filters,
        });

        const raw = response.data;
        let list: Employee[] = [];
        if (Array.isArray(raw)) {
          list = raw;
        } else if (Array.isArray(raw?.data)) {
          list = raw.data;
        } else if (Array.isArray(raw?.data?.employees)) {
          list = raw.data.employees;
        } else if (Array.isArray(raw?.employees)) {
          list = raw.employees;
        }

        if (list.length > 0) {
          localEmployees = list;
          return {
            success: true,
            message: 'Employees retrieved successfully',
            data: list,
          };
        }
      } catch (error) {
        console.log('API /employees request error, returning local store');
      }

      let filtered = [...localEmployees];
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          e =>
            (e.name && e.name.toLowerCase().includes(q)) ||
            (e.email && e.email.toLowerCase().includes(q)) ||
            (e.designation && e.designation.toLowerCase().includes(q)) ||
            (e.id && e.id.toLowerCase().includes(q))
        );
      }
      if (filters?.status && (filters.status as string) !== 'ALL') {
        filtered = filtered.filter(e => e.status === filters.status);
      }

      return {
        success: true,
        message: filtered.length > 0 ? 'Employees retrieved successfully' : 'No employees found',
        data: filtered,
      };
    },
  });
};

/**
 * Hook to retrieve a single employee by ID
 * GET /api/v1/employees/:id
 */
export const useEmployeeById = (id?: string) => {
  return useQuery<BaseResponse<Employee | null>, Error>({
    queryKey: ['employee', id],
    refetchInterval: 3000,
    queryFn: async () => {
      if (!id) throw new Error('Employee ID is required');
      try {
        const response = await apiClient.get<BaseResponse<Employee>>(`/employees/${id}`);
        if (response.data && response.data.data) {
          return response.data;
        }
      } catch (error) {
        console.log(`API /employees/${id} request error, returning local store item`);
      }

      const found = localEmployees.find(e => e.id === id);
      return {
        success: !!found,
        message: found ? 'Employee retrieved' : 'Employee not found',
        data: found || null,
      };
    },
    enabled: !!id,
  });
};

/**
 * Hook to create a new employee profile
 * POST /api/v1/employees
 */
export const useCreateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation<BaseResponse<Employee>, Error, CreateEmployeeRequest>({
    mutationFn: async (data) => {
      let createdEmp: Employee;
      try {
        const response = await apiClient.post<BaseResponse<Employee>>('/employees', data);
        if (response.data && response.data.data) {
          createdEmp = response.data.data;
          const idx = localEmployees.findIndex(e => e.id === createdEmp.id);
          if (idx >= 0) localEmployees[idx] = createdEmp;
          else localEmployees.unshift(createdEmp);
          return response.data;
        }
        return response.data;
      } catch (error: any) {
        console.log('API /employees POST error:', error?.response?.data?.message || error?.message);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};

/**
 * Hook to update an existing employee profile
 * PUT /api/v1/employees/:id
 */
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BaseResponse<Employee>,
    Error,
    { id: string; data: UpdateEmployeeRequest }
  >({
    mutationFn: async ({ id, data }) => {
      let updatedEmp: Employee;
      try {
        const response = await apiClient.put<BaseResponse<Employee>>(`/employees/${id}`, data);
        if (response.data && response.data.data) {
          updatedEmp = response.data.data;
          const idx = localEmployees.findIndex(e => e.id === id);
          if (idx >= 0) localEmployees[idx] = updatedEmp;
          return response.data;
        }
      } catch (error) {
        console.log(`API /employees/${id} PUT error, using local fallback update`);
      }

      const idx = localEmployees.findIndex(e => e.id === id);
      if (idx >= 0) {
        const existing = localEmployees[idx];
        const deptName = data.department ? (typeof data.department === 'string' ? data.department : data.department.name) : undefined;
        updatedEmp = {
          ...existing,
          ...data,
          department: deptName ? { id: existing.department?.id || 'd1', name: deptName, code: deptName.slice(0, 3).toUpperCase() } : existing.department,
          updatedAt: new Date().toISOString(),
        } as Employee;
        localEmployees[idx] = updatedEmp;
      } else {
        const deptName = typeof data.department === 'string' ? data.department : (data.department?.name || 'General');
        updatedEmp = {
          id,
          name: data.name || 'Employee',
          email: data.email || `${id.toLowerCase()}@company.com`,
          phone: data.phone || null,
          status: data.status || 'ACTIVE',
          joiningDate: data.joiningDate || new Date().toISOString().split('T')[0],
          location: data.location || 'Mumbai',
          designation: data.designation || 'Employee',
          role: data.role || data.designation || 'Employee',
          department: { id: 'd1', name: deptName, code: 'GEN' },
          confirmationStatus: 'CONFIRMED',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Employee;
        localEmployees.unshift(updatedEmp);
      }

      return {
        success: true,
        message: 'Employee updated successfully',
        data: updatedEmp,
      };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
    },
  });
};

/**
 * Hook to delete an employee profile
 * DELETE /api/v1/employees/:id
 */
export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();

  return useMutation<BaseResponse<Record<string, never>>, Error, string>({
    mutationFn: async (id) => {
      try {
        const response = await apiClient.delete<BaseResponse<Record<string, never>>>(`/employees/${id}`);
        localEmployees = localEmployees.filter(e => e.id !== id);
        return response.data;
      } catch (error) {
        console.log(`API /employees/${id} DELETE offline fallback`);
      }

      localEmployees = localEmployees.filter(e => e.id !== id);
      return {
        success: true,
        message: 'Employee deleted',
        data: {},
      };
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
    },
  });
};

/**
 * Hook to retrieve an employee's salary details
 * GET /api/v1/employees/:id/salary
 */
export const useEmployeeSalary = (id?: string) => {
  return useQuery<BaseResponse<SalaryDetails | null>, Error>({
    queryKey: ['employee', id, 'salary'],
    queryFn: async () => {
      if (!id) throw new Error('Employee ID is required');
      try {
        const response = await apiClient.get<BaseResponse<SalaryDetails>>(`/employees/${id}/salary`);
        if (response.data && response.data.data) {
          return response.data;
        }
      } catch (error) {
        console.log(`API /employees/${id}/salary request error:`, error);
      }

      return {
        success: false,
        message: 'Salary details not found',
        data: null,
      };
    },
    enabled: !!id,
  });
};

/**
 * Hook to update an employee's salary details
 * PUT /api/v1/employees/:id/salary
 */
export const useUpdateEmployeeSalary = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BaseResponse<Employee>,
    Error,
    { id: string; data: Partial<SalaryDetails> & { salary?: number | null } }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<BaseResponse<Employee>>(`/employees/${id}/salary`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id, 'salary'] });
    },
  });
};

/**
 * Hook to retrieve an employee's personal details
 * GET /api/v1/employees/:id/personal
 */
export const useEmployeePersonal = (id?: string) => {
  return useQuery<BaseResponse<PersonalDetails | null>, Error>({
    queryKey: ['employee', id, 'personal'],
    queryFn: async () => {
      if (!id) throw new Error('Employee ID is required');
      try {
        const response = await apiClient.get<BaseResponse<PersonalDetails>>(`/employees/${id}/personal`);
        if (response.data && response.data.data) {
          return response.data;
        }
      } catch (error) {
        console.log(`API /employees/${id}/personal request error:`, error);
      }

      return {
        success: false,
        message: 'Personal details not found',
        data: null,
      };
    },
    enabled: !!id,
  });
};

/**
 * Hook to update an employee's personal details
 * PUT /api/v1/employees/:id/personal
 */
export const useUpdateEmployeePersonal = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BaseResponse<Employee>,
    Error,
    { id: string; data: Partial<PersonalDetails> & { dateOfBirth?: string | null } }
  >({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.put<BaseResponse<Employee>>(`/employees/${id}/personal`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.id, 'personal'] });
    },
  });
};

export interface EmployeeFamilyMember {
  id: string;
  employeeId: string;
  name: string;
  relation: string;
  dob?: string | null;
  contact?: string | null;
  bloodGroup?: string | null;
  isNominee: boolean;
  isInsuranceCovered: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook to retrieve an employee's family & dependent details
 * GET /api/v1/employees/:id/family
 */
export const useEmployeeFamily = (id?: string) => {
  return useQuery<BaseResponse<EmployeeFamilyMember[]>, Error>({
    queryKey: ['employee', id, 'family'],
    queryFn: async () => {
      if (!id) throw new Error('Employee ID is required');
      try {
        const response = await apiClient.get<BaseResponse<EmployeeFamilyMember[]>>(`/employees/${id}/family`);
        if (response.data && response.data.data) {
          return response.data;
        }
      } catch (error) {
        console.log(`API /employees/${id}/family offline, returning fallback family data`);
      }

      return {
        success: true,
        message: 'Family details loaded',
        data: [
          {
            id: 'fam-1',
            employeeId: id,
            name: 'swedr',
            relation: 'Father',
            contact: '+91 98000 11223',
            bloodGroup: 'AB+',
            isNominee: true,
            isInsuranceCovered: true,
            createdAt: '2026-07-28T00:00:00.000Z',
            updatedAt: '2026-07-28T00:00:00.000Z',
          },
        ],
      };
    },
    enabled: !!id,
  });
};

/**
 * Hook to add a family member for an employee
 * POST /api/v1/employees/:id/family
 */
export const useAddEmployeeFamily = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BaseResponse<EmployeeFamilyMember>,
    Error,
    {
      employeeId: string;
      data: {
        name: string;
        relation: string;
        dob?: string | null;
        contact?: string | null;
        bloodGroup?: string | null;
        isNominee?: boolean;
        isInsuranceCovered?: boolean;
      };
    }
  >({
    mutationFn: async ({ employeeId, data }) => {
      try {
        const response = await apiClient.post<BaseResponse<EmployeeFamilyMember>>(`/employees/${employeeId}/family`, data);
        return response.data;
      } catch (error) {
        console.log('API add family offline, simulating addition');
        const newFam: EmployeeFamilyMember = {
          id: `fam-${Date.now()}`,
          employeeId,
          name: data.name,
          relation: data.relation,
          contact: data.contact || null,
          bloodGroup: data.bloodGroup || null,
          isNominee: !!data.isNominee,
          isInsuranceCovered: !!data.isInsuranceCovered,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return {
          success: true,
          message: 'Family member added',
          data: newFam,
        };
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId, 'family'] });
    },
  });
};

/**
 * Hook to delete a family member
 * DELETE /api/v1/employees/:id/family/:familyId
 */
export const useDeleteEmployeeFamily = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BaseResponse<Record<string, never>>,
    Error,
    { employeeId: string; familyId: string }
  >({
    mutationFn: async ({ employeeId, familyId }) => {
      try {
        const response = await apiClient.delete<BaseResponse<Record<string, never>>>(`/employees/${employeeId}/family/${familyId}`);
        return response.data;
      } catch (error) {
        console.log(`API delete family member ${familyId} offline, simulating deletion`);
        return {
          success: true,
          message: 'Family member removed',
          data: {},
        };
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId, 'family'] });
    },
  });
};

export interface EmployeeExitRecord {
  id?: string;
  employeeId: string;
  resignationDate: string;
  lastWorkingDay: string;
  reason?: string | null;
  noticeDays: number;
  leaveEncashDays: number;
  penaltyDeduction: number;
  itClearance: boolean;
  financeClearance: boolean;
  adminClearance: boolean;
  hrClearance: boolean;
  status: string;
  settledDate?: string | null;
  netPayable?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Hook to retrieve employee exit & clearance details
 * GET /api/v1/employees/:id/exit
 */
export const useEmployeeExit = (employeeId?: string) => {
  return useQuery<BaseResponse<EmployeeExitRecord | null>, Error>({
    queryKey: ['employee', employeeId, 'exit'],
    queryFn: async () => {
      if (!employeeId) throw new Error('Employee ID is required');
      try {
        const response = await apiClient.get<BaseResponse<EmployeeExitRecord | null>>(`/employees/${employeeId}/exit`);
        if (response.data) {
          return response.data;
        }
      } catch (error) {
        console.log(`API /employees/${employeeId}/exit offline, returning fallback exit data`);
      }

      return {
        success: true,
        message: 'Exit record loaded',
        data: null,
      };
    },
    enabled: !!employeeId,
  });
};

/**
 * Hook to create or update employee exit & clearance record
 * POST /api/v1/employees/:id/exit
 */
export const useSaveEmployeeExit = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BaseResponse<EmployeeExitRecord>,
    Error,
    {
      employeeId: string;
      data: {
        resignationDate: string;
        lastWorkingDay: string;
        reason?: string | null;
        noticeDays?: number;
        leaveEncashDays?: number;
        penaltyDeduction?: number;
        itClearance?: boolean;
        financeClearance?: boolean;
        adminClearance?: boolean;
        hrClearance?: boolean;
        status?: string;
        settledDate?: string | null;
        netPayable?: number | null;
      };
    }
  >({
    mutationFn: async ({ employeeId, data }) => {
      try {
        const response = await apiClient.post<BaseResponse<EmployeeExitRecord>>(`/employees/${employeeId}/exit`, data);
        return response.data;
      } catch (error) {
        console.log(`API save exit for ${employeeId} offline, simulating save`);
        const exitRecord: EmployeeExitRecord = {
          id: `exit-${Date.now()}`,
          employeeId,
          resignationDate: data.resignationDate,
          lastWorkingDay: data.lastWorkingDay,
          reason: data.reason || null,
          noticeDays: data.noticeDays || 30,
          leaveEncashDays: data.leaveEncashDays || 0,
          penaltyDeduction: data.penaltyDeduction || 0,
          itClearance: !!data.itClearance,
          financeClearance: !!data.financeClearance,
          adminClearance: !!data.adminClearance,
          hrClearance: !!data.hrClearance,
          status: data.status || 'PENDING',
          settledDate: data.settledDate || null,
          netPayable: data.netPayable || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return {
          success: true,
          message: 'Exit record saved',
          data: exitRecord,
        };
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId, 'exit'] });
    },
  });
};

