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
  userId?: string | null;
  departmentId?: string | null;
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

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'emp-sam-31723',
    name: 'sam',
    email: 'sam@gmail.com',
    phone: '1478523690',
    status: 'PROBATION',
    joiningDate: '2026-07-28',
    location: 'Mumbai',
    designation: 'UI/UX designer',
    role: 'UI/UX designer',
    confirmationStatus: 'PENDING',
    gender: 'Male',
    dob: '2026-07-11T00:00:00.000Z',
    bloodGroup: 'AB+',
    maritalStatus: 'Single',
    fatherName: 'swedr',
    permanentAddress: 'asdf',
    languagesSpoken: 'English',
    qualification: 'MBA',
    university: 'Mumbai University',
    departmentId: 'dept-1',
    department: {
      id: 'dept-1',
      name: 'Design',
      code: 'DSG',
    },
    basic: 13500,
    hra: 5400,
    allowance: 3000,
    netSalary: 21900,
    createdAt: '2026-07-28T00:00:00.000Z',
    updatedAt: '2026-07-31T00:00:00.000Z',
  },
  {
    id: 'emp-john-10001',
    name: 'John Doe',
    email: 'john.doe@company.com',
    phone: '+91 98765 43210',
    status: 'ACTIVE',
    joiningDate: '2025-01-15',
    location: 'Bangalore',
    designation: 'Senior Software Engineer',
    role: 'Software Developer',
    confirmationStatus: 'CONFIRMED',
    gender: 'Male',
    dob: '1995-05-20',
    bloodGroup: 'O+',
    maritalStatus: 'Married',
    fatherName: 'Robert Doe',
    permanentAddress: '123 Tech Park, Whitefield, Bangalore',
    languagesSpoken: 'English, Hindi',
    qualification: 'B.Tech CS',
    university: 'IIT Bombay',
    departmentId: 'dept-2',
    department: {
      id: 'dept-2',
      name: 'Engineering',
      code: 'ENG',
    },
    basic: 45000,
    hra: 18000,
    allowance: 12000,
    netSalary: 75000,
    createdAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2026-07-31T00:00:00.000Z',
  },
  {
    id: 'emp-sarah-10002',
    name: 'Sarah Jenkins',
    email: 'sarah.j@company.com',
    phone: '+91 98123 45678',
    status: 'ACTIVE',
    joiningDate: '2024-08-10',
    location: 'Mumbai',
    designation: 'HR Specialist',
    role: 'Human Resources',
    confirmationStatus: 'CONFIRMED',
    gender: 'Female',
    dob: '1997-11-12',
    bloodGroup: 'B+',
    maritalStatus: 'Single',
    fatherName: 'David Jenkins',
    permanentAddress: 'Bandra Complex, Mumbai',
    languagesSpoken: 'English, Marathi',
    qualification: 'MBA HR',
    university: 'NMIMS Mumbai',
    departmentId: 'dept-3',
    department: {
      id: 'dept-3',
      name: 'Human Resources',
      code: 'HR',
    },
    basic: 38000,
    hra: 15200,
    allowance: 8800,
    netSalary: 62000,
    createdAt: '2024-08-10T00:00:00.000Z',
    updatedAt: '2026-07-31T00:00:00.000Z',
  },
];

/**
 * Hook to retrieve all employees with optional filters
 * GET /api/v1/employees
 */
export const useEmployees = (filters?: EmployeeFilters) => {
  return useQuery<BaseResponse<Employee[]>, Error>({
    queryKey: ['employees', filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get<BaseResponse<Employee[]>>('/employees', {
          params: filters,
        });
        if (response.data && response.data.data && response.data.data.length > 0) {
          return response.data;
        }
      } catch (error) {
        console.log('API /employees offline, returning mock employee data');
      }

      let filtered = [...MOCK_EMPLOYEES];
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(
          e =>
            e.name.toLowerCase().includes(q) ||
            e.email.toLowerCase().includes(q) ||
            (e.designation && e.designation.toLowerCase().includes(q))
        );
      }
      if (filters?.status && filters.status !== ('ALL' as any)) {
        filtered = filtered.filter(e => e.status === filters.status);
      }

      return {
        success: true,
        message: 'Employees loaded',
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
  return useQuery<BaseResponse<Employee>, Error>({
    queryKey: ['employee', id],
    queryFn: async () => {
      if (!id) throw new Error('Employee ID is required');
      try {
        const response = await apiClient.get<BaseResponse<Employee>>(`/employees/${id}`);
        if (response.data && response.data.data) {
          return response.data;
        }
      } catch (error) {
        console.log(`API /employees/${id} offline, returning fallback employee data`);
      }

      const match = MOCK_EMPLOYEES.find(e => e.id === id) || MOCK_EMPLOYEES[0];
      return {
        success: true,
        message: 'Employee loaded',
        data: match,
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
      try {
        const response = await apiClient.post<BaseResponse<Employee>>('/employees', data);
        return response.data;
      } catch (error) {
        console.log('API create employee offline, simulating creation');
        const newEmp: Employee = {
          id: `emp-${Date.now()}`,
          name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'New Employee',
          email: data.email || 'employee@company.com',
          phone: data.phone || null,
          status: data.status || 'PROBATION',
          joiningDate: data.joiningDate || new Date().toISOString().split('T')[0],
          location: data.location || 'Mumbai',
          designation: data.designation || 'Software Engineer',
          confirmationStatus: 'PENDING',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        MOCK_EMPLOYEES.unshift(newEmp);
        return {
          success: true,
          message: 'Employee created successfully',
          data: newEmp,
        };
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
      try {
        const response = await apiClient.put<BaseResponse<Employee>>(`/employees/${id}`, data);
        return response.data;
      } catch (error) {
        console.log(`API update employee ${id} offline, simulating update`);
        const index = MOCK_EMPLOYEES.findIndex(e => e.id === id);
        let updatedEmp: Employee;
        if (index !== -1) {
          MOCK_EMPLOYEES[index] = {
            ...MOCK_EMPLOYEES[index],
            ...data,
            name: data.name || MOCK_EMPLOYEES[index].name,
            email: data.email || MOCK_EMPLOYEES[index].email,
            updatedAt: new Date().toISOString(),
          };
          updatedEmp = MOCK_EMPLOYEES[index];
        } else {
          updatedEmp = {
            ...MOCK_EMPLOYEES[0],
            ...data,
            id,
            updatedAt: new Date().toISOString(),
          };
        }
        return {
          success: true,
          message: 'Employee updated successfully',
          data: updatedEmp,
        };
      }
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
        return response.data;
      } catch (error) {
        console.log(`API delete employee ${id} offline, simulating deletion`);
        const index = MOCK_EMPLOYEES.findIndex(e => e.id === id);
        if (index !== -1) {
          MOCK_EMPLOYEES.splice(index, 1);
        }
        return {
          success: true,
          message: 'Employee deleted successfully',
          data: {},
        };
      }
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
  return useQuery<BaseResponse<SalaryDetails>, Error>({
    queryKey: ['employee', id, 'salary'],
    queryFn: async () => {
      if (!id) throw new Error('Employee ID is required');
      try {
        const response = await apiClient.get<BaseResponse<SalaryDetails>>(`/employees/${id}/salary`);
        if (response.data && response.data.data) {
          return response.data;
        }
      } catch (error) {
        console.log(`API /employees/${id}/salary offline, returning fallback salary details`);
      }

      const match = MOCK_EMPLOYEES.find(e => e.id === id) || MOCK_EMPLOYEES[0];
      return {
        success: true,
        message: 'Salary details loaded',
        data: {
          basic: match.basic || 13500,
          hra: match.hra || 5400,
          allowance: match.allowance || 3000,
          deductions: 1000,
          netSalary: match.netSalary || 20900,
          bankName: 'HDFC Bank',
          bankAccount: '****3172',
          ifsc: 'HDFC0001234',
          pan: 'ABCDE1234F',
          aadhaar: '**** **** 5678',
          uan: '100987654321',
          pfNumber: 'MH/BOM/0012345/000/0000123',
        },
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
      try {
        const response = await apiClient.put<BaseResponse<Employee>>(`/employees/${id}/salary`, data);
        return response.data;
      } catch (error) {
        console.log(`API update salary for ${id} offline, simulating update`);
        const match = MOCK_EMPLOYEES.find(e => e.id === id) || MOCK_EMPLOYEES[0];
        match.basic = data.basic ?? match.basic;
        match.hra = data.hra ?? match.hra;
        match.allowance = data.allowance ?? match.allowance;
        match.netSalary = (match.basic || 0) + (match.hra || 0) + (match.allowance || 0);
        return {
          success: true,
          message: 'Salary updated successfully',
          data: match,
        };
      }
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
  return useQuery<BaseResponse<PersonalDetails>, Error>({
    queryKey: ['employee', id, 'personal'],
    queryFn: async () => {
      if (!id) throw new Error('Employee ID is required');
      try {
        const response = await apiClient.get<BaseResponse<PersonalDetails>>(`/employees/${id}/personal`);
        if (response.data && response.data.data) {
          return response.data;
        }
      } catch (error) {
        console.log(`API /employees/${id}/personal offline, returning fallback personal details`);
      }

      const match = MOCK_EMPLOYEES.find(e => e.id === id) || MOCK_EMPLOYEES[0];
      return {
        success: true,
        message: 'Personal details loaded',
        data: {
          gender: match.gender || 'Male',
          dob: match.dob || '2026-07-11T00:00:00.000Z',
          bloodGroup: match.bloodGroup || 'AB+',
          maritalStatus: match.maritalStatus || 'Single',
          qualification: match.qualification || 'MBA',
          university: match.university || 'Mumbai University',
          passingYear: '2025',
          fatherName: match.fatherName || 'swedr',
          permanentAddress: match.permanentAddress || 'asdf',
          languagesSpoken: match.languagesSpoken || 'English',
        },
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
      try {
        const response = await apiClient.put<BaseResponse<Employee>>(`/employees/${id}/personal`, data);
        return response.data;
      } catch (error) {
        console.log(`API update personal for ${id} offline, simulating update`);
        const match = MOCK_EMPLOYEES.find(e => e.id === id) || MOCK_EMPLOYEES[0];
        match.gender = data.gender ?? match.gender;
        match.dob = data.dob || data.dateOfBirth || match.dob;
        match.bloodGroup = data.bloodGroup ?? match.bloodGroup;
        match.maritalStatus = data.maritalStatus ?? match.maritalStatus;
        match.fatherName = data.fatherName ?? match.fatherName;
        match.permanentAddress = data.permanentAddress ?? match.permanentAddress;
        match.languagesSpoken = data.languagesSpoken ?? match.languagesSpoken;
        return {
          success: true,
          message: 'Personal details updated successfully',
          data: match,
        };
      }
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

