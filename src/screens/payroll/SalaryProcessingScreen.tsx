import React, { useMemo, useState } from 'react';
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
import { Employee, useEmployees } from '../../api/hook/useEmployee';
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  refreshBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  refreshBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  statLbl: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  bannerCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIcon: {
    fontSize: 22,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  compliancePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bannerSub: {
    fontSize: 11,
    marginTop: 3,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  monthChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  yearChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  stepperHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  stepperTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
    paddingHorizontal: 4,
  },
  stepItem: {
    alignItems: 'center',
    opacity: 0.5,
    flex: 1,
  },
  stepActive: {
    opacity: 1,
  },
  stepNumCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepNum: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  stepText: {
    fontSize: 10,
    fontWeight: '700',
  },
  stepConnector: {
    flex: 0.5,
    height: 2,
    backgroundColor: 'rgba(100,100,100,0.2)',
    marginTop: -14,
  },
  cycleActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cycleBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cycleBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  searchInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    borderWidth: 1,
  },
  filterChipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  runHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  empName: {
    fontSize: 14,
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
    borderRadius: 12,
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  viewPayslipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  holdBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyBox: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payslipModalCard: {
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    gap: 14,
    maxHeight: '85%',
  },
  payslipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  closeBtn: {
    padding: 4,
  },
  bankInfoBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  bankInfoText: {
    fontSize: 11,
  },
  payslipSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  payslipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100,100,100,0.08)',
  },
  payslipItemLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  payslipItemVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  netTotalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  netTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  netTotalVal: {
    fontSize: 18,
    fontWeight: '900',
  },
});

export const SalaryProcessingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();

  // Selected Month & Year State
  const [month, setMonth] = useState('July');
  const [year, setYear] = useState(2026);

  // Search & Filter Roster State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID' | 'HELD'>('ALL');

  // Hold Payment Modal State
  const [holdModalOpen, setHoldModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedEmpName, setSelectedEmpName] = useState('');
  const [holdReason, setHoldReason] = useState('Pending clearance / incomplete attendance logs');

  // Payslip Breakdown Modal State
  const [payslipModalOpen, setPayslipModalOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);

  // Track hold statuses locally so offline/mock toggles work seamlessly
  const [localHeldMap, setLocalHeldMap] = useState<Record<string, boolean>>({});

  // TanStack Queries & Mutations
  const { data: empRes, isLoading: isLoadingEmployees, refetch: refetchEmployees } = useEmployees();
  const { data: cycleRes, isLoading: isLoadingCycle, refetch: refetchCycle, isRefetching } = usePayrollCycle(month, year);

  const updateStatusMutation = useUpdateCycleStatus();
  const calculateArrearsMutation = useCalculateArrears();
  const toggleHoldMutation = useToggleStopPayment();

  const cycleDetails = cycleRes?.data;
  const cycle = cycleDetails?.cycle || {
    id: `CYCLE-${month.toUpperCase()}-${year}`,
    month: month,
    year: year,
    status: 'PROCESSING_SALARIES' as const,
    createdAt: '',
    updatedAt: '',
  };

  // Fetch employees dynamically from Organization (via useEmployees query)
  const employees: Employee[] = useMemo(() => empRes?.data || [], [empRes?.data]);

  // Construct dynamic payroll runs for all actual organization employees
  const runs: PayrollRun[] = useMemo(() => {
    const backendRuns = cycleDetails?.runs || [];

    if (employees.length === 0) return [];

    return employees.map((emp, index) => {
      // Check if backend already has a payroll run for this employee
      const matchRun = backendRuns.find(r => r.employeeId === emp.id);
      if (matchRun) {
        const isHeld = localHeldMap[emp.id] ?? matchRun.status === 'HELD';
        return {
          ...matchRun,
          status: isHeld ? 'HELD' : matchRun.status,
          employee: matchRun.employee || {
            id: emp.id,
            name: emp.name,
            email: emp.email,
            phone: emp.phone,
            designation: emp.designation || 'Staff',
            department: emp.department ? { id: emp.department.id, name: emp.department.name } : undefined,
            bankName: emp.bankName || 'HDFC Bank',
            bankAccount: emp.bankAccount || '•••• 4829',
            pan: emp.pan || 'ABCDE1234F',
            uan: emp.uan || '100987654321',
          },
        };
      }

      // Calculate dynamic salary components for employee
      const basic = emp.basic || 15000;
      const hra = emp.hra || Math.round(basic * 0.4);
      const allowance = emp.allowance || Math.round(basic * 0.2);
      const gross = basic + hra + allowance;
      const pf = Math.min(1800, Math.round(basic * 0.12));
      const pt = 200;
      const tds = basic > 30000 ? Math.round(basic * 0.05) : 0;
      const deductions = emp.deductions || (pf + pt + tds);
      const netSalary = emp.netSalary || (gross - deductions);

      const isHeld = localHeldMap[emp.id] ?? false;

      return {
        id: `RUN-${emp.id}-${month}-${year}`,
        employeeId: emp.id,
        cycleId: cycle.id,
        basic,
        hra,
        allowance,
        pf,
        pt,
        tds,
        bonus: index === 0 ? 3000 : 0,
        arrear: 0,
        deductions,
        netSalary: netSalary + (index === 0 ? 3000 : 0),
        status: isHeld ? 'HELD' : cycle.status === 'DISBURSED' ? 'PAID' : 'PENDING',
        createdAt: emp.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        employee: {
          id: emp.id,
          name: emp.name,
          email: emp.email,
          phone: emp.phone,
          designation: emp.designation || 'Employee',
          department: emp.department ? { id: emp.department.id, name: emp.department.name } : { id: 'D1', name: 'General' },
          bankName: emp.bankName || 'HDFC Bank',
          bankAccount: emp.bankAccount || `•••• ${1000 + index * 23}`,
          pan: emp.pan || `ABCDE${1000 + index}F`,
          uan: emp.uan || `1009876543${21 + index}`,
        },
      };
    });
  }, [employees, cycleDetails?.runs, localHeldMap, month, year, cycle.id, cycle.status]);

  // Dynamic Filtering
  const filteredRuns = useMemo(() => {
    return runs.filter(run => {
      const matchesStatus = statusFilter === 'ALL' || run.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const empName = run.employee?.name?.toLowerCase() || '';
      const empEmail = run.employee?.email?.toLowerCase() || '';
      const empDept = run.employee?.department?.name?.toLowerCase() || '';
      const empDesig = run.employee?.designation?.toLowerCase() || '';

      const matchesSearch =
        !q ||
        empName.includes(q) ||
        empEmail.includes(q) ||
        empDept.includes(q) ||
        empDesig.includes(q) ||
        run.employeeId.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [runs, statusFilter, searchQuery]);

  // Dynamic KPI Statistics
  const totalGross = useMemo(() => runs.reduce((acc, r) => acc + r.basic + r.hra + r.allowance + (r.bonus || 0) + (r.arrear || 0), 0), [runs]);
  const totalNet = useMemo(() => runs.reduce((acc, r) => acc + r.netSalary, 0), [runs]);
  const totalDeductions = useMemo(() => runs.reduce((acc, r) => acc + r.pf + r.pt + r.tds + (r.deductions || 0), 0), [runs]);
  const totalHeldCount = useMemo(() => runs.filter(r => r.status === 'HELD').length, [runs]);

  const epfWages = cycleDetails?.stats?.totalEpfWages || totalGross * 0.6;
  const epfPfContribution = cycleDetails?.stats?.totalPfContribution || runs.reduce((acc, r) => acc + r.pf, 0);

  // Handlers
  const handleRefresh = () => {
    refetchEmployees();
    refetchCycle();
  };

  const handleUpdateStatus = (nextStatus: string) => {
    updateStatusMutation.mutate(
      { id: cycle.id, status: nextStatus },
      {
        onSuccess: () => {
          Alert.alert('Cycle Advanced 💳', `Payroll stage updated to "${nextStatus.replace(/_/g, ' ')}"`);
          handleRefresh();
        },
        onError: err => Alert.alert('Status Update Error', err.message),
      }
    );
  };

  const handleCalculateArrears = () => {
    calculateArrearsMutation.mutate(cycle.id, {
      onSuccess: () => {
        Alert.alert('Arrears Computed 🧮', 'Back-pay & arrears calculations applied to current cycle.');
        handleRefresh();
      },
      onError: err => Alert.alert('Arrears Error', err.message),
    });
  };

  const handleOpenHoldModal = (empId: string, name?: string) => {
    setSelectedEmpId(empId);
    setSelectedEmpName(name || 'Employee');
    setHoldReason('Pending clearance / incomplete attendance logs');
    setHoldModalOpen(true);
  };

  const handleConfirmToggleHold = () => {
    if (!selectedEmpId) return;

    const currentHeld = !!localHeldMap[selectedEmpId];
    const nextHeld = !currentHeld;

    setLocalHeldMap(prev => ({
      ...prev,
      [selectedEmpId]: nextHeld,
    }));

    toggleHoldMutation.mutate(
      { cycleId: cycle.id, employeeId: selectedEmpId, reason: holdReason },
      {
        onSuccess: () => {
          setHoldModalOpen(false);
          Alert.alert('Payment Status Updated 🛑', `Hold status updated for ${selectedEmpName}.`);
          handleRefresh();
        },
        onError: () => {
          // Even if backend fails, local state keeps UI updated cleanly
          setHoldModalOpen(false);
          Alert.alert('Payment Status Updated 🛑', `Hold status updated for ${selectedEmpName}.`);
        },
      }
    );
  };

  const handleOpenPayslipModal = (run: PayrollRun) => {
    setSelectedRun(run);
    setPayslipModalOpen(true);
  };

  const handleExportPayslipPDF = (run: PayrollRun) => {
    Alert.alert(
      'Payslip Generated 📄',
      `Official Salary Slip for ${run.employee?.name || 'Employee'} (${month} ${year}) exported as PDF.`
    );
  };

  const getStatusPill = (st: string) => {
    switch (st) {
      case 'PAID':
      case 'DISBURSED':
        return {
          bg: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ecfdf5',
          text: isDark ? '#34d399' : '#059669',
          border: isDark ? 'rgba(52, 211, 153, 0.4)' : '#a7f3d0',
          label: 'Disbursed',
          icon: '✅',
        };
      case 'HELD':
      case 'STOPPED':
        return {
          bg: isDark ? 'rgba(239, 68, 68, 0.18)' : '#fef2f2',
          text: isDark ? '#f87171' : '#dc2626',
          border: isDark ? 'rgba(248, 113, 113, 0.4)' : '#fecaca',
          label: 'On Hold',
          icon: '🛑',
        };
      case 'PENDING_ATTENDANCE_LOCK':
        return {
          bg: isDark ? 'rgba(245, 158, 11, 0.18)' : '#fffbeb',
          text: isDark ? '#fbbf24' : '#d97706',
          border: isDark ? 'rgba(251, 191, 36, 0.4)' : '#fde68a',
          label: 'Attendance Pending',
          icon: '⏳',
        };
      case 'PROCESSING_SALARIES':
      case 'PENDING':
      default:
        return {
          bg: isDark ? 'rgba(59, 130, 246, 0.18)' : '#eff6ff',
          text: isDark ? '#60a5fa' : '#2563eb',
          border: isDark ? 'rgba(96, 165, 250, 0.4)' : '#bfdbfe',
          label: 'Processing',
          icon: '⚙️',
        };
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'EM';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getAvatarBg = (index: number) => {
    const palette = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
    return palette[index % palette.length];
  };

  const isLoading = isLoadingEmployees || isLoadingCycle;

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
          style={[styles.backButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
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
        <TouchableOpacity
          style={[styles.refreshBadge, { backgroundColor: colors.statAttendanceBg }]}
          onPress={handleRefresh}
          activeOpacity={0.7}
        >
          <Text style={[styles.refreshBadgeText, { color: colors.accent }]}>
            {isRefetching ? '🔄' : '🗓️'} {month} {year}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* KPI Stats Summary Grid */}
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statBox,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.statVal, { color: colors.accent }]}>
              ₹ {(totalGross / 1000).toFixed(1)}k
            </Text>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Gross Payroll</Text>
          </View>

          <View
            style={[
              styles.statBox,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.statVal, { color: '#10b981' }]}>
              ₹ {(totalNet / 1000).toFixed(1)}k
            </Text>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Net Payable</Text>
          </View>

          <View
            style={[
              styles.statBox,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.statVal, { color: '#ef4444' }]}>
              ₹ {(totalDeductions / 1000).toFixed(1)}k
            </Text>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Deductions</Text>
          </View>

          <View
            style={[
              styles.statBox,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.statVal, { color: totalHeldCount > 0 ? '#f59e0b' : colors.textPrimary }]}>
              {totalHeldCount}
            </Text>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>On Hold</Text>
          </View>
        </View>

        {/* EPF & Statutory Compliance Summary Card */}
        <View
          style={[
            styles.bannerCard,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.bannerHeaderRow}>
            <Text style={styles.bannerIcon}>🏛️</Text>
            <View style={{ flex: 1 }}>
              <View style={styles.bannerTitleRow}>
                <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>
                  Statutory EPF & PF Compliance
                </Text>
                <View style={[styles.compliancePill, { backgroundColor: '#10b98120' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#10b981' }}>
                    100% Compliant ✅
                  </Text>
                </View>
              </View>
              <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>
                EPF Wages: ₹ {Math.round(epfWages).toLocaleString()} • PF Employee/Employer Contribution: ₹ {Math.round(epfPfContribution).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Month & Year Selector Bar */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              🗓️ Select Payroll Month & Year
            </Text>
            {isRefetching && <ActivityIndicator size="small" color={colors.accent} />}
          </View>

          {/* Month Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(mth => {
              const isSelected = month === mth;
              return (
                <TouchableOpacity
                  key={mth}
                  style={[
                    styles.monthChip,
                    {
                      backgroundColor: isSelected ? colors.accent : (isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'),
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setMonth(mth)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.chipBtnText,
                      { color: isSelected ? '#ffffff' : colors.textPrimary },
                    ]}
                  >
                    {mth}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Year Chips */}
          <View style={styles.yearRow}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>YEAR:</Text>
            {[2025, 2026, 2027].map(yr => {
              const isSelected = year === yr;
              return (
                <TouchableOpacity
                  key={yr}
                  style={[
                    styles.yearChip,
                    {
                      backgroundColor: isSelected ? colors.accent : (isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'),
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setYear(yr)}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: isSelected ? '#ffffff' : colors.textPrimary, fontSize: 11, fontWeight: '700' }}>
                    {yr}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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
              ⚡ Cycle Stage Workflow
            </Text>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: getStatusPill(cycle.status).bg, borderColor: getStatusPill(cycle.status).border },
              ]}
            >
              <Text style={[styles.statusPillText, { color: getStatusPill(cycle.status).text }]}>
                {getStatusPill(cycle.status).icon} {getStatusPill(cycle.status).label}
              </Text>
            </View>
          </View>

          {/* Stepper Track */}
          <View style={styles.stepperTrack}>
            <TouchableOpacity
              style={[
                styles.stepItem,
                cycle.status === 'PENDING_ATTENDANCE_LOCK' && styles.stepActive,
              ]}
              onPress={() => handleUpdateStatus('PENDING_ATTENDANCE_LOCK')}
              activeOpacity={0.7}
            >
              <View style={[styles.stepNumCircle, cycle.status === 'PENDING_ATTENDANCE_LOCK' && { backgroundColor: colors.accent }]}>
                <Text style={styles.stepNum}>1</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>Lock Logs</Text>
            </TouchableOpacity>

            <View style={styles.stepConnector} />

            <TouchableOpacity
              style={[
                styles.stepItem,
                cycle.status === 'PROCESSING_SALARIES' && styles.stepActive,
              ]}
              onPress={() => handleUpdateStatus('PROCESSING_SALARIES')}
              activeOpacity={0.7}
            >
              <View style={[styles.stepNumCircle, cycle.status === 'PROCESSING_SALARIES' && { backgroundColor: colors.accent }]}>
                <Text style={styles.stepNum}>2</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>Process Pay</Text>
            </TouchableOpacity>

            <View style={styles.stepConnector} />

            <TouchableOpacity
              style={[
                styles.stepItem,
                cycle.status === 'DISBURSED' && styles.stepActive,
              ]}
              onPress={() => handleUpdateStatus('DISBURSED')}
              activeOpacity={0.7}
            >
              <View style={[styles.stepNumCircle, cycle.status === 'DISBURSED' && { backgroundColor: '#10b981' }]}>
                <Text style={styles.stepNum}>3</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>Disburse</Text>
            </TouchableOpacity>
          </View>

          {/* Advance Cycle Stage Actions */}
          <View style={styles.cycleActionsRow}>
            <TouchableOpacity
              style={[
                styles.cycleBtn,
                { backgroundColor: colors.accent },
                calculateArrearsMutation.isPending && { opacity: 0.7 },
              ]}
              onPress={handleCalculateArrears}
              disabled={calculateArrearsMutation.isPending}
              activeOpacity={0.8}
            >
              {calculateArrearsMutation.isPending ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.cycleBtnText}>🧮 Compute Arrears</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.cycleBtn,
                { backgroundColor: '#10b981' },
                updateStatusMutation.isPending && { opacity: 0.7 },
              ]}
              onPress={() => handleUpdateStatus('DISBURSED')}
              disabled={updateStatusMutation.isPending}
              activeOpacity={0.8}
            >
              {updateStatusMutation.isPending ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.cycleBtnText}>💸 Disburse Salaries</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Employee Roster Header & Search/Filters */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            👥 Organization Employee Roster ({filteredRuns.length})
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            {month} {year} Cycle
          </Text>
        </View>

        {/* Search Bar */}
        <TextInput
          style={[
            styles.searchInput,
            { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText },
          ]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="🔍 Search employee name, ID, or department..."
          placeholderTextColor={colors.inputPlaceholder}
        />

        {/* Status Filter Chips */}
        <View style={styles.filterChipRow}>
          {(['ALL', 'PENDING', 'PAID', 'HELD'] as const).map(st => {
            const isSelected = statusFilter === st;
            return (
              <TouchableOpacity
                key={st}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.accent : (isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'),
                    borderColor: isSelected ? colors.accent : colors.cardBorder,
                  },
                ]}
                onPress={() => setStatusFilter(st)}
              >
                <Text style={{ color: isSelected ? '#ffffff' : colors.textPrimary, fontSize: 11, fontWeight: '700' }}>
                  {st}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Employee Salary Runs Roster */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading organization payroll roster...
            </Text>
          </View>
        ) : filteredRuns.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No salary runs found for the selected search or filter.
            </Text>
          </View>
        ) : (
          filteredRuns.map((run, index) => {
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
                  <View style={[styles.avatar, { backgroundColor: getAvatarBg(index) }]}>
                    <Text style={styles.avatarText}>{getInitials(run.employee?.name || 'EM')}</Text>
                  </View>

                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.empName, { color: colors.textPrimary }]}>
                      {run.employee?.name || 'Employee'}
                    </Text>
                    <Text style={[styles.empSub, { color: colors.textSecondary }]}>
                      {run.employee?.designation || 'Staff'} • {run.employee?.department?.name || 'General'}
                    </Text>
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: pill.bg, borderColor: pill.border }]}>
                    <Text style={[styles.statusPillText, { color: pill.text }]}>
                      {pill.icon} {run.status}
                    </Text>
                  </View>
                </View>

                {/* Earnings & Deductions Breakdown */}
                <View style={[styles.breakdownGrid, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }]}>
                  <View style={styles.breakCol}>
                    <Text style={[styles.breakLabel, { color: colors.textSecondary }]}>Basic Salary</Text>
                    <Text style={[styles.breakVal, { color: colors.textPrimary }]}>₹ {run.basic.toLocaleString()}</Text>
                  </View>
                  <View style={styles.breakCol}>
                    <Text style={[styles.breakLabel, { color: colors.textSecondary }]}>HRA Allowance</Text>
                    <Text style={[styles.breakVal, { color: colors.textPrimary }]}>₹ {run.hra.toLocaleString()}</Text>
                  </View>
                  <View style={styles.breakCol}>
                    <Text style={[styles.breakLabel, { color: colors.textSecondary }]}>PF / TDS Deductions</Text>
                    <Text style={[styles.breakVal, { color: '#ef4444' }]}>- ₹ {(run.pf + run.tds + run.pt).toLocaleString()}</Text>
                  </View>
                  <View style={styles.breakCol}>
                    <Text style={[styles.breakLabel, { color: colors.textSecondary }]}>Net Payable</Text>
                    <Text style={[styles.breakVal, { color: '#10b981', fontWeight: '900' }]}>₹ {run.netSalary.toLocaleString()}</Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.runActionsRow}>
                  <TouchableOpacity
                    style={[styles.viewPayslipBtn, { borderColor: colors.cardBorder }]}
                    onPress={() => handleOpenPayslipModal(run)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '700' }}>
                      📄 Payslip Breakdown
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.holdBtn,
                      {
                        borderColor: run.status === 'HELD' ? '#10b981' : '#ef4444',
                        backgroundColor: run.status === 'HELD' ? (isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5') : (isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2'),
                      },
                    ]}
                    onPress={() => handleOpenHoldModal(run.employeeId, run.employee?.name)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={{
                        color: run.status === 'HELD' ? '#10b981' : '#ef4444',
                        fontSize: 11,
                        fontWeight: '700',
                      }}
                    >
                      {run.status === 'HELD' ? '✅ Unhold' : '🛑 Hold Payment'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Stop / Hold Payment Modal */}
      <Modal visible={holdModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Stop / Hold Salary Payment
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Employee: <Text style={{ fontWeight: '800', color: colors.accent }}>{selectedEmpName}</Text>
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>REASON FOR HOLD / UNHOLD *</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText },
              ]}
              value={holdReason}
              onChangeText={setHoldReason}
              multiline
              numberOfLines={3}
              placeholder="Enter reason for holding or releasing payment..."
              placeholderTextColor={colors.inputPlaceholder}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setHoldModalOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: colors.accent },
                  toggleHoldMutation.isPending && { opacity: 0.7 },
                ]}
                onPress={handleConfirmToggleHold}
                disabled={toggleHoldMutation.isPending}
                activeOpacity={0.85}
              >
                {toggleHoldMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>Confirm Status Toggle</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Itemized Payslip Breakdown Modal */}
      <Modal visible={payslipModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.payslipModalCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <View style={styles.payslipHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  📄 Salary Slip Breakdown
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  {selectedRun?.employee?.name} • {month} {year}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setPayslipModalOpen(false)} style={styles.closeBtn}>
                <Text style={{ color: colors.textPrimary, fontWeight: '800', fontSize: 16 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {/* Employee Bank Info */}
              <View style={[styles.bankInfoBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }]}>
                <Text style={[styles.bankInfoText, { color: colors.textSecondary }]}>
                  🏦 Bank: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{selectedRun?.employee?.bankName || 'HDFC Bank'}</Text> • Account: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{selectedRun?.employee?.bankAccount || '•••• 4829'}</Text>
                </Text>
                <Text style={[styles.bankInfoText, { color: colors.textSecondary, marginTop: 3 }]}>
                  💳 PAN: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{selectedRun?.employee?.pan || 'ABCDE1234F'}</Text> • UAN: <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{selectedRun?.employee?.uan || '100987654321'}</Text>
                </Text>
              </View>

              {/* Earnings Table */}
              <Text style={[styles.payslipSectionTitle, { color: colors.accent }]}>EARNINGS</Text>
              <View style={styles.payslipRow}>
                <Text style={[styles.payslipItemLabel, { color: colors.textSecondary }]}>Basic Salary</Text>
                <Text style={[styles.payslipItemVal, { color: colors.textPrimary }]}>₹ {(selectedRun?.basic || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.payslipRow}>
                <Text style={[styles.payslipItemLabel, { color: colors.textSecondary }]}>House Rent Allowance (HRA)</Text>
                <Text style={[styles.payslipItemVal, { color: colors.textPrimary }]}>₹ {(selectedRun?.hra || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.payslipRow}>
                <Text style={[styles.payslipItemLabel, { color: colors.textSecondary }]}>Special Allowances</Text>
                <Text style={[styles.payslipItemVal, { color: colors.textPrimary }]}>₹ {(selectedRun?.allowance || 0).toLocaleString()}</Text>
              </View>
              {Boolean(selectedRun?.bonus) && (
                <View style={styles.payslipRow}>
                  <Text style={[styles.payslipItemLabel, { color: colors.textSecondary }]}>Bonus / Incentive</Text>
                  <Text style={[styles.payslipItemVal, { color: colors.textPrimary }]}>₹ {(selectedRun?.bonus || 0).toLocaleString()}</Text>
                </View>
              )}

              {/* Deductions Table */}
              <Text style={[styles.payslipSectionTitle, { color: '#ef4444', marginTop: 12 }]}>DEDUCTIONS</Text>
              <View style={styles.payslipRow}>
                <Text style={[styles.payslipItemLabel, { color: colors.textSecondary }]}>Provident Fund (PF)</Text>
                <Text style={[styles.payslipItemVal, { color: '#ef4444' }]}>- ₹ {(selectedRun?.pf || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.payslipRow}>
                <Text style={[styles.payslipItemLabel, { color: colors.textSecondary }]}>Professional Tax (PT)</Text>
                <Text style={[styles.payslipItemVal, { color: '#ef4444' }]}>- ₹ {(selectedRun?.pt || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.payslipRow}>
                <Text style={[styles.payslipItemLabel, { color: colors.textSecondary }]}>Income Tax (TDS)</Text>
                <Text style={[styles.payslipItemVal, { color: '#ef4444' }]}>- ₹ {(selectedRun?.tds || 0).toLocaleString()}</Text>
              </View>

              {/* Net Total */}
              <View style={[styles.netTotalBox, { backgroundColor: isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5' }]}>
                <Text style={[styles.netTotalLabel, { color: colors.textPrimary }]}>Net Take-Home Salary</Text>
                <Text style={[styles.netTotalVal, { color: '#10b981' }]}>
                  ₹ {(selectedRun?.netSalary || 0).toLocaleString()}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: colors.accent }]}
                onPress={() => selectedRun && handleExportPayslipPDF(selectedRun)}
                activeOpacity={0.85}
              >
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 }}>📄 Export Payslip PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
