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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Employee, MOCK_EMPLOYEES, useEmployees, useUpdateEmployee } from '../../api/hook/useEmployee';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const EmployeeDirectoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<string>('Overview');

  // Status Picker Modal State
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);

  // Promote / Transfer Modal State
  const [promoteModalOpen, setPromoteModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'Role Upgrade' | 'Dept Transfer' | 'Role + Transfer'>('Role Upgrade');
  const [newRole, setNewRole] = useState('UI/UX designer');
  const [targetDept, setTargetDept] = useState('Engineering');
  const [effectiveDate, setEffectiveDate] = useState('31-07-2026');
  const [revisedSalary, setRevisedSalary] = useState('13500');
  const [remarks, setRemarks] = useState('');

  const updateEmployeeMutation = useUpdateEmployee();



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
            <Text style={[styles.employeeName, { color: colors.textPrimary }]}>{item.name}</Text>
            <Text style={[styles.employeeDesignation, { color: colors.textSecondary }]}>
              {item.designation || 'UI/UX designer'}
            </Text>
            <Text style={[styles.employeeDepartment, { color: colors.textMuted }]}>
              {item.department?.name || 'Design'} • {item.location || 'Mumbai'}
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
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('EmployeeMaster', {})}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
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
                  {selectedEmployee.name || 'sam'}
                </Text>
                <Text style={{ fontSize: 12, color: '#64748b' }}>
                  {selectedEmployee.id ? `EMP${selectedEmployee.id.substring(0, 5).toUpperCase()}` : 'EMP31723'} • {selectedEmployee.designation || 'UI/UX designer'}
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
                          : 'SM'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.profileHeaderInfoFlex}>
                    <View style={styles.profileNameRow}>
                      <Text style={[styles.profileNameText, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                        {selectedEmployee.name || 'sam'}
                      </Text>
                      <View style={styles.empCodeBadge}>
                        <Text style={styles.empCodeBadgeText}>
                          {selectedEmployee.id ? `EMP${selectedEmployee.id.substring(0, 5).toUpperCase()}` : 'EMP31723'}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.profileRoleText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      {selectedEmployee.designation || 'UI/UX designer'} • {selectedEmployee.location || 'Mumbai'}
                    </Text>

                    <Text style={[styles.profileMetaText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      Manager: {selectedEmployee.manager?.name || 'N/A'}
                    </Text>
                    <Text style={[styles.profileMetaText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      Joined: {selectedEmployee.joiningDate ? selectedEmployee.joiningDate.split('T')[0] : '2026-07-28'}
                    </Text>
                  </View>

                  {/* Status Dropdown Button */}
                  <TouchableOpacity
                    style={styles.statusProbationBadge}
                    onPress={() => setStatusPickerOpen(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.statusProbationText}>
                      Status: {selectedEmployee.status ? (selectedEmployee.status === 'PROBATION' ? 'Probation' : selectedEmployee.status === 'ACTIVE' ? 'Active' : selectedEmployee.status === 'ON_LEAVE' ? 'On Leave' : selectedEmployee.status === 'RESIGNED' ? 'Resigned' : 'Terminated') : 'Probation'} ▼
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
                            setSelectedEmployee(null);
                            Alert.alert('Deleted', 'Employee profile removed.');
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
                        setNewRole(selectedEmployee.designation || 'UI/UX designer');
                        setTargetDept(selectedEmployee.department?.name || 'Engineering');
                        setEffectiveDate('31-07-2026');
                        setRevisedSalary('13500');
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
                        <Text style={styles.infoBoxLabel}>Current Designation Role</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.designation || 'UI/UX designer'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Active Role</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.role || selectedEmployee.designation || 'UI/UX designer'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Department</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.department?.name || 'Design / Product'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Joining Date</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.joiningDate ? selectedEmployee.joiningDate.split('T')[0] : '2026-07-28'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Work Location</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.location || 'Mumbai'}
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
                          const empId = selectedEmployee.id;
                          setSelectedEmployee(null);
                          navigation.navigate('EmployeeMaster', { employeeId: empId });
                        }}
                      >
                        <Text style={styles.btnEditDetailsText}>Edit Details</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.infoGrid2Col}>
                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Profile Photo</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.name || 'sam'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Gender</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.gender || 'Male'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Date of Birth</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.dob || '2026-07-11T00:00:00.000Z'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Blood Group</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.bloodGroup || 'AB+'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Marital Status</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.maritalStatus || 'Single'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Contact Email</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.email || 'sam@gmail.com'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Contact Phone</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.phone || '1478523690'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Nationality</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          Indian
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Father's / Guardian Name</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.fatherName || 'swedr'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>Permanent Address</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.permanentAddress || 'asdf'}
                        </Text>
                      </View>

                      <View style={styles.infoBoxFull}>
                        <Text style={styles.infoBoxLabel}>Emergency Contact</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          +91 98000 11223 (Family Emergency Contact)
                        </Text>
                      </View>

                      <View style={styles.infoBoxFull}>
                        <Text style={styles.infoBoxLabel}>Languages Spoken</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.languagesSpoken || 'English'}
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
                          {selectedEmployee.qualification || 'MBA'}
                        </Text>
                      </View>

                      <View style={styles.infoBox}>
                        <Text style={styles.infoBoxLabel}>University</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {selectedEmployee.university || 'Mumbai University'}
                        </Text>
                      </View>

                      <View style={styles.infoBoxFull}>
                        <Text style={styles.infoBoxLabel}>Past Companies</Text>
                        <Text style={[styles.infoBoxValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          No past companies listed (Fresher)
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Other Tabs Placeholder Renderers */}
              {activeProfileTab === 'Documents' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                  <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Document Vault</Text>
                  <View style={{ gap: 10, marginTop: 10 }}>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>📄 Offer_Letter_Sam.pdf (Verified)</Text>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>📄 Degree_Certificate_MBA.pdf (Verified)</Text>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>📄 Passport_Copy.pdf (Verified)</Text>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>📄 Aadhaar_Identity_Proof.pdf (Verified)</Text>
                  </View>
                </View>
              )}

              {activeProfileTab === 'Attendance' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                  <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Attendance Overview</Text>
                  <View style={{ gap: 8, marginTop: 10 }}>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>🟢 Total Present Days: 22 Days (95.5%)</Text>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>🟡 Late Punch-ins: 1 Day</Text>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>🔴 Unexcused Absences: 0 Days</Text>
                  </View>
                </View>
              )}

              {activeProfileTab === 'Payroll' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                  <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Payroll & Compensation</Text>
                  <View style={{ gap: 8, marginTop: 10 }}>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>💵 Basic Salary: ₹45,000 / month</Text>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>🏠 HRA: ₹18,000 / month</Text>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>🎁 Special Allowance: ₹12,000 / month</Text>
                    <Text style={{ color: '#22c55e', fontWeight: '700', fontSize: 15, marginTop: 4 }}>
                      💰 Net Payable: ₹75,000 / month
                    </Text>
                  </View>
                </View>
              )}

              {activeProfileTab === 'Leave' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                  <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Leave Balances</Text>
                  <View style={{ gap: 8, marginTop: 10 }}>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>🌴 Casual Leave: 12 / 12 Remaining</Text>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>🤒 Sick Leave: 10 / 10 Remaining</Text>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>✈️ Earned Leave: 15 / 15 Remaining</Text>
                  </View>
                </View>
              )}

              {activeProfileTab === 'Performance' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                  <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Performance & Rating</Text>
                  <View style={{ gap: 8, marginTop: 10 }}>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>⭐ Overall Rating: 4.8 / 5.0 (Exceeds Expectations)</Text>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>🎯 KRA & Goals Completed: 8 / 10</Text>
                  </View>
                </View>
              )}

              {activeProfileTab === 'Assets' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                  <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Assigned Company Assets</Text>
                  <View style={{ gap: 8, marginTop: 10 }}>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>💻 Apple MacBook Pro 16" (SN: C02F1234MD6R)</Text>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>🖥️ Dell UltraSharp 27" 4K Monitor</Text>
                  </View>
                </View>
              )}

              {activeProfileTab === 'Family & Dependents' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                  <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Family & Dependents</Text>
                  <View style={{ gap: 8, marginTop: 10 }}>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>👨 Father: swedr</Text>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>📞 Emergency Contact: +91 98000 11223</Text>
                    <Text style={{ color: isDark ? '#cbd5e1' : '#475569' }}>🏠 Address: asdf</Text>
                  </View>
                </View>
              )}

              {activeProfileTab === 'Revision History' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                  <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Revision & Promotion Logs</Text>
                  <Text style={{ color: isDark ? '#cbd5e1' : '#475569', marginTop: 10 }}>
                    📅 2026-07-28: Initial Appointment as UI/UX designer on probation period.
                  </Text>
                </View>
              )}

              {activeProfileTab === 'Timeline' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                  <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>Employment Timeline</Text>
                  <Text style={{ color: isDark ? '#cbd5e1' : '#475569', marginTop: 10 }}>
                    🚀 2026-07-28: Account created and onboarded to HRMS system.
                  </Text>
                </View>
              )}

              {activeProfileTab === 'Notes' && (
                <View style={[styles.detailSectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
                  <Text style={[styles.cardTitleHeader, { color: isDark ? '#ffffff' : '#0f172a' }]}>HR Confidential Notes</Text>
                  <Text style={{ color: isDark ? '#cbd5e1' : '#475569', marginTop: 10 }}>
                    📝 High potential UI/UX designer candidate joining the Mumbai office.
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

                    const mockIdx = MOCK_EMPLOYEES.findIndex(
                      e => e.id === selectedEmployee.id || e.name.toLowerCase() === selectedEmployee.name.toLowerCase()
                    );
                    if (mockIdx !== -1) {
                      MOCK_EMPLOYEES[mockIdx].status = newStatus;
                    }

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
                    Promote or transfer employee {selectedEmployee?.name || 'sam'} ({selectedEmployee?.id ? `EMP${selectedEmployee.id.substring(0, 5).toUpperCase()}` : 'EMP31723'})
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
                    {selectedEmployee?.designation || 'UI/UX designer'}
                  </Text>
                </View>
                <View style={styles.currentBox}>
                  <Text style={styles.fieldLabelText}>Current Department</Text>
                  <Text style={[styles.fieldValueBold, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                    {selectedEmployee?.department?.name || 'Design / Product'}
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
                placeholder="UI/UX designer"
                placeholderTextColor="#94a3b8"
              />

              {/* Target Department */}
              <Text style={styles.fieldLabelText}>Target Department</Text>
              <TextInput
                style={[styles.modalInput, { color: isDark ? '#ffffff' : '#0f172a', borderColor: isDark ? '#334155' : '#cbd5e1' }]}
                value={targetDept}
                onChangeText={setTargetDept}
                placeholder="Engineering"
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
                    placeholder="31-07-2026"
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
                    placeholder="13500"
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

                      const mockIdx = MOCK_EMPLOYEES.findIndex(
                        e => e.id === selectedEmployee.id || e.name.toLowerCase() === selectedEmployee.name.toLowerCase()
                      );
                      if (mockIdx !== -1) {
                        MOCK_EMPLOYEES[mockIdx].designation = newRole;
                        MOCK_EMPLOYEES[mockIdx].role = newRole;
                        MOCK_EMPLOYEES[mockIdx].department = updatedDept;
                        MOCK_EMPLOYEES[mockIdx].basic = parsedBasic;
                      }

                      updateEmployeeMutation.mutate(
                        {
                          id: selectedEmployee.id,
                          data: { designation: newRole },
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
});


