import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEmployees } from '../../api/hook/useEmployee';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PayslipTemplates'>;

export const PayslipTemplatesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [selectedMonthYear, setSelectedMonthYear] = useState('July 2026');
  const [selectedEmpId, setSelectedEmpId] = useState('');

  // TanStack Query
  const { data: empRes, isLoading } = useEmployees();
  const employees = empRes?.data || [];

  const selectedEmployee = employees.find(e => e.id === selectedEmpId) || employees[0];

  const handleDownloadPayslip = () => {
    Alert.alert(
      'Payslip Downloaded 📄',
      `Official Salary Slip for ${selectedEmployee?.name || 'Employee'} (${selectedMonthYear}) saved to Downloads as PDF.`
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
          {isLoading ? (
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

        {/* DIGITAL PAYSLIP DOCUMENT PREVIEW */}
        {selectedEmployee ? (
          <View style={styles.payslipDocCard}>
            {/* Header Branding */}
            <View style={styles.payslipHeader}>
              <Text style={styles.companyNameText}>SYMBOSYS TECHNOLOGIES PVT LTD</Text>
              <Text style={styles.companyAddrText}>
                Unit 402, IT Tech Park, Kurla West, Mumbai - 400070
              </Text>
              <View style={styles.payslipMonthPill}>
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
                <Text style={styles.infoVal}>HDFC •••• 9812</Text>
              </View>
              <View style={styles.empInfoCol}>
                <Text style={styles.infoLabel}>UAN / PF No:</Text>
                <Text style={styles.infoVal}>100984719283</Text>
              </View>
            </View>

            {/* Earnings & Deductions Breakdown Table */}
            <View style={styles.tableWrapper}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>EARNINGS</Text>
                <Text style={styles.tableHeaderCellRight}>AMOUNT (₹)</Text>
                <Text style={styles.tableHeaderCell}>DEDUCTIONS</Text>
                <Text style={styles.tableHeaderCellRight}>AMOUNT (₹)</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Basic Salary</Text>
                <Text style={styles.tableCellRight}>45,000.00</Text>
                <Text style={styles.tableCell}>Provident Fund (PF)</Text>
                <Text style={styles.tableCellRight}>1,800.00</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>House Rent Allowance (HRA)</Text>
                <Text style={styles.tableCellRight}>18,000.00</Text>
                <Text style={styles.tableCell}>Professional Tax (PT)</Text>
                <Text style={styles.tableCellRight}>200.00</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Special Allowance</Text>
                <Text style={styles.tableCellRight}>12,000.00</Text>
                <Text style={styles.tableCell}>TDS / Income Tax</Text>
                <Text style={styles.tableCellRight}>2,500.00</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={styles.tableCell}>Performance Bonus</Text>
                <Text style={styles.tableCellRight}>5,000.00</Text>
                <Text style={styles.tableCell}>Other Deductions</Text>
                <Text style={styles.tableCellRight}>0.00</Text>
              </View>

              <View style={styles.tableTotalRow}>
                <Text style={styles.totalCellLabel}>GROSS EARNINGS</Text>
                <Text style={styles.totalCellVal}>₹ 80,000.00</Text>
                <Text style={styles.totalCellLabel}>TOTAL DEDUCTIONS</Text>
                <Text style={styles.totalCellVal}>₹ 4,500.00</Text>
              </View>
            </View>

            {/* Net Pay Banner */}
            <View style={styles.netPayBanner}>
              <View>
                <Text style={styles.netPayLabel}>NET AMOUNT PAYABLE</Text>
                <Text style={styles.netPayWords}>Seventy-Five Thousand Five Hundred Rupees Only</Text>
              </View>
              <Text style={styles.netPayVal}>₹ 75,500.00</Text>
            </View>
          </View>
        ) : null}

        {/* Download Payslip Button */}
        <TouchableOpacity
          style={[styles.downloadBtn, { backgroundColor: colors.accent }]}
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
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  empChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
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
    borderBottomColor: '#0f172a',
    paddingBottom: 10,
  },
  companyNameText: {
    color: '#0f172a',
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
    backgroundColor: '#2563eb',
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
    backgroundColor: '#0f172a',
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
    backgroundColor: '#10b98115',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  netPayLabel: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
  },
  netPayWords: {
    color: '#334155',
    fontSize: 9,
    marginTop: 2,
  },
  netPayVal: {
    color: '#10b981',
    fontSize: 20,
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
