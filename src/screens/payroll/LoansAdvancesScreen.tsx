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
import { useApplyLoan, useLoans } from '../../api/hook/usePayroll';
import { useEmployees } from '../../api/hook/useEmployee';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'LoansAdvances'>;

export const LoansAdvancesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  // Apply Loan Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [principal, setPrincipal] = useState('50000');
  const [emi, setEmi] = useState('5000');
  const [purpose, setPurpose] = useState('Personal emergency & medical expense');

  // TanStack Queries & Mutations
  const { data: loansRes, isLoading } = useLoans();
  const { data: empRes } = useEmployees();
  const applyLoanMutation = useApplyLoan();

  const loans = loansRes?.data || [
    {
      id: 'LOAN101',
      employeeId: 'EMP001',
      employee: { id: 'EMP001', name: 'Aarav Sharma', email: 'aarav@symbosys.com' },
      principal: 100000,
      balance: 40000,
      emi: 10000,
      purpose: 'Home renovation advance',
      status: 'ACTIVE' as const,
      approvedDate: '2026-01-10',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'LOAN102',
      employeeId: 'EMP002',
      employee: { id: 'EMP002', name: 'Neha Patel', email: 'neha@symbosys.com' },
      principal: 30000,
      balance: 0,
      emi: 5000,
      purpose: 'Festival salary advance',
      status: 'PAID' as const,
      approvedDate: '2026-03-01',
      createdAt: '',
      updatedAt: '',
    },
  ];

  const employees = empRes?.data || [];

  const handleApplyLoan = () => {
    const empId = selectedEmpId || employees[0]?.id || 'EMP001';
    const p = parseFloat(principal);
    const e = parseFloat(emi);

    if (!empId || isNaN(p) || isNaN(e) || p <= 0) {
      Alert.alert('Validation Error', 'Please complete Principal and EMI amounts.');
      return;
    }

    applyLoanMutation.mutate(
      {
        employeeId: empId,
        principal: p,
        emi: e,
        purpose: purpose.trim(),
      },
      {
        onSuccess: () => {
          setModalOpen(false);
          setPurpose('');
          Alert.alert('Loan Application Submitted 🏦', 'Employee loan request registered for approval.');
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const getStatusPill = (st: string) => {
    switch (st) {
      case 'PAID':
        return { bg: '#10b98120', text: '#10b981' };
      case 'REJECTED':
        return { bg: '#ef444420', text: '#ef4444' };
      case 'ACTIVE':
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
            Loans & Salary Advances
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Employee Loan Ledger & EMI Repayments
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addTopBtn, { backgroundColor: colors.accent }]}
          onPress={() => setModalOpen(true)}
        >
          <Text style={styles.addTopBtnText}>+ Apply Loan</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Active Loans Ledger */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Employee Loans Roster ({loans.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          loans.map(loan => {
            const pill = getStatusPill(loan.status);
            const paidPct = Math.round(((loan.principal - loan.balance) / loan.principal) * 100);

            return (
              <View
                key={loan.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.empName, { color: colors.textPrimary }]}>
                      {loan.employee?.name || 'Employee'}
                    </Text>
                    <Text style={[styles.loanSub, { color: colors.textSecondary }]}>
                      Approved: {loan.approvedDate} • {loan.purpose}
                    </Text>
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: pill.text }}>
                      {loan.status}
                    </Text>
                  </View>
                </View>

                {/* Balance & Progress Grid */}
                <View style={[styles.balanceGrid, { backgroundColor: colors.background }]}>
                  <View style={styles.balCol}>
                    <Text style={[styles.balLabel, { color: colors.textSecondary }]}>Principal Loan</Text>
                    <Text style={[styles.balVal, { color: colors.textPrimary }]}>₹ {loan.principal.toLocaleString()}</Text>
                  </View>
                  <View style={styles.balCol}>
                    <Text style={[styles.balLabel, { color: colors.textSecondary }]}>Monthly EMI</Text>
                    <Text style={[styles.balVal, { color: colors.accent }]}>₹ {loan.emi.toLocaleString()} / mo</Text>
                  </View>
                  <View style={styles.balCol}>
                    <Text style={[styles.balLabel, { color: colors.textSecondary }]}>Remaining Balance</Text>
                    <Text style={[styles.balVal, { color: loan.balance > 0 ? '#ef4444' : '#10b981' }]}>₹ {loan.balance.toLocaleString()}</Text>
                  </View>
                </View>

                {/* EMI Progress Bar */}
                <View style={styles.progressTrack}>
                  <View style={[styles.progressBar, { width: `${paidPct}%`, backgroundColor: colors.accent }]} />
                </View>
                <Text style={[styles.progressText, { color: colors.textSecondary }]}>
                  Repayment Progress: {paidPct}% Paid
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Apply Loan Modal */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Apply Loan / Salary Advance
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

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>LOAN PRINCIPAL AMOUNT (₹) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={principal}
              onChangeText={setPrincipal}
              keyboardType="numeric"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>MONTHLY EMI AMOUNT (₹) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={emi}
              onChangeText={setEmi}
              keyboardType="numeric"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PURPOSE OF LOAN</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={purpose}
              onChangeText={setPurpose}
              multiline
              numberOfLines={2}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setModalOpen(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.accent }]}
                onPress={handleApplyLoan}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Submit Application</Text>
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  empName: {
    fontSize: 15,
    fontWeight: '700',
  },
  loanSub: {
    fontSize: 11,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  balanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
  },
  balCol: {
    flex: 1,
  },
  balLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  balVal: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(100,100,100,0.1)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    textAlign: 'right',
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
  textArea: {
    minHeight: 60,
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
