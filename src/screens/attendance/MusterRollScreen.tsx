import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
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
import { useMusterRoll } from '../../api/hook/useAttendance';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MusterRoll'>;

export type AttendanceStatus = 'P' | 'A' | 'L' | 'WO' | 'HD' | 'LV' | '-';

export const MusterRollScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  // Modal detail for clicked cell
  const [modalDetail, setModalDetail] = useState<{
    visible: boolean;
    empName?: string;
    empDesignation?: string;
    date?: string;
    status?: AttendanceStatus;
    inTime?: string | null;
    outTime?: string | null;
    workedHours?: number;
    details?: string;
  }>({ visible: false });

  // TanStack Query for Dynamic Muster Roll Data from backend
  const { data: musterRes, isLoading, isRefetching, refetch } = useMusterRoll(selectedMonth, selectedYear);
  const musterData = musterRes?.data;
  const employees = musterData?.employees || [];
  const summary = musterData?.summary || {
    totalStaff: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    halfDayToday: 0,
    leaveToday: 0,
    weekOffToday: 0,
    totalPresentDays: 0,
    totalLateDays: 0,
    totalHalfDays: 0,
    totalAbsentDays: 0,
    totalWeekOffDays: 0,
    totalLeaveDays: 0,
  };

  const daysCount = musterData?.daysInMonth || new Date(selectedYear, selectedMonth, 0).getDate();
  const daysInMonth = Array.from({ length: daysCount }, (_, i) => i + 1);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonthLabel = `${monthNames[selectedMonth - 1]} ${selectedYear}`;

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const getStatusStyle = (st: AttendanceStatus) => {
    switch (st) {
      case 'P':
        return {
          bg: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5',
          text: isDark ? '#34d399' : '#059669',
          border: isDark ? 'rgba(52, 211, 153, 0.4)' : '#a7f3d0',
          label: 'Present',
        };
      case 'A':
        return {
          bg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2',
          text: isDark ? '#f87171' : '#dc2626',
          border: isDark ? 'rgba(248, 113, 113, 0.4)' : '#fecaca',
          label: 'Absent',
        };
      case 'L':
        return {
          bg: isDark ? 'rgba(234, 179, 8, 0.2)' : '#fefce8',
          text: isDark ? '#facc15' : '#ca8a04',
          border: isDark ? 'rgba(250, 204, 21, 0.4)' : '#fef08a',
          label: 'Late (Grace)',
        };
      case 'HD':
        return {
          bg: isDark ? 'rgba(249, 115, 22, 0.2)' : '#fff7ed',
          text: isDark ? '#fb923c' : '#ea580c',
          border: isDark ? 'rgba(251, 146, 60, 0.4)' : '#fed7aa',
          label: 'Half Day (<8h / >15m)',
        };
      case 'LV':
        return {
          bg: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff',
          text: isDark ? '#60a5fa' : '#2563eb',
          border: isDark ? 'rgba(96, 165, 250, 0.4)' : '#bfdbfe',
          label: 'Leave',
        };
      case 'WO':
        return {
          bg: isDark ? 'rgba(148, 163, 184, 0.12)' : '#f1f5f9',
          text: isDark ? '#94a3b8' : '#64748b',
          border: isDark ? 'rgba(148, 163, 184, 0.25)' : '#e2e8f0',
          label: 'Week Off',
        };
      case '-':
      default:
        return {
          bg: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
          text: isDark ? '#64748b' : '#94a3b8',
          border: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9',
          label: 'Upcoming',
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
            Dynamic Roster Matrix & Shift Tracking
          </Text>
        </View>
        <View style={[styles.monthBadge, { backgroundColor: colors.statAttendanceBg }]}>
          <Text style={[styles.monthBadgeText, { color: colors.accent }]}>{currentMonthLabel}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.accent} />
        }
      >
        {/* KPI Stats Summary Cards */}
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{summary.totalStaff}</Text>
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
              <Text style={[styles.statValue, { color: '#10b981' }]}>{summary.presentToday}</Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Present Today</Text>
            <Text style={[styles.statSubLabel, { color: colors.textSecondary }]}>{summary.totalPresentDays} mo. days</Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.statValueRow}>
              <View style={[styles.miniDot, { backgroundColor: '#ef4444' }]} />
              <Text style={[styles.statValue, { color: '#ef4444' }]}>{summary.absentToday}</Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Absent Today</Text>
            <Text style={[styles.statSubLabel, { color: colors.textSecondary }]}>{summary.totalAbsentDays} mo. days</Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.statValueRow}>
              <View style={[styles.miniDot, { backgroundColor: '#eab308' }]} />
              <Text style={[styles.statValue, { color: '#eab308' }]}>{summary.lateToday}</Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Late Today</Text>
            <Text style={[styles.statSubLabel, { color: colors.textSecondary }]}>{summary.totalLateDays} mo. days</Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.statValueRow}>
              <View style={[styles.miniDot, { backgroundColor: '#f97316' }]} />
              <Text style={[styles.statValue, { color: '#f97316' }]}>{summary.halfDayToday}</Text>
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Half Day Today</Text>
            <Text style={[styles.statSubLabel, { color: colors.textSecondary }]}>{summary.totalHalfDays} mo. days</Text>
          </View>
        </View>

        {/* Dynamic Month Selector Bar */}
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
            <View style={styles.monthNavRow}>
              <TouchableOpacity
                style={[styles.navArrowBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }]}
                onPress={handlePrevMonth}
                activeOpacity={0.7}
              >
                <Text style={[styles.navArrowText, { color: colors.textPrimary }]}>◀ Prev</Text>
              </TouchableOpacity>
              <Text style={[styles.navCurrentLabel, { color: colors.accent }]}>
                {monthNames[selectedMonth - 1]} {selectedYear}
              </Text>
              <TouchableOpacity
                style={[styles.navArrowBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }]}
                onPress={handleNextMonth}
                activeOpacity={0.7}
              >
                <Text style={[styles.navArrowText, { color: colors.textPrimary }]}>Next ▶</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(mNum => {
              const isSelected = selectedMonth === mNum;
              return (
                <TouchableOpacity
                  key={mNum}
                  style={[
                    styles.monthChip,
                    {
                      backgroundColor: isSelected ? colors.accent : (isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'),
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setSelectedMonth(mNum)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.monthChipText,
                      { color: isSelected ? '#ffffff' : colors.textPrimary },
                    ]}
                  >
                    {monthNames[mNum - 1].slice(0, 3)} {selectedYear}
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
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>📌 Attendance Legend & Shift Rules</Text>
          <View style={styles.legendRow}>
            {(['P', 'A', 'L', 'HD', 'WO', 'LV'] as AttendanceStatus[]).map(st => {
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
          <Text style={[styles.rulesHelperText, { color: colors.textSecondary }]}>
            • Shift starts at 09:30 AM (10-15m grace accepted as Late 'L'; &gt;15m late automatically marked Half Day 'HD').{'\n'}
            • Logout before 8 hours worked automatically counts as Half Day 'HD' (&gt;=8 hours = Full Day).{'\n'}
            • Forgot to logout? System automatically records Punch-Out at 12:00 AM midnight.
          </Text>
        </View>

        {/* Muster Matrix Grid Table */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                📊 Monthly Muster Matrix ({currentMonthLabel})
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Tap any cell to view punch-in, punch-out, and worked hours detail
              </Text>
            </View>
            <View style={styles.recordCountPill}>
              <Text style={[styles.recordCountText, { color: colors.textSecondary }]}>
                {employees.length} Staff
              </Text>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Calculating dynamic attendance matrix...
              </Text>
            </View>
          ) : employees.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No employee records found for this period.
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View style={styles.tableGrid}>
                {/* Day Numbers & Summary Header Row */}
                <View style={[styles.tableHeaderRow, { borderBottomColor: colors.cardBorder }]}>
                  <Text style={[styles.thEmp, { color: colors.textPrimary }]}>Employee Name</Text>
                  
                  {/* Days 1 to 31 */}
                  {daysInMonth.map(d => {
                    const dateObj = new Date(selectedYear, selectedMonth - 1, d);
                    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
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

                  {/* Calculated Totals Header Columns */}
                  <View style={styles.summaryHeadersGroup}>
                    <View style={[styles.thSummaryBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                      <Text style={[styles.thSummaryText, { color: '#10b981' }]}>P</Text>
                    </View>
                    <View style={[styles.thSummaryBadge, { backgroundColor: 'rgba(234, 179, 8, 0.15)' }]}>
                      <Text style={[styles.thSummaryText, { color: '#eab308' }]}>L</Text>
                    </View>
                    <View style={[styles.thSummaryBadge, { backgroundColor: 'rgba(249, 115, 22, 0.15)' }]}>
                      <Text style={[styles.thSummaryText, { color: '#f97316' }]}>HD</Text>
                    </View>
                    <View style={[styles.thSummaryBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                      <Text style={[styles.thSummaryText, { color: '#ef4444' }]}>A</Text>
                    </View>
                    <View style={[styles.thSummaryBadge, { backgroundColor: 'rgba(148, 163, 184, 0.15)' }]}>
                      <Text style={[styles.thSummaryText, { color: '#94a3b8' }]}>WO</Text>
                    </View>
                    <View style={[styles.thSummaryBadge, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                      <Text style={[styles.thSummaryText, { color: '#3b82f6' }]}>LV</Text>
                    </View>
                    <View style={[styles.thSummaryBadge, { backgroundColor: 'rgba(168, 85, 247, 0.15)', width: 44 }]}>
                      <Text style={[styles.thSummaryText, { color: '#a855f7' }]}>Hrs</Text>
                    </View>
                  </View>
                </View>

                {/* Employee Rows with Dynamic Days and Totals */}
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
                    {/* Employee Info Column */}
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
                        <Text style={[styles.empDeptText, { color: colors.textSecondary }]} numberOfLines={1}>
                          {emp.designation || emp.department || 'Staff'}
                        </Text>
                      </View>
                    </View>

                    {/* Day Cells 1 to 31 */}
                    {daysInMonth.map(dayNum => {
                      const dayDetail = emp.days?.[dayNum - 1];
                      const st = (dayDetail?.status || '-') as AttendanceStatus;
                      const info = getStatusStyle(st);
                      const dateObj = new Date(selectedYear, selectedMonth - 1, dayNum);
                      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                      return (
                        <TouchableOpacity
                          key={dayNum}
                          style={[
                            styles.cellWrapper,
                            isWeekend && { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(241,245,249,0.5)' },
                          ]}
                          activeOpacity={0.7}
                          onPress={() => {
                            if (dayDetail) {
                              setModalDetail({
                                visible: true,
                                empName: emp.name,
                                empDesignation: emp.designation || emp.department,
                                date: dayDetail.date,
                                status: st,
                                inTime: dayDetail.inTime,
                                outTime: dayDetail.outTime,
                                workedHours: dayDetail.workedHours,
                                details: dayDetail.details,
                              });
                            }
                          }}
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
                        </TouchableOpacity>
                      );
                    })}

                    {/* Calculated Counts per Employee */}
                    <View style={styles.summaryCountsGroup}>
                      <View style={[styles.tdSummaryBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                        <Text style={[styles.tdSummaryText, { color: '#10b981' }]}>{emp.counts?.present || 0}</Text>
                      </View>
                      <View style={[styles.tdSummaryBadge, { backgroundColor: 'rgba(234, 179, 8, 0.12)' }]}>
                        <Text style={[styles.tdSummaryText, { color: '#eab308' }]}>{emp.counts?.late || 0}</Text>
                      </View>
                      <View style={[styles.tdSummaryBadge, { backgroundColor: 'rgba(249, 115, 22, 0.12)' }]}>
                        <Text style={[styles.tdSummaryText, { color: '#f97316' }]}>{emp.counts?.halfDay || 0}</Text>
                      </View>
                      <View style={[styles.tdSummaryBadge, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                        <Text style={[styles.tdSummaryText, { color: '#ef4444' }]}>{emp.counts?.absent || 0}</Text>
                      </View>
                      <View style={[styles.tdSummaryBadge, { backgroundColor: 'rgba(148, 163, 184, 0.12)' }]}>
                        <Text style={[styles.tdSummaryText, { color: '#94a3b8' }]}>{emp.counts?.weekOff || 0}</Text>
                      </View>
                      <View style={[styles.tdSummaryBadge, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
                        <Text style={[styles.tdSummaryText, { color: '#3b82f6' }]}>{emp.counts?.leave || 0}</Text>
                      </View>
                      <View style={[styles.tdSummaryBadge, { backgroundColor: 'rgba(168, 85, 247, 0.12)', width: 44 }]}>
                        <Text style={[styles.tdSummaryText, { color: '#a855f7' }]}>{emp.counts?.totalWorkedHours || 0}h</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Attendance Day Details Modal */}
      <Modal
        visible={modalDetail.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalDetail({ visible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalEmpName, { color: colors.textPrimary }]}>{modalDetail.empName}</Text>
                <Text style={[styles.modalDate, { color: colors.textSecondary }]}>
                  {modalDetail.date} • {modalDetail.empDesignation || 'Staff'}
                </Text>
              </View>
              {modalDetail.status && (
                <View
                  style={[
                    styles.modalStatusPill,
                    {
                      backgroundColor: getStatusStyle(modalDetail.status).bg,
                      borderColor: getStatusStyle(modalDetail.status).border,
                    },
                  ]}
                >
                  <Text style={[styles.modalStatusCode, { color: getStatusStyle(modalDetail.status).text }]}>
                    {modalDetail.status}
                  </Text>
                  <Text style={[styles.modalStatusLabel, { color: colors.textPrimary }]}>
                    {getStatusStyle(modalDetail.status).label}
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.modalDivider, { backgroundColor: colors.cardBorder }]} />

            <View style={styles.modalBody}>
              <View style={styles.modalInfoRow}>
                <Text style={[styles.modalInfoLabel, { color: colors.textSecondary }]}>Punch In Time:</Text>
                <Text style={[styles.modalInfoValue, { color: colors.textPrimary }]}>
                  {modalDetail.inTime || '—'}
                </Text>
              </View>

              <View style={styles.modalInfoRow}>
                <Text style={[styles.modalInfoLabel, { color: colors.textSecondary }]}>Punch Out Time:</Text>
                <Text style={[styles.modalInfoValue, { color: colors.textPrimary }]}>
                  {modalDetail.outTime || '—'}
                </Text>
              </View>

              <View style={styles.modalInfoRow}>
                <Text style={[styles.modalInfoLabel, { color: colors.textSecondary }]}>Worked Hours:</Text>
                <Text style={[styles.modalInfoValue, { color: colors.accent, fontWeight: '800' }]}>
                  {modalDetail.workedHours !== undefined ? `${modalDetail.workedHours} hrs` : '0 hrs'}
                </Text>
              </View>

              <View style={styles.modalReasonCard}>
                <Text style={[styles.modalReasonTitle, { color: colors.textSecondary }]}>Evaluation Rule / Details:</Text>
                <Text style={[styles.modalReasonText, { color: colors.textPrimary }]}>
                  {modalDetail.details || 'Standard roster calculation'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.modalCloseButton, { backgroundColor: colors.accent }]}
              onPress={() => setModalDetail({ visible: false })}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCloseButtonText}>Done</Text>
            </TouchableOpacity>
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
    gap: 6,
  },
  statCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
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
    fontSize: 15,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  statSubLabel: {
    fontSize: 8,
    marginTop: 1,
    opacity: 0.7,
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
  cardSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navArrowBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  navArrowText: {
    fontSize: 11,
    fontWeight: '700',
  },
  navCurrentLabel: {
    fontSize: 12,
    fontWeight: '800',
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
    paddingHorizontal: 14,
    paddingVertical: 8,
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
  rulesHelperText: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
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
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  tableGrid: {
    minWidth: 1450,
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
  summaryHeadersGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 4,
  },
  thSummaryBadge: {
    width: 30,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thSummaryText: {
    fontSize: 10,
    fontWeight: '800',
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
  empDeptText: {
    fontSize: 10,
    marginTop: 1,
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
  summaryCountsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 4,
  },
  tdSummaryBadge: {
    width: 30,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tdSummaryText: {
    fontSize: 10,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalEmpName: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalDate: {
    fontSize: 12,
    marginTop: 2,
  },
  modalStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  modalStatusCode: {
    fontSize: 11,
    fontWeight: '900',
  },
  modalStatusLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalDivider: {
    height: 1,
    marginVertical: 14,
  },
  modalBody: {
    gap: 10,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalInfoLabel: {
    fontSize: 13,
  },
  modalInfoValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalReasonCard: {
    backgroundColor: 'rgba(100,100,100,0.06)',
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  modalReasonTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  modalReasonText: {
    fontSize: 12,
    lineHeight: 16,
  },
  modalCloseButton: {
    marginTop: 18,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
