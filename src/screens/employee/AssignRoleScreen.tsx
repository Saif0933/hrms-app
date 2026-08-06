import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Employee, useEmployees } from '../../api/hook/useEmployee';
import { Role, useAssignRole, useRoles } from '../../api/hook/useRole';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AssignRole'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'AssignRole'>;

export const AssignRoleScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { colors } = useTheme();

  // Route Params
  const initialEmpId = route.params?.employeeId || '';

  // API Hooks
  const { data: response, isLoading: isLoadingEmployees, refetch: refetchEmployees } = useEmployees();
  const { data: rolesResponse, isLoading: isLoadingRoles } = useRoles();
  const assignRoleMutation = useAssignRole();

  const rawEmpData: any = response?.data;
  const fetchedEmployees: Employee[] = Array.isArray(rawEmpData)
    ? rawEmpData
    : Array.isArray(rawEmpData?.data)
    ? rawEmpData.data
    : Array.isArray(rawEmpData?.employees)
    ? rawEmpData.employees
    : Array.isArray(response)
    ? (response as any)
    : [];

  const employees: Employee[] = fetchedEmployees;
  const displayRoles: Role[] = rolesResponse?.data || [];

  // Selection States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState<string>(initialEmpId);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [userRolesMap, setUserRolesMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialEmpId && employees.length > 0) {
      setSelectedEmpId(initialEmpId);
    }
  }, [initialEmpId, employees]);

  // Filter employees based on search query
  const filteredEmployees = employees.filter(emp => {
    const q = searchQuery.toLowerCase();
    const nameMatch = emp.name ? emp.name.toLowerCase().includes(q) : false;
    const emailMatch = emp.email ? emp.email.toLowerCase().includes(q) : false;
    const deptName = typeof emp.department === 'object' && emp.department?.name ? emp.department.name : (typeof emp.department === 'string' ? emp.department : '');
    const deptMatch = deptName ? deptName.toLowerCase().includes(q) : false;
    const idMatch = emp.id ? emp.id.toLowerCase().includes(q) : false;
    return nameMatch || emailMatch || deptMatch || idMatch;
  });

  const selectedEmployee = employees.find(e => e.id === selectedEmpId);
  const selectedRoleObj = displayRoles.find(r => r.id === selectedRoleId);

  const handleAssignRole = () => {
    if (!selectedEmpId) {
      Alert.alert('Validation Error', 'Please select an employee to assign a role profile.');
      return;
    }

    if (!selectedRoleId) {
      Alert.alert('Validation Error', 'Please select a system role profile to assign.');
      return;
    }

    if (!selectedEmployee) {
      Alert.alert('Validation Error', 'Selected employee standard record not found.');
      return;
    }

    const userIdentifier = selectedEmployee.userId || selectedEmployee.email || selectedEmployee.phone || selectedEmployee.id;
    const roleName = selectedRoleObj?.name || 'Assigned Role';

    assignRoleMutation.mutate(
      {
        userId: userIdentifier,
        roleId: selectedRoleId,
      },
      {
        onSuccess: () => {
          setUserRolesMap(prev => ({
            ...prev,
            [selectedEmpId]: roleName,
          }));
          refetchEmployees();
          Alert.alert(
            'Role Assigned Successfully! 👤',
            `Successfully assigned role profile "${roleName}" to ${selectedEmployee.name}.`
          );
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || 'Failed to assign role to employee.';
          Alert.alert('Error', msg);
        },
      }
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Assign Role to Employee</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Map System Access Profiles to Individual Employees
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.roleMatrixBtn, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('RolePermissions')}
          activeOpacity={0.8}
        >
          <Text style={styles.roleMatrixBtnText}>Permissions Matrix →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step 1: Select Employee */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Select Employee</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Choose an employee from your organization directory
              </Text>
            </View>
          </View>

          {/* Search Box */}
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder },
            ]}
          >
            <Text style={[styles.searchIcon, { color: colors.textMuted }]}>🔍</Text>
            <TextInput
              style={[styles.searchInput, { color: colors.inputText }]}
              placeholder="Search by name, email, dept, ID..."
              placeholderTextColor={colors.inputPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={{ color: colors.textMuted, fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoadingEmployees ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 16 }} />
          ) : filteredEmployees.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No employees match your search criteria.
            </Text>
          ) : (
            <View style={styles.employeeList}>
              {filteredEmployees.slice(0, 15).map(emp => {
                const isSelected = selectedEmpId === emp.id;
                const assignedRoleName =
                  userRolesMap[emp.id] ||
                  emp.user?.role?.name ||
                  (typeof emp.role === 'object' && (emp.role as any)?.name
                    ? (emp.role as any).name
                    : typeof emp.role === 'string'
                    ? emp.role
                    : 'Employee');

                const deptDisplayName =
                  typeof emp.department === 'object' && emp.department?.name
                    ? emp.department.name
                    : typeof emp.department === 'string'
                    ? emp.department
                    : 'General';

                return (
                  <TouchableOpacity
                    key={emp.id}
                    style={[
                      styles.empItemCard,
                      {
                        backgroundColor: isSelected ? `${colors.accent}15` : colors.background,
                        borderColor: isSelected ? colors.accent : colors.cardBorder,
                      },
                    ]}
                    onPress={() => setSelectedEmpId(emp.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.empAvatarContainer}>
                      <View style={[styles.empAvatar, { backgroundColor: isSelected ? colors.accent : colors.cardBorder }]}>
                        <Text style={[styles.empAvatarText, { color: isSelected ? '#ffffff' : colors.textPrimary }]}>
                          {emp.name ? emp.name.charAt(0).toUpperCase() : 'E'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.empInfo}>
                      <Text style={[styles.empName, { color: colors.textPrimary }]}>{emp.name}</Text>
                      <Text style={[styles.empSubText, { color: colors.textSecondary }]}>
                        {emp.designation || 'Staff'} • {deptDisplayName}
                      </Text>
                      {emp.email ? (
                        <Text style={[styles.empSubText, { color: colors.textMuted }]}>{emp.email}</Text>
                      ) : null}
                    </View>

                    <View style={styles.roleBadgeContainer}>
                      <View style={[styles.roleBadge, { backgroundColor: `${colors.accent}20` }]}>
                        <Text style={[styles.roleBadgeText, { color: colors.accent }]}>
                          {assignedRoleName}
                        </Text>
                      </View>
                      <View style={styles.radioButton}>
                        <View
                          style={[
                            styles.radioOuter,
                            { borderColor: isSelected ? colors.accent : colors.textMuted },
                          ]}
                        >
                          {isSelected && <View style={[styles.radioInner, { backgroundColor: colors.accent }]} />}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Step 2: Select Role Profile */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.stepHeader}>
            <View style={[styles.stepBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Choose Role Profile</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Select system role profile with defined permission privileges
              </Text>
            </View>
          </View>

          {isLoadingRoles ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 16 }} />
          ) : (
            <View style={styles.roleGrid}>
              {displayRoles.map(role => {
                const isSelected = selectedRoleId === role.id;
                return (
                  <TouchableOpacity
                    key={role.id}
                    style={[
                      styles.roleCard,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.background,
                        borderColor: isSelected ? colors.accent : colors.cardBorder,
                      },
                    ]}
                    onPress={() => setSelectedRoleId(role.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.roleCardHeader}>
                      <Text style={[styles.roleCardIcon]}>
                        {role.name.includes('ADMIN') ? '👑' : role.name.includes('HR') ? '👔' : role.name.includes('Payroll') ? '💰' : role.name.includes('Manager') ? '💼' : '👤'}
                      </Text>
                      <Text
                        style={[
                          styles.roleCardTitle,
                          { color: isSelected ? '#ffffff' : colors.textPrimary },
                        ]}
                      >
                        {role.name}
                      </Text>
                    </View>

                    {role.description ? (
                      <Text
                        style={[
                          styles.roleCardDesc,
                          { color: isSelected ? 'rgba(255,255,255,0.85)' : colors.textSecondary },
                        ]}
                        numberOfLines={2}
                      >
                        {role.description}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Step 3: Review & Submit */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>Assignment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Selected Employee:</Text>
            <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
              {selectedEmployee ? selectedEmployee.name : 'None Selected'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Target Role Profile:</Text>
            <Text style={[styles.summaryValue, { color: colors.accent, fontWeight: '700' }]}>
              {selectedRoleObj ? selectedRoleObj.name : 'None Selected'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              {
                backgroundColor: colors.accent,
                opacity: assignRoleMutation.isPending || !selectedEmpId || !selectedRoleId ? 0.6 : 1,
              },
            ]}
            onPress={handleAssignRole}
            disabled={assignRoleMutation.isPending || !selectedEmpId || !selectedRoleId}
            activeOpacity={0.85}
          >
            {assignRoleMutation.isPending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>Assign Role Profile to Employee</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  roleMatrixBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 6,
  },
  roleMatrixBtnText: {
    color: '#ffffff',
    fontSize: 11,
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
    marginBottom: 16,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginBottom: 12,
    height: 42,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 16,
    fontStyle: 'italic',
  },
  employeeList: {
    gap: 8,
  },
  empItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  empAvatarContainer: {
    marginRight: 12,
  },
  empAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empAvatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  empInfo: {
    flex: 1,
  },
  empName: {
    fontSize: 14,
    fontWeight: '700',
  },
  empSubText: {
    fontSize: 11,
    marginTop: 2,
  },
  roleBadgeContainer: {
    alignItems: 'flex-end',
    gap: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  radioButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  roleGrid: {
    gap: 10,
  },
  roleCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  roleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleCardIcon: {
    fontSize: 18,
  },
  roleCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  roleCardDesc: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  summaryCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginTop: 4,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
