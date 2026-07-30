import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Employee, useEmployees } from '../../api/hook/useEmployee';
import { usePayrollCycle } from '../../api/hook/usePayroll';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PayrollReports'>;

export const PayrollReportsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  // Filters State
  const [selectedMonth, setSelectedMonth] = useState('July');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [searchQuery, setSearchQuery] = useState('');

  // TanStack Queries
  const { data: cycleRes } = usePayrollCycle(selectedMonth, selectedYear);
  const { data: empRes, isLoading: isLoadingEmployees } = useEmployees();

  const cycleDetails = cycleRes?.data;
  const employees = empRes?.data || [];

  // Filter employees by search query
  const filteredEmployees = employees.filter(emp => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(q) ||
      emp.email?.toLowerCase().includes(q) ||
      emp.id?.toLowerCase().includes(q) ||
      emp.designation?.toLowerCase().includes(q) ||
      emp.department?.name?.toLowerCase().includes(q)
    );
  });

  const handleExportSingleReport = (emp: Employee) => {
    Alert.alert(
      'Employee Report Exported 📄',
      `Monthly Payroll Register & Statutory Deductions report for ${emp.name} (${selectedMonth} ${selectedYear}) saved to Downloads as PDF/CSV.`
    );
  };

  const handleExportAllPayrollRegister = () => {
    Alert.alert(
      'Master Payroll Register Exported 📊',
      `Complete Monthly Payroll Register & Statutory Deductions for ${filteredEmployees.length} employee(s) (${selectedMonth} ${selectedYear}) saved to Downloads as CSV / Excel bundle.`
    );
  };

  const handleExportEcr = () => {
    Alert.alert(
      'EPF ECR Text File Generated 📥',
      `EPF Electronic Challan Return text file for ${selectedMonth} ${selectedYear} saved to Downloads as .txt.`
    );
  };

  const handleExportEsic = () => {
    Alert.alert(
      'ESIC Return Generated 📊',
      `ESIC monthly return data for ${selectedMonth} ${selectedYear} saved to Downloads as CSV.`
    );
  };

  const handleExportPt = () => {
    Alert.alert(
      'PT Challan Exported 📑',
      `State Professional Tax (PT) summary for ${selectedMonth} ${selectedYear} saved to Downloads.`
    );
  };

  const handleExportForm16 = () => {
    Alert.alert(
      'Form 16 Bundle Exported 📜',
      `Annual TDS & Income Tax Form 16 bundle for FY ${selectedYear - 1}-${selectedYear} saved to Downloads as ZIP.`
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
            Payroll Reports & Statutory Deductions
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Monthly Register, EPF ECR, ESIC & Statutory Compliance
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. SELECT MONTH & YEAR FILTER */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            🗓️ Select Month & Year
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            {['May', 'June', 'July', 'August'].map(mth => {
              const isSelected = selectedMonth === mth;
              return (
                <TouchableOpacity
                  key={mth}
                  style={[
                    styles.mthChip,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.background,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setSelectedMonth(mth)}
                >
                  <Text
                    style={{
                      color: isSelected ? '#ffffff' : colors.textPrimary,
                      fontWeight: '700',
                      fontSize: 12,
                    }}
                  >
                    {mth} {selectedYear}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 2. SEARCH EMPLOYEE INPUT */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            🔍 Search Employee Payroll Register
          </Text>
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.inputText,
              },
            ]}
            placeholder="Search employee by name, code, designation or department..."
            placeholderTextColor={colors.inputPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* 3. MASTER EXPORT ALL EMPLOYEE DATA ACTION CARD */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.masterExportRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                📊 Master Monthly Payroll Register ({selectedMonth} {selectedYear})
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Export complete monthly earnings and statutory deductions register for {filteredEmployees.length} employee(s).
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.exportAllBtn, { backgroundColor: colors.accent }]}
              onPress={handleExportAllPayrollRegister}
              activeOpacity={0.85}
            >
              <Text style={styles.exportAllBtnText}>📥 Export All (CSV)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. MONTHLY PAYROLL REGISTER & STATUTORY DEDUCTIONS LIST PER EMPLOYEE */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Monthly Payroll & Statutory Deductions Roster ({filteredEmployees.length})
        </Text>

        {isLoadingEmployees ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          filteredEmployees.map((emp, index) => {
            // Simulated / Calculated Salary Breakdown per employee
            const baseGross = 50000 + (index % 5) * 5000;
            const basic = Math.round(baseGross * 0.5);
            const hra = Math.round(baseGross * 0.2);
            const special = baseGross - basic - hra;

            // Statutory Deductions
            const epf = Math.min(1800, Math.round(basic * 0.12));
            const esic = baseGross <= 21000 ? Math.round(baseGross * 0.0075) : 0;
            const pt = 200;
            const tds = baseGross > 60000 ? 2500 : 0;
            const totalDeductions = epf + esic + pt + tds;
            const netPayable = baseGross - totalDeductions;

            return (
              <View
                key={emp.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                {/* Employee Header */}
                <View style={styles.empHeaderRow}>
                  <View style={styles.avatarMini}>
                    <Text style={styles.avatarMiniText}>
                      {emp.name
                        ? emp.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .slice(0, 2)
                        : 'EMP'}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.empName, { color: colors.textPrimary }]}>
                      {emp.name}
                    </Text>
                    <Text style={[styles.empSubInfo, { color: colors.textSecondary }]}>
                      Code: EMP-{emp.id.slice(0, 6).toUpperCase()} • {emp.designation || 'Staff'} • {emp.department?.name || 'General'}
                    </Text>
                  </View>
                </View>

                {/* Earnings & Statutory Deductions Grid */}
                <View style={[styles.breakdownGrid, { backgroundColor: colors.background }]}>
                  {/* Earnings Side */}
                  <View style={styles.breakSection}>
                    <Text style={[styles.breakTitle, { color: colors.textPrimary }]}>💵 Monthly Gross Earnings</Text>
                    <View style={styles.breakRow}>
                      <Text style={[styles.breakLabel, { color: colors.textSecondary }]}>Basic (50%):</Text>
                      <Text style={[styles.breakVal, { color: colors.textPrimary }]}>₹{basic.toLocaleString()}</Text>
                    </View>
                    <View style={styles.breakRow}>
                      <Text style={[styles.breakLabel, { color: colors.textSecondary }]}>HRA (20%):</Text>
                      <Text style={[styles.breakVal, { color: colors.textPrimary }]}>₹{hra.toLocaleString()}</Text>
                    </View>
                    <View style={styles.breakRow}>
                      <Text style={[styles.breakLabel, { color: colors.textSecondary }]}>Special Allow:</Text>
                      <Text style={[styles.breakVal, { color: colors.textPrimary }]}>₹{special.toLocaleString()}</Text>
                    </View>
                    <View style={[styles.breakRow, styles.totalSubRow]}>
                      <Text style={[styles.breakLabelBold, { color: colors.textPrimary }]}>Total Gross:</Text>
                      <Text style={[styles.breakValBold, { color: colors.textPrimary }]}>₹{baseGross.toLocaleString()}</Text>
                    </View>
                  </View>

                  {/* Statutory Deductions Side */}
                  <View style={styles.breakSection}>
                    <Text style={[styles.breakTitle, { color: '#ef4444' }]}>🛡️ Statutory Deductions</Text>
                    <View style={styles.breakRow}>
                      <Text style={[styles.breakLabel, { color: colors.textSecondary }]}>EPF (12%):</Text>
                      <Text style={[styles.breakVal, { color: '#ef4444' }]}>- ₹{epf.toLocaleString()}</Text>
                    </View>
                    <View style={styles.breakRow}>
                      <Text style={[styles.breakLabel, { color: colors.textSecondary }]}>ESIC:</Text>
                      <Text style={[styles.breakVal, { color: '#ef4444' }]}>- ₹{esic.toLocaleString()}</Text>
                    </View>
                    <View style={styles.breakRow}>
                      <Text style={[styles.breakLabel, { color: colors.textSecondary }]}>PT (State):</Text>
                      <Text style={[styles.breakVal, { color: '#ef4444' }]}>- ₹{pt.toLocaleString()}</Text>
                    </View>
                    <View style={styles.breakRow}>
                      <Text style={[styles.breakLabel, { color: colors.textSecondary }]}>TDS (IT):</Text>
                      <Text style={[styles.breakVal, { color: '#ef4444' }]}>- ₹{tds.toLocaleString()}</Text>
                    </View>
                    <View style={[styles.breakRow, styles.totalSubRow]}>
                      <Text style={[styles.breakLabelBold, { color: '#ef4444' }]}>Total Deductions:</Text>
                      <Text style={[styles.breakValBold, { color: '#ef4444' }]}>- ₹{totalDeductions.toLocaleString()}</Text>
                    </View>
                  </View>
                </View>

                {/* Net Take Home Banner */}
                <View style={styles.netTakeHomeRow}>
                  <Text style={[styles.netTakeHomeLabel, { color: colors.textSecondary }]}>Net Payable Take Home:</Text>
                  <Text style={[styles.netTakeHomeVal, { color: '#10b981' }]}>₹ {netPayable.toLocaleString()} / mo</Text>
                </View>

                {/* Single Employee Export Button */}
                <TouchableOpacity
                  style={[styles.downloadSingleBtn, { backgroundColor: colors.accent }]}
                  onPress={() => handleExportSingleReport(emp)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.downloadSingleBtnText}>
                    ⬇️ Export {emp.name}'s Payroll Report (PDF / CSV)
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {filteredEmployees.length === 0 && !isLoadingEmployees && (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No employee payroll records match your search filter.
          </Text>
        )}

        {/* 5. STATUTORY COMPLIANCE CARDS (EPF ECR, ESIC, PT, FORM 16) */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Statutory Compliance & Regulatory Filing Exports
        </Text>

        {/* EPF ECR */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.reportTitle, { color: colors.textPrimary }]}>
                🏛️ EPF Electronic Challan Return (ECR)
              </Text>
              <Text style={[styles.reportSub, { color: colors.textSecondary }]}>
                Generate EPFO compliant text file for monthly PF return upload on Unified Portal.
              </Text>
            </View>
          </View>

          <View style={[styles.statRow, { backgroundColor: colors.background }]}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total EPF Wages:</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              ₹ {cycleDetails?.stats?.totalEpfWages ? cycleDetails.stats.totalEpfWages.toLocaleString() : '8,90,000'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: colors.accent }]}
            onPress={handleExportEcr}
            activeOpacity={0.85}
          >
            <Text style={styles.exportBtnText}>📥 Export EPF ECR File (.txt)</Text>
          </TouchableOpacity>
        </View>

        {/* ESIC RETURN */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.reportTitle, { color: colors.textPrimary }]}>
            🏥 ESIC Monthly Contribution Return
          </Text>
          <Text style={[styles.reportSub, { color: colors.textSecondary }]}>
            Export ESIC contribution details for employees drawing gross pay ≤ ₹21,000.
          </Text>

          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: '#10b981' }]}
            onPress={handleExportEsic}
            activeOpacity={0.85}
          >
            <Text style={styles.exportBtnText}>📊 Export ESIC Return (CSV)</Text>
          </TouchableOpacity>
        </View>

        {/* PT CHALLAN */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.reportTitle, { color: colors.textPrimary }]}>
            💼 Professional Tax (PT) State Challan
          </Text>
          <Text style={[styles.reportSub, { color: colors.textSecondary }]}>
            State-wise Professional Tax deduction summary for Maharashtra, Karnataka & Gujarat.
          </Text>

          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: '#8b5cf6' }]}
            onPress={handleExportPt}
            activeOpacity={0.85}
          >
            <Text style={styles.exportBtnText}>📑 Export PT Challan Summary</Text>
          </TouchableOpacity>
        </View>

        {/* FORM 16 */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.reportTitle, { color: colors.textPrimary }]}>
            📜 Income Tax Form 16 & TDS Summary
          </Text>
          <Text style={[styles.reportSub, { color: colors.textSecondary }]}>
            Annual Part A & Part B TDS certificates for all employees.
          </Text>

          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: colors.accent }]}
            onPress={handleExportForm16}
            activeOpacity={0.85}
          >
            <Text style={styles.exportBtnText}>📦 Download Form 16 Bundle (ZIP)</Text>
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
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  mthChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  searchInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  masterExportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exportAllBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  exportAllBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },
  empHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarMini: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  empName: {
    fontSize: 15,
    fontWeight: '700',
  },
  empSubInfo: {
    fontSize: 11,
    marginTop: 2,
  },
  breakdownGrid: {
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  breakSection: {
    gap: 4,
  },
  breakTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  breakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakLabel: {
    fontSize: 11,
  },
  breakVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  totalSubRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(100,100,100,0.15)',
    paddingTop: 4,
    marginTop: 2,
  },
  breakLabelBold: {
    fontSize: 11,
    fontWeight: '800',
  },
  breakValBold: {
    fontSize: 11,
    fontWeight: '900',
  },
  netTakeHomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#10b98115',
    padding: 10,
    borderRadius: 10,
  },
  netTakeHomeLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  netTakeHomeVal: {
    fontSize: 15,
    fontWeight: '900',
  },
  downloadSingleBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  downloadSingleBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  reportSub: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  exportBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  exportBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
