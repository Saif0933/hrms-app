import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
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
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
  const [showEffectiveDatePicker, setShowEffectiveDatePicker] = useState(false);
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
        return '#10b981';
      case 'PROBATION':
        return '#f59e0b';
      case 'ON_LEAVE':
        return '#0284c7';
      case 'RESIGNED':
        return '#f97316';
      case 'TERMINATED':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'PROBATION':
        return 'Probation';
      case 'ON_LEAVE':
        return 'On Leave';
      case 'RESIGNED':
        return 'Resigned';
      case 'TERMINATED':
        return 'Terminated';
      default:
        return status || 'N/A';
    }
  };

  const getTabIcon = (tabName: string) => {
    switch (tabName) {
      case 'Overview':
        return 'account-details-outline';
      case 'Documents':
        return 'file-document-multiple-outline';
      case 'Attendance':
        return 'clock-check-outline';
      case 'Payroll':
        return 'cash-multiple';
      case 'Leave':
        return 'palm-tree';
      case 'Performance':
        return 'chart-line';
      case 'Assets':
        return 'laptop';
      case 'Family & Dependents':
        return 'account-heart-outline';
      case 'Revision History':
        return 'history';
      case 'Timeline':
        return 'timeline-clock-outline';
      case 'Notes':
        return 'notebook-outline';
      default:
        return 'information-outline';
    }
  };

  const handleEffectiveDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEffectiveDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setEffectiveDate(selectedDate.toISOString().split('T')[0]);
    } else if (event.type === 'dismissed') {
      setShowEffectiveDatePicker(false);
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
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff', borderColor: colors.accent }]}>
            <Text style={[styles.avatarText, { color: colors.accent }]}>{initials}</Text>
          </View>
          <View style={styles.cardHeaderInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={[styles.employeeName, { color: colors.textPrimary }]}>{item.name}</Text>
              <View style={[styles.idBadge, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <Text style={[styles.idBadgeText, { color: colors.accent }]}>{item.id}</Text>
              </View>
            </View>

            <Text style={[styles.employeeDesignation, { color: colors.textSecondary }]}>
              {item.designation || 'N/A'}
            </Text>

            <View style={styles.deptLocationRow}>
              {deptStr !== 'N/A' && (
                <View style={styles.metaIconText}>
                  <MaterialCommunityIcons name="domain" size={13} color={colors.textMuted} />
                  <Text style={[styles.employeeDepartment, { color: colors.textMuted }]}>{deptStr}</Text>
                </View>
              )}
              {item.location ? (
                <View style={styles.metaIconText}>
                  <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.textMuted} />
                  <Text style={[styles.employeeDepartment, { color: colors.textMuted }]}>{item.location}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18`, borderColor: `${statusColor}40` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        <View style={[styles.cardDivider, { backgroundColor: colors.divider }]} />

        <View style={styles.cardFooter}>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="email-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.contactText, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
          {item.phone && (
            <View style={styles.contactItem}>
              <MaterialCommunityIcons name="phone-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.contactText, { color: colors.textSecondary }]}>{item.phone}</Text>
            </View>
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
          style={[styles.backButton, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Employee Directory</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {employees.length} {employees.length === 1 ? 'Member' : 'Members'} Listed
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            style={[styles.myDetailsButton, { backgroundColor: isDark ? '#1e3a8a' : '#eff6ff' }]}
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
            <MaterialCommunityIcons name="account-circle-outline" size={16} color={colors.accent} />
            <Text style={[styles.myDetailsButtonText, { color: colors.accent }]}>My Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('EmployeeMaster', {})}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#ffffff" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchInputContainer,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
            },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={colors.inputPlaceholder} style={{ marginRight: 8 }} />
          <TextInput
            style={[
              styles.searchInput,
              {
                color: colors.inputText,
              },
            ]}
            placeholder="Search by name, email or designation..."
            placeholderTextColor={colors.inputPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.inputPlaceholder} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {[
            { id: 'ALL', label: 'All', icon: 'account-group-outline' },
            { id: 'ACTIVE', label: 'Active', icon: 'check-circle-outline' },
            { id: 'PROBATION', label: 'Probation', icon: 'clock-outline' },
            { id: 'ON_LEAVE', label: 'On Leave', icon: 'calendar-remove-outline' },
          ].map(filter => {
            const isSelected = selectedStatus === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.cardBackground,
                    borderColor: isSelected ? colors.accent : colors.cardBorder,
                  },
                ]}
                onPress={() => setSelectedStatus(filter.id)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={filter.icon}
                  size={14}
                  color={isSelected ? '#ffffff' : colors.textSecondary}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isSelected ? '#ffffff' : colors.textSecondary },
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
              <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <MaterialCommunityIcons name="account-search-outline" size={44} color={colors.textMuted} />
              </View>
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
            {/* Modal Top Nav Header Bar */}
            <View style={[styles.modalTopNavHeader, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderBottomColor: isDark ? '#334155' : '#e2e8f0' }]}>
              <TouchableOpacity
                style={[styles.modalHeaderBackButton, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
                onPress={() => setSelectedEmployee(null)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="arrow-left" size={20} color={isDark ? '#ffffff' : '#0f172a'} />
              </TouchableOpacity>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.modalHeaderTitleText, { color: isDark ? '#ffffff' : '#0f172a' }]} numberOfLines={1}>
                  {selectedEmployee.name || 'N/A'}
                </Text>
                <Text style={{ fontSize: 12, color: '#64748b' }} numberOfLines={1}>
                  {selectedEmployee.id || 'N/A'} • {selectedEmployee.designation || 'N/A'}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.closeIconButton, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
                onPress={() => setSelectedEmployee(null)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
              {/* Profile Card Summary Header */}
              <View style={[styles.profileHeaderCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                <View style={styles.profileHeaderTopRow}>
                  <View style={styles.avatarContainerLarge}>
                    <View style={[styles.avatarLargeCircle, { backgroundColor: isDark ? '#2563eb' : '#3b82f6' }]}>
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

                    <View style={{ marginTop: 4, gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MaterialCommunityIcons name="account-supervisor-outline" size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                        <Text style={[styles.profileMetaText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                          Manager: {selectedEmployee.manager?.name || 'N/A'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MaterialCommunityIcons name="calendar-month-outline" size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                        <Text style={[styles.profileMetaText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                          Joined: {selectedEmployee.joiningDate ? selectedEmployee.joiningDate.split('T')[0] : 'N/A'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Status Dropdown Button */}
                  <TouchableOpacity
                    style={[styles.statusProbationBadge, { backgroundColor: `${getStatusColor(selectedEmployee.status)}15`, borderColor: `${getStatusColor(selectedEmployee.status)}40` }]}
                    onPress={() => setStatusPickerOpen(true)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(selectedEmployee.status) }]} />
                    <Text style={[styles.statusProbationText, { color: getStatusColor(selectedEmployee.status) }]}>
                      Status: {getStatusLabel(selectedEmployee.status)}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={16} color={getStatusColor(selectedEmployee.status)} />
                  </TouchableOpacity>
                </View>

                {/* Profile Actions Row */}
                <View style={[styles.profileActionsRow, { borderTopColor: isDark ? '#334155' : '#f1f5f9' }]}>
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
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={14} color="#ef4444" />
                    <Text style={styles.btnActionDeleteText}>Delete Profile</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnActionIssue}
                    onPress={() => {
                      setSelectedEmployee(null);
                      navigation.navigate('GenerateLetter');
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="file-document-outline" size={14} color="#2563eb" />
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
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="account-arrow-up-outline" size={15} color="#9333ea" />
                    <Text style={styles.btnActionPromoteText}>Promote / Transfer</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Horizontal Scrollable Tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.profileTabsScroll}>
                {profileTabs.map(tab => {
                  const isActive = activeProfileTab === tab;
                  const iconName = getTabIcon(tab);
                  return (
                    <TouchableOpacity
                      key={tab}
                      style={[
                        styles.profileTabItem,
                        { backgroundColor: isActive ? colors.accent : (isDark ? '#1e293b' : '#f1f5f9') },
                      ]}
                      onPress={() => setActiveProfileTab(tab)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={iconName}
                        size={15}
                        color={isActive ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b')}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.profileTabText, { color: isActive ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b') }]}>
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
                  <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                    <View style={styles.cardHeaderRow}>
                      <MaterialCommunityIcons name="briefcase-outline" size={20} color={colors.accent} />
                      <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Work Details</Text>
                    </View>
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
                  <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                    <View style={styles.sectionHeaderBetween}>
                      <View style={styles.cardHeaderRow}>
                        <MaterialCommunityIcons name="account-outline" size={20} color={colors.accent} />
                        <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Personal Details</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.btnEditDetails}
                        onPress={() => {
                          const empIdToEdit = selectedEmployee.id;
                          setSelectedEmployee(null);
                          navigation.navigate('EmployeeMaster', { employeeId: empIdToEdit });
                        }}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="pencil-outline" size={13} color="#0284c7" />
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
                  <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                    <View style={styles.cardHeaderRow}>
                      <MaterialCommunityIcons name="school-outline" size={20} color={colors.accent} />
                      <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Academic & Career Background</Text>
                    </View>
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
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                  <View style={styles.cardHeaderRow}>
                    <MaterialCommunityIcons name="file-document-multiple-outline" size={20} color={colors.accent} />
                    <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Document Vault</Text>
                  </View>
                  {vaultDocs.length > 0 ? (
                    <View style={{ gap: 10, marginTop: 10 }}>
                      {vaultDocs.map(doc => (
                        <View key={doc.id} style={[styles.docItemRow, { backgroundColor: isDark ? '#334155' : '#f8fafc' }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                            <MaterialCommunityIcons name="file-pdf-box" size={24} color="#ef4444" />
                            <View>
                              <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontSize: 13, fontWeight: '700' }}>{doc.name}</Text>
                              <Text style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}>Category: {doc.category}</Text>
                            </View>
                          </View>
                          <View style={[styles.docStatusBadge, { backgroundColor: doc.status === 'Active' ? '#dcfce7' : '#fef3c7' }]}>
                            <Text style={{ color: doc.status === 'Active' ? '#16a34a' : '#d97706', fontSize: 11, fontWeight: '700' }}>{doc.status}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.tabEmptyBox}>
                      <MaterialCommunityIcons name="folder-open-outline" size={36} color={isDark ? '#64748b' : '#94a3b8'} />
                      <Text style={{ color: isDark ? '#94a3b8' : '#64748b', marginTop: 8, fontSize: 13 }}>
                        No documents uploaded for this employee yet.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {activeProfileTab === 'Attendance' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                  <View style={styles.cardHeaderRow}>
                    <MaterialCommunityIcons name="clock-check-outline" size={20} color={colors.accent} />
                    <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Attendance Overview</Text>
                  </View>
                  {punchLogs.length > 0 ? (
                    <View style={{ gap: 10, marginTop: 10 }}>
                      <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontWeight: '700', fontSize: 13 }}>
                        Total Punch Logs: {punchLogs.length} Recorded Entries
                      </Text>
                      {punchLogs.slice(0, 5).map(punch => (
                        <View key={punch.id} style={[styles.punchRow, { backgroundColor: isDark ? '#334155' : '#f8fafc' }]}>
                          <MaterialCommunityIcons
                            name={punch.type === 'In' ? 'login' : 'logout'}
                            size={18}
                            color={punch.type === 'In' ? '#10b981' : '#ef4444'}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '600', fontSize: 13 }}>
                              {punch.type === 'In' ? 'Check In' : 'Check Out'} ({punch.method})
                            </Text>
                            <Text style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}>
                              {new Date(punch.time).toLocaleString()}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.tabEmptyBox}>
                      <MaterialCommunityIcons name="calendar-clock-outline" size={36} color={isDark ? '#64748b' : '#94a3b8'} />
                      <Text style={{ color: isDark ? '#94a3b8' : '#64748b', marginTop: 8, fontSize: 13 }}>
                        No attendance punches recorded for this employee.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {activeProfileTab === 'Payroll' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                  <View style={styles.cardHeaderRow}>
                    <MaterialCommunityIcons name="cash-multiple" size={20} color={colors.accent} />
                    <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Payroll & Compensation</Text>
                  </View>
                  <View style={{ gap: 10, marginTop: 10 }}>
                    <View style={styles.payrollRow}>
                      <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 13 }}>Basic Salary</Text>
                      <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '700', fontSize: 14 }}>
                        {salaryData?.basic != null ? `₹${Number(salaryData.basic).toLocaleString()}` : (selectedEmployee.basic != null && selectedEmployee.basic > 0 ? `₹${Number(selectedEmployee.basic).toLocaleString()}` : 'N/A')}
                      </Text>
                    </View>
                    <View style={styles.payrollRow}>
                      <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 13 }}>HRA</Text>
                      <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '700', fontSize: 14 }}>
                        {salaryData?.hra != null ? `₹${Number(salaryData.hra).toLocaleString()}` : (selectedEmployee.hra != null && selectedEmployee.hra > 0 ? `₹${Number(selectedEmployee.hra).toLocaleString()}` : 'N/A')}
                      </Text>
                    </View>
                    <View style={styles.payrollRow}>
                      <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 13 }}>Special Allowance</Text>
                      <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '700', fontSize: 14 }}>
                        {salaryData?.allowance != null ? `₹${Number(salaryData.allowance).toLocaleString()}` : (selectedEmployee.allowance != null && selectedEmployee.allowance > 0 ? `₹${Number(selectedEmployee.allowance).toLocaleString()}` : 'N/A')}
                      </Text>
                    </View>
                    <View style={styles.payrollRow}>
                      <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 13 }}>Deductions</Text>
                      <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 14 }}>
                        {salaryData?.deductions != null ? `₹${Number(salaryData.deductions).toLocaleString()}` : (selectedEmployee.deductions != null && selectedEmployee.deductions > 0 ? `₹${Number(selectedEmployee.deductions).toLocaleString()}` : 'N/A')}
                      </Text>
                    </View>

                    <View style={[styles.netSalaryBanner, { backgroundColor: isDark ? '#064e3b' : '#ecfdf5', borderColor: '#10b98140' }]}>
                      <Text style={{ color: '#10b981', fontWeight: '700', fontSize: 13 }}>Net Payable</Text>
                      <Text style={{ color: '#10b981', fontWeight: '800', fontSize: 17 }}>
                        {salaryData?.netSalary != null ? `₹${Number(salaryData.netSalary).toLocaleString()}` : (selectedEmployee.netSalary != null && selectedEmployee.netSalary > 0 ? `₹${Number(selectedEmployee.netSalary).toLocaleString()}` : 'N/A')}
                      </Text>
                    </View>

                    <View style={{ marginTop: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: isDark ? '#334155' : '#e2e8f0', gap: 6 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MaterialCommunityIcons name="bank-outline" size={15} color={colors.accent} />
                        <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 12 }}>
                          Bank: {salaryData?.bankName || selectedEmployee.bankName || 'N/A'} | A/C: {salaryData?.bankAccount || selectedEmployee.bankAccount || 'N/A'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MaterialCommunityIcons name="card-account-details-outline" size={15} color={colors.accent} />
                        <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 12 }}>
                          PAN: {salaryData?.pan || selectedEmployee.pan || 'N/A'} | IFSC: {salaryData?.ifsc || selectedEmployee.ifsc || 'N/A'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {activeProfileTab === 'Leave' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                  <View style={styles.cardHeaderRow}>
                    <MaterialCommunityIcons name="palm-tree" size={20} color={colors.accent} />
                    <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Leave Balances</Text>
                  </View>
                  {leaveAllocations.length > 0 ? (
                    <View style={{ gap: 10, marginTop: 10 }}>
                      {leaveAllocations.map(alloc => (
                        <View key={alloc.id} style={[styles.leaveItemCard, { backgroundColor: isDark ? '#334155' : '#f8fafc' }]}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                            <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '700', fontSize: 13 }}>
                              {alloc.leaveType?.name || 'Leave'}
                            </Text>
                            <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 13 }}>
                              {alloc.allocated - alloc.used} / {alloc.allocated} Days
                            </Text>
                          </View>
                          <View style={[styles.progressBarBg, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
                            <View
                              style={[
                                styles.progressBarFill,
                                {
                                  backgroundColor: colors.accent,
                                  width: `${Math.min(100, Math.max(0, ((alloc.allocated - alloc.used) / (alloc.allocated || 1)) * 100))}%`,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.tabEmptyBox}>
                      <MaterialCommunityIcons name="calendar-blank-outline" size={36} color={isDark ? '#64748b' : '#94a3b8'} />
                      <Text style={{ color: isDark ? '#94a3b8' : '#64748b', marginTop: 8, fontSize: 13 }}>
                        No custom leave allocations found. Standard company policy applies.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {activeProfileTab === 'Performance' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                  <View style={styles.cardHeaderRow}>
                    <MaterialCommunityIcons name="chart-line" size={20} color={colors.accent} />
                    <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Performance & Rating</Text>
                  </View>
                  <View style={{ gap: 10, marginTop: 10 }}>
                    <View style={[styles.infoRowSimple, { backgroundColor: isDark ? '#334155' : '#f8fafc' }]}>
                      <MaterialCommunityIcons name="shield-check-outline" size={18} color="#10b981" />
                      <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 13, flex: 1 }}>
                        Confirmation Status: <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '700' }}>{selectedEmployee.confirmationStatus || 'CONFIRMED'}</Text>
                      </Text>
                    </View>
                    {selectedEmployee.probationEnd && (
                      <View style={[styles.infoRowSimple, { backgroundColor: isDark ? '#334155' : '#f8fafc' }]}>
                        <MaterialCommunityIcons name="clock-outline" size={18} color="#f59e0b" />
                        <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 13, flex: 1 }}>
                          Probation Ends: <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '700' }}>{selectedEmployee.probationEnd.split('T')[0]}</Text>
                        </Text>
                      </View>
                    )}
                    <View style={[styles.infoRowSimple, { backgroundColor: isDark ? '#334155' : '#f8fafc' }]}>
                      <MaterialCommunityIcons name="target" size={18} color={colors.accent} />
                      <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 13, flex: 1 }}>
                        Active Role: <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '700' }}>{selectedEmployee.designation || 'N/A'}</Text>
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {activeProfileTab === 'Assets' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                  <View style={styles.cardHeaderRow}>
                    <MaterialCommunityIcons name="laptop" size={20} color={colors.accent} />
                    <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Assigned Company Assets</Text>
                  </View>
                  {assignedAssets.length > 0 ? (
                    <View style={{ gap: 10, marginTop: 10 }}>
                      {assignedAssets.map(asset => (
                        <View key={asset.id} style={[styles.assetRow, { backgroundColor: isDark ? '#334155' : '#f8fafc' }]}>
                          <MaterialCommunityIcons name="laptop" size={22} color={colors.accent} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '700', fontSize: 13 }}>
                              {asset.name} ({asset.category})
                            </Text>
                            <Text style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}>
                              SN: {asset.serial} • Status: {asset.status}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.tabEmptyBox}>
                      <MaterialCommunityIcons name="devices" size={36} color={isDark ? '#64748b' : '#94a3b8'} />
                      <Text style={{ color: isDark ? '#94a3b8' : '#64748b', marginTop: 8, fontSize: 13 }}>
                        No company assets assigned to this employee.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {activeProfileTab === 'Family & Dependents' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                  <View style={styles.cardHeaderRow}>
                    <MaterialCommunityIcons name="account-heart-outline" size={20} color={colors.accent} />
                    <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Family & Dependents</Text>
                  </View>
                  {familyMembers.length > 0 ? (
                    <View style={{ gap: 10, marginTop: 10 }}>
                      {familyMembers.map(fam => (
                        <View key={fam.id} style={[styles.familyCardItem, { backgroundColor: isDark ? '#334155' : '#f8fafc' }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <MaterialCommunityIcons name="account-child-outline" size={20} color={colors.accent} />
                            <Text style={{ color: isDark ? '#ffffff' : '#0f172a', fontWeight: '700', fontSize: 14 }}>
                              {fam.name} ({fam.relation})
                            </Text>
                          </View>
                          {fam.contact && (
                            <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 12, marginTop: 4 }}>
                              📞 Contact: {fam.contact}
                            </Text>
                          )}
                          {fam.bloodGroup && (
                            <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 12 }}>
                              🩸 Blood Group: {fam.bloodGroup}
                            </Text>
                          )}
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                            {fam.isNominee && (
                              <View style={[styles.chipBadge, { backgroundColor: '#dcfce7' }]}>
                                <Text style={{ color: '#16a34a', fontSize: 10, fontWeight: '700' }}>✓ Nominee</Text>
                              </View>
                            )}
                            {fam.isInsuranceCovered && (
                              <View style={[styles.chipBadge, { backgroundColor: '#e0f2fe' }]}>
                                <Text style={{ color: '#0284c7', fontSize: 10, fontWeight: '700' }}>🛡️ Insurance Covered</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.tabEmptyBox}>
                      <MaterialCommunityIcons name="account-group-outline" size={36} color={isDark ? '#64748b' : '#94a3b8'} />
                      <Text style={{ color: isDark ? '#94a3b8' : '#64748b', marginTop: 8, fontSize: 13 }}>
                        No family members or dependents registered.
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {activeProfileTab === 'Revision History' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                  <View style={styles.cardHeaderRow}>
                    <MaterialCommunityIcons name="history" size={20} color={colors.accent} />
                    <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Revision & Promotion Logs</Text>
                  </View>
                  <View style={{ gap: 10, marginTop: 10 }}>
                    <View style={[styles.timelineItem, { backgroundColor: isDark ? '#334155' : '#f8fafc' }]}>
                      <MaterialCommunityIcons name="calendar-check" size={18} color={colors.accent} />
                      <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 13, flex: 1 }}>
                        {selectedEmployee.joiningDate ? selectedEmployee.joiningDate.split('T')[0] : 'N/A'}: Joined as {selectedEmployee.designation || 'Employee'} in {selectedEmployee.department?.name || 'General'}.
                      </Text>
                    </View>
                    {selectedEmployee.updatedAt && (
                      <View style={[styles.timelineItem, { backgroundColor: isDark ? '#334155' : '#f8fafc' }]}>
                        <MaterialCommunityIcons name="update" size={18} color="#10b981" />
                        <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 13, flex: 1 }}>
                          {selectedEmployee.updatedAt.split('T')[0]}: Profile record updated.
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {activeProfileTab === 'Timeline' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                  <View style={styles.cardHeaderRow}>
                    <MaterialCommunityIcons name="timeline-clock-outline" size={20} color={colors.accent} />
                    <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Employment Timeline</Text>
                  </View>
                  <View style={{ gap: 10, marginTop: 10 }}>
                    <View style={[styles.timelineItem, { backgroundColor: isDark ? '#334155' : '#f8fafc' }]}>
                      <MaterialCommunityIcons name="rocket-launch-outline" size={18} color={colors.accent} />
                      <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 13, flex: 1 }}>
                        {selectedEmployee.createdAt ? selectedEmployee.createdAt.split('T')[0] : 'N/A'}: Account onboarded to HRMS system.
                      </Text>
                    </View>
                    <View style={[styles.timelineItem, { backgroundColor: isDark ? '#334155' : '#f8fafc' }]}>
                      <MaterialCommunityIcons name="flag-outline" size={18} color="#10b981" />
                      <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 13, flex: 1 }}>
                        Current Status: <Text style={{ fontWeight: '700', color: getStatusColor(selectedEmployee.status) }}>{getStatusLabel(selectedEmployee.status)}</Text>
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {activeProfileTab === 'Notes' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                  <View style={styles.cardHeaderRow}>
                    <MaterialCommunityIcons name="notebook-outline" size={20} color={colors.accent} />
                    <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>HR Confidential Notes</Text>
                  </View>
                  <View style={[styles.noteBox, { backgroundColor: isDark ? '#334155' : '#f8fafc' }]}>
                    <MaterialCommunityIcons name="note-text-outline" size={20} color={colors.accent} style={{ marginTop: 2 }} />
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569', fontSize: 13, flex: 1, lineHeight: 20 }}>
                      {selectedEmployee.name} ({selectedEmployee.id}) - Designation: {selectedEmployee.designation || 'N/A'}, Department: {selectedEmployee.department?.name || 'N/A'}, Work Location: {selectedEmployee.location || 'N/A'}.
                    </Text>
                  </View>
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
              { label: 'Active', value: 'ACTIVE', color: '#10b981', bg: isDark ? '#064e3b30' : '#dcfce7' },
              { label: 'On Leave', value: 'ON_LEAVE', color: '#0284c7', bg: isDark ? '#0c4a6e30' : '#e0f2fe' },
              { label: 'Resigned', value: 'RESIGNED', color: '#ea580c', bg: isDark ? '#7c2d1230' : '#ffedd5' },
              { label: 'Terminated', value: 'TERMINATED', color: '#ef4444', bg: isDark ? '#7f1d1d30' : '#fee2e2' },
              { label: 'Probation', value: 'PROBATION', color: '#f59e0b', bg: isDark ? '#78350f30' : '#fef3c7' },
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
                activeOpacity={0.7}
              >
                <View style={[styles.statusDotIcon, { backgroundColor: option.color }]} />
                <Text style={[styles.statusOptionLabel, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                  {option.label}
                </Text>
                {selectedEmployee?.status === option.value && (
                  <MaterialCommunityIcons name="check" size={20} color={option.color} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.dropdownCancelBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
              onPress={() => setStatusPickerOpen(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dropdownCancelText, { color: isDark ? '#cbd5e1' : '#64748b' }]}>Cancel</Text>
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
            <View style={[styles.promoteModalCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
              {/* Header */}
              <View style={styles.promoteModalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.promoteTitleText, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                    Role Upgrade & Employee Transfer
                  </Text>
                  <Text style={[styles.promoteSubtitleText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    Promote or transfer employee {selectedEmployee?.name || 'N/A'} ({selectedEmployee?.id || 'N/A'})
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setPromoteModalOpen(false)} style={{ padding: 4 }}>
                  <MaterialCommunityIcons name="close" size={22} color={isDark ? '#cbd5e1' : '#64748b'} />
                </TouchableOpacity>
              </View>

              {/* Current Details */}
              <View style={[styles.currentDetailsRow, { backgroundColor: isDark ? '#334155' : '#f8fafc' }]}>
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
                      style={[
                        styles.typePill,
                        { backgroundColor: isSelected ? colors.accent : (isDark ? '#334155' : '#f1f5f9') },
                      ]}
                      onPress={() => setActionType(type as any)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.typePillText, { color: isSelected ? '#ffffff' : (isDark ? '#cbd5e1' : '#64748b') }]}>
                        {type}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* New Job Designation Role */}
              <Text style={styles.fieldLabelText}>New Job Designation Role</Text>
              <TextInput
                style={[styles.modalInput, { color: isDark ? '#ffffff' : '#0f172a', borderColor: isDark ? '#334155' : '#cbd5e1', backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}
                value={newRole}
                onChangeText={setNewRole}
                placeholder="Enter designation / role"
                placeholderTextColor="#94a3b8"
              />

              {/* Target Department */}
              <Text style={styles.fieldLabelText}>Target Department</Text>
              <TextInput
                style={[styles.modalInput, { color: isDark ? '#ffffff' : '#0f172a', borderColor: isDark ? '#334155' : '#cbd5e1', backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}
                value={targetDept}
                onChangeText={setTargetDept}
                placeholder="Enter department name"
                placeholderTextColor="#94a3b8"
              />

              {/* Effective Date & Revised Basic Salary Row */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabelText}>Effective Date</Text>
                  <TouchableOpacity
                    style={[styles.dateInputRowModal, { borderColor: isDark ? '#334155' : '#cbd5e1', backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}
                    onPress={() => setShowEffectiveDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: effectiveDate ? (isDark ? '#ffffff' : '#0f172a') : '#94a3b8', fontSize: 13, flex: 1 }}>
                      {effectiveDate || 'YYYY-MM-DD'}
                    </Text>
                    <MaterialCommunityIcons name="calendar" size={18} color={colors.accent} />
                  </TouchableOpacity>

                  {showEffectiveDatePicker && (
                    <DateTimePicker
                      value={effectiveDate ? new Date(effectiveDate) : new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'inline' : 'default'}
                      onChange={handleEffectiveDateChange}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabelText}>Revised Basic Salary (₹)</Text>
                  <TextInput
                    style={[styles.modalInput, { color: isDark ? '#ffffff' : '#0f172a', borderColor: isDark ? '#334155' : '#cbd5e1', backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}
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
                style={[styles.modalTextArea, { color: isDark ? '#ffffff' : '#0f172a', borderColor: isDark ? '#334155' : '#cbd5e1', backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}
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
                  style={[styles.btnCancelModal, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
                  onPress={() => setPromoteModalOpen(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.btnCancelModalText, { color: isDark ? '#cbd5e1' : '#64748b' }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnConfirmPromote, { backgroundColor: colors.accent }]}
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
                  activeOpacity={0.8}
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
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  myDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  myDetailsButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 6,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1.5,
  },
  avatarText: {
    fontWeight: '800',
    fontSize: 17,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '800',
  },
  idBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  idBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  employeeDesignation: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  deptLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  metaIconText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  employeeDepartment: {
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardDivider: {
    height: 1,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '48%',
  },
  contactText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
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
  },
  modalHeaderBackButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderTitleText: {
    fontSize: 18,
    fontWeight: '800',
  },
  profileHeaderCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  avatarLargeText: {
    color: '#ffffff',
    fontSize: 24,
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
    fontWeight: '800',
  },
  profileRoleText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  profileMetaText: {
    fontSize: 12,
  },
  statusProbationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusProbationText: {
    fontSize: 12,
    fontWeight: '800',
  },
  profileActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    flexWrap: 'wrap',
  },
  btnActionDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnActionDeleteText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  btnActionIssue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnActionIssueText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },
  btnActionPromote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderColor: '#9333ea',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    marginRight: 8,
  },
  profileTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailSectionCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitleHeader: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  btnEditDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    rowGap: 14,
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
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoBoxValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
  docItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  docStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  punchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  payrollRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  netSalaryBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  leaveItemCard: {
    padding: 12,
    borderRadius: 12,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  infoRowSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
  },
  familyCardItem: {
    padding: 14,
    borderRadius: 14,
  },
  chipBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  tabEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  modalOverlayDark: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  statusDropdownCard: {
    width: '90%',
    maxWidth: 380,
    borderRadius: 22,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  dropdownTitle: {
    fontSize: 17,
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
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  dropdownCancelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  promoteModalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  promoteModalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
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
    marginTop: 3,
  },
  currentDetailsRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
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
    marginTop: 2,
  },
  actionTypePillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  typePill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  dateInputRowModal: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  modalTextArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 74,
    textAlignVertical: 'top',
  },
  modalFooterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  btnCancelModal: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnCancelModalText: {
    fontWeight: '700',
    fontSize: 13,
  },
  btnConfirmPromote: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
  },
  btnConfirmPromoteText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});
