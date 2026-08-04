import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'EmployeeMaster'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'EmployeeMaster'>;

type WizardTab = 'OVERVIEW' | 'SALARY' | 'LEAVE' | 'PERSONAL' | 'FAMILY';

export const EmployeeMasterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { colors } = useTheme();

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

  // Overview & Password State (Account Password is now under Email Address in Overview)
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

  // Salary State
  const [basic, setBasic] = useState('');
  const [hra, setHra] = useState('');
  const [allowance, setAllowance] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [pan, setPan] = useState('');

  // Leave Allocation State
  const [casualLeave, setCasualLeave] = useState('12');
  const [sickLeave, setSickLeave] = useState('10');
  const [earnedLeave, setEarnedLeave] = useState('15');
  const [maternityLeave, setMaternityLeave] = useState('90');

  // Personal State (Father's Name, Permanent Address, Languages Spoken)
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [qualification, setQualification] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [languagesSpoken, setLanguagesSpoken] = useState('');

  // Family Modal State
  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [famName, setFamName] = useState('');
  const [famRelation, setFamRelation] = useState('');
  const [famContact, setFamContact] = useState('');

  // TanStack Queries & Mutations
  const { data: empRes, isLoading: isEmpLoading } = useEmployeeById(employeeId);
  const { data: salaryRes } = useEmployeeSalary(employeeId);
  const { data: personalRes } = useEmployeePersonal(employeeId);
  const { data: familyRes } = useEmployeeFamily(employeeId);

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
    }
  }, [empRes]);

  useEffect(() => {
    if (salaryRes?.data) {
      const sal = salaryRes.data;
      setBasic(sal.basic ? String(sal.basic) : '');
      setHra(sal.hra ? String(sal.hra) : '');
      setAllowance(sal.allowance ? String(sal.allowance) : '');
      setBankName(sal.bankName || '');
      setBankAccount(sal.bankAccount || '');
      setIfsc(sal.ifsc || '');
      setPan(sal.pan || '');
    }
  }, [salaryRes]);

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

  const handleSaveOverview = (onSuccessCallback?: () => void) => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Validation Error', 'Name and Email are required.');
      return;
    }

    if (isEditing && employeeId) {
      updateMutation.mutate(
        {
          id: employeeId,
          data: { name, email, phone, designation, department, location, status, joiningDate, avatar: photoUrl },
        },
        {
          onSuccess: () => {
            Alert.alert('Step 1 Saved', 'Basic Overview details updated in database.');
            if (onSuccessCallback) onSuccessCallback();
          },
          onError: err => Alert.alert('Error', err.message),
        }
      );
    } else {
      createMutation.mutate(
        { name, email, phone, designation, department, location, status, joiningDate, avatar: photoUrl },
        {
          onSuccess: res => {
            Alert.alert('Step 1 Saved', 'Employee registered in database.');
            navigation.replace('EmployeeMaster', { employeeId: res.data.id });
            if (onSuccessCallback) onSuccessCallback();
          },
          onError: err => Alert.alert('Error', err.message),
        }
      );
    }
  };

  const handleSaveSalary = (onSuccessCallback?: () => void) => {
    if (!employeeId) {
      Alert.alert('Note', 'Please complete Step 1 (Overview) first to create the employee record.');
      return;
    }

    updateSalaryMutation.mutate(
      {
        id: employeeId,
        data: {
          basic: basic ? parseFloat(basic) : null,
          hra: hra ? parseFloat(hra) : null,
          allowance: allowance ? parseFloat(allowance) : null,
          bankName,
          bankAccount,
          ifsc,
          pan,
        },
      },
      {
        onSuccess: () => {
          Alert.alert('Step 2 Saved', 'Salary structure & bank details updated.');
          if (onSuccessCallback) onSuccessCallback();
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const handleSaveLeave = (onSuccessCallback?: () => void) => {
    Alert.alert('Step 3 Saved', `Leave Allocations Saved:\nCasual: ${casualLeave}d, Sick: ${sickLeave}d, Earned: ${earnedLeave}d, Maternity: ${maternityLeave}d`);
    if (onSuccessCallback) onSuccessCallback();
  };

  const handleSavePersonal = (onSuccessCallback?: () => void) => {
    if (!employeeId) {
      Alert.alert('Note', 'Please complete Step 1 (Overview) first.');
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
        },
      },
      {
        onSuccess: () => {
          Alert.alert('Step 4 Saved', 'Personal details updated.');
          if (onSuccessCallback) onSuccessCallback();
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const handleAddFamilyMember = () => {
    if (!employeeId || !famName || !famRelation) {
      Alert.alert('Validation Error', 'Name and Relation are required');
      return;
    }

    addFamilyMutation.mutate(
      {
        employeeId,
        data: {
          name: famName,
          relation: famRelation,
          contact: famContact,
        },
      },
      {
        onSuccess: () => {
          setFamilyModalOpen(false);
          setFamName('');
          setFamRelation('');
          setFamContact('');
          Alert.alert('Success', 'Family member added.');
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
              Alert.alert('Deleted', 'Employee record deleted.');
              navigation.goBack();
            },
          });
        },
      },
    ]);
  };

  // Stepper Controls
  const currentTabIndex = tabs.indexOf(activeTab);

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
    }
  };

  const handlePreviousStep = () => {
    if (currentTabIndex > 0) {
      setActiveTab(tabs[currentTabIndex - 1]);
    }
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
          style={[styles.backButton, { backgroundColor: colors.cardBackground }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={[styles.backIcon, { color: colors.textPrimary }]}>←</Text>
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
            <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* VISUAL STEPPER WIZARD COMPONENT */}
      <View style={[styles.stepperWrapper, { backgroundColor: colors.cardBackground, borderBottomColor: colors.cardBorder }]}>
        <View style={styles.stepperContainer}>
          {tabs.map((tab, idx) => {
            const isCompleted = currentTabIndex > idx;
            const isActive = activeTab === tab;
            return (
              <React.Fragment key={tab}>
                <TouchableOpacity
                  style={styles.stepItem}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                >
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
                </TouchableOpacity>

                {idx < tabs.length - 1 && (
                  <View
                    style={[
                      styles.stepLineConnector,
                      { backgroundColor: currentTabIndex > idx ? '#10b981' : colors.cardBorder },
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
          {/* STEP 1: OVERVIEW & ACCOUNT SETUP (ACCOUNT PASSWORD IS DIRECTLY BELOW EMAIL ADDRESS) */}
          {activeTab === 'OVERVIEW' && (
            <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                1. Basic Info & Account Credentials
              </Text>

              {/* Photo Upload Zone */}
              <View style={[styles.photoCard, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
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
                  >
                    <Text style={styles.uploadPhotoBtnText}>📷 Select / Upload Photo</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Full Name */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>👤 FULL NAME *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Aarav Sharma"
                placeholderTextColor={colors.inputPlaceholder}
              />

              {/* Email Address */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>📧 OFFICIAL EMAIL ADDRESS *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholder="aarav.sharma@symbosys.com"
                placeholderTextColor={colors.inputPlaceholder}
                autoCapitalize="none"
              />

              {/* ACCOUNT PASSWORD (PLACED DIRECTLY BELOW EMAIL ADDRESS) */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>🔒 ACCOUNT PASSWORD *</Text>
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
                  <Text style={{ fontSize: 16 }}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>

              {/* Phone Number */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>📞 MOBILE PHONE NUMBER</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+1 234 567 890"
                placeholderTextColor={colors.inputPlaceholder}
              />

              {/* Designation */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>💼 DESIGNATION & ROLE</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={designation}
                onChangeText={setDesignation}
                placeholder="Senior UI Developer"
                placeholderTextColor={colors.inputPlaceholder}
              />

              {/* Department */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>🏢 DEPARTMENT</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={department}
                onChangeText={setDepartment}
                placeholder="Finance"
                placeholderTextColor={colors.inputPlaceholder}
              />

              {/* Work Location */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>📍 WORK LOCATION</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={location}
                onChangeText={setLocation}
                placeholder="Mumbai"
                placeholderTextColor={colors.inputPlaceholder}
              />

              {/* Joining Date */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>📅 JOINING DATE (YYYY-MM-DD)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={joiningDate}
                onChangeText={setJoiningDate}
                placeholder="2026-01-15"
                placeholderTextColor={colors.inputPlaceholder}
              />

              {/* Status */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>STATUS</Text>
              <View style={styles.statusRow}>
                {(['ACTIVE', 'PROBATION', 'ON_LEAVE', 'RESIGNED'] as const).map(st => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: status === st ? colors.accent : colors.background,
                        borderColor: status === st ? colors.accent : colors.cardBorder,
                      },
                    ]}
                    onPress={() => setStatus(st)}
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
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                2. Salary CTC & Bank Accounts
              </Text>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>💵 BASIC SALARY ($/month)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={basic}
                onChangeText={setBasic}
                keyboardType="numeric"
                placeholder="5000"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>🏠 HRA ALLOWANCE ($)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={hra}
                onChangeText={setHra}
                keyboardType="numeric"
                placeholder="2000"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>🌟 SPECIAL ALLOWANCE ($)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={allowance}
                onChangeText={setAllowance}
                keyboardType="numeric"
                placeholder="1000"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>🏦 BANK NAME</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={bankName}
                onChangeText={setBankName}
                placeholder="JPMorgan Chase / HDFC Bank"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>💳 BANK ACCOUNT NUMBER</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={bankAccount}
                onChangeText={setBankAccount}
                placeholder="123456789012"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>🏛️ IFSC CODE / ROUTING NUMBER</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={ifsc}
                onChangeText={setIfsc}
                placeholder="CHAS0123456"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>📄 PAN / TAX IDENTIFICATION</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={pan}
                onChangeText={setPan}
                placeholder="ABCDE1234F"
                placeholderTextColor={colors.inputPlaceholder}
              />
            </View>
          )}

          {/* STEP 3: LEAVE ALLOCATIONS */}
          {activeTab === 'LEAVE' && (
            <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                3. Annual Leave Allocation Quotas
              </Text>
              <Text style={[styles.subText, { color: colors.textSecondary }]}>
                Configure initial leave balances assigned to this employee.
              </Text>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>🏖️ CASUAL LEAVE QUOTA (Days/Year)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={casualLeave}
                onChangeText={setCasualLeave}
                keyboardType="numeric"
                placeholder="12"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>🤒 SICK LEAVE QUOTA (Days/Year)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={sickLeave}
                onChangeText={setSickLeave}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>✈️ EARNED / PRIVILEGE LEAVE (Days/Year)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={earnedLeave}
                onChangeText={setEarnedLeave}
                keyboardType="numeric"
                placeholder="15"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>🍼 MATERNITY / PATERNITY LEAVE (Days)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={maternityLeave}
                onChangeText={setMaternityLeave}
                keyboardType="numeric"
                placeholder="90"
                placeholderTextColor={colors.inputPlaceholder}
              />
            </View>
          )}

          {/* STEP 4: PERSONAL DETAILS */}
          {activeTab === 'PERSONAL' && (
            <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                4. Personal & Background Information
              </Text>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>👨 FATHER'S / GUARDIAN NAME *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={fatherName}
                onChangeText={setFatherName}
                placeholder="e.g. Robert Doe"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>📍 PERMANENT ADDRESS *</Text>
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

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>🗣️ LANGUAGES SPOKEN</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={languagesSpoken}
                onChangeText={setLanguagesSpoken}
                placeholder="English, Hindi, Marathi"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>🚻 GENDER</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={gender}
                onChangeText={setGender}
                placeholder="Male / Female / Other"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>🎂 DATE OF BIRTH (YYYY-MM-DD)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={dob}
                onChangeText={setDob}
                placeholder="1995-06-20"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>🩸 BLOOD GROUP</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={bloodGroup}
                onChangeText={setBloodGroup}
                placeholder="O+ / A+ / B+"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>💍 MARITAL STATUS</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={maritalStatus}
                onChangeText={setMaritalStatus}
                placeholder="Single / Married"
                placeholderTextColor={colors.inputPlaceholder}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>🎓 HIGHEST QUALIFICATION</Text>
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
                <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
                  5. Family Members & Emergency Contacts
                </Text>
                <TouchableOpacity
                  style={[styles.addFamBtn, { backgroundColor: colors.accent }]}
                  onPress={() => setFamilyModalOpen(true)}
                >
                  <Text style={styles.addFamBtnText}>+ Add Member</Text>
                </TouchableOpacity>
              </View>

              {familyRes?.data && familyRes.data.length > 0 ? (
                familyRes.data.map(fam => (
                  <View
                    key={fam.id}
                    style={[styles.famCard, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}
                  >
                    <View style={styles.famCardLeft}>
                      <Text style={[styles.famName, { color: colors.textPrimary }]}>{fam.name}</Text>
                      <Text style={[styles.famRelation, { color: colors.textSecondary }]}>
                        {fam.relation} • {fam.contact || 'No Contact'}
                      </Text>
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
            </View>
          )}

          {/* STEPPER PREVIOUS / NEXT NAVIGATION BUTTONS */}
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
                { backgroundColor: colors.accent },
                currentTabIndex === 0 && { flex: 1 },
              ]}
              onPress={handleNextStep}
              activeOpacity={0.85}
            >
              <Text style={styles.nextButtonText}>
                {currentTabIndex === tabs.length - 1
                  ? '💾 Save All Employee Details'
                  : `Next Step: ${tabLabels[tabs[currentTabIndex + 1]]} →`}
              </Text>
            </TouchableOpacity>
          </View>
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
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Family Member</Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Member Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={famName}
              onChangeText={setFamName}
              placeholder="e.g. Jane Doe"
              placeholderTextColor={colors.inputPlaceholder}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Relation</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={famRelation}
              onChangeText={setFamRelation}
              placeholder="Spouse / Father / Mother / Child"
              placeholderTextColor={colors.inputPlaceholder}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Contact Phone</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={famContact}
              onChangeText={setFamContact}
              placeholder="+1 234 567 890"
              placeholderTextColor={colors.inputPlaceholder}
            />

            <View style={styles.modalBtns}>
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
                <Text style={{ color: '#fff', fontWeight: '700' }}>Add Member</Text>
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
  backIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  deleteButton: {
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
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
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
  modalBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
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
});
