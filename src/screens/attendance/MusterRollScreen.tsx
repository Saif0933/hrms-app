import React, { useState } from 'react';
import {
  ActivityIndicator,
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

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MusterRoll'>;

type AttendanceStatus = 'P' | 'A' | 'L' | 'WO' | 'HD';

export const MusterRollScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();

  const [selectedMonth, setSelectedMonth] = useState('July 2026');

  // TanStack Query
  const { data: empRes, isLoading } = useEmployees();
  const employees = empRes?.data || [];

  // Generate 31 days array
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  const getStatusStyle = (st: AttendanceStatus) => {
    switch (st) {
      case 'P':
        return {
          bg: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ecfdf5',
          text: isDark ? '#34d399' : '#059669',
          border: isDark ? 'rgba(52, 211, 153, 0.4)' : '#a7f3d0',
          label: 'Present',
        };
      case 'A':
        return {
          bg: isDark ? 'rgba(239, 68, 68, 0.18)' : '#fef2f2',
          text: isDark ? '#f87171' : '#dc2626',
          border: isDark ? 'rgba(248, 113, 113, 0.4)' : '#fecaca',
          label: 'Absent',
        };
      case 'L':
        return {
          bg: isDark ? 'rgba(59, 130, 246, 0.18)' : '#eff6ff',
          text: isDark ? '#60a5fa' : '#2563eb',
          border: isDark ? 'rgba(96, 165, 250, 0.4)' : '#bfdbfe',
          label: 'Leave',
        };
      case 'HD':
        return {
          bg: isDark ? 'rgba(245, 158, 11, 0.18)' : '#fffbeb',
          text: isDark ? '#fbbf24' : '#d97706',
          border: isDark ? 'rgba(251, 191, 36, 0.4)' : '#fde68a',
          label: 'Half Day',
        };
      case 'WO':
      default:
        return {
          bg: isDark ? 'rgba(148, 163, 184, 0.1)' : '#f1f5f9',
          text: isDark ? '#94a3b8' : '#64748b',
          border: isDark ? 'rgba(148, 163, 184, 0.2)' : '#e2e8f0',
          label: 'Week Off',
        };
    }
  };

  // Mock deterministic generator for demo
  const getEmpDayStatus = (empId: string, day: number): AttendanceStatus => {
    if (day % 7 === 0 || day % 7 === 6) return 'WO';
    if (day === 5 || day === 18) return 'L';
    if (day === 12 || day === 24) return 'A';
    if (day === 8) return 'HD';
    return 'P';
  };

  // Calculate quick summary metrics
  const totalEmployees = employees.length;
  let presentCount = 0;
  let absentCount = 0;
  let leaveCount = 0;

  employees.forEach(emp => {
    const st = getEmpDayStatus(emp.id, 1);
    if (st === 'P') presentCount++;
    else if (st === 'A') absentCount++;
    else if (st === 'L') leaveCount++;
  });

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
            Muster Roll & Calendar
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Monthly Attendance Roster Matrix
          </Text>
        </View>
        <View style={[styles.monthBadge, { backgroundColor: colors.statAttendanceBg }]}>
          <Text style={[styles.monthBadgeText, { color: colors.accent }]}>{selectedMonth}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* KPI Stats Summary Cards */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{totalEmployees}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Staff</Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.statValueRow}>
              <View style={[styles.miniDot, { backgroundColor: '#10b981' }]} />
              <Text style={[styles.statValue, { color: '#10b981' }]}>{presentCount}</Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Present Today</Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.statValueRow}>
              <View style={[styles.miniDot, { backgroundColor: '#ef4444' }]} />
              <Text style={[styles.statValue, { color: '#ef4444' }]}>{absentCount}</Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Absent Today</Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.statValueRow}>
              <View style={[styles.miniDot, { backgroundColor: '#3b82f6' }]} />
              <Text style={[styles.statValue, { color: '#3b82f6' }]}>{leaveCount}</Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>On Leave</Text>
          </View>
        </View>

        {/* Month Selector Bar */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              🗓️ Select Muster Month
            </Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
            {['May 2026', 'June 2026', 'July 2026', 'August 2026'].map(mth => {
              const isSelected = selectedMonth === mth;
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
                  onPress={() => setSelectedMonth(mth)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.monthChipText,
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

        {/* Status Legend */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>📌 Attendance Legend</Text>
          <View style={styles.legendRow}>
            {(['P', 'A', 'L', 'HD', 'WO'] as AttendanceStatus[]).map(st => {
              const info = getStatusStyle(st);
              return (
                <View
                  key={st}
                  style={[
                    styles.legendBadge,
                    { backgroundColor: info.bg, borderColor: info.border },
                  ]}
                >
                  <Text style={[styles.legendBadgeCode, { color: info.text }]}>{st}</Text>
                  <Text style={[styles.legendBadgeLabel, { color: colors.textPrimary }]}>
                    {info.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Muster Matrix Grid Table */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              📊 Monthly Muster Matrix ({selectedMonth})
            </Text>
            <View style={styles.recordCountPill}>
              <Text style={[styles.recordCountText, { color: colors.textSecondary }]}>
                {employees.length} Records
              </Text>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading roster matrix...
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tableGrid}>
                {/* Day Numbers Header Row */}
                <View style={[styles.tableHeaderRow, { borderBottomColor: colors.cardBorder }]}>
                  <Text style={[styles.thEmp, { color: colors.textPrimary }]}>Employee Name</Text>
                  {daysInMonth.map(d => {
                    const isWeekend = d % 7 === 0 || d % 7 === 6;
                    return (
                      <View
                        key={d}
                        style={[
                          styles.thDayContainer,
                          isWeekend && { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.thDay,
                            { color: isWeekend ? colors.accent : colors.textSecondary },
                          ]}
                        >
                          {d}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Employee Rows */}
                {employees.map((emp, index) => (
                  <View
                    key={emp.id}
                    style={[
                      styles.tableDataRow,
                      { borderBottomColor: colors.divider || 'rgba(100,100,100,0.1)' },
                      index % 2 === 1 && {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.015)' : 'rgba(248,250,252,0.6)',
                      },
                    ]}
                  >
                    <View style={styles.tdEmpInfo}>
                      <View
                        style={[
                          styles.avatar,
                          { backgroundColor: getAvatarBg(index) },
                        ]}
                      >
                        <Text style={styles.avatarText}>{getInitials(emp.name)}</Text>
                      </View>
                      <View style={styles.empNameContainer}>
                        <Text
                          style={[styles.empNameText, { color: colors.textPrimary }]}
                          numberOfLines={1}
                        >
                          {emp.name}
                        </Text>
                      </View>
                    </View>

                    {daysInMonth.map(day => {
                      const st = getEmpDayStatus(emp.id, day);
                      const info = getStatusStyle(st);
                      const isWeekend = day % 7 === 0 || day % 7 === 6;

                      return (
                        <View
                          key={day}
                          style={[
                            styles.cellWrapper,
                            isWeekend && { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(241,245,249,0.5)' },
                          ]}
                        >
                          <View
                            style={[
                              styles.statusCell,
                              { backgroundColor: info.bg, borderColor: info.border },
                            ]}
                          >
                            <Text style={[styles.statusCellText, { color: info.text }]}>
                              {st}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
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
  monthBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  monthBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
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
  recordCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(100,100,100,0.08)',
  },
  recordCountText: {
    fontSize: 10,
    fontWeight: '600',
  },
  monthChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  monthChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  legendBadgeCode: {
    fontSize: 11,
    fontWeight: '900',
  },
  legendBadgeLabel: {
    fontSize: 11,
    fontWeight: '600',
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
  tableGrid: {
    minWidth: 1180,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  thEmp: {
    width: 170,
    fontWeight: '800',
    fontSize: 12,
    paddingLeft: 4,
  },
  thDayContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    borderRadius: 4,
  },
  thDay: {
    fontWeight: '700',
    fontSize: 11,
    textAlign: 'center',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tdEmpInfo: {
    width: 170,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  empNameContainer: {
    flex: 1,
  },
  empNameText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cellWrapper: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  statusCell: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCellText: {
    fontSize: 9,
    fontWeight: '900',
  },
});
