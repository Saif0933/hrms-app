import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEmployees } from '../../api/hook/useEmployee';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'RolePermissions'>;

interface PermissionItem {
  id: string;
  name: string;
  category: 'Employees' | 'Attendance' | 'Leave' | 'Payroll' | 'Performance' | 'Claims' | 'Recruitment' | 'Admin';
}

export const RolePermissionsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  // Roles State
  const [roles, setRoles] = useState<string[]>([
    'Super Admin',
    'HR Manager',
    'Payroll Officer',
    'Manager',
    'Employee',
  ]);
  const [selectedRole, setSelectedRole] = useState<string>('HR Manager');

  // Create Role Modal State
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  // Assign Role State
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [assignRoleName, setAssignRoleName] = useState<string>('HR Manager');
  const [userRolesMap, setUserRolesMap] = useState<Record<string, string>>({});

  // Active Category Filter for Permissions
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // TanStack Query for employees
  const { data: response, isLoading: isLoadingEmployees } = useEmployees();
  const employees = response?.data || [];

  // Full System Permissions List
  const permissions: PermissionItem[] = [
    // Employees
    { id: 'VIEW_EMPLOYEE_DIRECTORY', name: 'View Employee Directory', category: 'Employees' },
    { id: 'VIEW_EMPLOYEE_MASTER', name: 'View Full Employee Master', category: 'Employees' },
    { id: 'CREATE_EMPLOYEE', name: 'Create / Onboard New Employee', category: 'Employees' },
    { id: 'UPDATE_EMPLOYEE', name: 'Update Employee Records', category: 'Employees' },
    { id: 'DELETE_EMPLOYEE', name: 'Archive / Terminate Employee', category: 'Employees' },
    { id: 'VIEW_ORGANIZATION_CHART', name: 'View Org Chart & Hierarchy', category: 'Employees' },
    { id: 'VIEW_EXIT_SETTLEMENT', name: 'Manage Resignations & Clearance', category: 'Employees' },
    { id: 'MANAGE_BULK_IMPORTS', name: 'Manage Bulk Imports & Exports', category: 'Employees' },

    // Attendance
    { id: 'VIEW_GPS_SELFIE_PUNCH', name: 'GPS & Selfie Attendance Punch', category: 'Attendance' },
    { id: 'VIEW_SHIFT_ROSTER', name: 'View Shift Rosters & Schedules', category: 'Attendance' },
    { id: 'UPDATE_SHIFT_ROSTER', name: 'Manage Shift Rosters & Transfers', category: 'Attendance' },
    { id: 'VIEW_ATTENDANCE_REGULARIZATION', name: 'Regularize Missed Punches', category: 'Attendance' },
    { id: 'VIEW_MUSTER_ROLL', name: 'View Monthly Muster Roll', category: 'Attendance' },
    { id: 'VIEW_ATTENDANCE_REPORTS', name: 'View Attendance Analytics', category: 'Attendance' },

    // Leave
    { id: 'CREATE_LEAVE_APPLICATION', name: 'Apply for Leave / Time Off', category: 'Leave' },
    { id: 'UPDATE_LEAVE_APPROVAL', name: 'Approve / Reject Leave Requests', category: 'Leave' },
    { id: 'VIEW_LEAVE_CALENDAR', name: 'View Team Leave Calendar', category: 'Leave' },
    { id: 'MANAGE_LEAVE_CONFIGURATIONS', name: 'Configure Leave Types & Quotas', category: 'Leave' },

    // Payroll
    { id: 'UPDATE_SALARY_PROCESSING', name: 'Process Monthly Payroll', category: 'Payroll' },
    { id: 'UPDATE_SALARY_STRUCTURE', name: 'Revise Salary CTC Structure', category: 'Payroll' },
    { id: 'VIEW_LOANS_ADVANCES', name: 'Manage Salary Loans & Advances', category: 'Payroll' },
    { id: 'VIEW_INVESTMENT_DECLARATIONS', name: 'Tax Investment Declarations', category: 'Payroll' },
    { id: 'VIEW_PAYSLIP_TEMPLATES', name: 'Generate & Mail Payslips', category: 'Payroll' },

    // Performance
    { id: 'VIEW_KRA_GOALS', name: 'Manage KRAs & Goal Sheets', category: 'Performance' },
    { id: 'VIEW_FEEDBACK_360', name: 'Conduct 360 Feedback Appraisal', category: 'Performance' },
    { id: 'VIEW_BELLCURVE_ANALYTICS', name: 'View Bell Curve Performance Analytics', category: 'Performance' },

    // Claims & Expenses
    { id: 'CREATE_TRAVEL_REQUEST', name: 'Submit Travel & Expense Claims', category: 'Claims' },
    { id: 'UPDATE_CLAIM_APPROVAL', name: 'Approve Reimbursement Claims', category: 'Claims' },

    // Recruitment
    { id: 'VIEW_JOB_REQUISITIONS', name: 'Create Job Requisitions', category: 'Recruitment' },
    { id: 'VIEW_CANDIDATE_PIPELINE', name: 'Track Candidate Hiring Pipeline', category: 'Recruitment' },

    // Admin
    { id: 'VIEW_ROLES_PERMISSIONS', name: 'Configure System Roles & Access Matrix', category: 'Admin' },
    { id: 'MANAGE_SYSTEM_SETTINGS', name: 'Manage System & Tenant Configurations', category: 'Admin' },
  ];

  // Enabled permissions state map
  const [enabledPerms, setEnabledPerms] = useState<Record<string, Record<string, boolean>>>({
    'HR Manager': {
      VIEW_EMPLOYEE_DIRECTORY: true,
      VIEW_EMPLOYEE_MASTER: true,
      CREATE_EMPLOYEE: true,
      UPDATE_EMPLOYEE: true,
      MANAGE_BULK_IMPORTS: true,
      UPDATE_LEAVE_APPROVAL: true,
      VIEW_ATTENDANCE_REPORTS: true,
      VIEW_ORGANIZATION_CHART: true,
      VIEW_EXIT_SETTLEMENT: true,
    },
    'Payroll Officer': {
      VIEW_EMPLOYEE_DIRECTORY: true,
      UPDATE_SALARY_PROCESSING: true,
      UPDATE_SALARY_STRUCTURE: true,
      VIEW_LOANS_ADVANCES: true,
      VIEW_INVESTMENT_DECLARATIONS: true,
      VIEW_PAYSLIP_TEMPLATES: true,
    },
    Employee: {
      VIEW_EMPLOYEE_DIRECTORY: true,
      VIEW_GPS_SELFIE_PUNCH: true,
      CREATE_LEAVE_APPLICATION: true,
      CREATE_TRAVEL_REQUEST: true,
    },
  });

  const togglePermission = (permId: string) => {
    setEnabledPerms(prev => {
      const currentRolePerms = prev[selectedRole] || {};
      return {
        ...prev,
        [selectedRole]: {
          ...currentRolePerms,
          [permId]: !currentRolePerms[permId],
        },
      };
    });
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      Alert.alert('Validation Error', 'Please enter a role name');
      return;
    }

    if (roles.includes(newRoleName.trim())) {
      Alert.alert('Duplicate Role', 'Role with this name already exists.');
      return;
    }

    const createdRole = newRoleName.trim();
    setRoles(prev => [...prev, createdRole]);
    setSelectedRole(createdRole);
    setNewRoleName('');
    setNewRoleDesc('');
    setIsCreateRoleModalOpen(false);
    Alert.alert('Role Created', `Successfully created custom system role: "${createdRole}"`);
  };

  const handleAssignRole = () => {
    if (!selectedEmpId) {
      Alert.alert('Validation Error', 'Please select an employee to assign role profile.');
      return;
    }

    const matchedEmp = employees.find(e => e.id === selectedEmpId);
    const empName = matchedEmp?.name || selectedEmpId;

    setUserRolesMap(prev => ({
      ...prev,
      [selectedEmpId]: assignRoleName,
    }));

    Alert.alert(
      'Role Assigned Successfully! 👤',
      `Assigned Role Profile "${assignRoleName}" to employee ${empName}.`
    );
  };

  const categories = ['ALL', 'Employees', 'Attendance', 'Leave', 'Payroll', 'Performance', 'Claims', 'Recruitment', 'Admin'];

  const filteredPermissions = permissions.filter(
    p => activeCategory === 'ALL' || p.category === activeCategory
  );

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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Role & Permissions</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Access Control, Role Creation & User Profile Assignment
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. ASSIGN ROLE PROFILES TO USERS SECTION */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            👤 Assign Role Profiles to Users
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Select an employee and assign them a system role profile (Super Admin, HR Manager, etc.).
          </Text>

          {isLoadingEmployees ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 10 }} />
          ) : (
            <>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                SELECT EMPLOYEE *
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <View style={styles.chipRow}>
                  {employees.map(emp => {
                    const isSelected = selectedEmpId === emp.id;
                    const assignedRole = userRolesMap[emp.id] || 'Employee';
                    return (
                      <TouchableOpacity
                        key={emp.id}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? colors.accent : colors.background,
                            borderColor: isSelected ? colors.accent : colors.cardBorder,
                          },
                        ]}
                        onPress={() => setSelectedEmpId(emp.id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: isSelected ? '#ffffff' : colors.textPrimary },
                          ]}
                        >
                          {emp.name} ({assignedRole})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                ASSIGN ROLE PROFILE *
              </Text>
              <View style={styles.chipRow}>
                {roles.map(r => {
                  const isSelected = assignRoleName === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected ? colors.accent : colors.background,
                          borderColor: isSelected ? colors.accent : colors.cardBorder,
                        },
                      ]}
                      onPress={() => setAssignRoleName(r)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isSelected ? '#ffffff' : colors.textPrimary },
                        ]}
                      >
                        {r}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: colors.accent }]}
                onPress={handleAssignRole}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryActionBtnText}>Assign Role Profile to User</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 2. ROLE SELECTOR & CREATE ROLE BUTTON */}
        <View style={styles.roleSectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Configure Privileges for System Roles
          </Text>
          <TouchableOpacity
            style={[styles.createRoleBtn, { backgroundColor: colors.accent }]}
            onPress={() => setIsCreateRoleModalOpen(true)}
          >
            <Text style={styles.createRoleBtnText}>+ Create Role</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.roleGrid}>
          {roles.map(role => {
            const isSelected = selectedRole === role;
            return (
              <TouchableOpacity
                key={role}
                style={[
                  styles.roleCard,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.cardBackground,
                    borderColor: isSelected ? colors.accent : colors.cardBorder,
                  },
                ]}
                onPress={() => setSelectedRole(role)}
              >
                <Text style={[styles.roleTitle, { color: isSelected ? '#ffffff' : colors.textPrimary }]}>
                  {role}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 3. CATEGORY FILTERS & ALL PERMISSIONS LIST */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 20 }]}>
          Permission Privileges Matrix for ({selectedRole})
        </Text>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={styles.categoryPillsRow}>
            {categories.map(cat => {
              const isActive = activeCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catPill,
                    {
                      backgroundColor: isActive ? colors.accent : colors.cardBackground,
                      borderColor: isActive ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setActiveCategory(cat)}
                >
                  <Text
                    style={[
                      styles.catPillText,
                      { color: isActive ? '#ffffff' : colors.textSecondary },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Permissions Rows */}
        {filteredPermissions.map(perm => {
          const roleMap = enabledPerms[selectedRole] || {};
          const isGranted = selectedRole === 'Super Admin' || !!roleMap[perm.id];

          return (
            <View
              key={perm.id}
              style={[
                styles.permRow,
                { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.permInfo}>
                <Text style={[styles.permName, { color: colors.textPrimary }]}>{perm.name}</Text>
                <Text style={[styles.permCat, { color: colors.textMuted }]}>
                  Category: {perm.category} • Key: ({perm.id})
                </Text>
              </View>

              <Switch
                value={isGranted}
                disabled={selectedRole === 'Super Admin'}
                onValueChange={() => togglePermission(perm.id)}
                thumbColor={isGranted ? colors.accent : '#94a3b8'}
              />
            </View>
          );
        })}
      </ScrollView>

      {/* CREATE NEW ROLE MODAL */}
      <Modal visible={isCreateRoleModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              ✨ Create Custom System Role
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Enter role name and description to create a new role profile.
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ROLE NAME *</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText,
                },
              ]}
              placeholder="e.g. Senior HR Generalist"
              placeholderTextColor={colors.inputPlaceholder}
              value={newRoleName}
              onChangeText={setNewRoleName}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DESCRIPTION</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText,
                },
              ]}
              placeholder="e.g. Manages recruitment, onboarding and attendance regularizations"
              placeholderTextColor={colors.inputPlaceholder}
              value={newRoleDesc}
              onChangeText={setNewRoleDesc}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setIsCreateRoleModalOpen(false)}
              >
                <Text style={[styles.modalCancelBtnText, { color: colors.textPrimary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.accent }]}
                onPress={handleCreateRole}
              >
                <Text style={styles.modalSubmitBtnText}>Create Role</Text>
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
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  primaryActionBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  roleSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  createRoleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  createRoleBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  roleCard: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  roleTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  categoryPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  permRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  permInfo: {
    flex: 1,
    marginRight: 10,
  },
  permName: {
    fontSize: 13,
    fontWeight: '600',
  },
  permCat: {
    fontSize: 11,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  modalInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
