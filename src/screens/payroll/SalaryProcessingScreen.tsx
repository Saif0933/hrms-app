import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  PayrollRun,
  useCalculateArrears,
  usePayrollCycle,
  useToggleStopPayment,
  useUpdateCycleStatus,
} from '../../api/hook/usePayroll';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SalaryProcessing'>;

export const SalaryProcessingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [month, setMonth] = useState('July');
  const [year, setYear] = useState(2026);

  // Hold Payment Modal State
  const [holdModalOpen, setHoldModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedEmpName, setSelectedEmpName] = useState('');
  const [holdReason, setHoldReason] = useState('Pending clearance / incomplete attendance logs');

  // TanStack Queries & Mutations
  const { data: cycleRes, isLoading } = usePayrollCycle(month, year);
  const updateStatusMutation = useUpdateCycleStatus();
  const calculateArrearsMutation = useCalculateArrears();
  const toggleHoldMutation = useToggleStopPayment();

  const cycleDetails = cycleRes?.data;
  const cycle = cycleDetails?.cycle || {
    id: 'CYCLE001',
    month: 'July',
    year: 2026,
    status: 'PROCESSING_SALARIES' as const,
    createdAt: '',
    updatedAt: '',
  };

  const runs: PayrollRun[] = cycleDetails?.runs || [
    {
      id: 'RUN01',
      employeeId: 'EMP001',
      cycleId: 'CYCLE001',
      basic: 45000,
      hra: 18000,
      allowance: 12000,
      pf: 1800,
      pt: 200,
      tds: 2500,
      bonus: 5000,
      arrear: 0,
      deductions: 4500,
      netSalary: 70500,
      status: 'PENDING',
      createdAt: '',
      updatedAt: '',
      employee: {
        id: 'EMP001',
        name: 'Aarav Sharma',
        email: 'aarav@symbosys.com',
        designation: 'Senior Software Engineer',
        department: { id: 'D1', name: 'Engineering' },
      },
    },
    {
      id: 'RUN02',
      employeeId: 'EMP002',
      cycleId: 'CYCLE001',
      basic: 38000,
      hra: 15200,
      allowance: 8000,
      pf: 1800,
      pt: 200,
      tds: 1500,
      bonus: 0,
      arrear: 1200,
      deductions: 3500,
      netSalary: 57700,
      status: 'PENDING',
      createdAt: '',
      updatedAt: '',
      employee: {
        id: 'EMP002',
        name: 'Neha Patel',
        email: 'neha@symbosys.com',
        designation: 'HR Specialist',
        department: { id: 'D2', name: 'Human Resources' },
      },
    },
    {
      id: 'RUN03',
      employeeId: 'EMP003',
      cycleId: 'CYCLE001',
      basic: 55000,
      hra: 22000,
      allowance: 15000,
      pf: 1800,
      pt: 200,
      tds: 4500,
      bonus: 10000,
      arrear: 0,
      deductions: 6500,
      netSalary: 90500,
      status: 'HELD',
      createdAt: '',
      updatedAt: '',
      employee: {
        id: 'EMP003',
        name: 'Vikram Malhotra',
        email: 'vikram@symbosys.com',
        designation: 'Tech Lead',
        department: { id: 'D1', name: 'Engineering' },
      },
    },
  ];

  const totalGross = runs.reduce((acc, r) => acc + r.basic + r.hra + r.allowance + r.bonus + r.arrear, 0);
  const totalNet = runs.reduce((acc, r) => acc + r.netSalary, 0);

  const handleUpdateStatus = (nextStatus: string) => {
    updateStatusMutation.mutate(
      { id: cycle.id, status: nextStatus },
      {
        onSuccess: () => {
          Alert.alert('Status Updated 💳', `Payroll Cycle stage advanced to ${nextStatus}`);
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const handleCalculateArrears = () => {
    calculateArrearsMutation.mutate(cycle.id, {
      onSuccess: () => {
        Alert.alert('Arrears Computed 🧮', 'Arrears & back-pay calculations completed for active roster.');
      },
      onError: err => Alert.alert('Error', err.message),
    });
  };

  const handleOpenHoldModal = (empId: string, name?: string) => {
    setSelectedEmpId(empId);
    setSelectedEmpName(name || 'Employee');
    setHoldReason('Pending clearance / attendance audit');
    setHoldModalOpen(true);
  };

  const handleConfirmToggleHold = () => {
    if (!selectedEmpId) return;

    toggleHoldMutation.mutate(
      { cycleId: cycle.id, employeeId: selectedEmpId, reason: holdReason },
      {
        onSuccess: () => {
          setHoldModalOpen(false);
          Alert.alert('Payment Status Toggled 🛑', `Hold / Stop Payment updated for ${selectedEmpName}.`);
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const getStatusPill = (st: string) => {
    switch (st) {
      case 'PAID':
      case 'DISBURSED':
        return { bg: '#10b98120', text: '#10b981' };
      case 'HELD':
      case 'STOPPED':
        return { bg: '#ef444420', text: '#ef4444' };
      case 'PROCESSING_SALARIES':
      case 'PENDING':
      default:
        return { bg: '#3b82f620', text: '#3b82f6' };
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Salary Processing Cycle
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Monthly Payroll Runs & Disburse Management
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Month Selector Bar */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            🗓️ Select Payroll Month & Year
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {['May', 'June', 'July', 'August'].map(mth => {
              const isSelected = month === mth;
              return (
                <TouchableOpacity
                  key={mth}
                  style={[
                    styles.monthChip,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.background,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setMonth(mth)}
                >
                  <Text
                    style={{
                      color: isSelected ? '#fff' : colors.textPrimary,
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {mth} {year}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Cycle Stage Progress Stepper */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.stepperHeaderRow}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              ⚡ Cycle Stage Status
            </Text>
            <View style={[styles.statusPill, { backgroundColor: getStatusPill(cycle.status).bg }]}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: getStatusPill(cycle.status).text }}>
                {cycle.status}
              </Text>
            </View>
          </View>

          <View style={styles.stepperTrack}>
            <View
              style={[
                styles.stepItem,
                cycle.status === 'PENDING_ATTENDANCE_LOCK' && styles.stepActive,
              ]}
            >
              <Text style={styles.stepNum}>1</Text>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>Lock Attendance</Text>
            </View>

            <View
              style={[
                styles.stepItem,
                cycle.status === 'PROCESSING_SALARIES' && styles.stepActive,
              ]}
            >
              <Text style={styles.stepNum}>2</Text>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>Process Salaries</Text>
            </View>

            <View style={[styles.stepItem, cycle.status === 'DISBURSED' && styles.stepActive]}>
              <Text style={styles.stepNum}>3</Text>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>Disburse Pay</Text>
            </View>
          </View>

          {/* Advance Cycle Stage Actions */}
          <View style={styles.cycleActionsRow}>
            <TouchableOpacity
              style={[styles.cycleBtn, { backgroundColor: colors.accent }]}
              onPress={handleCalculateArrears}
            >
              <Text style={styles.cycleBtnText}>🧮 Compute Arrears</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cycleBtn, { backgroundColor: '#10b981' }]}
              onPress={() => handleUpdateStatus('DISBURSED')}
            >
              <Text style={styles.cycleBtnText}>💸 Disburse All Salaries</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
            <Text style={[styles.statVal, { color: '#3b82f6' }]}>
              ₹ {(totalGross / 1000).toFixed(1)}k
            </Text>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Total Gross Payroll</Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
            <Text style={[styles.statVal, { color: '#10b981' }]}>
              ₹ {(totalNet / 1000).toFixed(1)}k
            </Text>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Total Net Payout</Text>
          </View>
        </View>

        {/* Employee Salary Runs Roster */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Employee Salary Breakdown ({runs.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          runs.map(run => {
            const pill = getStatusPill(run.status);

            return (
              <View
                key={run.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.runHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.empName, { color: colors.textPrimary }]}>
                      {run.employee?.name || 'Employee'}
                    </Text>
                    <Text style={[styles.empSub, { color: colors.textSecondary }]}>
                      {run.employee?.designation || 'Staff'} • {run.employee?.department?.name || 'Engineering'}
                    </Text>
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: pill.text }}>
                      {run.status}
                    </Text>
                  </View>
                </View>

                {/* Earnings & Deductions Breakdown */}
                <View style={[styles.breakdownGrid, { backgroundColor: colors.background }]}>
                  <View style={styles.breakCol}>
                    <Text style={[styles.breakLabel, { color: colors.textSecondary }]}>Basic Salary</Text>
                    <Text style={[styles.breakVal, { color: colors.textPrimary }]}>₹ {run.basic.toLocaleString()}</Text>
                  </View>
                  <View style={styles.breakCol}>
                    <Text style={[styles.breakLabel, { color: colors.textSecondary }]}>HRA</Text>
                    <Text style={[styles.breakVal, { color: colors.textPrimary }]}>₹ {run.hra.toLocaleString()}</Text>
                  </View>
                  <View style={styles.breakCol}>
                    <Text style={[styles.breakLabel, { color: colors.textSecondary }]}>PF Deduction</Text>
                    <Text style={[styles.breakVal, { color: '#ef4444' }]}>- ₹ {run.pf.toLocaleString()}</Text>
                  </View>
                  <View style={styles.breakCol}>
                    <Text style={[styles.breakLabel, { color: colors.textSecondary }]}>Net Payable</Text>
                    <Text style={[styles.breakVal, { color: '#10b981', fontWeight: '900' }]}>₹ {run.netSalary.toLocaleString()}</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.runActionsRow}>
                  <TouchableOpacity
                    style={[styles.holdBtn, { borderColor: '#ef4444' }]}
                    onPress={() => handleOpenHoldModal(run.employeeId, run.employee?.name)}
                  >
                    <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '700' }}>
                      {run.status === 'HELD' ? 'Unhold Payment ✅' : 'Stop / Hold Payment 🛑'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Stop / Hold Payment Modal */}
      <Modal visible={holdModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Stop / Hold Salary Payment
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {selectedEmpName}
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>REASON FOR HOLD</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={holdReason}
              onChangeText={setHoldReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setHoldModalOpen(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: '#ef4444' }]}
                onPress={handleConfirmToggleHold}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Toggle Hold</Text>
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
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  monthChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  stepperHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stepperTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
    opacity: 0.5,
  },
  stepActive: {
    opacity: 1,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 4,
  },
  stepText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cycleActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cycleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cycleBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  statVal: {
    fontSize: 22,
    fontWeight: '900',
  },
  statLbl: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  runHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  empName: {
    fontSize: 15,
    fontWeight: '700',
  },
  empSub: {
    fontSize: 11,
    marginTop: 2,
  },
  breakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  breakCol: {
    width: '48%',
  },
  breakLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  breakVal: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  runActionsRow: {
    alignSelf: 'flex-end',
  },
  holdBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
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
  },
  modalSubtitle: {
    fontSize: 12,
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
  textArea: {
    minHeight: 70,
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
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});
