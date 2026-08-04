import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { useEmployees } from '../../api/hook/useEmployee';
import {
  useAllocateLeave,
  useCreateLeaveType,
  useDeleteLeaveType,
  useLeaveTypes
} from '../../api/hook/useLeave';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'LeaveConfigurations'>;

export const LeaveConfigurationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  // Create Type Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [typeName, setTypeName] = useState('');
  const [typeCode, setTypeCode] = useState('');
  const [description, setDescription] = useState('');
  const [defaultDays, setDefaultDays] = useState('12');
  const [carryForward, setCarryForward] = useState(true);
  const [maxCarryForward, setMaxCarryForward] = useState('15');

  // Allocate Quota Modal State
  const [allocModalOpen, setAllocModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState('');
  const [allocatedDays, setAllocatedDays] = useState('12');

  // TanStack Queries & Mutations
  const { data: typesRes, isLoading: isLoadingTypes } = useLeaveTypes();
  const { data: empRes } = useEmployees();
  const createTypeMutation = useCreateLeaveType();
  const deleteTypeMutation = useDeleteLeaveType();
  const allocateMutation = useAllocateLeave();

  const leaveTypes = typesRes?.data || [
    { id: 'LT001', name: 'Casual Leave', code: 'CL', defaultDays: 12, carryForward: false, isActive: true, createdAt: '', updatedAt: '' },
    { id: 'LT002', name: 'Sick Leave', code: 'SL', defaultDays: 10, carryForward: false, isActive: true, createdAt: '', updatedAt: '' },
    { id: 'LT003', name: 'Privilege Leave', code: 'PL', defaultDays: 15, carryForward: true, maxCarryForward: 30, isActive: true, createdAt: '', updatedAt: '' },
  ];

  const employees = empRes?.data || [];

  const handleCreateLeaveType = () => {
    if (!typeName.trim() || !typeCode.trim()) {
      Alert.alert('Validation Error', 'Leave Name and Code are required.');
      return;
    }

    createTypeMutation.mutate(
      {
        name: typeName.trim(),
        code: typeCode.trim().toUpperCase(),
        description: description.trim(),
        defaultDays: parseInt(defaultDays, 10) || 12,
        carryForward,
        maxCarryForward: carryForward ? parseInt(maxCarryForward, 10) || 15 : 0,
        isActive: true,
      },
      {
        onSuccess: () => {
          setCreateModalOpen(false);
          setTypeName('');
          setTypeCode('');
          setDescription('');
          Alert.alert('Leave Type Created ⚙️', `New leave category "${typeName}" configured successfully.`);
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const handleDeleteType = (id: string, name: string) => {
    Alert.alert('Confirm Delete', `Remove leave configuration for "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTypeMutation.mutate(id, {
            onSuccess: () => Alert.alert('Deleted', 'Leave configuration deleted.'),
          });
        },
      },
    ]);
  };

  const handleAllocateLeaveQuota = () => {
    const empId = selectedEmpId || employees[0]?.id;
    const typeId = selectedLeaveTypeId || leaveTypes[0]?.id;

    if (!empId || !typeId) {
      Alert.alert('Error', 'Employee and Leave Type selection are required.');
      return;
    }

    allocateMutation.mutate(
      {
        employeeId: empId,
        leaveTypeId: typeId,
        year: 2026,
        allocated: parseInt(allocatedDays, 10) || 12,
        carriedForward: 0,
      },
      {
        onSuccess: () => {
          setAllocModalOpen(false);
          Alert.alert('Quota Allocated 🎯', 'Employee leave quota allocated for 2026.');
        },
        onError: err => Alert.alert('Error', err.message),
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Leave Configurations
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Leave Types Master & Quota Allocation Settings
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addTopBtn, { backgroundColor: colors.accent }]}
          onPress={() => setCreateModalOpen(true)}
        >
          <Text style={styles.addTopBtnText}>+ Add Type</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick Action: Allocate Leave Quota to User */}
        <TouchableOpacity
          style={[styles.allocCardBtn, { backgroundColor: colors.accent }]}
          onPress={() => setAllocModalOpen(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.allocCardBtnText}>🎯 Allocate Leave Quota to Employee</Text>
        </TouchableOpacity>

        {/* Master Leave Types List */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Master Leave Categories ({leaveTypes.length})
        </Text>

        {isLoadingTypes ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          leaveTypes.map(lt => (
            <View
              key={lt.id}
              style={[
                styles.card,
                { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.typeName, { color: colors.textPrimary }]}>
                    {lt.name} ({lt.code})
                  </Text>
                  <Text style={[styles.typeSub, { color: colors.textSecondary }]}>
                    Default Entitlement: {lt.defaultDays} Days / Year
                  </Text>
                </View>

                <View
                  style={[
                    styles.cfPill,
                    { backgroundColor: lt.carryForward ? '#10b98120' : 'rgba(100,100,100,0.1)' },
                  ]}
                >
                  <Text
                    style={{
                      color: lt.carryForward ? '#10b981' : colors.textSecondary,
                      fontWeight: '700',
                      fontSize: 10,
                    }}
                  >
                    {lt.carryForward ? `Carry Forward (${lt.maxCarryForward || 'Unlimited'})` : 'No Carry Forward'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteType(lt.id, lt.name)}
              >
                <Text style={styles.deleteBtnText}>🗑️ Delete Configuration</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Leave Type Modal */}
      <Modal visible={createModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Create New Leave Category
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>LEAVE TYPE NAME *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={typeName}
              onChangeText={setTypeName}
              placeholder="e.g. Sabbatical Leave"
              placeholderTextColor={colors.inputPlaceholder}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SHORT CODE *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={typeCode}
              onChangeText={setTypeCode}
              placeholder="e.g. SAB"
              placeholderTextColor={colors.inputPlaceholder}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DESCRIPTION / RULES</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.inputBorder,
                  color: colors.inputText,
                  minHeight: 60,
                },
              ]}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              placeholder="Specify leave eligibility, rules & description..."
              placeholderTextColor={colors.inputPlaceholder}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DEFAULT ANNUAL DAYS *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={defaultDays}
              onChangeText={setDefaultDays}
              keyboardType="numeric"
            />

            <View style={styles.switchRow}>
              <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13 }}>
                Allow Carry Forward to Next Year
              </Text>
              <Switch value={carryForward} onValueChange={setCarryForward} thumbColor={carryForward ? colors.accent : '#94a3b8'} />
            </View>

            {carryForward && (
              <>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>MAX CARRY FORWARD DAYS</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                  value={maxCarryForward}
                  onChangeText={setMaxCarryForward}
                  keyboardType="numeric"
                />
              </>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setCreateModalOpen(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.accent }]}
                onPress={handleCreateLeaveType}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Save Leave Type</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Allocate Quota Modal */}
      <Modal visible={allocModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Allocate Leave Quota to Employee
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SELECT EMPLOYEE *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {employees.map(emp => {
                const isSelected = (selectedEmpId || employees[0]?.id) === emp.id;
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
                    <Text style={{ color: isSelected ? '#fff' : colors.textPrimary, fontSize: 11, fontWeight: '600' }}>
                      {emp.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SELECT LEAVE TYPE *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {leaveTypes.map(lt => {
                const isSelected = (selectedLeaveTypeId || leaveTypes[0]?.id) === lt.id;
                return (
                  <TouchableOpacity
                    key={lt.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.background,
                        borderColor: isSelected ? colors.accent : colors.cardBorder,
                      },
                    ]}
                    onPress={() => setSelectedLeaveTypeId(lt.id)}
                  >
                    <Text style={{ color: isSelected ? '#fff' : colors.textPrimary, fontSize: 11, fontWeight: '600' }}>
                      {lt.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DAYS TO ALLOCATE *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={allocatedDays}
              onChangeText={setAllocatedDays}
              keyboardType="numeric"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setAllocModalOpen(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.accent }]}
                onPress={handleAllocateLeaveQuota}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Allocate Quota</Text>
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
    fontSize: 11,
    marginTop: 1,
  },
  addTopBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addTopBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  allocCardBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  allocCardBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeName: {
    fontSize: 15,
    fontWeight: '700',
  },
  typeSub: {
    fontSize: 11,
    marginTop: 2,
  },
  cfPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  deleteBtn: {
    alignSelf: 'flex-end',
  },
  deleteBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
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
    gap: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});
