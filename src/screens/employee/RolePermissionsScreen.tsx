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
import { useProfile } from '../../api/hook/useAuth';
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
  category: string;
  description?: string;
}

const getCategoryForPermission = (perm: { name: string; module?: string | null }): string => {
  const mod = (perm.module || '').toLowerCase();
  const name = perm.name.toUpperCase();

  if (mod === 'employees' || name.includes('EMPLOYEE') || name.includes('DEPARTMENT') || name.includes('ORGANIZATION_CHART') || name.includes('EXIT_SETTLEMENT') || name.includes('BULK_IMPORTS')) return 'Employees';
  if (mod === 'attendance' || name.includes('ATTENDANCE') || name.includes('PUNCH') || name.includes('ROSTER') || name.includes('MUSTER')) return 'Attendance';
  if (mod === 'leave' || name.includes('LEAVE')) return 'Leave';
  if (mod === 'payroll' || name.includes('PAYROLL') || name.includes('SALARY') || name.includes('LOAN') || name.includes('PAYSLIP') || name.includes('INVESTMENT')) return 'Payroll';
  if (mod === 'performance' || name.includes('PERFORMANCE') || name.includes('KRA') || name.includes('GOAL') || name.includes('FEEDBACK') || name.includes('BELLCURVE')) return 'Performance';
  if (mod === 'claims' || name.includes('CLAIM') || name.includes('TRAVEL') || name.includes('EXPENSE')) return 'Claims';
  if (mod === 'timesheets' || name.includes('TIMESHEET') || name.includes('CLIENTS') || name.includes('PROJECTS')) return 'Timesheets';
  if (mod === 'recruitment' || name.includes('RECRUITMENT') || name.includes('CANDIDATE') || name.includes('JOB') || name.includes('ONBOARDING')) return 'Recruitment';
  if (mod === 'documents' || name.includes('DOCUMENT') || name.includes('VAULT')) return 'Documents';
  if (mod === 'assets' || name.includes('ASSET')) return 'Assets';
  if (mod === 'letters' || name.includes('LETTER')) return 'Letters';
  if (mod === 'helpdesk' || name.includes('HELPDESK') || name.includes('TICKET')) return 'Helpdesk';
  if (mod === 'engagement' || name.includes('ENGAGEMENT') || name.includes('SOCIAL') || name.includes('MOOD') || name.includes('SURVEY')) return 'Engagement';
  return 'Admin';
};

const formatPermissionName = (name: string, description?: string | null): string => {
  if (description && description.trim() && !description.toLowerCase().startsWith('permission for')) {
    return description.trim();
  }
  return name
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const fallbackPermissions: PermissionItem[] = [
  // Employees
  { id: 'VIEW_EMPLOYEES', name: 'View Employee Center', category: 'Employees' },
  { id: 'CREATE_EMPLOYEES', name: 'Create / Onboard Employees', category: 'Employees' },
  { id: 'UPDATE_EMPLOYEES', name: 'Update Employee Records', category: 'Employees' },
  { id: 'DELETE_EMPLOYEES', name: 'Delete / Archive Employees', category: 'Employees' },
  { id: 'VIEW_EMPLOYEE_DIRECTORY', name: 'View Employee Directory', category: 'Employees' },
  { id: 'VIEW_EMPLOYEE_MASTER', name: 'View Full Employee Master', category: 'Employees' },
  { id: 'UPDATE_EMPLOYEE_MASTER', name: 'Edit Employee Master Details', category: 'Employees' },
  { id: 'VIEW_ORGANIZATION_CHART', name: 'View Org Chart & Hierarchy', category: 'Employees' },
  { id: 'VIEW_EXIT_SETTLEMENT', name: 'View Resignations & F&F', category: 'Employees' },
  { id: 'UPDATE_EXIT_SETTLEMENT', name: 'Process Exit & Clearance', category: 'Employees' },
  { id: 'MANAGE_BULK_IMPORTS', name: 'Bulk Imports & Exports', category: 'Employees' },
  { id: 'VIEW_DEPARTMENTS', name: 'View Company Departments', category: 'Employees' },
  { id: 'UPDATE_DEPARTMENTS', name: 'Create & Manage Departments', category: 'Employees' },

  // Attendance
  { id: 'VIEW_ATTENDANCE', name: 'View Attendance Records', category: 'Attendance' },
  { id: 'VIEW_GPS_SELFIE_PUNCH', name: 'GPS & Selfie Punch Logs', category: 'Attendance' },
  { id: 'CREATE_GPS_SELFIE_PUNCH', name: 'Mark GPS / Selfie Punch', category: 'Attendance' },
  { id: 'VIEW_SHIFT_ROSTER', name: 'View Shift Rosters & Plans', category: 'Attendance' },
  { id: 'UPDATE_SHIFT_ROSTER', name: 'Assign Shift Rosters & Geofence', category: 'Attendance' },
  { id: 'VIEW_ATTENDANCE_REGULARIZATION', name: 'View Regularization Requests', category: 'Attendance' },
  { id: 'CREATE_ATTENDANCE_REGULARIZATION', name: 'Submit Attendance Regularization', category: 'Attendance' },
  { id: 'UPDATE_ATTENDANCE_REGULARIZATION', name: 'Approve Attendance Regularization', category: 'Attendance' },
  { id: 'VIEW_MUSTER_ROLL', name: 'View Muster Roll Calendar', category: 'Attendance' },
  { id: 'VIEW_ATTENDANCE_REPORTS', name: 'View Attendance Reports', category: 'Attendance' },

  // Leave
  { id: 'VIEW_LEAVE', name: 'View Leave Records', category: 'Leave' },
  { id: 'CREATE_LEAVE_APPLICATION', name: 'Apply for Leave / Time Off', category: 'Leave' },
  { id: 'VIEW_LEAVE_APPLICATION', name: 'View Leave Applications', category: 'Leave' },
  { id: 'UPDATE_LEAVE_APPROVAL', name: 'Approve / Reject Leaves', category: 'Leave' },
  { id: 'VIEW_LEAVE_CALENDAR', name: 'View Team Leave Calendar', category: 'Leave' },
  { id: 'VIEW_LEAVE_POLICIES', name: 'View Leave Policies & Balances', category: 'Leave' },
  { id: 'UPDATE_LEAVE_POLICIES', name: 'Manage Leave Policies & Quotas', category: 'Leave' },

  // Payroll
  { id: 'VIEW_PAYROLL', name: 'View Payroll Processing', category: 'Payroll' },
  { id: 'UPDATE_SALARY_PROCESSING', name: 'Process Monthly Payroll', category: 'Payroll' },
  { id: 'UPDATE_SALARY_STRUCTURE', name: 'Revise Salary CTC Structure', category: 'Payroll' },
  { id: 'VIEW_LOANS_ADVANCES', name: 'View Loans & Advances', category: 'Payroll' },
  { id: 'CREATE_LOANS_ADVANCES', name: 'Apply for Salary Loans / Advance', category: 'Payroll' },
  { id: 'UPDATE_LOANS_ADVANCES', name: 'Approve / Process Loans', category: 'Payroll' },
  { id: 'VIEW_INVESTMENT_DECLARATIONS', name: 'View Investment Declarations', category: 'Payroll' },
  { id: 'CREATE_INVESTMENT_DECLARATIONS', name: 'Submit Tax Declarations', category: 'Payroll' },
  { id: 'UPDATE_INVESTMENT_DECLARATIONS', name: 'Verify Tax Declarations', category: 'Payroll' },
  { id: 'VIEW_PAYSLIP_TEMPLATES', name: 'View Payslips & Templates', category: 'Payroll' },
  { id: 'VIEW_PAYROLL_REPORTS', name: 'View Payroll & Statutory Reports', category: 'Payroll' },

  // Performance
  { id: 'VIEW_PERFORMANCE', name: 'View Performance Management', category: 'Performance' },
  { id: 'VIEW_KRA_GOALS', name: 'View KRAs & Goal Sheets', category: 'Performance' },
  { id: 'CREATE_KRA_GOALS', name: 'Create Goals & KRAs', category: 'Performance' },
  { id: 'UPDATE_KRA_GOALS', name: 'Evaluate & Score Appraisals', category: 'Performance' },
  { id: 'VIEW_FEEDBACK_360', name: 'View 360 Feedback Requests', category: 'Performance' },
  { id: 'CREATE_FEEDBACK_360', name: 'Submit 360 Peer Feedback', category: 'Performance' },
  { id: 'VIEW_BELLCURVE_ANALYTICS', name: 'View Bell Curve Analytics', category: 'Performance' },

  // Claims & Expenses
  { id: 'VIEW_CLAIMS', name: 'View Travel & Claims', category: 'Claims' },
  { id: 'CREATE_TRAVEL_REQUEST', name: 'Submit New Travel Request', category: 'Claims' },
  { id: 'VIEW_TRAVEL_REQUEST', name: 'View Travel Request History', category: 'Claims' },
  { id: 'CREATE_EXPENSE_REIMBURSEMENT', name: 'Submit Expense Reimbursement', category: 'Claims' },
  { id: 'VIEW_EXPENSE_REIMBURSEMENT', name: 'View Expense Claims', category: 'Claims' },
  { id: 'UPDATE_CLAIM_APPROVAL', name: 'Approve Reimbursement Claims', category: 'Claims' },

  // Timesheets
  { id: 'VIEW_TIMESHEETS', name: 'View Timesheets', category: 'Timesheets' },
  { id: 'CREATE_TIMESHEET_ENTRY', name: 'Log Timesheet Hours', category: 'Timesheets' },
  { id: 'VIEW_TIMESHEET_ENTRY', name: 'View Logged Timesheets', category: 'Timesheets' },
  { id: 'VIEW_CLIENTS_PROJECTS', name: 'View Clients & Projects', category: 'Timesheets' },
  { id: 'UPDATE_CLIENTS_PROJECTS', name: 'Create & Manage Projects', category: 'Timesheets' },

  // Recruitment
  { id: 'VIEW_RECRUITMENT', name: 'View Recruitment & ATS', category: 'Recruitment' },
  { id: 'VIEW_JOB_REQUISITIONS', name: 'View Job Vacancies & Requisitions', category: 'Recruitment' },
  { id: 'CREATE_JOB_REQUISITIONS', name: 'Post New Job Vacancies', category: 'Recruitment' },
  { id: 'VIEW_CANDIDATE_PIPELINE', name: 'View Candidate Pipeline', category: 'Recruitment' },
  { id: 'UPDATE_CANDIDATE_PIPELINE', name: 'Update Candidate Stage / Interviews', category: 'Recruitment' },
  { id: 'VIEW_PRE_ONBOARDING', name: 'View Pre-Onboarding Checklists', category: 'Recruitment' },
  { id: 'UPDATE_PRE_ONBOARDING', name: 'Process Onboarding Checklists', category: 'Recruitment' },

  // Documents
  { id: 'VIEW_DOCUMENTS', name: 'View Document Vault', category: 'Documents' },
  { id: 'VIEW_DOCUMENT_VAULT', name: 'Access Stored Company Documents', category: 'Documents' },
  { id: 'CREATE_DOCUMENT_VAULT', name: 'Upload & Share Vault Documents', category: 'Documents' },

  // Assets
  { id: 'VIEW_ASSETS', name: 'View Asset Management', category: 'Assets' },
  { id: 'VIEW_ASSET_MANAGEMENT', name: 'View Company Asset Registry', category: 'Assets' },
  { id: 'UPDATE_ASSET_MANAGEMENT', name: 'Allocate & Return Hardware Assets', category: 'Assets' },

  // Letters
  { id: 'VIEW_LETTERS', name: 'View Letter Generator', category: 'Letters' },
  { id: 'VIEW_LETTER_GENERATOR', name: 'View Issued Corporate Letters', category: 'Letters' },
  { id: 'CREATE_LETTER_GENERATOR', name: 'Generate Experience & Offer Letters', category: 'Letters' },

  // Helpdesk
  { id: 'VIEW_HELPDESK', name: 'View HR Help Desk', category: 'Helpdesk' },
  { id: 'CREATE_HR_HELPDESK_TICKET', name: 'Raise Support Tickets', category: 'Helpdesk' },
  { id: 'VIEW_HR_HELPDESK_TICKETS', name: 'View Ticket Queue', category: 'Helpdesk' },
  { id: 'UPDATE_HR_HELPDESK_TICKET', name: 'Resolve & Assign Helpdesk Tickets', category: 'Helpdesk' },

  // Engagement
  { id: 'VIEW_ENGAGEMENT', name: 'View Engagement & Surveys', category: 'Engagement' },
  { id: 'VIEW_SOCIAL_FEED', name: 'View Social Feed Posts', category: 'Engagement' },
  { id: 'CREATE_SOCIAL_POST', name: 'Post, Like & Comment on Feed', category: 'Engagement' },
  { id: 'VIEW_MOOD_ANALYSIS', name: 'View Team Mood Analytics', category: 'Engagement' },
  { id: 'VIEW_SURVEYS', name: 'Participate in Surveys', category: 'Engagement' },
  { id: 'CREATE_SURVEYS', name: 'Create & Publish New Surveys', category: 'Engagement' },

  // Admin
  { id: 'VIEW_ADMIN', name: 'View System Administration', category: 'Admin' },
  { id: 'VIEW_ROLES_PERMISSIONS', name: 'View Roles & Access Matrix', category: 'Admin' },
  { id: 'UPDATE_ROLES_PERMISSIONS', name: 'Manage & Assign Role Permissions', category: 'Admin' },
  { id: 'MANAGE_SYSTEM_SETTINGS', name: 'Manage System & Tenant Configurations', category: 'Admin' },
];

export const RolePermissionsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  // API Hooks
  const { data: profileResponse } = useProfile();
  const organizationId = profileResponse?.data?.user?.organizationId;
  const { data: rolesResponse, isLoading: isLoadingRoles } = useRoles(organizationId);
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

  // Full System Permissions List (Merged dynamically with DB permissions)
  const permissions: PermissionItem[] = React.useMemo(() => {
    const list: PermissionItem[] = [];
    const seenNames = new Set<string>();

    if (apiPermissions && apiPermissions.length > 0) {
      apiPermissions.forEach((dbPerm: any) => {
        if (!seenNames.has(dbPerm.name)) {
          seenNames.add(dbPerm.name);
          const cat = getCategoryForPermission(dbPerm);
          const name = formatPermissionName(dbPerm.name, dbPerm.description);
          list.push({
            id: dbPerm.name,
            name: name,
            category: cat,
            description: dbPerm.description || undefined,
          });
        }
      });
    }

    // Ensure all comprehensive fallback items are also represented
    fallbackPermissions.forEach(fb => {
      if (!seenNames.has(fb.id)) {
        seenNames.add(fb.id);
        list.push(fb);
      }
    });

    return list;
  }, [apiPermissions]);

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

  const categories = [
    'ALL',
    'Employees',
    'Attendance',
    'Leave',
    'Payroll',
    'Performance',
    'Claims',
    'Timesheets',
    'Recruitment',
    'Documents',
    'Assets',
    'Letters',
    'Helpdesk',
    'Engagement',
    'Admin',
  ];

  const filteredPermissions = permissions.filter(
    p => activeCategory === 'ALL' || p.category === activeCategory
  );

  const allCurrentCategorySelected =
    filteredPermissions.length > 0 &&
    filteredPermissions.every(perm => {
      const roleName = activeRole?.name || 'DefaultRole';
      if (roleName === 'SUPER_ADMIN' || roleName === 'Super Admin') return true;
      const targetDbPerm = apiPermissions.find(p => p.name === perm.id || p.id === perm.id);
      return (
        selectedPermissionIds.includes(perm.id) ||
        (targetDbPerm ? selectedPermissionIds.includes(targetDbPerm.id) || selectedPermissionIds.includes(targetDbPerm.name) : false)
      );
    });

  const handleToggleAllCategory = () => {
    if (allCurrentCategorySelected) {
      const toRemove = new Set<string>();
      filteredPermissions.forEach(p => {
        toRemove.add(p.id);
        const targetDbPerm = apiPermissions.find(db => db.name === p.id || db.id === p.id);
        if (targetDbPerm) {
          toRemove.add(targetDbPerm.id);
          toRemove.add(targetDbPerm.name);
        }
      });
      setSelectedPermissionIds(prev => prev.filter(id => !toRemove.has(id)));
    } else {
      const toAdd: string[] = [];
      filteredPermissions.forEach(p => {
        toAdd.push(p.id);
        const targetDbPerm = apiPermissions.find(db => db.name === p.id || db.id === p.id);
        if (targetDbPerm) {
          toAdd.push(targetDbPerm.id);
          toAdd.push(targetDbPerm.name);
        }
      });
      setSelectedPermissionIds(prev => Array.from(new Set([...prev, ...toAdd])));
    }
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

        {/* Category Summary & Quick Toggle All Action */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 2 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>
            {filteredPermissions.length} permissions in {activeCategory}
          </Text>
          {filteredPermissions.length > 0 && activeRole?.name !== 'SUPER_ADMIN' && activeRole?.name !== 'Super Admin' && (
            <TouchableOpacity onPress={handleToggleAllCategory}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.accent }}>
                {allCurrentCategorySelected ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

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
