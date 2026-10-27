import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  useAddEmployeeFamily,
  useCreateEmployee,
  useDeleteEmployee,
  useDeleteEmployeeFamily,
  useEmployeeById,
  useEmployeeFamily,
  useEmployeePersonal,
  useEmployeeSalary,
  useUpdateEmployee,
  useUpdateEmployeePersonal,
  useUpdateEmployeeSalary,
} from '../../api/hook/useEmployee';
import { useRoles } from '../../api/hook/useRole';
import { useProfile } from '../../api/hook/useAuth';
import { Dropdown } from 'react-native-element-dropdown';
import { useDepartments } from '../../api/hook/useDepartment';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'EmployeeMaster'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'EmployeeMaster'>;

type WizardTab = 'OVERVIEW' | 'SALARY' | 'LEAVE' | 'PERSONAL' | 'FAMILY';

const bloodGroupOptions = [
  { label: 'A+', value: 'A+' },
  { label: 'A-', value: 'A-' },
  { label: 'B+', value: 'B+' },
  { label: 'B-', value: 'B-' },
  { label: 'O+', value: 'O+' },
  { label: 'O-', value: 'O-' },
  { label: 'AB+', value: 'AB+' },
  { label: 'AB-', value: 'AB-' },
];

export const EmployeeMasterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { colors, isDark } = useTheme();

  const employeeId = route.params?.employeeId;
  const isEditing = !!employeeId;

  const tabs: WizardTab[] = ['OVERVIEW', 'SALARY', 'LEAVE', 'PERSONAL', 'FAMILY'];
  const tabLabels: Record<WizardTab, string> = {
    OVERVIEW: 'Overview',
    SALARY: 'Salary',
    LEAVE: 'Leave',
    PERSONAL: 'Personal',
    FAMILY: 'Family',
  };

  const [activeTab, setActiveTab] = useState<WizardTab>('OVERVIEW');
  const [completedSteps, setCompletedSteps] = useState<number[]>(isEditing ? [0, 1, 2, 3, 4] : []);

  // Overview & Password State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [department, setDepartment] = useState('Finance');
  const [location, setLocation] = useState('Mumbai');
  const [status, setStatus] = useState<'ACTIVE' | 'ON_LEAVE' | 'TERMINATED' | 'RESIGNED' | 'PROBATION'>('ACTIVE');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
  const [photoUrl, setPhotoUrl] = useState('');
  const [showJoiningPicker, setShowJoiningPicker] = useState(false);

  // Salary State (with deductions & net salary auto-calc)
  const [basic, setBasic] = useState('');
  const [hra, setHra] = useState('');
  const [allowance, setAllowance] = useState('');
  const [deductions, setDeductions] = useState('');
  const [netSalary, setNetSalary] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [pan, setPan] = useState('');
  const [aadhaar, setAadhaar] = useState('');

  // Leave Allocation State (aligned with Web standards)
  const [casualLeave, setCasualLeave] = useState('12');
  const [sickLeave, setSickLeave] = useState('12');
  const [earnedLeave, setEarnedLeave] = useState('15');
  const [maternityLeave, setMaternityLeave] = useState('10');
  const [leavePolicy, setLeavePolicy] = useState('Standard Corporate Leave Policy 2026');

  const leavePolicyOptions = [
    { label: 'Standard Corporate Policy (12 CL, 12 SL, 15 EL)', value: 'Standard Corporate Leave Policy 2026' },
    { label: 'Executive Leave Policy (15 CL, 15 SL, 20 EL)', value: 'Executive Leave Policy 2026' },
    { label: 'Probationer Leave Policy (6 CL, 6 SL, 0 EL)', value: 'Probationer Leave Policy 2026' },
  ];

  // Personal State
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [bloodGroup, setBloodGroup] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [qualification, setQualification] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [languagesSpoken, setLanguagesSpoken] = useState('');

  // Family Modal State (with DOB, Nominee & Insurance)
  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [famName, setFamName] = useState('');
  const [famRelation, setFamRelation] = useState('Spouse');
  const [famContact, setFamContact] = useState('');
  const [famDob, setFamDob] = useState('');
  const [showFamDobPicker, setShowFamDobPicker] = useState(false);
  const [isNominee, setIsNominee] = useState(true);
  const [isInsuranceCovered, setIsInsuranceCovered] = useState(true);

  // TanStack Queries & Mutations
  const { data: empRes, isLoading: isEmpLoading } = useEmployeeById(employeeId);
  const { data: salaryRes } = useEmployeeSalary(employeeId);
  const { data: personalRes } = useEmployeePersonal(employeeId);
  const { data: familyRes } = useEmployeeFamily(employeeId);
  const { data: profileResponse } = useProfile();
  const organizationId = profileResponse?.data?.user?.organizationId;
  const { data: deptRes } = useDepartments(organizationId);

  const fetchedDepartments = deptRes?.data || [];
  const fetchedNames = fetchedDepartments.map(d => d.name).filter(Boolean);

  const defaultDeptList = [
    'Design',
    'Product',
    'Executive',
    'Human Resources',
    'Finance',
    'IT',
    'Sales',
  ];

  const dynamicDeptNames = Array.from(
    new Set([
      ...fetchedNames,
      ...(fetchedNames.length === 0 ? defaultDeptList : []),
    ])
  );

  const departmentDropdownOptions = dynamicDeptNames.map(deptName => {
    const deptObj = fetchedDepartments.find(d => d.name === deptName);
    return {
      label: deptObj?.code ? `${deptName} (${deptObj.code})` : deptName,
      value: deptName,
    };
  });

  const { data: rolesResponse } = useRoles(organizationId);
  const fetchedRoles = rolesResponse?.data || [];
  const roleDropdownOptions = fetchedRoles.map(r => ({
    label: `${r.name}${r.description ? ` (${r.description})` : ''}`,
    value: r.id,
  }));
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();
  const deleteMutation = useDeleteEmployee();
  const updateSalaryMutation = useUpdateEmployeeSalary();
  const updatePersonalMutation = useUpdateEmployeePersonal();
  const addFamilyMutation = useAddEmployeeFamily();
  const deleteFamilyMutation = useDeleteEmployeeFamily();

  // Populate data if editing
  useEffect(() => {
    if (empRes?.data) {
      const emp = empRes.data;
      setName(emp.name || '');
      setEmail(emp.email || '');
      setPhone(emp.phone || '');
      setDesignation(emp.designation || '');
      if (emp.department) setDepartment(typeof emp.department === 'string' ? emp.department : emp.department.name || 'Finance');
      if (emp.location) setLocation(emp.location);
      setStatus(emp.status || 'ACTIVE');
      if (emp.joiningDate) setJoiningDate(emp.joiningDate.split('T')[0]);
      if (emp.avatar) setPhotoUrl(emp.avatar);
      if ((emp as any).user?.roleId || (emp as any).roleId) {
        setSelectedRoleId((emp as any).user?.roleId || (emp as any).roleId);
      }
    }
  }, [empRes]);

  useEffect(() => {
    if (salaryRes?.data) {
      const sal = salaryRes.data;
      setBasic(sal.basic ? String(sal.basic) : '');
      setHra(sal.hra ? String(sal.hra) : '');
      setAllowance(sal.allowance ? String(sal.allowance) : '');
      setDeductions(sal.deductions ? String(sal.deductions) : '');
      setNetSalary(sal.netSalary ? String(sal.netSalary) : '');
      setBankName(sal.bankName || '');
      setBankAccount(sal.bankAccount || '');
      setIfsc(sal.ifsc || '');
      setPan(sal.pan || '');
      setAadhaar(sal.aadhaar || '');
    }
  }, [salaryRes]);

  // Auto-calculation logic for Salary & Deductions (matching Web formula)
  const handleBasicChange = (text: string) => {
    setBasic(text);
    const b = parseFloat(text);
    if (!isNaN(b) && b > 0) {
      const h = Math.round(b * 0.4);   // 40% HRA
      const a = Math.round(b * 0.3);   // 30% Allowance
      const d = Math.round(b * 0.15);  // 15% Deductions
      const net = b + h + a - d;
      setHra(String(h));
      setAllowance(String(a));
      setDeductions(String(d));
      setNetSalary(String(net));
    } else if (!text) {
      setHra('');
      setAllowance('');
      setDeductions('');
      setNetSalary('');
    }
  };

  const handleSalaryComponentChange = (field: 'hra' | 'allowance' | 'deductions', val: string) => {
    if (field === 'hra') setHra(val);
    if (field === 'allowance') setAllowance(val);
    if (field === 'deductions') setDeductions(val);

    const b = parseFloat(basic) || 0;
    const h = parseFloat(field === 'hra' ? val : hra) || 0;
    const a = parseFloat(field === 'allowance' ? val : allowance) || 0;
    const d = parseFloat(field === 'deductions' ? val : deductions) || 0;
    const net = b + h + a - d;
    setNetSalary(String(Math.max(0, net)));
  };

  const handleLeavePolicyChange = (policy: string) => {
    setLeavePolicy(policy);
    if (policy === 'Standard Corporate Leave Policy 2026') {
      setCasualLeave('12');
      setSickLeave('12');
      setEarnedLeave('15');
      setMaternityLeave('10');
    } else if (policy === 'Executive Leave Policy 2026') {
      setCasualLeave('15');
      setSickLeave('15');
      setEarnedLeave('20');
      setMaternityLeave('12');
    } else if (policy === 'Probationer Leave Policy 2026') {
      setCasualLeave('6');
      setSickLeave('6');
      setEarnedLeave('0');
      setMaternityLeave('0');
    }
  };

  useEffect(() => {
    if (personalRes?.data) {
      const per = personalRes.data;
      setGender(per.gender || '');
      setDob(per.dob ? per.dob.split('T')[0] : '');
      setBloodGroup(per.bloodGroup || '');
      setMaritalStatus(per.maritalStatus || '');
      setQualification(per.qualification || '');
    }
  }, [personalRes]);

  // Validation Checks for Sequential Steps
  const isOverviewValid = name.trim().length > 0 && email.trim().length > 0;
  const isSalaryValid = basic.trim().length > 0 && bankAccount.trim().length > 0;
  const isLeaveValid = casualLeave.trim().length > 0 && sickLeave.trim().length > 0;
  const isPersonalValid = fatherName.trim().length > 0 && permanentAddress.trim().length > 0;

  const currentTabIndex = tabs.indexOf(activeTab);

  const canAccessTab = (tabIndex: number): boolean => {
    if (isEditing) return true;
    if (tabIndex === 0) return true;
    if (tabIndex === 1) return completedSteps.includes(0) && isOverviewValid;
    if (tabIndex === 2) return completedSteps.includes(1) && isSalaryValid;
    if (tabIndex === 3) return completedSteps.includes(2) && isLeaveValid;
    if (tabIndex === 4) return completedSteps.includes(3) && isPersonalValid;
    return false;
  };

  const handleTabClick = (tab: WizardTab, idx: number) => {
    if (canAccessTab(idx)) {
      setActiveTab(tab);
    } else {
      Alert.alert(
        'Step Locked 🔒',
        `Please fill out all required fields in Step ${idx} and click Next Step to unlock ${tabLabels[tab]}.`
      );
    }
  };

  // Date Picker Handlers
  const handleJoiningDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowJoiningPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setJoiningDate(selectedDate.toISOString().split('T')[0]);
    } else if (event.type === 'dismissed') {
      setShowJoiningPicker(false);
    }
  };

  const handleDobChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDobPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setDob(selectedDate.toISOString().split('T')[0]);
    } else if (event.type === 'dismissed') {
      setShowDobPicker(false);
    }
  };

  const handleFamDobChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowFamDobPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setFamDob(selectedDate.toISOString().split('T')[0]);
    } else if (event.type === 'dismissed') {
      setShowFamDobPicker(false);
    }
  };

  // Step 1 Save (Overview)
  const handleSaveOverview = (onSuccessCallback?: () => void) => {
    if (!isOverviewValid) {
      Alert.alert('Validation Error', 'Full Name and Official Email are required.');
      return;
    }

    const payloadPassword = accountPassword.trim() ? accountPassword.trim() : undefined;

    if (isEditing && employeeId) {
      updateMutation.mutate(
        {
          id: employeeId,
          data: {
            name,
            email,
            phone,
            password: payloadPassword,
            designation,
            department,
            location,
            status,
            joiningDate,
            avatar: photoUrl,
          },
        },
        {
          onSuccess: () => {
            setCompletedSteps(prev => Array.from(new Set([...prev, 0])));
            Alert.alert('Step 1 Saved', 'Basic Overview details updated in database.');
            if (onSuccessCallback) onSuccessCallback();
          },
          onError: err => Alert.alert('Error', err.message),
        }
      );
    } else {
      createMutation.mutate(
        {
          name,
          email,
          phone,
          password: payloadPassword,
          roleId: selectedRoleId || undefined,
          designation,
          department,
          location,
          status,
          joiningDate,
          avatar: photoUrl,
        },
        {
          onSuccess: res => {
            setCompletedSteps(prev => Array.from(new Set([...prev, 0])));
            Alert.alert('Step 1 Saved', 'Employee registered in database.');
            navigation.replace('EmployeeMaster', { employeeId: res.data.id });
            if (onSuccessCallback) onSuccessCallback();
          },
          onError: err => Alert.alert('Error', err.message),
        }
      );
    }
  };

  // Step 2 Save (Salary)
  const handleSaveSalary = (onSuccessCallback?: () => void) => {
    if (!employeeId) {
      Alert.alert('Note', 'Please complete Step 1 (Overview) first to create the employee record.');
      return;
    }
    if (!isSalaryValid) {
      Alert.alert('Validation Error', 'Basic Salary and Bank Account Number are required.');
      return;
    }

    updateSalaryMutation.mutate(
      {
        id: employeeId,
        data: {
          basic: basic ? parseFloat(basic) : null,
          hra: hra ? parseFloat(hra) : null,
          allowance: allowance ? parseFloat(allowance) : null,
          deductions: deductions ? parseFloat(deductions) : null,
          netSalary: netSalary ? parseFloat(netSalary) : null,
          bankName,
          bankAccount,
          ifsc,
          pan,
          aadhaar: aadhaar.trim() || null,
        },
      },
      {
        onSuccess: () => {
          setCompletedSteps(prev => Array.from(new Set([...prev, 1])));
          Alert.alert('Step 2 Saved', 'Salary structure & bank details updated in database.');
          if (onSuccessCallback) onSuccessCallback();
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  // Step 3 Save (Leave)
  const handleSaveLeave = (onSuccessCallback?: () => void) => {
    if (!isLeaveValid) {
      Alert.alert('Validation Error', 'Casual and Sick leave quotas are required.');
      return;
    }
    setCompletedSteps(prev => Array.from(new Set([...prev, 2])));
    Alert.alert('Step 3 Saved', `Leave Allocations Saved to Database:\nCasual: ${casualLeave}d, Sick: ${sickLeave}d, Earned: ${earnedLeave}d, Maternity: ${maternityLeave}d`);
    if (onSuccessCallback) onSuccessCallback();
  };

  // Step 4 Save (Personal)
  const handleSavePersonal = (onSuccessCallback?: () => void) => {
    if (!employeeId) {
      Alert.alert('Note', 'Please complete Step 1 (Overview) first.');
      return;
    }
    if (!isPersonalValid) {
      Alert.alert('Validation Error', "Father's Name and Permanent Address are required.");
      return;
    }

    updatePersonalMutation.mutate(
      {
        id: employeeId,
        data: {
          gender,
          dob,
          bloodGroup,
          maritalStatus,
          qualification,
          fatherName,
          permanentAddress,
          languagesSpoken,
        },
      },
      {
        onSuccess: () => {
          setCompletedSteps(prev => Array.from(new Set([...prev, 3])));
          Alert.alert('Step 4 Saved', 'Personal background details updated in database.');
          if (onSuccessCallback) onSuccessCallback();
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  // Step 5 Save All Details to Database
  const handleSaveAll = () => {
    if (!employeeId && !isOverviewValid) {
      Alert.alert('Error', 'Please complete all required fields in the setup wizard.');
      return;
    }

    // Perform final sync across all sections
    if (employeeId) {
      updateMutation.mutate(
        {
          id: employeeId,
          data: { name, email, phone, designation, department, location, status, joiningDate, avatar: photoUrl },
        },
        {
          onSuccess: () => {
            updateSalaryMutation.mutate({
              id: employeeId,
              data: {
                basic: basic ? parseFloat(basic) : null,
                hra: hra ? parseFloat(hra) : null,
                allowance: allowance ? parseFloat(allowance) : null,
                deductions: deductions ? parseFloat(deductions) : null,
                netSalary: netSalary ? parseFloat(netSalary) : null,
                bankName,
                bankAccount,
                ifsc,
                pan,
                aadhaar: aadhaar.trim() || null,
              },
            });

            updatePersonalMutation.mutate({
              id: employeeId,
              data: {
                gender,
                dob,
                bloodGroup,
                maritalStatus,
                qualification,
                fatherName,
                permanentAddress,
                languagesSpoken,
              },
            });

            Alert.alert(
              'Registration Complete 🎉',
              'All employee details have been successfully saved into the database.',
              [
                {
                  text: 'OK / Open Directory',
                  onPress: () => {
                    navigation.navigate('EmployeeDirectory');
                  },
                },
              ]
            );
          },
          onError: err => Alert.alert('Error', err.message),
        }
      );
    } else {
      handleSaveOverview(() => {
        Alert.alert(
          'Registration Complete 🎉',
          'All employee details have been successfully saved into the database.',
          [
            {
              text: 'OK / Open Directory',
              onPress: () => {
                navigation.navigate('EmployeeDirectory');
              },
            },
          ]
        );
      });
    }
  };

  const handleNextStep = () => {
    if (activeTab === 'OVERVIEW') {
      handleSaveOverview(() => setActiveTab('SALARY'));
    } else if (activeTab === 'SALARY') {
      handleSaveSalary(() => setActiveTab('LEAVE'));
    } else if (activeTab === 'LEAVE') {
      handleSaveLeave(() => setActiveTab('PERSONAL'));
    } else if (activeTab === 'PERSONAL') {
      handleSavePersonal(() => setActiveTab('FAMILY'));
    } else if (activeTab === 'FAMILY') {
      handleSaveAll();
    }
  };

  const handlePreviousStep = () => {
    if (currentTabIndex > 0) {
      setActiveTab(tabs[currentTabIndex - 1]);
    }
  };

  const handleAddFamilyMember = () => {
    if (!employeeId || !famName.trim() || !famRelation.trim()) {
      Alert.alert('Validation Error', 'Name and Relation are required');
      return;
    }

    addFamilyMutation.mutate(
      {
        employeeId,
        data: {
          name: famName.trim(),
          relation: famRelation.trim(),
          contact: famContact.trim() || null,
          dob: famDob.trim() || null,
          isNominee,
          isInsuranceCovered,
        },
      },
      {
        onSuccess: () => {
          setFamilyModalOpen(false);
          setFamName('');
          setFamRelation('Spouse');
          setFamContact('');
          setFamDob('');
          setIsNominee(false);
          setIsInsuranceCovered(true);
          Alert.alert('Success', 'Family member added to database.');
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const handleDeleteEmployee = () => {
    if (!employeeId) return;
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this employee record?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteMutation.mutate(employeeId, {
            onSuccess: () => {
              Alert.alert('Deleted', 'Employee record removed from database.');
              navigation.goBack();
            },
          });
        },
      },
    ]);
  };

  const handlePhotoUploadSimulate = () => {
    const sampleAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    ];
    const picked = sampleAvatars[Math.floor(Math.random() * sampleAvatars.length)];
    setPhotoUrl(picked);
    Alert.alert('Photo Selected', 'Employee profile photo updated.');
  };

  // Helper check for current step validation
  const isCurrentStepValid = (): boolean => {
    if (activeTab === 'OVERVIEW') return isOverviewValid;
    if (activeTab === 'SALARY') return isSalaryValid;
    if (activeTab === 'LEAVE') return isLeaveValid;
    if (activeTab === 'PERSONAL') return isPersonalValid;
    if (activeTab === 'FAMILY') return true;
    return false;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* Header Bar */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.headerBackground, borderBottomColor: colors.headerBorder },
        ]}
      >
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {isEditing ? 'Employee Master Setup' : 'New Employee Registration'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {name ? `${name} • Step ${currentTabIndex + 1} of 5` : `Step ${currentTabIndex + 1} of 5: ${tabLabels[activeTab]}`}
          </Text>
        </View>

        {isEditing && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteEmployee}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={14} color="#ef4444" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* VISUAL STEPPER WIZARD COMPONENT */}
      <View style={[styles.stepperWrapper, { backgroundColor: colors.cardBackground, borderBottomColor: colors.cardBorder }]}>
        <View style={styles.stepperContainer}>
          {tabs.map((tab, idx) => {
            const isCompleted = completedSteps.includes(idx);
            const isActive = activeTab === tab;

            return (
              <React.Fragment key={tab}>
                <View style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepBadge,
                      {
                        backgroundColor: isActive
                          ? colors.accent
                          : isCompleted
                          ? '#10b981'
                          : colors.background,
                        borderColor: isActive
                          ? colors.accent
                          : isCompleted
                          ? '#10b981'
                          : colors.cardBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stepBadgeText,
                        { color: isActive || isCompleted ? '#ffffff' : colors.textSecondary },
                      ]}
                    >
                      {isCompleted ? '✓' : idx + 1}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.stepLabelText,
                      { color: isActive ? colors.accent : colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {tabLabels[tab]}
                  </Text>
                </View>

                {idx < tabs.length - 1 && (
                  <View
                    style={[
                      styles.stepLineConnector,
                      { backgroundColor: completedSteps.includes(idx) ? '#10b981' : colors.cardBorder },
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>
      </View>

      {isEmpLoading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ color: colors.textSecondary, marginTop: 10 }}>Loading profile data...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* STEP 1: OVERVIEW & ACCOUNT SETUP */}
          {activeTab === 'OVERVIEW' && (
            <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <View style={styles.stepTitleRow}>
                <MaterialCommunityIcons name="account-details-outline" size={22} color={colors.accent} />
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                  1. Basic Info & Account Credentials
                </Text>
              </View>

              {/* Photo Upload Zone */}
              <View style={[styles.photoCard, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.cardBorder }]}>
                <View style={styles.avatarPreviewBox}>
                  <Text style={{ fontSize: 32 }}>{photoUrl ? '📸' : '👤'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.photoCardTitle, { color: colors.textPrimary }]}>Employee Profile Photo</Text>
                  <Text style={[styles.photoCardSub, { color: colors.textSecondary }]}>
                    Upload photo badge for official digital ID card.
                  </Text>
                  <TouchableOpacity
                    style={[styles.uploadPhotoBtn, { backgroundColor: colors.accent }]}
                    onPress={handlePhotoUploadSimulate}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.uploadPhotoBtnText}>📷 Select / Upload Photo</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Full Name */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>FULL NAME *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Aarav Sharma"
                placeholderTextColor={colors.inputPlaceholder}
              />

              {/* Email Address */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>OFFICIAL EMAIL ADDRESS *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholder="aarav.sharma@symbosys.com"
                placeholderTextColor={colors.inputPlaceholder}
                autoCapitalize="none"
              />

              {/* ACCOUNT PASSWORD */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ACCOUNT PASSWORD *</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                  value={accountPassword}
                  onChangeText={setAccountPassword}
                  placeholder="••••••••••••"
                  placeholderTextColor={colors.inputPlaceholder}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity style={styles.eyeToggleBtn} onPress={() => setShowPassword(!showPassword)}>
                  <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Phone Number */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>MOBILE PHONE NUMBER</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+1 234 567 890"
                placeholderTextColor={colors.inputPlaceholder}
              />

              {/* Designation */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DESIGNATION (TITLE)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={designation}
                onChangeText={setDesignation}
                placeholder="Senior UI Developer"
                placeholderTextColor={colors.inputPlaceholder}
              />

              {/* Organization Role (Permissions) */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ORGANIZATION ROLE (PERMISSIONS)</Text>
              <Dropdown
                style={[
                  styles.dropdownInput,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    marginBottom: 16,
                  },
                ]}
                placeholderStyle={[styles.dropdownPlaceholder, { color: colors.inputPlaceholder }]}
                selectedTextStyle={[styles.dropdownSelectedText, { color: colors.inputText }]}
                inputSearchStyle={[styles.dropdownSearchInput, { color: colors.inputText, backgroundColor: colors.inputBackground }]}
                containerStyle={[styles.dropdownContainer, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}
                itemTextStyle={{ color: isDark ? '#ffffff' : '#0f172a', fontSize: 14 }}
                activeColor={isDark ? '#334155' : '#f1f5f9'}
                data={roleDropdownOptions}
                search
                maxHeight={280}
                labelField="label"
                valueField="value"
                placeholder="Select Organization Role"
                searchPlaceholder="Search role..."
                value={selectedRoleId}
                onChange={item => {
                  setSelectedRoleId(item.value);
                }}
              />

              {/* Department Dropdown */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DEPARTMENT *</Text>
              <Dropdown
                style={[
                  styles.dropdownInput,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    marginBottom: 16,
                  },
                ]}
                placeholderStyle={[styles.dropdownPlaceholder, { color: colors.inputPlaceholder }]}
                selectedTextStyle={[styles.dropdownSelectedText, { color: colors.inputText }]}
                inputSearchStyle={[styles.dropdownSearchInput, { color: colors.inputText, backgroundColor: colors.inputBackground }]}
                containerStyle={[styles.dropdownContainer, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}
                itemTextStyle={{ color: isDark ? '#ffffff' : '#0f172a', fontSize: 14 }}
                activeColor={isDark ? '#334155' : '#f1f5f9'}
                data={departmentDropdownOptions}
                search
                maxHeight={280}
                labelField="label"
                valueField="value"
                placeholder="Select Department"
                searchPlaceholder="Search department..."
                value={department}
                onChange={item => {
                  setDepartment(item.value);
                }}
              />

              {/* Work Location */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>WORK LOCATION</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={location}
                onChangeText={setLocation}
                placeholder="Mumbai"
                placeholderTextColor={colors.inputPlaceholder}
              />

              {/* Joining DatePicker */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>JOINING DATE *</Text>
              <TouchableOpacity
                style={[styles.dateInputRow, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                onPress={() => setShowJoiningPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={{ color: joiningDate ? colors.inputText : colors.inputPlaceholder, fontSize: 14, flex: 1 }}>
                  {joiningDate || 'YYYY-MM-DD'}
                </Text>
                <MaterialCommunityIcons name="calendar" size={20} color={colors.accent} />
              </TouchableOpacity>

              {showJoiningPicker && (
                <DateTimePicker
                  value={joiningDate ? new Date(joiningDate) : new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={handleJoiningDateChange}
                />
              )}

              {/* Status */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EMPLOYMENT STATUS</Text>
              <View style={styles.statusRow}>
                {(['ACTIVE', 'PROBATION', 'ON_LEAVE', 'RESIGNED'] as const).map(st => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: status === st ? colors.accent : (isDark ? '#0f172a' : '#f8fafc'),
                        borderColor: status === st ? colors.accent : colors.cardBorder,
                      },
                    ]}
                    onPress={() => setStatus(st)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: status === st ? '#ffffff' : colors.textSecondary, fontSize: 11, fontWeight: '700' }}>
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* STEP 2: SALARY & BANK DETAILS */}
          {activeTab === 'SALARY' && (
            <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <View style={styles.stepTitleRow}>
                <MaterialCommunityIcons name="cash-multiple" size={22} color={colors.accent} />
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                  2. Salary CTC & Bank Accounts
                </Text>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>BASIC SALARY (₹/month) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={basic}
                onChangeText={handleBasicChange}
                keyboardType="numeric"
                placeholder="50000"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>HRA ALLOWANCE (₹) - [40% Auto]</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={hra}
                onChangeText={val => handleSalaryComponentChange('hra', val)}
                keyboardType="numeric"
                placeholder="20000"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SPECIAL ALLOWANCE (₹) - [30% Auto]</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={allowance}
                onChangeText={val => handleSalaryComponentChange('allowance', val)}
                keyboardType="numeric"
                placeholder="15000"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>MONTHLY DEDUCTIONS (₹) - [15% Auto PF/Tax]</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={deductions}
                onChangeText={val => handleSalaryComponentChange('deductions', val)}
                keyboardType="numeric"
                placeholder="7500"
                placeholderTextColor={colors.inputPlaceholder}
              />

              {/* Net Take-Home Salary Banner */}
              <View
                style={[
                  styles.netSalaryBanner,
                  {
                    backgroundColor: isDark ? '#064e3b33' : '#ecfdf5',
                    borderColor: isDark ? '#059669' : '#a7f3d0',
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.netSalaryLabel, { color: isDark ? '#6ee7b7' : '#047857' }]}>
                    ESTIMATED NET MONTHLY SALARY
                  </Text>
                  <Text style={[styles.netSalaryValue, { color: isDark ? '#ecfdf5' : '#065f46' }]}>
                    ₹{netSalary ? parseFloat(netSalary).toLocaleString('en-IN') : '0'} / month
                  </Text>
                </View>
                <MaterialCommunityIcons name="calculator-variant-outline" size={26} color={isDark ? '#34d399' : '#059669'} />
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 8 }]}>BANK NAME</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={bankName}
                onChangeText={setBankName}
                placeholder="HDFC Bank / ICICI Bank"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>BANK ACCOUNT NUMBER *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={bankAccount}
                onChangeText={setBankAccount}
                placeholder="50100234567890"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>IFSC CODE / ROUTING NUMBER</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={ifsc}
                onChangeText={setIfsc}
                placeholder="HDFC0001234"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PAN / TAX IDENTIFICATION</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={pan}
                onChangeText={setPan}
                placeholder="ABCDE1234F"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>AADHAAR CARD NUMBER (12-DIGIT)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={aadhaar}
                onChangeText={setAadhaar}
                keyboardType="numeric"
                maxLength={12}
                placeholder="1234 5678 9012"
                placeholderTextColor={colors.inputPlaceholder}
              />
            </View>
          )}

          {/* STEP 3: LEAVE ALLOCATIONS */}
          {activeTab === 'LEAVE' && (
            <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <View style={styles.stepTitleRow}>
                <MaterialCommunityIcons name="palm-tree" size={22} color={colors.accent} />
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                  3. Annual Leave Allocation Quotas
                </Text>
              </View>
              <Text style={[styles.subText, { color: colors.textSecondary }]}>
                Configure initial leave balances and entitlement policies for this employee.
              </Text>

              {/* Leave Policy Dropdown */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ASSIGNED LEAVE POLICY</Text>
              <Dropdown
                style={[
                  styles.dropdownInput,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    marginBottom: 16,
                  },
                ]}
                placeholderStyle={[styles.dropdownPlaceholder, { color: colors.inputPlaceholder }]}
                selectedTextStyle={[styles.dropdownSelectedText, { color: colors.inputText }]}
                containerStyle={[styles.dropdownContainer, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}
                itemTextStyle={{ color: isDark ? '#ffffff' : '#0f172a', fontSize: 13 }}
                activeColor={isDark ? '#334155' : '#f1f5f9'}
                data={leavePolicyOptions}
                labelField="label"
                valueField="value"
                placeholder="Select Leave Policy"
                value={leavePolicy}
                onChange={item => handleLeavePolicyChange(item.value)}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CASUAL LEAVE QUOTA (Days/Year) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={casualLeave}
                onChangeText={setCasualLeave}
                keyboardType="numeric"
                placeholder="12"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SICK LEAVE QUOTA (Days/Year) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={sickLeave}
                onChangeText={setSickLeave}
                keyboardType="numeric"
                placeholder="12"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EARNED / PRIVILEGE LEAVE (Days/Year)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={earnedLeave}
                onChangeText={setEarnedLeave}
                keyboardType="numeric"
                placeholder="15"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>MATERNITY / PATERNITY LEAVE (Days)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={maternityLeave}
                onChangeText={setMaternityLeave}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor={colors.inputPlaceholder}
              />

              {/* Total Annual Allocation Banner */}
              <View
                style={[
                  styles.leaveTotalBanner,
                  {
                    backgroundColor: isDark ? '#064e3b33' : '#ecfdf5',
                    borderColor: isDark ? '#059669' : '#a7f3d0',
                  },
                ]}
              >
                <Text style={[styles.leaveTotalText, { color: isDark ? '#6ee7b7' : '#047857' }]}>
                  ✓ Total Annual Allocation:{' '}
                  <Text style={{ fontWeight: '800' }}>
                    {(parseInt(casualLeave) || 0) +
                      (parseInt(sickLeave) || 0) +
                      (parseInt(earnedLeave) || 0) +
                      (parseInt(maternityLeave) || 0)}{' '}
                    Days
                  </Text>
                </Text>
                <Text style={{ fontSize: 11, color: isDark ? '#34d399' : '#059669', marginTop: 2 }}>
                  Carry Forward Limit: Max 30 Days
                </Text>
              </View>
            </View>
          )}

          {/* STEP 4: PERSONAL DETAILS */}
          {activeTab === 'PERSONAL' && (
            <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <View style={styles.stepTitleRow}>
                <MaterialCommunityIcons name="account-outline" size={22} color={colors.accent} />
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                  4. Personal & Background Information
                </Text>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>FATHER'S / GUARDIAN NAME *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={fatherName}
                onChangeText={setFatherName}
                placeholder="e.g. Ramesh Sharma"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PERMANENT ADDRESS *</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={permanentAddress}
                onChangeText={setPermanentAddress}
                placeholder="Street address, city, state, postal code"
                placeholderTextColor={colors.inputPlaceholder}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DATE OF BIRTH</Text>
              <TouchableOpacity
                style={[styles.dateInputRow, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                onPress={() => setShowDobPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={{ color: dob ? colors.inputText : colors.inputPlaceholder, fontSize: 14, flex: 1 }}>
                  {dob || 'YYYY-MM-DD'}
                </Text>
                <MaterialCommunityIcons name="calendar-account" size={20} color={colors.accent} />
              </TouchableOpacity>

              {showDobPicker && (
                <DateTimePicker
                  value={dob ? new Date(dob) : new Date(1995, 0, 1)}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={handleDobChange}
                />
              )}

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>LANGUAGES SPOKEN</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={languagesSpoken}
                onChangeText={setLanguagesSpoken}
                placeholder="English, Hindi, Marathi"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>GENDER</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={gender}
                onChangeText={setGender}
                placeholder="Male / Female / Other"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>BLOOD GROUP</Text>
              <Dropdown
                style={[
                  styles.dropdownInput,
                  { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
                ]}
                placeholderStyle={[styles.dropdownPlaceholder, { color: colors.inputPlaceholder }]}
                selectedTextStyle={[styles.dropdownSelectedText, { color: colors.inputText }]}
                inputSearchStyle={[styles.dropdownSearchInput, { color: colors.inputText, backgroundColor: colors.inputBackground }]}
                containerStyle={[styles.dropdownContainer, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
                itemTextStyle={{ color: colors.textPrimary, fontSize: 14 }}
                activeColor={isDark ? '#334155' : '#f1f5f9'}
                data={bloodGroupOptions}
                search
                maxHeight={240}
                labelField="label"
                valueField="value"
                placeholder="Select Blood Group (e.g. O+)"
                searchPlaceholder="Search blood group..."
                value={bloodGroup}
                onChange={item => {
                  setBloodGroup(item.value);
                }}
                renderLeftIcon={() => (
                  <MaterialCommunityIcons
                    name="water-outline"
                    size={20}
                    color="#ef4444"
                    style={{ marginRight: 8 }}
                  />
                )}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>MARITAL STATUS</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={maritalStatus}
                onChangeText={setMaritalStatus}
                placeholder="Single / Married"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>HIGHEST QUALIFICATION</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={qualification}
                onChangeText={setQualification}
                placeholder="B.Tech Computer Science"
                placeholderTextColor={colors.inputPlaceholder}
              />
            </View>
          )}

          {/* STEP 5: FAMILY & DEPENDENTS */}
          {activeTab === 'FAMILY' && (
            <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <View style={styles.familyHeaderRow}>
                <View style={styles.stepTitleRow}>
                  <MaterialCommunityIcons name="account-heart-outline" size={22} color={colors.accent} />
                  <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                    5. Family Members & Emergency Contacts
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.addFamBtn, { backgroundColor: colors.accent }]}
                  onPress={() => setFamilyModalOpen(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.addFamBtnText}>+ Add Member</Text>
                </TouchableOpacity>
              </View>

              {familyRes?.data && familyRes.data.length > 0 ? (
                familyRes.data.map(fam => (
                  <View
                    key={fam.id}
                    style={[styles.famCard, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.cardBorder }]}
                  >
                    <View style={styles.famCardLeft}>
                      <Text style={[styles.famName, { color: colors.textPrimary }]}>{fam.name}</Text>
                      <Text style={[styles.famRelation, { color: colors.textSecondary }]}>
                        {fam.relation} • {fam.contact || 'No Contact'}
                        {fam.dob ? ` • DOB: ${fam.dob.split('T')[0]}` : ''}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                        {fam.isNominee && (
                          <View style={styles.nomineeBadge}>
                            <Text style={styles.nomineeBadgeText}>✓ PRIMARY NOMINEE</Text>
                          </View>
                        )}
                        {fam.isInsuranceCovered && (
                          <View style={styles.insuranceBadge}>
                            <Text style={styles.insuranceBadgeText}>✓ HEALTH INSURANCE</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() =>
                        employeeId &&
                        deleteFamilyMutation.mutate({ employeeId, familyId: fam.id })
                      }
                    >
                      <Text style={styles.famDeleteText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No family members added yet. Tap + Add Member to specify emergency contacts.
                </Text>
              )}

              {/* Company Insurance Note Banner (aligned with Web) */}
              <View
                style={[
                  styles.infoCallout,
                  {
                    backgroundColor: isDark ? '#1e3a8a33' : '#eff6ff',
                    borderColor: isDark ? '#1d4ed8' : '#bfdbfe',
                  },
                ]}
              >
                <MaterialCommunityIcons name="shield-check-outline" size={18} color={isDark ? '#93c5fd' : '#2563eb'} />
                <Text style={[styles.infoCalloutText, { color: isDark ? '#bfdbfe' : '#1e40af' }]}>
                  ✓ Dependents entered during onboarding will automatically be registered under Company Health Insurance coverage.
                </Text>
              </View>
            </View>
          )}

          {/* STEPPER PREVIOUS / NEXT / SAVE ALL NAVIGATION BUTTONS */}
          <View style={styles.bottomNavContainer}>
            {currentTabIndex > 0 && (
              <TouchableOpacity
                style={[styles.prevButton, { borderColor: colors.cardBorder, backgroundColor: colors.cardBackground }]}
                onPress={handlePreviousStep}
                activeOpacity={0.8}
              >
                <Text style={[styles.prevButtonText, { color: colors.textPrimary }]}>
                  ← Previous
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.nextButton,
                {
                  backgroundColor: isCurrentStepValid() ? colors.accent : '#cbd5e1',
                  opacity: isCurrentStepValid() ? 1 : 0.6,
                },
                currentTabIndex === 0 && { flex: 1 },
              ]}
              onPress={handleNextStep}
              disabled={!isCurrentStepValid()}
              activeOpacity={0.85}
            >
              <Text style={styles.nextButtonText}>
                {currentTabIndex === tabs.length - 1
                  ? '💾 Save All Employee Details'
                  : `Next Step: ${tabLabels[tabs[currentTabIndex + 1]]} →`}
              </Text>
            </TouchableOpacity>
          </View>
          {!isCurrentStepValid() && (
            <Text style={styles.validationNoticeText}>
              ⚠️ Please fill in all required (*) fields in Step {currentTabIndex + 1} to enable Next Step.
            </Text>
          )}
        </ScrollView>
      )}

      {/* Add Family Modal */}
      <Modal
        visible={familyModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFamilyModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Family Member / Nominee</Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>MEMBER FULL NAME *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={famName}
              onChangeText={setFamName}
              placeholder="e.g. Sunita Sharma"
              placeholderTextColor={colors.inputPlaceholder}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>RELATIONSHIP *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={famRelation}
              onChangeText={setFamRelation}
              placeholder="Spouse / Father / Mother / Child / Brother"
              placeholderTextColor={colors.inputPlaceholder}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DATE OF BIRTH</Text>
            <TouchableOpacity
              style={[styles.dateInputRow, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, marginBottom: 12 }]}
              onPress={() => setShowFamDobPicker(true)}
              activeOpacity={0.7}
            >
              <Text style={{ color: famDob ? colors.inputText : colors.inputPlaceholder, fontSize: 14, flex: 1 }}>
                {famDob || 'YYYY-MM-DD'}
              </Text>
              <MaterialCommunityIcons name="calendar-account" size={20} color={colors.accent} />
            </TouchableOpacity>

            {showFamDobPicker && (
              <DateTimePicker
                value={famDob ? new Date(famDob) : new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={handleFamDobChange}
              />
            )}

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EMERGENCY CONTACT NUMBER</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={famContact}
              onChangeText={setFamContact}
              keyboardType="phone-pad"
              placeholder="+91 98765 43210"
              placeholderTextColor={colors.inputPlaceholder}
            />

            {/* Nominee Switch */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>Primary Nominee</Text>
                <Text style={[styles.switchSubLabel, { color: colors.textSecondary }]}>
                  Designate as primary beneficiary nominee
                </Text>
              </View>
              <Switch
                value={isNominee}
                onValueChange={setIsNominee}
                trackColor={{ false: '#cbd5e1', true: colors.accent }}
                thumbColor="#ffffff"
              />
            </View>

            {/* Health Insurance Switch */}
            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>Health Insurance Coverage</Text>
                <Text style={[styles.switchSubLabel, { color: colors.textSecondary }]}>
                  Auto-enrolled under Company Health Insurance
                </Text>
              </View>
              <Switch
                value={isInsuranceCovered}
                onValueChange={setIsInsuranceCovered}
                trackColor={{ false: '#cbd5e1', true: colors.accent }}
                thumbColor="#ffffff"
              />
            </View>

            <View style={styles.modalFooterRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setFamilyModalOpen(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: colors.accent }]}
                onPress={handleAddFamilyMember}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Save Member</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ef444420',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  stepperWrapper: {
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  stepLabelText: {
    fontSize: 10,
    fontWeight: '700',
  },
  stepLineConnector: {
    height: 2,
    width: 14,
    marginTop: -14,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    gap: 10,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
  },
  subText: {
    fontSize: 12,
    marginBottom: 8,
  },
  photoCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  avatarPreviewBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563eb15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  photoCardSub: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 6,
  },
  uploadPhotoBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  uploadPhotoBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  eyeToggleBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  textArea: {
    minHeight: 70,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  bottomNavContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  prevButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  nextButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  validationNoticeText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  familyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addFamBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addFamBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  famCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  famCardLeft: {
    flex: 1,
  },
  famName: {
    fontSize: 14,
    fontWeight: '600',
  },
  famRelation: {
    fontSize: 12,
    marginTop: 2,
  },
  famDeleteText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  modalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  confirmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  dropdownInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    height: 46,
  },
  dropdownPlaceholder: {
    fontSize: 14,
  },
  dropdownSelectedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownSearchInput: {
    height: 40,
    fontSize: 14,
    borderRadius: 8,
  },
  dropdownContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  netSalaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 12,
  },
  netSalaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  netSalaryValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  leaveTotalBanner: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
  },
  leaveTotalText: {
    fontSize: 13,
    fontWeight: '600',
  },
  nomineeBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nomineeBadgeText: {
    color: '#15803d',
    fontSize: 9,
    fontWeight: '800',
  },
  insuranceBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  insuranceBadgeText: {
    color: '#1d4ed8',
    fontSize: 9,
    fontWeight: '800',
  },
  infoCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 14,
  },
  infoCalloutText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  switchSubLabel: {
    fontSize: 11,
    marginTop: 2,
  },
});
