import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
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
import {
  Role,
  useCreateRole,
  usePermissions,
  useRoles,
  useUpdateRole,
} from '../../api/hook/useRole';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'RolePermissions'>;

interface PermissionItem {
  id: string;
  name: string;
  category: 'Employees' | 'Attendance' | 'Leave' | 'Payroll' | 'Performance' | 'Claims' | 'Recruitment' | 'Admin';
}

export const RolePermissionsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  // API Hooks
  const { data: rolesResponse, isLoading: isLoadingRoles } = useRoles();
  const { data: permissionsResponse, isLoading: isLoadingPermissions } = usePermissions();

  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();

  const apiRoles = rolesResponse?.data || [];
  const apiPermissions = permissionsResponse?.data || [];

  // Selected Role ID State
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const displayRoles: Role[] = apiRoles;
  const activeRole = displayRoles.find(r => r.id === selectedRoleId) || displayRoles[0];

  useEffect(() => {
    if (apiRoles.length > 0 && !selectedRoleId) {
      setSelectedRoleId(apiRoles[0].id);
    }
  }, [apiRoles, selectedRoleId]);

  // Create Role Modal State
  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  // Active Category Filter for Permissions
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // Local state for enabled permissions for active role
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);

  useEffect(() => {
    if (activeRole) {
      const currentPerms = activeRole.permissions || [];
      const resolvedIdentifiers: string[] = [];
      currentPerms.forEach((p: any) => {
        const permObj = p.permission || p;
        if (permObj?.id) resolvedIdentifiers.push(permObj.id);
        if (permObj?.name) resolvedIdentifiers.push(permObj.name);
      });
      setSelectedPermissionIds(resolvedIdentifiers);
    } else {
      setSelectedPermissionIds([]);
    }
  }, [activeRole]);

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

  const togglePermission = (permId: string) => {
    const targetPerm = apiPermissions.find(p => p.id === permId || p.name === permId);
    const idToToggle = targetPerm?.id || permId;
    const nameToToggle = targetPerm?.name || permId;

    setSelectedPermissionIds(prev => {
      const isAlreadySelected = prev.includes(idToToggle) || prev.includes(nameToToggle);
      if (isAlreadySelected) {
        return prev.filter(x => x !== idToToggle && x !== nameToToggle);
      } else {
        return [...prev, idToToggle, nameToToggle];
      }
    });
  };

  const getResolvedPermissionIds = (permissionKeys: string[]) => {
    if (apiPermissions.length === 0) return permissionKeys;
    const resolvedSet = new Set<string>();
    permissionKeys.forEach(key => {
      const found = apiPermissions.find(p => p.id === key || p.name === key);
      if (found) {
        resolvedSet.add(found.id);
      } else {
        resolvedSet.add(key);
      }
    });
    return Array.from(resolvedSet);
  };

  const handleSavePermissions = () => {
    if (!activeRole) {
      Alert.alert('Validation Error', 'No active role selected.');
      return;
    }

    const payloadIds = getResolvedPermissionIds(selectedPermissionIds);

    if (activeRole.id && !activeRole.id.startsWith('role-')) {
      updateRoleMutation.mutate(
        {
          id: activeRole.id,
          data: { permissionIds: payloadIds },
        },
        {
          onSuccess: () => {
            Alert.alert(
              'Permissions Saved! 💾',
              `Successfully saved updated permissions matrix for role "${activeRole.name}".`
            );
          },
          onError: (err: any) => {
            const msg = err.response?.data?.message || err.message || 'Failed to update permissions';
            Alert.alert('Error', msg);
          },
        }
      );
    } else {
      Alert.alert(
        'Permissions Saved! 💾',
        `Saved permission matrix settings for "${activeRole.name}".`
      );
    }
  };

  const handleCreateRole = () => {
    if (!newRoleName.trim()) {
      Alert.alert('Validation Error', 'Please enter a role name');
      return;
    }

    const trimmedName = newRoleName.trim();

    if (displayRoles.some(r => r.name.toLowerCase() === trimmedName.toLowerCase())) {
      Alert.alert('Duplicate Role', 'Role with this name already exists.');
      return;
    }

    createRoleMutation.mutate(
      {
        name: trimmedName.toUpperCase(),
        description: newRoleDesc.trim(),
        permissionIds: [],
      },
      {
        onSuccess: (res) => {
          const createdRole = res?.data;
          setNewRoleName('');
          setNewRoleDesc('');
          setIsCreateRoleModalOpen(false);
          if (createdRole?.id) {
            setSelectedRoleId(createdRole.id);
          }
          Alert.alert('Role Created', `Successfully created custom system role: "${createdRole?.name || trimmedName.toUpperCase()}"`);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || 'Failed to create role';
          Alert.alert('Error', msg);
        },
      }
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
            Role Creation & System Permission Matrix
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.headerSaveBtn, { backgroundColor: colors.accent, opacity: updateRoleMutation.isPending ? 0.6 : 1 }]}
          onPress={handleSavePermissions}
          disabled={updateRoleMutation.isPending}
          activeOpacity={0.8}
        >
          {updateRoleMutation.isPending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.headerSaveBtnText}>Save 💾</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick Shortcut Banner to Assign Roles to Employees */}
        <TouchableOpacity
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
          onPress={() => navigation.navigate('AssignRole')}
          activeOpacity={0.8}
        >
          <View style={styles.shortcutRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                👤 Assign Roles to Employees
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary, marginBottom: 0 }]}>
                Map system roles & access profiles directly to employees.
              </Text>
            </View>
            <View style={[styles.shortcutBtn, { backgroundColor: colors.accent }]}>
              <Text style={styles.shortcutBtnText}>Assign Role →</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 1. ROLE SELECTOR & CREATE ROLE BUTTON */}
        <View style={styles.roleSectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            System Roles List
          </Text>
          <TouchableOpacity
            style={[styles.createRoleBtn, { backgroundColor: colors.accent }]}
            onPress={() => setIsCreateRoleModalOpen(true)}
          >
            <Text style={styles.createRoleBtnText}>+ Create Role</Text>
          </TouchableOpacity>
        </View>

        {isLoadingRoles ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 12 }} />
        ) : (
          <View style={styles.roleGrid}>
            {displayRoles.map(role => {
              const isSelected = activeRole?.id === role.id;
              return (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleCard,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.cardBackground,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setSelectedRoleId(role.id)}
                >
                  <Text style={[styles.roleTitle, { color: isSelected ? '#ffffff' : colors.textPrimary }]}>
                    {role.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* 2. CATEGORY FILTERS & PERMISSIONS MATRIX */}
        <View style={styles.permHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, flex: 1 }]}>
            Permissions for ({activeRole?.name || 'Role'})
          </Text>
          <TouchableOpacity
            style={[
              styles.savePermsBtn,
              { backgroundColor: colors.accent, opacity: updateRoleMutation.isPending ? 0.6 : 1 },
            ]}
            onPress={handleSavePermissions}
            disabled={updateRoleMutation.isPending}
            activeOpacity={0.8}
          >
            {updateRoleMutation.isPending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.savePermsBtnText}>💾 Save Permissions</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12, marginTop: 8 }}>
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
          const roleName = activeRole?.name || 'DefaultRole';
          const targetDbPerm = apiPermissions.find(p => p.name === perm.id || p.id === perm.id);
          const isGranted =
            roleName === 'SUPER_ADMIN' ||
            roleName === 'Super Admin' ||
            selectedPermissionIds.includes(perm.id) ||
            (targetDbPerm ? selectedPermissionIds.includes(targetDbPerm.id) || selectedPermissionIds.includes(targetDbPerm.name) : false);

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
                disabled={roleName === 'SUPER_ADMIN' || roleName === 'Super Admin'}
                onValueChange={() => togglePermission(perm.id)}
                thumbColor={isGranted ? colors.accent : '#94a3b8'}
              />
            </View>
          );
        })}

        {/* Save Permissions Bottom Action Button */}
        <TouchableOpacity
          style={[
            styles.bottomSaveBtn,
            { backgroundColor: colors.accent, opacity: updateRoleMutation.isPending ? 0.6 : 1 },
          ]}
          onPress={handleSavePermissions}
          disabled={updateRoleMutation.isPending}
          activeOpacity={0.85}
        >
          {updateRoleMutation.isPending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.bottomSaveBtnText}>💾 Save Role Permissions</Text>
          )}
        </TouchableOpacity>
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
                style={[styles.modalSubmitBtn, { backgroundColor: colors.accent, opacity: createRoleMutation.isPending ? 0.6 : 1 }]}
                onPress={handleCreateRole}
                disabled={createRoleMutation.isPending}
              >
                {createRoleMutation.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Create Role</Text>
                )}
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
  headerSaveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  headerSaveBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
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
  shortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  shortcutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  shortcutBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
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
  permHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  savePermsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  savePermsBtnText: {
    color: '#ffffff',
    fontSize: 12,
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
  bottomSaveBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  bottomSaveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
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
