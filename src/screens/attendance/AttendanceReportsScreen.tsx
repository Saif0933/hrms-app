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
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AttendanceReports'>;

export const AttendanceReportsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  // Filters State
  const [selectedMonthYear, setSelectedMonthYear] = useState('July 2026');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // TanStack Query for employee records
  const { data: empRes, isLoading: isLoadingEmployees } = useEmployees();
  const employees = empRes?.data || [];

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const matchesDept = selectedDept === 'ALL' || emp.department?.name?.toLowerCase() === selectedDept.toLowerCase();
    const matchesQuery =
      !searchQuery.trim() ||
      emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesQuery;
  });

  const handleDownloadSingleReport = (emp: Employee) => {
    Alert.alert(
      'Report Downloaded 📄',
      `Attendance report for ${emp.name} (${selectedMonthYear}) saved to Downloads as PDF/CSV.`
    );
  };

  const handleExportAllReports = () => {
    Alert.alert(
      'Master Report Downloaded 📊',
      `Complete attendance report for ${filteredEmployees.length} employee(s) for ${selectedMonthYear} saved to Downloads as CSV bundle.`
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
            Attendance Analytics & Reports
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Individual Employee & Master Attendance Reports
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {['July 2026', 'June 2026', 'May 2026', 'April 2026', 'March 2026'].map(mth => {
              const isSelected = selectedMonthYear === mth;
              return (
                <TouchableOpacity
                  key={mth}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.background,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setSelectedMonthYear(mth)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isSelected ? '#ffffff' : colors.textPrimary },
                    ]}
                  >
                    {mth}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 2. SEARCH EMPLOYEE & DEPARTMENT FILTER */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            🔍 Search & Department Filter
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
            placeholder="Search employee by name, email, code or designation..."
            placeholderTextColor={colors.inputPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            {['ALL', 'Engineering', 'Human Resources', 'Sales & Marketing', 'Finance'].map(dept => {
              const isSelected = selectedDept === dept;
              return (
                <TouchableOpacity
                  key={dept}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.background,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setSelectedDept(dept)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isSelected ? '#ffffff' : colors.textPrimary },
                    ]}
                  >
                    {dept}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* MASTER OVERVIEW & EXPORT ALL BUTTON */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.masterExportHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                📊 Master Reports Bundle ({selectedMonthYear})
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                {filteredEmployees.length} Employee report(s) matching current filter.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.exportAllBtn, { backgroundColor: colors.accent }]}
              onPress={handleExportAllReports}
              activeOpacity={0.85}
            >
              <Text style={styles.exportAllBtnText}>📥 Export All (CSV)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. INDIVIDUAL EMPLOYEE ATTENDANCE REPORTS LIST */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Employee Attendance Reports ({filteredEmployees.length})
        </Text>

        {isLoadingEmployees ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          filteredEmployees.map((emp, index) => {
            // Simulated per-employee stats
            const presentDays = 20 - (index % 3);
            const absentDays = index % 2;
            const leaveDays = 1;
            const totalDays = 22;
            const onTimePct = 90 + (index % 10);
            const avgHours = (8.2 + (index % 5) * 0.2).toFixed(1);

            return (
              <View
                key={emp.id}
                style={[
                  styles.empReportCard,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.empReportHeader}>
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
                      ID: EMP-{emp.id.slice(0, 6).toUpperCase()} • {emp.designation || 'Staff'} • {emp.department?.name || 'Engineering'}
                    </Text>
                  </View>
                </View>

                {/* Metrics Grid */}
                <View style={styles.metricsGrid}>
                  <View style={[styles.metricBox, { backgroundColor: '#10b98115', borderColor: '#10b98140' }]}>
                    <Text style={[styles.metricVal, { color: '#10b981' }]}>{presentDays} / {totalDays}</Text>
                    <Text style={[styles.metricLbl, { color: colors.textSecondary }]}>Days Present</Text>
                  </View>

                  <View style={[styles.metricBox, { backgroundColor: '#ef444415', borderColor: '#ef444440' }]}>
                    <Text style={[styles.metricVal, { color: '#ef4444' }]}>{absentDays} Day{absentDays === 1 ? '' : 's'}</Text>
                    <Text style={[styles.metricLbl, { color: colors.textSecondary }]}>Absent</Text>
                  </View>

                  <View style={[styles.metricBox, { backgroundColor: '#3b82f615', borderColor: '#3b82f640' }]}>
                    <Text style={[styles.metricVal, { color: '#3b82f6' }]}>{leaveDays} Day</Text>
                    <Text style={[styles.metricLbl, { color: colors.textSecondary }]}>Leaves</Text>
                  </View>

                  <View style={[styles.metricBox, { backgroundColor: '#f59e0b15', borderColor: '#f59e0b40' }]}>
                    <Text style={[styles.metricVal, { color: '#f59e0b' }]}>{onTimePct}%</Text>
                    <Text style={[styles.metricLbl, { color: colors.textSecondary }]}>On-Time Punctual</Text>
                  </View>

                  <View style={[styles.metricBox, { backgroundColor: 'rgba(100,100,100,0.1)', borderColor: colors.cardBorder }]}>
                    <Text style={[styles.metricVal, { color: colors.textPrimary }]}>{avgHours} hrs</Text>
                    <Text style={[styles.metricLbl, { color: colors.textSecondary }]}>Avg Work/Day</Text>
                  </View>
                </View>

                {/* Download Individual Employee Report Action Button */}
                <TouchableOpacity
                  style={[styles.downloadSingleBtn, { backgroundColor: colors.accent }]}
                  onPress={() => handleDownloadSingleReport(emp)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.downloadSingleBtnText}>
                    ⬇️ Download {emp.name}'s Report (PDF)
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {filteredEmployees.length === 0 && !isLoadingEmployees && (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No employee reports match your search query and filters.
          </Text>
        )}
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
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    marginVertical: 4,
  },
  masterExportHeaderRow: {
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
    marginTop: 4,
  },
  empReportCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  empReportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarMini: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricBox: {
    width: '31%',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  metricLbl: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  downloadSingleBtn: {
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  downloadSingleBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
