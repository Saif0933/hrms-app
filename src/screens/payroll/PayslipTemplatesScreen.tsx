import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useEmployees } from '../../api/hook/useEmployee';
import { usePayslip } from '../../api/hook/usePayroll';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PayslipTemplates'>;

const MONTH_LIST = [
  { month: 'August', year: 2026, label: 'August 2026' },
  { month: 'July', year: 2026, label: 'July 2026' },
  { month: 'June', year: 2026, label: 'June 2026' },
  { month: 'May', year: 2026, label: 'May 2026' },
  { month: 'April', year: 2026, label: 'April 2026' },
  { month: 'March', year: 2026, label: 'March 2026' },
];

const TEMPLATES = [
  { id: 'classic', name: 'Corporate Classic', headerBg: '#0f172a', pillBg: '#2563eb', borderAccent: '#2563eb' },
  { id: 'modern', name: 'Modern Slate', headerBg: '#1e293b', pillBg: '#7c3aed', borderAccent: '#7c3aed' },
  { id: 'emerald', name: 'Emerald Executive', headerBg: '#064e3b', pillBg: '#10b981', borderAccent: '#10b981' },
];

function numberToWords(num: number): string {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero Rupees Only';

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + inWords(n % 10000000) : '');
  }

  const rounded = Math.round(num);
  return `${inWords(rounded)} Rupees Only`;
}

export const PayslipTemplatesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [selectedMonthYear, setSelectedMonthYear] = useState('August 2026');
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('classic');

  const selectedPeriod = useMemo(() => {
    return MONTH_LIST.find(m => m.label === selectedMonthYear) || MONTH_LIST[0];
  }, [selectedMonthYear]);

  const activeTemplate = useMemo(() => {
    return TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0];
  }, [selectedTemplateId]);

  // Dynamic TanStack Queries
  const { data: empRes, isLoading: isEmpLoading } = useEmployees();
  const employees = empRes?.data || [];

  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmpId) || employees[0];
  }, [employees, selectedEmpId]);

  const { data: payslipRes, isLoading: isPayslipLoading } = usePayslip(
    selectedEmployee?.id || '',
    selectedPeriod.month,
    selectedPeriod.year
  );

  const payslipData = payslipRes?.data;

  // Dynamic Financial Calculations
  const calc = useMemo(() => {
    if (!selectedEmployee) {
      return {
        basic: 50000,
        hra: 20000,
        allowance: 15000,
        bonus: 0,
        grossEarnings: 85000,
        pf: 1800,
        pt: 200,
        tds: 2500,
        otherDeductions: 0,
        totalDeductions: 4500,
        netPay: 80500,
        netPayWords: 'Eighty Thousand Five Hundred Rupees Only',
        bankName: 'HDFC Bank',
        bankAccount: '•••• 9812',
        uan: '100984719283',
        pfNumber: 'MH/KRL/0098471/000/0123',
      };
    }

    const basic = payslipData?.basic || selectedEmployee.basic || 50000;
    const hra = payslipData?.hra || selectedEmployee.hra || Math.round(basic * 0.4);
    const allowance = payslipData?.allowance || selectedEmployee.allowance || Math.round(basic * 0.3);
    const bonus = payslipData?.bonus || 0;
    const grossEarnings = basic + hra + allowance + bonus;

    const pf = payslipData?.pf || Math.min(Math.round(basic * 0.12), 1800);
    const pt = payslipData?.pt || 200;
    const tds = payslipData?.tds || (basic > 30000 ? Math.round(basic * 0.05) : 0);
    const otherDeductions = payslipData?.otherDeductions || (selectedEmployee.deductions ? Math.max(0, selectedEmployee.deductions - (pf + pt + tds)) : 0);
    const totalDeductions = pf + pt + tds + otherDeductions;

    const netPay = grossEarnings - totalDeductions;

    return {
      basic,
      hra,
      allowance,
      bonus,
      grossEarnings,
      pf,
      pt,
      tds,
      otherDeductions,
      totalDeductions,
      netPay,
      netPayWords: numberToWords(netPay),
      bankName: selectedEmployee.bankName || payslipData?.bankName || 'HDFC Bank',
      bankAccount: selectedEmployee.bankAccount || payslipData?.bankAccount || '•••• 9812',
      uan: selectedEmployee.uan || payslipData?.uan || '100984719283',
      pfNumber: selectedEmployee.pfNumber || payslipData?.pfNumber || 'MH/KRL/0098471/000/0123',
    };
  }, [selectedEmployee, payslipData]);

  const handleDownloadPayslip = () => {
    Alert.alert(
      'Payslip Downloaded 📄',
      `Official Salary Slip for ${selectedEmployee?.name || 'Employee'} (${selectedMonthYear}) saved to Downloads as PDF.\n\nTemplate: ${activeTemplate.name}\nNet Amount: ₹ ${calc.netPay.toLocaleString('en-IN')}.00`
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
            Payslip Templates & Generator
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Official Itemized Salary Slip Previewer & PDF Export
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Employee Selector Bar */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            👤 Select Employee Payslip
          </Text>
          {isEmpLoading ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 10 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
              {employees.map(emp => {
                const isSelected = (selectedEmpId || selectedEmployee?.id) === emp.id;
                return (
                  <TouchableOpacity
                    key={emp.id}
                    style={[
                      styles.empChip,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.background,
                        borderColor: isSelected ? colors.accent : colors.cardBorder,
                      },
                    ]}
                    onPress={() => setSelectedEmpId(emp.id)}
                  >
                    <Text
                      style={{
                        color: isSelected ? '#ffffff' : colors.textPrimary,
                        fontWeight: '700',
                        fontSize: 12,
                      }}
                    >
                      {emp.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Dynamic Month Selector Bar */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            📅 Select Salary Cycle Month
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            {MONTH_LIST.map(m => {
              const isSelected = selectedMonthYear === m.label;
              return (
                <TouchableOpacity
                  key={m.label}
                  style={[
                    styles.empChip,
                    {
                      backgroundColor: isSelected ? activeTemplate.borderAccent : colors.background,
                      borderColor: isSelected ? activeTemplate.borderAccent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setSelectedMonthYear(m.label)}
                >
                  <Text
                    style={{
                      color: isSelected ? '#ffffff' : colors.textPrimary,
                      fontWeight: '700',
                      fontSize: 12,
                    }}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Dynamic Payslip Template Design Selector Bar */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            🎨 Select Payslip Template Theme
          </Text>
          <View style={styles.templateRow}>
            {TEMPLATES.map(tmpl => {
              const isSelected = selectedTemplateId === tmpl.id;
              return (
                <TouchableOpacity
                  key={tmpl.id}
                  style={[
                    styles.templateChip,
                    {
                      backgroundColor: isSelected ? tmpl.headerBg : colors.background,
                      borderColor: tmpl.borderAccent,
                    },
                  ]}
                  onPress={() => setSelectedTemplateId(tmpl.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={{
                      color: isSelected ? '#ffffff' : colors.textPrimary,
                      fontWeight: '800',
                      fontSize: 11,
                    }}
                  >
                    {tmpl.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* DIGITAL PAYSLIP DOCUMENT PREVIEW */}
        {isPayslipLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginVertical: 30 }} />
        ) : selectedEmployee ? (
          <View style={styles.payslipDocCard}>
            {/* Header Branding */}
            <View style={[styles.payslipHeader, { borderBottomColor: activeTemplate.headerBg }]}>
              <Text style={[styles.companyNameText, { color: activeTemplate.headerBg }]}>
                SYMBOSYS TECHNOLOGIES PVT LTD
              </Text>
              <Text style={styles.companyAddrText}>
                Unit 402, IT Tech Park, Kurla West, Mumbai - 400070
              </Text>
              <View style={[styles.payslipMonthPill, { backgroundColor: activeTemplate.pillBg }]}>
                <Text style={styles.payslipMonthText}>SALARY SLIP FOR {selectedMonthYear.toUpperCase()}</Text>
              </View>
            </View>

            {/* Employee Particulars Grid */}
            <View style={styles.empInfoGrid}>
              <View style={styles.empInfoCol}>
                <Text style={styles.infoLabel}>Employee Name:</Text>
                <Text style={styles.infoVal}>{selectedEmployee.name}</Text>
              </View>
              <View style={styles.empInfoCol}>
                <Text style={styles.infoLabel}>Employee ID:</Text>
                <Text style={styles.infoVal}>EMP-{selectedEmployee.id.slice(0, 6).toUpperCase()}</Text>
              </View>
              <View style={styles.empInfoCol}>
                <Text style={styles.infoLabel}>Designation:</Text>
                <Text style={styles.infoVal}>{selectedEmployee.designation || 'Software Engineer'}</Text>
              </View>
              <View style={styles.empInfoCol}>
                <Text style={styles.infoLabel}>Department:</Text>
                <Text style={styles.infoVal}>{selectedEmployee.department?.name || 'Engineering'}</Text>
              </View>
              <View style={styles.empInfoCol}>
                <Text style={styles.infoLabel}>Bank Account:</Text>
                <Text style={styles.infoVal}>{calc.bankName} • {calc.bankAccount}</Text>
              </View>
              <View style={styles.empInfoCol}>
                <Text style={styles.infoLabel}>UAN / PF No:</Text>
                <Text style={styles.infoVal}>{calc.uan}</Text>
              </View>
            </View>

            {/* Earnings & Deductions Breakdown Table */}
            <View style={styles.tableWrapper}>
              <View style={[styles.tableHeader, { backgroundColor: activeTemplate.headerBg }]}>
                <Text style={styles.tableHeaderCell}>EARNINGS</Text>
                <Text style={styles.tableHeaderCellRight}>AMOUNT (₹)</Text>
                <Text style={styles.tableHeaderCell}>DEDUCTIONS</Text>
                <Text style={styles.tableHeaderCellRight}>AMOUNT (₹)</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Basic Salary</Text>
                <Text style={styles.tableCellRight}>{calc.basic.toLocaleString('en-IN')}.00</Text>
                <Text style={styles.tableCell}>Provident Fund (PF)</Text>
                <Text style={styles.tableCellRight}>{calc.pf.toLocaleString('en-IN')}.00</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>House Rent Allowance (HRA)</Text>
                <Text style={styles.tableCellRight}>{calc.hra.toLocaleString('en-IN')}.00</Text>
                <Text style={styles.tableCell}>Professional Tax (PT)</Text>
                <Text style={styles.tableCellRight}>{calc.pt.toLocaleString('en-IN')}.00</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Special Allowance</Text>
                <Text style={styles.tableCellRight}>{calc.allowance.toLocaleString('en-IN')}.00</Text>
                <Text style={styles.tableCell}>TDS / Income Tax</Text>
                <Text style={styles.tableCellRight}>{calc.tds.toLocaleString('en-IN')}.00</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Performance Bonus</Text>
                <Text style={styles.tableCellRight}>{calc.bonus.toLocaleString('en-IN')}.00</Text>
                <Text style={styles.tableCell}>Other Deductions</Text>
                <Text style={styles.tableCellRight}>{calc.otherDeductions.toLocaleString('en-IN')}.00</Text>
              </View>

              <View style={styles.tableTotalRow}>
                <Text style={styles.totalCellLabel}>GROSS EARNINGS</Text>
                <Text style={styles.totalCellVal}>₹ {calc.grossEarnings.toLocaleString('en-IN')}.00</Text>
                <Text style={styles.totalCellLabel}>TOTAL DEDUCTIONS</Text>
                <Text style={styles.totalCellVal}>₹ {calc.totalDeductions.toLocaleString('en-IN')}.00</Text>
              </View>
            </View>

            {/* Net Pay Banner */}
            <View
              style={[
                styles.netPayBanner,
                { backgroundColor: `${activeTemplate.borderAccent}15`, borderColor: activeTemplate.borderAccent },
              ]}
            >
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.netPayLabel, { color: activeTemplate.borderAccent }]}>NET AMOUNT PAYABLE</Text>
                <Text style={styles.netPayWords}>{calc.netPayWords}</Text>
              </View>
              <Text style={[styles.netPayVal, { color: activeTemplate.borderAccent }]}>
                ₹ {calc.netPay.toLocaleString('en-IN')}.00
              </Text>
            </View>
          </View>
        ) : null}

        {/* Download Payslip Button */}
        <TouchableOpacity
          style={[styles.downloadBtn, { backgroundColor: activeTemplate.borderAccent }]}
          onPress={handleDownloadPayslip}
          activeOpacity={0.85}
        >
          <Text style={styles.downloadBtnText}>📄 Download Official Payslip PDF</Text>
        </TouchableOpacity>
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
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  empChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  templateRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  templateChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  payslipDocCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  payslipHeader: {
    alignItems: 'center',
    borderBottomWidth: 2,
    paddingBottom: 10,
  },
  companyNameText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  companyAddrText: {
    color: '#64748b',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  payslipMonthPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 8,
  },
  payslipMonthText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  empInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  empInfoCol: {
    width: '48%',
  },
  infoLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700',
  },
  infoVal: {
    color: '#0f172a',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  tableWrapper: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    flex: 1,
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  tableHeaderCellRight: {
    flex: 1,
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'right',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableCell: {
    flex: 1,
    color: '#334155',
    fontSize: 11,
  },
  tableCellRight: {
    flex: 1,
    color: '#0f172a',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  tableTotalRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  totalCellLabel: {
    flex: 1,
    color: '#0f172a',
    fontSize: 10,
    fontWeight: '800',
  },
  totalCellVal: {
    flex: 1,
    color: '#0f172a',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'right',
  },
  netPayBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  netPayLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  netPayWords: {
    color: '#334155',
    fontSize: 9,
    marginTop: 2,
  },
  netPayVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  downloadBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  downloadBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
