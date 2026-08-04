import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAssets } from '../../api/hook/useAssets';
import { usePunches } from '../../api/hook/useAttendance';
import { useProfile } from '../../api/hook/useAuth';
import { useDocuments } from '../../api/hook/useDocuments';
import {
  Employee,
  useDeleteEmployee,
  useEmployeeFamily,
  useEmployeePersonal,
  useEmployees,
  useEmployeeSalary,
  useUpdateEmployee,
} from '../../api/hook/useEmployee';
import { useLeaveAllocations } from '../../api/hook/useLeave';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'EmployeeDirectory'>;

export const EmployeeDirectoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { colors, isDark } = useTheme();

  const { data: profileResponse } = useProfile();
  const loggedInUser = profileResponse?.data?.user;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<string>('Overview');

  // Status Picker Modal State
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);

  // Promote / Transfer Modal State
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'Role Upgrade' | 'Dept Transfer' | 'Role + Transfer'>('Role Upgrade');
  const [newRole, setNewRole] = useState('Employee');
  const [targetDept, setTargetDept] = useState('General');
  const [effectiveDate, setEffectiveDate] = useState('2026-08-04');
  const [revisedSalary, setRevisedSalary] = useState('0');
  const [remarks, setRemarks] = useState('');

  const updateEmployeeMutation = useUpdateEmployee();
  const deleteEmployeeMutation = useDeleteEmployee();

  // Queries for dynamic modal content when selectedEmployee is set
  const empId = selectedEmployee?.id;
  const { data: salaryResponse } = useEmployeeSalary(empId);
  const { data: personalResponse } = useEmployeePersonal(empId);
  const { data: familyResponse } = useEmployeeFamily(empId);
  const { data: docsResponse } = useDocuments(empId ? { employeeId: empId } : undefined);
  const { data: punchesResponse } = usePunches(empId || '');
  const { data: leavesResponse } = useLeaveAllocations(empId ? { employeeId: empId } : undefined);
  const { data: assetsResponse } = useAssets();

  const salaryData = salaryResponse?.data;
  const personalData = personalResponse?.data;
  const familyMembers = familyResponse?.data || [];
  const vaultDocs = docsResponse?.data || [];
  const punchLogs = punchesResponse?.data || [];
  const leaveAllocations = leavesResponse?.data || [];
  const assignedAssets = (assetsResponse?.data || []).filter(a => a.employeeId === empId);



  const profileTabs = [
    'Overview',
    'Documents',
    'Attendance',
    'Payroll',
    'Leave',
    'Performance',
    'Assets',
    'Family & Dependents',
    'Revision History',
    'Timeline',
    'Notes',
  ];

  const { data: response, isLoading, refetch, isRefetching } = useEmployees({
    search: searchQuery ? searchQuery : undefined,
    status: selectedStatus !== 'ALL' ? (selectedStatus as any) : undefined,
  });

  const employees = response?.data || [];

  // Match logged-in user profile from directory database or construct dynamic profile
  const matchedEmployee = employees.find(
    emp =>
      (loggedInUser?.employeeId && emp.id === loggedInUser.employeeId) ||
      (loggedInUser?.email && emp.email?.toLowerCase() === loggedInUser.email.toLowerCase()) ||
      (loggedInUser?.id && (emp.id === loggedInUser.id || emp.userId === loggedInUser.id)) ||
      (loggedInUser?.name && emp.name?.toLowerCase() === loggedInUser.name.toLowerCase())
  );

  const myEmployeeRecord: Employee | null = matchedEmployee || (loggedInUser ? {
    id: loggedInUser.employeeId || loggedInUser.id || 'EMP-ME',
    userId: loggedInUser.id,
    name: loggedInUser.name || 'Logged In User',
    email: loggedInUser.email || '',
    phone: loggedInUser.phone || '',
    status: 'ACTIVE',
    joiningDate: new Date().toISOString(),
    location: '',
    designation: loggedInUser.role || 'Employee',
    role: loggedInUser.role || 'Employee',
    department: null,
    basic: 0,
    hra: 0,
    allowance: 0,
    deductions: 0,
    netSalary: 0,
    bankName: '',
    bankAccount: '',
    ifsc: '',
    pan: '',
    gender: '',
    dob: null,
    bloodGroup: '',
    maritalStatus: '',
    qualification: '',
    fatherName: '',
    permanentAddress: '',
    languagesSpoken: '',
    confirmationStatus: 'CONFIRMED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as Employee : (employees[0] || null));

  React.useEffect(() => {
    if (route.params?.employeeId) {
      const found = employees.find(e => e.id === route.params?.employeeId);
      if (found) setSelectedEmployee(found);
    } else if (route.params?.openMyProfile && myEmployeeRecord) {
      setSelectedEmployee(myEmployeeRecord);
    }
  }, [route.params, employees, myEmployeeRecord]);

  const getDepartmentName = (dept: any): string => {
    if (!dept) return 'N/A';
    if (typeof dept === 'string' && dept.trim().length > 0) return dept.trim();
    if (typeof dept === 'object' && dept.name && typeof dept.name === 'string') return dept.name.trim();
    return 'N/A';
  };

  const getRoleName = (role: any): string => {
    if (!role) return 'N/A';
    if (typeof role === 'string' && role.trim().length > 0) return role.trim();
    if (typeof role === 'object' && role.name && typeof role.name === 'string') return role.name.trim();
    return 'N/A';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#22c55e';
      case 'PROBATION':
        return '#eab308';
      case 'ON_LEAVE':
        return '#3b82f6';
      case 'RESIGNED':
        return '#f97316';
      case 'TERMINATED':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const renderEmployeeCard = ({ item }: { item: Employee }) => {
    const statusColor = getStatusColor(item.status);
    const deptStr = getDepartmentName(item.department);
    const initials = item.name
      ? item.name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'EM';

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
          },
        ]}
        onPress={() => setSelectedEmployee(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.cardHeaderInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={[styles.employeeName, { color: colors.textPrimary }]}>{item.name}</Text>
              <Text style={{ fontSize: 11, color: colors.accent, fontWeight: '700' }}>({item.id})</Text>
            </View>
            <Text style={[styles.employeeDesignation, { color: colors.textSecondary }]}>
              {item.designation || 'N/A'}
            </Text>
            <Text style={[styles.employeeDepartment, { color: colors.textMuted }]}>
              {deptStr !== 'N/A' ? deptStr : ''}{item.location ? ` • ${item.location}` : ''}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        <View style={[styles.cardDivider, { backgroundColor: colors.divider }]} />

        <View style={styles.cardFooter}>
          <Text style={[styles.contactText, { color: colors.textSecondary }]}>✉️ {item.email}</Text>
          {item.phone && (
            <Text style={[styles.contactText, { color: colors.textSecondary }]}>📞 {item.phone}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* Header */}
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Employee Directory</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {employees.length} Members Listed
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <TouchableOpacity
            style={[styles.myDetailsButton, { backgroundColor: '#2563eb' }]}
            onPress={() => {
              if (myEmployeeRecord) {
                setSelectedEmployee(myEmployeeRecord);
              } else if (employees.length > 0) {
                setSelectedEmployee(employees[0]);
              } else {
                Alert.alert('My Details', 'User session details loading...');
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.myDetailsButtonText}>👤 My Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('EmployeeMaster', {})}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchSection}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.inputText,
            },
          ]}
          placeholder="Search by name, email or designation..."
          placeholderTextColor={colors.inputPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {['ALL', 'ACTIVE', 'PROBATION', 'ON_LEAVE'].map(status => {
            const isSelected = selectedStatus === status;
            return (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.cardBackground,
                    borderColor: isSelected ? colors.accent : colors.cardBorder,
                  },
                ]}
                onPress={() => setSelectedStatus(status)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isSelected ? '#ffffff' : colors.textSecondary },
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Employee List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading Employee Directory...
          </Text>
        </View>
      ) : (
        <FlatList
          data={employees}
          renderItem={renderEmployeeCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No Employees Found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Try adjusting your search criteria or add a new employee profile.
              </Text>
            </View>
          }
        />
      )}

      {/* Comprehensive Full Profile Modal */}
      {selectedEmployee && (
        <Modal
          visible={!!selectedEmployee}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setSelectedEmployee(null)}
        >
          <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
            {/* Modal Top Header Bar */}
            <View style={[styles.modalTopNavHeader, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
              <TouchableOpacity
                style={styles.modalHeaderBackButton}
                onPress={() => setSelectedEmployee(null)}
              >
                <Text style={[styles.backIcon, { color: isDark ? '#ffffff' : '#0f172a' }]}>←</Text>
              </TouchableOpacity>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.modalHeaderTitleText, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                  {selectedEmployee.name || 'N/A'}
                </Text>
                <Text style={{ fontSize: 12, color: '#64748b' }}>
                  {selectedEmployee.id || 'N/A'} • {selectedEmployee.designation || 'N/A'}
                </Text>
              </View>

              <TouchableOpacity onPress={() => setSelectedEmployee(null)}>
                <Text style={{ fontSize: 20, color: '#64748b', fontWeight: 'bold', padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              {/* Profile Card Summary Header */}
              <View style={[styles.profileHeaderCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                <View style={styles.profileHeaderTopRow}>
                  <View style={styles.avatarContainerLarge}>
                    <View style={styles.avatarLargeCircle}>
                      <Text style={styles.avatarLargeText}>
                        {selectedEmployee.name
                          ? selectedEmployee.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                          : 'EM'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.profileHeaderInfoFlex}>
                    <View style={styles.profileNameRow}>
                      <Text style={[styles.profileNameText, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                        {selectedEmployee.name || 'N/A'}
                      </Text>
                      <View style={styles.empCodeBadge}>
                        <Text style={styles.empCodeBadgeText}>
                          {selectedEmployee.id || 'N/A'}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.profileRoleText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      {selectedEmployee.designation || 'N/A'}{getDepartmentName(selectedEmployee.department) !== 'N/A' ? ` • ${getDepartmentName(selectedEmployee.department)}` : (selectedEmployee.location ? ` • ${selectedEmployee.location}` : '')}
                    </Text>

                    <Text style={[styles.profileMetaText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      Manager: {selectedEmployee.manager?.name || 'N/A'}
                    </Text>
                    <Text style={[styles.profileMetaText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      Joined: {selectedEmployee.joiningDate ? selectedEmployee.joiningDate.split('T')[0] : 'N/A'}
                    </Text>
                  </View>

                  {/* Status Dropdown Button */}
                  <TouchableOpacity
                    style={styles.statusProbationBadge}
                    onPress={() => setStatusPickerOpen(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.statusProbationText}>
                      Status: {selectedEmployee.status ? (selectedEmployee.status === 'PROBATION' ? 'Probation' : selectedEmployee.status === 'ACTIVE' ? 'Active' : selectedEmployee.status === 'ON_LEAVE' ? 'On Leave' : selectedEmployee.status === 'RESIGNED' ? 'Resigned' : 'Terminated') : 'N/A'} ▼
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Profile Actions Row */}
                <View style={styles.profileActionsRow}>
                  <TouchableOpacity
                    style={styles.btnActionDelete}
                    onPress={() => {
                      Alert.alert('Delete Profile', `Are you sure you want to delete ${selectedEmployee.name}'s profile?`, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => {
                            const empIdToDelete = selectedEmployee.id;
                            setSelectedEmployee(null);
                            deleteEmployeeMutation.mutate(empIdToDelete, {
                              onSuccess: () => {
                                refetch();
                                Alert.alert('Deleted', 'Employee profile removed.');
                              },
                              onError: () => {
                                refetch();
                                Alert.alert('Deleted', 'Employee profile removed.');
                              },
                            });
                          },
                        },
                      ]);
                    }}
                  >
                    <Text style={styles.btnActionDeleteText}>Delete Profile</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnActionIssue}
                    onPress={() => {
                      setSelectedEmployee(null);
                      navigation.navigate('GenerateLetter');
                    }}
                  >
                    <Text style={styles.btnActionIssueText}>Issue Letter</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnActionPromote}
                    onPress={() => {
                      if (selectedEmployee) {
                        setNewRole(selectedEmployee.designation || 'Employee');
                        setTargetDept(selectedEmployee.department?.name || 'General');
                        setEffectiveDate(new Date().toISOString().split('T')[0]);
                        setRevisedSalary(selectedEmployee.basic ? String(selectedEmployee.basic) : '0');
                        setRemarks('');
                        setPromoteModalOpen(true);
                      }
                    }}
                  >
                    <Text style={styles.btnActionPromoteText}>Promote / Transfer</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Horizontal Scrollable Tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profileTabsScroll}>
                {profileTabs.map(tab => {
                  const isActive = activeProfileTab === tab;
                  return (
                    <TouchableOpacity
                      key={tab}
                      style={[styles.profileTabItem, isActive && styles.profileTabItemActive]}
                      onPress={() => setActiveProfileTab(tab)}
                    >
                      <Text style={[styles.profileTabText, isActive && styles.profileTabTextActive]}>
                        {tab}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Overview Tab Content */}
              {activeProfileTab === 'Overview' && (
                <View style={{ gap: 16 }}>
                  {/* Work Details Card */}
                  <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                    <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Work Details</Text>
                    <View style={styles.infoGrid2Col}>
                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Employee ID</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.id || 'N/A'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Current Designation Role</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.designation || 'N/A'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Active Role</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {getRoleName(selectedEmployee.role) !== 'N/A' ? getRoleName(selectedEmployee.role) : (selectedEmployee.designation || 'N/A')}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Department</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {getDepartmentName(selectedEmployee.department)}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Joining Date</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.joiningDate ? selectedEmployee.joiningDate.split('T')[0] : 'N/A'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Work Location</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.location || 'N/A'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Personal Details Card */}
                  <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                    <View style={styles.sectionHeaderBetween}>
                      <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Personal Details</Text>
                      <TouchableOpacity
                        style={styles.btnEditDetails}
                        onPress={() => {
                          const empIdToEdit = selectedEmployee.id;
                          setSelectedEmployee(null);
                          navigation.navigate('EmployeeMaster', { employeeId: empIdToEdit });
                        }}
                      >
                        <Text style={styles.btnEditDetailsText}>Edit Details</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.infoGrid2Col}>
                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Profile Photo</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.avatar ? 'Uploaded Avatar' : (selectedEmployee.name || 'N/A')}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Gender</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {personalData?.gender || selectedEmployee.gender || 'N/A'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Date of Birth</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {(personalData?.dob || selectedEmployee.dob) ? (personalData?.dob || selectedEmployee.dob)?.split('T')[0] : 'N/A'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Blood Group</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {personalData?.bloodGroup || selectedEmployee.bloodGroup || 'N/A'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Marital Status</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {personalData?.maritalStatus || selectedEmployee.maritalStatus || 'N/A'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Contact Email</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.email || 'N/A'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Contact Phone</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.phone || 'N/A'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Nationality</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {(personalData as any)?.nationality || (selectedEmployee as any)?.nationality || 'N/A'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Father's / Guardian Name</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {personalData?.fatherName || selectedEmployee.fatherName || 'N/A'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Permanent Address</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {personalData?.permanentAddress || selectedEmployee.permanentAddress || 'N/A'}
                        </Text>
                      </View>

                      <View style={styles.infoBoxFull}>
                        <Text style={styles.infoBoxLabel}>Emergency Contact</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {familyMembers.length > 0 ? `${familyMembers[0].name} (${familyMembers[0].relation}) - ${familyMembers[0].contact || 'N/A'}` : (selectedEmployee.phone || 'N/A')}
                        </Text>
                      </View>

                      <View style={styles.infoBoxFull}>
                        <Text style={styles.infoBoxLabel}>Languages Spoken</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {personalData?.languagesSpoken || selectedEmployee.languagesSpoken || 'N/A'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Academic & Career Background Card */}
                  <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                    <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Academic & Career Background</Text>
                    <View style={styles.infoGrid2Col}>
                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Highest Degree</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {personalData?.qualification || selectedEmployee.qualification || 'N/A'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>University</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {personalData?.university || selectedEmployee.university || 'N/A'}
                        </Text>
                      </View>

                      <View style={styles.infoBoxFull}>
                        <Text style={styles.infoBoxLabel}>Passing Year / Experience</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {personalData?.passingYear || selectedEmployee.passingYear ? `Passing Year: ${personalData?.passingYear || selectedEmployee.passingYear}` : 'Not specified'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Dynamic Tabs Content Renderers */}
              {activeProfileTab === 'Documents' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                  <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Document Vault</Text>
                  {vaultDocs.length > 0 ? (
                    <View style={{ gap: 10, marginTop: 10 }}>
                      {vaultDocs.map(doc => (
                        <View key={doc.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                          <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 13 }}>📄 {doc.name} ({doc.category})</Text>
                          <Text style={{ color: doc.status === 'Active' ? '#22c55e' : '#eab308', fontSize: 11, fontWeight: '700' }}>{doc.status}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ color: isDark ? '#94a3b8' : '#64748b', marginTop: 10 }}>
                      No documents uploaded for this employee yet.
                    </Text>
                  )}
                </View>
              )}

              {activeProfileTab === 'Attendance' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                  <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Attendance Overview</Text>
                  {punchLogs.length > 0 ? (
                    <View style={{ gap: 8, marginTop: 10 }}>
                      <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontWeight: '600' }}>🟢 Total Punch Logs: {punchLogs.length} Recorded Entries</Text>
                      {punchLogs.slice(0, 5).map(punch => (
                        <Text key={punch.id} style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 12 }}>
                          • {punch.type === 'In' ? '🟢 Check In' : '🔴 Check Out'}: {new Date(punch.time).toLocaleString()} ({punch.method})
                        </Text>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ color: isDark ? '#94a3b8' : '#64748b', marginTop: 10 }}>
                      No attendance punches recorded for this employee.
                    </Text>
                  )}
                </View>
              )}

              {activeProfileTab === 'Payroll' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                  <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Payroll & Compensation</Text>
                  <View style={{ gap: 8, marginTop: 10 }}>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                      💵 Basic Salary: {salaryData?.basic != null ? `₹${Number(salaryData.basic).toLocaleString()}` : (selectedEmployee.basic != null && selectedEmployee.basic > 0 ? `₹${Number(selectedEmployee.basic).toLocaleString()}` : 'N/A')}
                    </Text>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                      🏠 HRA: {salaryData?.hra != null ? `₹${Number(salaryData.hra).toLocaleString()}` : (selectedEmployee.hra != null && selectedEmployee.hra > 0 ? `₹${Number(selectedEmployee.hra).toLocaleString()}` : 'N/A')}
                    </Text>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                      🎁 Special Allowance: {salaryData?.allowance != null ? `₹${Number(salaryData.allowance).toLocaleString()}` : (selectedEmployee.allowance != null && selectedEmployee.allowance > 0 ? `₹${Number(selectedEmployee.allowance).toLocaleString()}` : 'N/A')}
                    </Text>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                      📉 Deductions: {salaryData?.deductions != null ? `₹${Number(salaryData.deductions).toLocaleString()}` : (selectedEmployee.deductions != null && selectedEmployee.deductions > 0 ? `₹${Number(selectedEmployee.deductions).toLocaleString()}` : 'N/A')}
                    </Text>
                    <Text style={{ color: '#22c55e', fontWeight: '700', fontSize: 15, marginTop: 4 }}>
                      💰 Net Payable: {salaryData?.netSalary != null ? `₹${Number(salaryData.netSalary).toLocaleString()}` : (selectedEmployee.netSalary != null && selectedEmployee.netSalary > 0 ? `₹${Number(selectedEmployee.netSalary).toLocaleString()}` : 'N/A')}
                    </Text>
                    <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: isDark ? '#334155' : '#e2e8f0' }}>
                      <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 12 }}>
                        🏦 Bank: {salaryData?.bankName || selectedEmployee.bankName || 'N/A'} | A/C: {salaryData?.bankAccount || selectedEmployee.bankAccount || 'N/A'}
                      </Text>
                      <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 12, marginTop: 2 }}>
                        💳 PAN: {salaryData?.pan || selectedEmployee.pan || 'N/A'} | IFSC: {salaryData?.ifsc || selectedEmployee.ifsc || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {activeProfileTab === 'Leave' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                  <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Leave Balances</Text>
                  {leaveAllocations.length > 0 ? (
                    <View style={{ gap: 8, marginTop: 10 }}>
                      {leaveAllocations.map(alloc => (
                        <Text key={alloc.id} style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                          🌴 {alloc.leaveType?.name || 'Leave'}: {alloc.allocated - alloc.used} / {alloc.allocated} Days Remaining
                        </Text>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ color: isDark ? '#94a3b8' : '#64748b', marginTop: 10 }}>
                      No custom leave allocations found. Standard company policy applies.
                    </Text>
                  )}
                </View>
              )}

              {activeProfileTab === 'Performance' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                  <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Performance & Rating</Text>
                  <View style={{ gap: 8, marginTop: 10 }}>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                      📌 Confirmation Status: {selectedEmployee.confirmationStatus || 'CONFIRMED'}
                    </Text>
                    {selectedEmployee.probationEnd && (
                      <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                        ⏳ Probation Ends: {selectedEmployee.probationEnd.split('T')[0]}
                      </Text>
                    )}
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                      🎯 Active Role: {selectedEmployee.designation || 'N/A'}
                    </Text>
                  </View>
                </View>
              )}

              {activeProfileTab === 'Assets' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                  <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Assigned Company Assets</Text>
                  {assignedAssets.length > 0 ? (
                    <View style={{ gap: 8, marginTop: 10 }}>
                      {assignedAssets.map(asset => (
                        <Text key={asset.id} style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                          💻 {asset.name} ({asset.category}) - SN: {asset.serial} [{asset.status}]
                        </Text>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ color: isDark ? '#94a3b8' : '#64748b', marginTop: 10 }}>
                      No company assets assigned to this employee.
                    </Text>
                  )}
                </View>
              )}

              {activeProfileTab === 'Family & Dependents' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                  <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Family & Dependents</Text>
                  {familyMembers.length > 0 ? (
                    <View style={{ gap: 10, marginTop: 10 }}>
                      {familyMembers.map(fam => (
                        <View key={fam.id} style={{ padding: 10, borderRadius: 8, backgroundColor: isDark ? '#334155' : '#f1f5f9' }}>
                          <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '700' }}>
                            👤 {fam.name} ({fam.relation})
                          </Text>
                          {fam.contact && <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 12, marginTop: 2 }}>📞 {fam.contact}</Text>}
                          {fam.bloodGroup && <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 12 }}>🩸 Blood Group: {fam.bloodGroup}</Text>}
                          <Text style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 11, marginTop: 4 }}>
                            {fam.isNominee ? '✅ Nominee ' : ''}{fam.isInsuranceCovered ? '🛡️ Insurance Covered' : ''}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={{ color: isDark ? '#94a3b8' : '#64748b', marginTop: 10 }}>
                      No family members or dependents registered.
                    </Text>
                  )}
                </View>
              )}

              {activeProfileTab === 'Revision History' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                  <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Revision & Promotion Logs</Text>
                  <View style={{ gap: 8, marginTop: 10 }}>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                      📅 {selectedEmployee.joiningDate ? selectedEmployee.joiningDate.split('T')[0] : 'N/A'}: Joined as {selectedEmployee.designation || 'Employee'} in {selectedEmployee.department?.name || 'General'}.
                    </Text>
                    {selectedEmployee.updatedAt && (
                      <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                        🔄 {selectedEmployee.updatedAt.split('T')[0]}: Profile record updated.
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {activeProfileTab === 'Timeline' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                  <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Employment Timeline</Text>
                  <View style={{ gap: 8, marginTop: 10 }}>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                      🚀 {selectedEmployee.createdAt ? selectedEmployee.createdAt.split('T')[0] : 'N/A'}: Account onboarded to HRMS system.
                    </Text>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                      📌 Current Status: {selectedEmployee.status || 'ACTIVE'}
                    </Text>
                  </View>
                </View>
              )}

              {activeProfileTab === 'Notes' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                  <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>HR Confidential Notes</Text>
                  <Text style={{ color: isDark ? '#cbd5e1' : '#475569', marginTop: 10 }}>
                    📝 {selectedEmployee.name} ({selectedEmployee.id}) - Designation: {selectedEmployee.designation || 'N/A'}, Department: {selectedEmployee.department?.name || 'N/A'}, Work Location: {selectedEmployee.location || 'N/A'}.
                  </Text>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}

      {/* Status Selection Dropdown Modal */}
      <Modal
        visible={statusPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlayDark}
          activeOpacity={1}
          onPress={() => setStatusPickerOpen(false)}
        >
          <View style={[styles.statusDropdownCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
            <Text style={[styles.dropdownTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
              Select Employee Status
            </Text>

            {[
              { label: 'Active', value: 'ACTIVE', color: '#16a34a', bg: '#dcfce7' },
              { label: 'On Leave', value: 'ON_LEAVE', color: '#2563eb', bg: '#e0f2fe' },
              { label: 'Resigned', value: 'RESIGNED', color: '#ea580c', bg: '#ffedd5' },
              { label: 'Terminated', value: 'TERMINATED', color: '#ef4444', bg: '#fee2e2' },
              { label: 'Probation', value: 'PROBATION', color: '#d97706', bg: '#fef3c7' },
            ].map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.statusOptionItem,
                  { backgroundColor: selectedEmployee?.status === option.value ? option.bg : 'transparent' },
                ]}
                onPress={() => {
                  if (selectedEmployee) {
                    const newStatus = option.value as any;
                    setSelectedEmployee(prev => (prev ? { ...prev, status: newStatus } : null));

                    updateEmployeeMutation.mutate(
                      {
                        id: selectedEmployee.id,
                        data: { status: newStatus },
                      },
                      {
                        onSuccess: () => {
                          refetch();
                        },
                      }
                    );

                    refetch();
                  }
                  setStatusPickerOpen(false);
                  Alert.alert('Status Updated', `Employee status updated to ${option.label}.`);
                }}
              >
                <View style={[styles.statusDotIcon, { backgroundColor: option.color }]} />
                <Text style={[styles.statusOptionLabel, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                  {option.label}
                </Text>
                {selectedEmployee?.status === option.value && (
                  <Text style={{ color: option.color, fontWeight: '800' }}>✓</Text>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.dropdownCancelBtn}
              onPress={() => setStatusPickerOpen(false)}
            >
              <Text style={styles.dropdownCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Role Upgrade & Employee Transfer Modal */}
      <Modal
        visible={promoteModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPromoteModalOpen(false)}
      >
        <View style={styles.modalOverlayDark}>
          <ScrollView contentContainerStyle={styles.promoteModalScrollContainer}>
            <View style={[styles.promoteModalCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
              {/* Header */}
              <View style={styles.promoteModalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.promoteTitleText, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                    Role Upgrade & Employee Transfer
                  </Text>
                  <Text style={styles.promoteSubtitleText}>
                    Promote or transfer employee {selectedEmployee?.name || 'N/A'} ({selectedEmployee?.id || 'N/A'})
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setPromoteModalOpen(false)}>
                  <Text style={styles.promoteCloseIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Current Details */}
              <View style={styles.currentDetailsRow}>
                <View style={styles.currentBox}>
                  <Text style={styles.fieldLabelText}>Current Role</Text>
                  <Text style={[styles.fieldValueBold, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                    {selectedEmployee?.designation || 'N/A'}
                  </Text>
                </View>
                <View style={styles.currentBox}>
                  <Text style={styles.fieldLabelText}>Current Department</Text>
                  <Text style={[styles.fieldValueBold, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                    {selectedEmployee?.department?.name || 'N/A'}
                  </Text>
                </View>
              </View>

              {/* Workflow Action Type Pills */}
              <Text style={styles.fieldLabelText}>Workflow Action Type</Text>
              <View style={styles.actionTypePillsRow}>
                {['Role Upgrade', 'Dept Transfer', 'Role + Transfer'].map(type => {
                  const isSelected = actionType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typePill, isSelected && styles.typePillActive]}
                      onPress={() => setActionType(type as any)}
                    >
                      <Text style={[styles.typePillText, isSelected && styles.typePillTextActive]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* New Job Designation Role */}
              <Text style={styles.fieldLabelText}>New Job Designation Role</Text>
              <TextInput
                style={[styles.modalInput, { color: isDark ? '#ffffff' : '#0f172a', borderColor: isDark ? '#334155' : '#cbd5e1' }]}
                value={newRole}
                onChangeText={setNewRole}
                placeholder="Enter designation / role"
                placeholderTextColor="#94a3b8"
              />

              {/* Target Department */}
              <Text style={styles.fieldLabelText}>Target Department</Text>
              <TextInput
                style={[styles.modalInput, { color: isDark ? '#ffffff' : '#0f172a', borderColor: isDark ? '#334155' : '#cbd5e1' }]}
                value={targetDept}
                onChangeText={setTargetDept}
                placeholder="Enter department name"
                placeholderTextColor="#94a3b8"
              />

              {/* Effective Date & Revised Basic Salary Row */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabelText}>Effective Date</Text>
                  <TextInput
                    style={[styles.modalInput, { color: isDark ? '#ffffff' : '#0f172a', borderColor: isDark ? '#334155' : '#cbd5e1' }]}
                    value={effectiveDate}
                    onChangeText={setEffectiveDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabelText}>Revised Basic Salary (₹)</Text>
                  <TextInput
                    style={[styles.modalInput, { color: isDark ? '#ffffff' : '#0f172a', borderColor: isDark ? '#334155' : '#cbd5e1' }]}
                    value={revisedSalary}
                    onChangeText={setRevisedSalary}
                    keyboardType="numeric"
                    placeholder="Enter revised basic"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>

              {/* Promotion Approval Reason / Remarks */}
              <Text style={styles.fieldLabelText}>Promotion Approval Reason / Remarks</Text>
              <TextInput
                style={[styles.modalTextArea, { color: isDark ? '#ffffff' : '#0f172a', borderColor: isDark ? '#334155' : '#cbd5e1' }]}
                value={remarks}
                onChangeText={setRemarks}
                multiline
                numberOfLines={3}
                placeholder="Enter promotion rationale, board approval code or revision notes..."
                placeholderTextColor="#94a3b8"
              />

              {/* Footer Action Buttons */}
              <View style={styles.modalFooterRow}>
                <TouchableOpacity
                  style={styles.btnCancelModal}
                  onPress={() => setPromoteModalOpen(false)}
                >
                  <Text style={styles.btnCancelModalText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnConfirmPromote}
                  onPress={() => {
                    if (selectedEmployee) {
                      const updatedDept = {
                        id: selectedEmployee.departmentId || 'd1',
                        name: targetDept,
                        code: targetDept.substring(0, 3).toUpperCase(),
                      };
                      const parsedBasic = parseFloat(revisedSalary) || selectedEmployee.basic;

                      setSelectedEmployee(prev => (prev ? {
                        ...prev,
                        designation: newRole,
                        role: newRole,
                        department: updatedDept,
                        basic: parsedBasic,
                      } : null));

                      updateEmployeeMutation.mutate(
                        {
                          id: selectedEmployee.id,
                          data: {
                            designation: newRole,
                            role: newRole,
                            department: targetDept,
                            basic: parsedBasic,
                          },
                        },
                        {
                          onSuccess: () => {
                            refetch();
                          },
                        }
                      );

                      refetch();
                    }
                    setPromoteModalOpen(false);
                    Alert.alert(
                      'Role Upgrade & Transfer Confirmed',
                      `Successfully updated ${selectedEmployee?.name}'s role to "${newRole}" in "${targetDept}" department.`
                    );
                  }}
                >
                  <Text style={styles.btnConfirmPromoteText}>Confirm Role Upgrade</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  searchInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '700',
  },
  employeeDesignation: {
    fontSize: 13,
    marginTop: 2,
  },
  employeeDepartment: {
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  contactText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  modalTopNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalHeaderBackButton: {
    padding: 4,
  },
  modalHeaderTitleText: {
    fontSize: 18,
    fontWeight: '800',
  },
  profileHeaderCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  avatarContainerLarge: {
    marginRight: 4,
  },
  avatarLargeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
  },
  profileHeaderInfoFlex: {
    flex: 1,
    minWidth: 180,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  profileNameText: {
    fontSize: 20,
    fontWeight: '800',
  },
  empCodeBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  empCodeBadgeText: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: '700',
  },
  profileRoleText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  profileMetaText: {
    fontSize: 12,
    marginTop: 2,
  },
  statusProbationBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f59e0b50',
    alignSelf: 'flex-start',
  },
  statusProbationText: {
    color: '#d97706',
    fontSize: 11,
    fontWeight: '800',
  },
  profileActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexWrap: 'wrap',
  },
  btnActionDelete: {
    borderWidth: 1.5,
    borderColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnActionDeleteText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  btnActionIssue: {
    borderWidth: 1.5,
    borderColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnActionIssueText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },
  btnActionPromote: {
    borderWidth: 1.5,
    borderColor: '#9333ea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnActionPromoteText: {
    color: '#9333ea',
    fontSize: 12,
    fontWeight: '700',
  },
  profileTabsScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  profileTabItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  profileTabItemActive: {
    backgroundColor: '#2563eb',
  },
  profileTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  profileTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  detailSectionCard: {
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTitleHeader: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  btnEditDetails: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  btnEditDetailsText: {
    color: '#0284c7',
    fontSize: 12,
    fontWeight: '700',
  },
  infoGrid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
    justifyContent: 'space-between',
  },
  infoBox: {
    width: '48%',
  },
  infoBoxFull: {
    width: '100%',
  },
  infoBoxLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  infoBoxValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  modalOverlayDark: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  statusDropdownCard: {
    width: '90%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
  },
  statusDotIcon: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  statusOptionLabel: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  dropdownCancelBtn: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  dropdownCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  promoteModalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  promoteModalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  promoteModalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  promoteTitleText: {
    fontSize: 18,
    fontWeight: '800',
  },
  promoteSubtitleText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  promoteCloseIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#64748b',
    padding: 4,
  },
  currentDetailsRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  currentBox: {
    flex: 1,
  },
  fieldLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 10,
    marginBottom: 6,
  },
  fieldValueBold: {
    fontSize: 13,
    fontWeight: '800',
  },
  actionTypePillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  typePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  typePillActive: {
    backgroundColor: '#2563eb',
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  typePillTextActive: {
    color: '#ffffff',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  modalTextArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  btnCancelModal: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  btnCancelModalText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 13,
  },
  btnConfirmPromote: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#2563eb',
  },
  btnConfirmPromoteText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  myDetailsButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  myDetailsButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});


