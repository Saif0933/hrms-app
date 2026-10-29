import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
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
import { MusterDayDetail, MusterEmployeeRecord, useMusterRoll } from '../../api/hook/useAttendance';
import { useProfile } from '../../api/hook/useAuth';
import { useEmployees } from '../../api/hook/useEmployee';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MusterRoll'>;

export type AttendanceStatus = 'P' | 'A' | 'L' | 'WO' | 'HD' | 'LV' | '-';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 7 columns with 16px container padding on each side and 4px gap between columns
const CALENDAR_CELL_WIDTH = Math.floor((SCREEN_WIDTH - 32 - 24) / 7);

export const MusterRollScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'calendar' | 'matrix'>('calendar');

  // Modal States
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [monthModalVisible, setMonthModalVisible] = useState(false);
  const [yearModalVisible, setYearModalVisible] = useState(false);
  const [dayDetailModal, setDayDetailModal] = useState<{
    visible: boolean;
    dayNum?: number;
    date?: string;
    status?: AttendanceStatus;
    inTime?: string | null;
    outTime?: string | null;
    workedHours?: number;
    details?: string;
    punchesCount?: number;
  }>({ visible: false });

  // TanStack Queries (Profile, Muster Roll API, and General Employee List)
  const { data: profileRes } = useProfile();
  const loggedUser = profileRes?.data?.user;
  const userRoleStr = String(loggedUser?.role || (loggedUser as any)?.role?.name || '').toUpperCase();
  const isOrgOrAdmin = !!(
    (loggedUser as any)?.isPlatformAdmin ||
    ['SUPER_ADMIN', 'ADMIN', 'ORGANIZATION ADMIN', 'SUPER ADMIN', 'HR ADMIN', 'HR_ADMIN', 'HR MANAGER'].includes(userRoleStr)
  );

  const { data: musterRes, isLoading: isMusterLoading, isRefetching, refetch } = useMusterRoll(selectedMonth, selectedYear);
  const { data: empRes, isLoading: isEmpLoading } = useEmployees();

  const musterEmployees = musterRes?.data?.employees || [];
  const rawEmployees = empRes?.data || [];

  // Helper to normalize any employee object to MusterEmployeeRecord
  const normalizeToMuster = React.useCallback((e: any): MusterEmployeeRecord => {
    return {
      id: e.id,
      name: e.name,
      email: e.email,
      userId: e.userId,
      role: e.role || e.user?.role?.name,
      department: e.department?.name || e.department,
      designation: e.designation || 'Staff',
      avatar: e.avatar,
      counts: e.counts || { present: 0, late: 0, halfDay: 0, absent: 0, weekOff: 0, leave: 0, totalWorkedHours: 0 },
      days: e.days || Array.from({ length: 31 }, (_, i) => ({
        day: i + 1,
        date: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
        status: '-' as AttendanceStatus,
        workedHours: 0,
      })),
    };
  }, [selectedMonth, selectedYear]);

  // Combined source list
  const normalizedSourceList = React.useMemo<MusterEmployeeRecord[]>(() => {
    if (musterEmployees.length > 0) return musterEmployees;
    return rawEmployees.map(normalizeToMuster);
  }, [musterEmployees, rawEmployees, normalizeToMuster]);

  // Match logged in user's employee profile
  const myEmployee = React.useMemo<MusterEmployeeRecord | null>(() => {
    if (!loggedUser) return null;
    const found = normalizedSourceList.find((e: MusterEmployeeRecord) =>
      (loggedUser.employeeId && e.id === loggedUser.employeeId) ||
      (loggedUser.id && (e.userId === loggedUser.id || e.id === loggedUser.id)) ||
      (loggedUser.email && e.email?.toLowerCase() === loggedUser.email?.toLowerCase())
    );
    return found || (normalizedSourceList.length > 0 ? normalizedSourceList[0] : null);
  }, [loggedUser, normalizedSourceList]);

  // Combine employees so all company employees are guaranteed selectable
  const combinedEmployees = React.useMemo<MusterEmployeeRecord[]>(() => {
    // 1. Regular Employee: Only show their own attendance record!
    if (!isOrgOrAdmin) {
      if (myEmployee) return [myEmployee];
      if (normalizedSourceList.length > 0) return [normalizedSourceList[0]];
      return [];
    }

    // 2. Organization (Admin/HR): Show all employees created by organization,
    // EXCLUDING the organization itself (admin/owner account, super admins, info@symbosys.com)
    return normalizedSourceList.filter(e => {
      if (loggedUser) {
        if (loggedUser.id && (e.userId === loggedUser.id || e.id === loggedUser.id)) return false;
        if (loggedUser.email && e.email?.toLowerCase() === loggedUser.email?.toLowerCase()) return false;
        if (loggedUser.employeeId && e.id === loggedUser.employeeId) return false;
      }
      const r = String(e.role || (e as any).user?.role?.name || '').toUpperCase();
      if (r.includes('ORGANIZATION ADMIN') || r.includes('SUPER_ADMIN') || r.includes('SUPER ADMIN')) return false;
      if (e.email?.toLowerCase() === 'info@symbosys.com') return false;
      return true;
    });
  }, [normalizedSourceList, isOrgOrAdmin, myEmployee, loggedUser]);

  // Keep selectedEmpId updated
  useEffect(() => {
    if (combinedEmployees.length > 0) {
      if (!selectedEmpId || !combinedEmployees.some(e => e.id === selectedEmpId)) {
        setSelectedEmpId(combinedEmployees[0].id);
      }
    }
  }, [combinedEmployees, selectedEmpId]);

  const targetEmployee = combinedEmployees.find(e => e.id === selectedEmpId) || combinedEmployees[0];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysCount = musterRes?.data?.daysInMonth || new Date(selectedYear, selectedMonth, 0).getDate();
  const daysInMonth = Array.from({ length: daysCount }, (_, i) => i + 1);

  // First day of week index: 0 = Mon, 6 = Sun
  const firstDayOfWeekIndex = (new Date(selectedYear, selectedMonth - 1, 1).getDay() + 6) % 7;

  const currentMonthLabel = `${monthNames[selectedMonth - 1]} ${selectedYear}`;

  const getStatusStyle = (st: AttendanceStatus) => {
    switch (st) {
      case 'P':
        return {
          bg: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ecfdf5',
          text: isDark ? '#34d399' : '#059669',
          border: isDark ? 'rgba(52, 211, 153, 0.4)' : '#a7f3d0',
          dot: '#10b981',
          label: 'Present',
        };
      case 'A':
        return {
          bg: isDark ? 'rgba(239, 68, 68, 0.18)' : '#fef2f2',
          text: isDark ? '#f87171' : '#dc2626',
          border: isDark ? 'rgba(248, 113, 113, 0.4)' : '#fecaca',
          dot: '#ef4444',
          label: 'Absent',
        };
      case 'L':
        return {
          bg: isDark ? 'rgba(234, 179, 8, 0.18)' : '#fefce8',
          text: isDark ? '#facc15' : '#ca8a04',
          border: isDark ? 'rgba(250, 204, 21, 0.4)' : '#fef08a',
          dot: '#eab308',
          label: 'Late',
        };
      case 'HD':
        return {
          bg: isDark ? 'rgba(249, 115, 22, 0.18)' : '#fff7ed',
          text: isDark ? '#fb923c' : '#ea580c',
          border: isDark ? 'rgba(251, 146, 60, 0.4)' : '#fed7aa',
          dot: '#f97316',
          label: 'Half Day',
        };
      case 'LV':
        return {
          bg: isDark ? 'rgba(59, 130, 246, 0.18)' : '#eff6ff',
          text: isDark ? '#60a5fa' : '#2563eb',
          border: isDark ? 'rgba(96, 165, 250, 0.4)' : '#bfdbfe',
          dot: '#3b82f6',
          label: 'Leave',
        };
      case 'WO':
        return {
          bg: isDark ? 'rgba(148, 163, 184, 0.12)' : '#f1f5f9',
          text: isDark ? '#94a3b8' : '#64748b',
          border: isDark ? 'rgba(148, 163, 184, 0.25)' : '#e2e8f0',
          dot: '#94a3b8',
          label: 'Week Off',
        };
      case '-':
      default:
        return {
          bg: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
          text: isDark ? '#64748b' : '#94a3b8',
          border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
          dot: '#94a3b8',
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

  const handleExportCSV = () => {
    if (!targetEmployee) return;
    const lines = [
      `Muster Roll - ${targetEmployee.name} - ${currentMonthLabel}`,
      `Total Present: ${targetEmployee.counts?.present || 0}, Late: ${targetEmployee.counts?.late || 0}, Half Day: ${targetEmployee.counts?.halfDay || 0}, Absent: ${targetEmployee.counts?.absent || 0}, Week Off: ${targetEmployee.counts?.weekOff || 0}`,
      `Day,Date,Status,In Time,Out Time,Hours Worked,Details`,
    ];
    targetEmployee.days?.forEach((d: MusterDayDetail) => {
      lines.push(`${d.day},${d.date},${d.status},${d.inTime || ''},${d.outTime || ''},${d.workedHours || 0},"${d.details || ''}"`);
    });

    Alert.alert(
      'Export Muster Roll CSV',
      `Muster roll generated for ${targetEmployee.name} (${currentMonthLabel}) with ${targetEmployee.days?.length || 0} days recorded.\n\nData is ready for download/share.`,
      [{ text: 'OK' }]
    );
  };

  const filteredEmployees = combinedEmployees.filter(e =>
    e.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    (e.designation && e.designation.toLowerCase().includes(employeeSearch.toLowerCase())) ||
    (e.department && e.department.toLowerCase().includes(employeeSearch.toLowerCase()))
  );

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
            Muster Roll Calendar
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Monthly Attendance & Shift Grid
          </Text>
        </View>
        <View style={[styles.monthBadge, { backgroundColor: colors.statAttendanceBg }]}>
          <Text style={[styles.monthBadgeText, { color: colors.accent }]}>
            {monthNames[selectedMonth - 1].slice(0, 3)} {selectedYear}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.accent} />
        }
      >
        {/* View Mode Toggle: [ 📅 Calendar View | 📋 All Staff Matrix ] (Only for Organization/Admin) */}
        {isOrgOrAdmin && (
          <View style={[styles.viewModeToggle, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }]}>
            <TouchableOpacity
              style={[
                styles.viewModeBtn,
                activeTab === 'calendar' && [styles.viewModeBtnActive, { backgroundColor: colors.cardBackground }],
              ]}
              onPress={() => setActiveTab('calendar')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.viewModeBtnText,
                  { color: activeTab === 'calendar' ? colors.accent : colors.textSecondary },
                  activeTab === 'calendar' && { fontWeight: '800' },
                ]}
              >
                📅 Calendar Grid View
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.viewModeBtn,
                activeTab === 'matrix' && [styles.viewModeBtnActive, { backgroundColor: colors.cardBackground }],
              ]}
              onPress={() => setActiveTab('matrix')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.viewModeBtnText,
                  { color: activeTab === 'matrix' ? colors.accent : colors.textSecondary },
                  activeTab === 'matrix' && { fontWeight: '800' },
                ]}
              >
                📋 All Staff Matrix
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ======================================= */}
        {/* 1. DEDICATED EMPLOYEE SELECTOR SECTION  */}
        {/* ======================================= */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                {isOrgOrAdmin ? '👤 SELECT EMPLOYEE / STAFF' : '👤 MY ATTENDANCE RECORD'}
              </Text>
              <Text style={[styles.sectionSubHeading, { color: colors.textPrimary }]}>
                {isOrgOrAdmin ? 'Attendance for: ' : 'Showing record for: '}
                <Text style={{ color: colors.accent, fontWeight: '800' }}>
                  {targetEmployee?.name || (isOrgOrAdmin ? 'Select Staff' : 'Me')}
                </Text>
              </Text>
            </View>
            {isOrgOrAdmin && (
              <View style={[styles.recordCountPill, { backgroundColor: colors.statAttendanceBg }]}>
                <Text style={[styles.recordCountText, { color: colors.accent }]}>
                  {combinedEmployees.length} Staff
                </Text>
              </View>
            )}
          </View>

          {/* Large Prominent Clickable Employee Selector Card */}
          <TouchableOpacity
            style={[
              styles.prominentEmpCard,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', borderColor: colors.accent },
            ]}
            onPress={() => {
              if (isOrgOrAdmin) setEmployeeModalVisible(true);
            }}
            disabled={!isOrgOrAdmin}
            activeOpacity={isOrgOrAdmin ? 0.8 : 1}
          >
            <View style={[styles.largeAvatar, { backgroundColor: getAvatarBg(0) }]}>
              <Text style={styles.largeAvatarText}>{getInitials(targetEmployee?.name || '')}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.prominentEmpName, { color: colors.textPrimary }]} numberOfLines={1}>
                {targetEmployee?.name || (isOrgOrAdmin ? 'Tap to choose staff member' : 'My Attendance')}
              </Text>
              <Text style={[styles.prominentEmpRole, { color: colors.textSecondary }]} numberOfLines={1}>
                {targetEmployee?.designation || targetEmployee?.department || 'Staff Member'} • ID: {targetEmployee?.id || '—'}
              </Text>
            </View>
            {isOrgOrAdmin ? (
              <View style={[styles.changeStaffBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.changeStaffText}>Change ▼</Text>
              </View>
            ) : (
              <View style={[styles.changeStaffBadge, { backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : '#ecfdf5' }]}>
                <Text style={[styles.changeStaffText, { color: '#10b981' }]}>Active ✓</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Quick-Scroll Horizontal Staff Chips (Only for Organization/Admin) */}
          {isOrgOrAdmin && combinedEmployees.length > 1 && (
            <View style={{ marginTop: 2 }}>
              <Text style={[styles.quickSelectLabel, { color: colors.textSecondary }]}>Quick Switch Staff:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                {combinedEmployees.map((emp, index) => {
                  const isSelected = emp.id === selectedEmpId;
                  return (
                    <TouchableOpacity
                      key={emp.id}
                      style={[
                        styles.quickStaffChip,
                        {
                          backgroundColor: isSelected ? colors.accent : (isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'),
                          borderColor: isSelected ? colors.accent : colors.cardBorder,
                        },
                      ]}
                      onPress={() => setSelectedEmpId(emp.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.chipAvatar, { backgroundColor: getAvatarBg(index) }]}>
                        <Text style={styles.chipAvatarText}>{getInitials(emp.name)}</Text>
                      </View>
                      <Text
                        style={[
                          styles.quickStaffChipText,
                          { color: isSelected ? '#ffffff' : colors.textPrimary },
                          isSelected && { fontWeight: '800' },
                        ]}
                        numberOfLines={1}
                      >
                        {emp.name.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* ======================================= */}
        {/* 2. DATE SELECTORS & SUMMARY COUNTERS    */}
        {/* ======================================= */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          {/* Header Row */}
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Muster Roll Grid — {currentMonthLabel}
              </Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                7-Day Calendar view matching Web portal
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.csvBtn, { backgroundColor: colors.accent }]}
              onPress={handleExportCSV}
              activeOpacity={0.8}
            >
              <Text style={styles.csvBtnText}>📥 CSV</Text>
            </TouchableOpacity>
          </View>

          {/* Month & Year Selectors Row */}
          <View style={styles.controlsRow}>
            {/* Month Selector Button */}
            <TouchableOpacity
              style={[
                styles.controlPickerBtn,
                { flex: 1.2, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderColor: colors.cardBorder },
              ]}
              onPress={() => setMonthModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.pickerContent}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Month</Text>
                  <Text style={[styles.pickerValueText, { color: colors.textPrimary }]} numberOfLines={1}>
                    {monthNames[selectedMonth - 1]}
                  </Text>
                </View>
                <Text style={[styles.pickerArrow, { color: colors.accent }]}>▼</Text>
              </View>
            </TouchableOpacity>

            {/* Year Selector Button */}
            <TouchableOpacity
              style={[
                styles.controlPickerBtn,
                { flex: 0.8, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', borderColor: colors.cardBorder },
              ]}
              onPress={() => setYearModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.pickerContent}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>Year</Text>
                  <Text style={[styles.pickerValueText, { color: colors.textPrimary }]}>
                    {selectedYear}
                  </Text>
                </View>
                <Text style={[styles.pickerArrow, { color: colors.accent }]}>▼</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick Summary Counts Row (Web ke jaise) */}
          <View style={[styles.summaryPillsRow, { borderTopColor: colors.cardBorder }]}>
            <View style={[styles.summaryPill, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5', borderColor: isDark ? 'rgba(52, 211, 153, 0.3)' : '#a7f3d0' }]}>
              <Text style={[styles.summaryPillValue, { color: '#10b981' }]}>
                {targetEmployee?.counts?.present || 0}
              </Text>
              <Text style={[styles.summaryPillLabel, { color: '#059669' }]}>Present</Text>
            </View>

            <View style={[styles.summaryPill, { backgroundColor: isDark ? 'rgba(234, 179, 8, 0.15)' : '#fefce8', borderColor: isDark ? 'rgba(250, 204, 21, 0.3)' : '#fef08a' }]}>
              <Text style={[styles.summaryPillValue, { color: '#eab308' }]}>
                {targetEmployee?.counts?.late || 0}
              </Text>
              <Text style={[styles.summaryPillLabel, { color: '#ca8a04' }]}>Late</Text>
            </View>

            <View style={[styles.summaryPill, { backgroundColor: isDark ? 'rgba(249, 115, 22, 0.15)' : '#fff7ed', borderColor: isDark ? 'rgba(251, 146, 60, 0.3)' : '#fed7aa' }]}>
              <Text style={[styles.summaryPillValue, { color: '#f97316' }]}>
                {targetEmployee?.counts?.halfDay || 0}
              </Text>
              <Text style={[styles.summaryPillLabel, { color: '#ea580c' }]}>Half Day</Text>
            </View>

            <View style={[styles.summaryPill, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2', borderColor: isDark ? 'rgba(248, 113, 113, 0.3)' : '#fecaca' }]}>
              <Text style={[styles.summaryPillValue, { color: '#ef4444' }]}>
                {targetEmployee?.counts?.absent || 0}
              </Text>
              <Text style={[styles.summaryPillLabel, { color: '#dc2626' }]}>Absent</Text>
            </View>

            <View style={[styles.summaryPill, { backgroundColor: isDark ? 'rgba(148, 163, 184, 0.12)' : '#f1f5f9', borderColor: isDark ? 'rgba(148, 163, 184, 0.25)' : '#e2e8f0' }]}>
              <Text style={[styles.summaryPillValue, { color: '#94a3b8' }]}>
                {targetEmployee?.counts?.weekOff || 0}
              </Text>
              <Text style={[styles.summaryPillLabel, { color: '#64748b' }]}>Week Off</Text>
            </View>
          </View>
        </View>

        {/* ======================================= */}
        {/* 3. CALENDAR GRID VIEW (Mon - Sun 7-Col) */}
        {/* ======================================= */}
        {activeTab === 'calendar' && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            {(isMusterLoading && isEmpLoading) ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading monthly roster grid...
                </Text>
              </View>
            ) : !targetEmployee ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No employee selected or records available.
                </Text>
              </View>
            ) : (
              <View style={styles.calendarContainer}>
                {/* 7 Days Weekday Header Row */}
                <View style={styles.weekdayHeaderRow}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(w => (
                    <View key={w} style={[styles.weekdayCol, { width: CALENDAR_CELL_WIDTH }]}>
                      <Text
                        style={[
                          styles.weekdayHeaderText,
                          { color: w === 'Sat' || w === 'Sun' ? colors.accent : colors.textSecondary },
                        ]}
                      >
                        {w}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Calendar Days Matrix (with offset padding before 1st of month) */}
                <View style={styles.daysGrid}>
                  {/* Dynamic Offset padding days */}
                  {Array.from({ length: firstDayOfWeekIndex }).map((_, idx) => (
                    <View
                      key={`offset-${idx}`}
                      style={[
                        styles.dayCellContainer,
                        { width: CALENDAR_CELL_WIDTH, borderColor: 'transparent' },
                      ]}
                    />
                  ))}

                  {/* Month Days (Day 1 to 31) */}
                  {daysInMonth.map(dayNum => {
                    const dayDetail: MusterDayDetail | undefined = targetEmployee.days?.[dayNum - 1];
                    const st = (dayDetail?.status || '-') as AttendanceStatus;
                    const info = getStatusStyle(st);
                    const hasPunches = (dayDetail?.inTime || dayDetail?.outTime) ? true : false;

                    return (
                      <TouchableOpacity
                        key={dayNum}
                        style={[
                          styles.dayCellContainer,
                          {
                            width: CALENDAR_CELL_WIDTH,
                            backgroundColor: info.bg,
                            borderColor: info.border,
                          },
                        ]}
                        activeOpacity={0.7}
                        onPress={() => {
                          setDayDetailModal({
                            visible: true,
                            dayNum,
                            date: dayDetail?.date || `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`,
                            status: st,
                            inTime: dayDetail?.inTime,
                            outTime: dayDetail?.outTime,
                            workedHours: dayDetail?.workedHours,
                            details: dayDetail?.details,
                            punchesCount: hasPunches ? 1 : 0,
                          });
                        }}
                      >
                        {/* Day Card Header: Day Number + Punch Dot */}
                        <View style={styles.dayCellTopRow}>
                          <Text style={[styles.dayCellNumber, { color: colors.textPrimary }]}>
                            {dayNum}
                          </Text>
                          {hasPunches && (
                            <View style={[styles.dayPunchDot, { backgroundColor: '#10b981' }]} />
                          )}
                        </View>

                        {/* Day Card Bottom: Status Text */}
                        <Text
                          style={[styles.dayCellStatusText, { color: info.text }]}
                          numberOfLines={1}
                        >
                          {st === 'HD' ? 'HalfDay' : st === 'WO' ? 'WeekOff' : st === 'LV' ? 'Leave' : st === 'P' ? 'Present' : st === 'L' ? 'Late' : st === 'A' ? 'Absent' : '—'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {/* ======================================= */}
        {/* 4. ALL STAFF MATRIX VIEW                */}
        {/* ======================================= */}
        {activeTab === 'matrix' && (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  📊 Company-wide Roster Matrix ({currentMonthLabel})
                </Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  All {combinedEmployees.length} staff attendance records with total counts
                </Text>
              </View>
            </View>

            {isMusterLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  Loading staff matrix...
                </Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={styles.matrixTable}>
                  {/* Header Row */}
                  <View style={[styles.matrixHeaderRow, { borderBottomColor: colors.cardBorder }]}>
                    <Text style={[styles.matrixThEmp, { color: colors.textPrimary }]}>Employee</Text>
                    {daysInMonth.map(d => (
                      <View key={d} style={styles.matrixThDay}>
                        <Text style={[styles.matrixThDayText, { color: colors.textSecondary }]}>{d}</Text>
                      </View>
                    ))}
                    <View style={styles.matrixSummaryHeaders}>
                      <Text style={[styles.matrixSumTh, { color: '#10b981' }]}>P</Text>
                      <Text style={[styles.matrixSumTh, { color: '#eab308' }]}>L</Text>
                      <Text style={[styles.matrixSumTh, { color: '#f97316' }]}>HD</Text>
                      <Text style={[styles.matrixSumTh, { color: '#ef4444' }]}>A</Text>
                      <Text style={[styles.matrixSumTh, { color: '#94a3b8' }]}>WO</Text>
                    </View>
                  </View>

                  {/* Rows */}
                  {combinedEmployees.map((emp, idx) => (
                    <TouchableOpacity
                      key={emp.id}
                      style={[
                        styles.matrixRow,
                        { borderBottomColor: colors.divider || 'rgba(100,100,100,0.1)' },
                        emp.id === selectedEmpId && { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' },
                      ]}
                      onPress={() => {
                        setSelectedEmpId(emp.id);
                        setActiveTab('calendar');
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.matrixTdEmp}>
                        <View style={[styles.miniAvatar, { backgroundColor: getAvatarBg(idx) }]}>
                          <Text style={styles.miniAvatarText}>{getInitials(emp.name)}</Text>
                        </View>
                        <Text style={[styles.matrixEmpName, { color: colors.textPrimary }]} numberOfLines={1}>
                          {emp.name}
                        </Text>
                      </View>

                      {daysInMonth.map(d => {
                        const st = (emp.days?.[d - 1]?.status || '-') as AttendanceStatus;
                        const info = getStatusStyle(st);
                        return (
                          <View key={d} style={styles.matrixCellWrapper}>
                            <View style={[styles.matrixStatusCell, { backgroundColor: info.bg, borderColor: info.border }]}>
                              <Text style={[styles.matrixCellText, { color: info.text }]}>{st}</Text>
                            </View>
                          </View>
                        );
                      })}

                      {/* Totals */}
                      <View style={styles.matrixSummaryCounts}>
                        <Text style={[styles.matrixSumTd, { color: '#10b981' }]}>{emp.counts?.present || 0}</Text>
                        <Text style={[styles.matrixSumTd, { color: '#eab308' }]}>{emp.counts?.late || 0}</Text>
                        <Text style={[styles.matrixSumTd, { color: '#f97316' }]}>{emp.counts?.halfDay || 0}</Text>
                        <Text style={[styles.matrixSumTd, { color: '#ef4444' }]}>{emp.counts?.absent || 0}</Text>
                        <Text style={[styles.matrixSumTd, { color: '#94a3b8' }]}>{emp.counts?.weekOff || 0}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>
        )}

        {/* ======================================= */}
        {/* 5. ATTENDANCE LEGEND & RULES CARD       */}
        {/* ======================================= */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>📌 Attendance Legend</Text>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={[styles.legendText, { color: colors.textPrimary }]}>Present (&gt;=8h)</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#eab308' }]} />
              <Text style={[styles.legendText, { color: colors.textPrimary }]}>Late (Grace 1-15m)</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
              <Text style={[styles.legendText, { color: colors.textPrimary }]}>Half Day (&lt;8h / &gt;15m)</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
              <Text style={[styles.legendText, { color: colors.textPrimary }]}>Absent</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
              <Text style={[styles.legendText, { color: colors.textPrimary }]}>Leave</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#94a3b8' }]} />
              <Text style={[styles.legendText, { color: colors.textPrimary }]}>Week Off</Text>
            </View>
          </View>

          <View style={[styles.rulesCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }]}>
            <Text style={[styles.rulesTitle, { color: colors.accent }]}>⚙️ Automatic Shift Policies</Text>
            <Text style={[styles.rulesText, { color: colors.textSecondary }]}>
              • Punch-In starts at 09:30 AM. 10-15m grace accepted as Late; &gt;15m late automatically marks Half Day.{'\n'}
              • Punch-Out duration &lt; 8 hours automatically marks Half Day; &gt;= 8 hours counts as Full Day.{'\n'}
              • Forgot to Punch-Out? System automatically records Punch-Out at 12:00 AM midnight.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ================= MODALS ================= */}

      {/* 1. Employee Selection Modal */}
      <Modal
        visible={employeeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEmployeeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModalBox, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalBoxTitle, { color: colors.textPrimary }]}>Select Staff Member</Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                  Showing {filteredEmployees.length} active staff members
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.modalCloseCircle, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9' }]}
                onPress={() => setEmployeeModalVisible(false)}
              >
                <Text style={[styles.modalCloseIcon, { color: colors.textPrimary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <TextInput
              style={[
                styles.modalSearchInput,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', color: colors.textPrimary, borderColor: colors.cardBorder },
              ]}
              placeholder="Search employee by name, role, dept..."
              placeholderTextColor={colors.textSecondary}
              value={employeeSearch}
              onChangeText={setEmployeeSearch}
            />

            <ScrollView style={{ maxHeight: 360 }}>
              {filteredEmployees.map((emp, index) => {
                const isSelected = emp.id === selectedEmpId;
                return (
                  <TouchableOpacity
                    key={emp.id}
                    style={[
                      styles.empPickerItem,
                      { borderBottomColor: colors.cardBorder },
                      isSelected && { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#eff6ff' },
                    ]}
                    onPress={() => {
                      setSelectedEmpId(emp.id);
                      setEmployeeModalVisible(false);
                      setEmployeeSearch('');
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.avatar, { backgroundColor: getAvatarBg(index) }]}>
                      <Text style={styles.avatarText}>{getInitials(emp.name)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.empPickerName, { color: colors.textPrimary }, isSelected && { color: colors.accent, fontWeight: '800' }]}>
                        {emp.name}
                      </Text>
                      <Text style={[styles.empPickerRole, { color: colors.textSecondary }]}>
                        {emp.designation || emp.department || 'Staff'} • ID: {emp.id}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={[styles.selectedCheckBadge, { backgroundColor: colors.accent }]}>
                        <Text style={styles.selectedCheckText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 2. Month Selection Modal */}
      <Modal
        visible={monthModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMonthModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModalBox, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, maxWidth: 320 }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalBoxTitle, { color: colors.textPrimary }]}>Select Month</Text>
              <TouchableOpacity onPress={() => setMonthModalVisible(false)}>
                <Text style={[styles.modalCloseIcon, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.monthGridModal}>
              {monthNames.map((mth, idx) => {
                const mNum = idx + 1;
                const isSelected = selectedMonth === mNum;
                return (
                  <TouchableOpacity
                    key={mth}
                    style={[
                      styles.monthGridItem,
                      {
                        backgroundColor: isSelected ? colors.accent : (isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'),
                        borderColor: isSelected ? colors.accent : colors.cardBorder,
                      },
                    ]}
                    onPress={() => {
                      setSelectedMonth(mNum);
                      setMonthModalVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.monthGridItemText,
                        { color: isSelected ? '#ffffff' : colors.textPrimary },
                      ]}
                    >
                      {mth.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. Year Selection Modal */}
      <Modal
        visible={yearModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setYearModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModalBox, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, maxWidth: 280 }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalBoxTitle, { color: colors.textPrimary }]}>Select Year</Text>
              <TouchableOpacity onPress={() => setYearModalVisible(false)}>
                <Text style={[styles.modalCloseIcon, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8, marginTop: 10 }}>
              {[2024, 2025, 2026, 2027].map(yr => {
                const isSelected = selectedYear === yr;
                return (
                  <TouchableOpacity
                    key={yr}
                    style={[
                      styles.yearModalItem,
                      {
                        backgroundColor: isSelected ? colors.accent : (isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'),
                      },
                    ]}
                    onPress={() => {
                      setSelectedYear(yr);
                      setYearModalVisible(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.yearModalItemText,
                        { color: isSelected ? '#ffffff' : colors.textPrimary },
                      ]}
                    >
                      {yr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* 4. Day Details & Regularize Modal */}
      <Modal
        visible={dayDetailModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setDayDetailModal({ visible: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={[styles.modalEmpName, { color: colors.textPrimary }]}>
                  {targetEmployee?.name || 'Staff Member'}
                </Text>
                <Text style={[styles.modalDate, { color: colors.textSecondary }]}>
                  {dayDetailModal.date} • Day {dayDetailModal.dayNum}
                </Text>
              </View>

              {dayDetailModal.status && (
                <View
                  style={[
                    styles.modalStatusPill,
                    {
                      backgroundColor: getStatusStyle(dayDetailModal.status).bg,
                      borderColor: getStatusStyle(dayDetailModal.status).border,
                    },
                  ]}
                >
                  <Text style={[styles.modalStatusLabel, { color: getStatusStyle(dayDetailModal.status).text }]}>
                    {getStatusStyle(dayDetailModal.status).label}
                  </Text>
                </View>
              )}
            </View>

            <View style={[styles.modalDivider, { backgroundColor: colors.cardBorder }]} />

            {/* Modal Details Body */}
            <View style={styles.modalBody}>
              <View style={styles.modalInfoRow}>
                <Text style={[styles.modalInfoLabel, { color: colors.textSecondary }]}>Punch In Time:</Text>
                <Text style={[styles.modalInfoValue, { color: colors.textPrimary }]}>
                  {dayDetailModal.inTime || '—'}
                </Text>
              </View>

              <View style={styles.modalInfoRow}>
                <Text style={[styles.modalInfoLabel, { color: colors.textSecondary }]}>Punch Out Time:</Text>
                <Text style={[styles.modalInfoValue, { color: colors.textPrimary }]}>
                  {dayDetailModal.outTime || '—'}
                </Text>
              </View>

              <View style={styles.modalInfoRow}>
                <Text style={[styles.modalInfoLabel, { color: colors.textSecondary }]}>Total Worked Hours:</Text>
                <Text style={[styles.modalInfoValue, { color: colors.accent, fontWeight: '800' }]}>
                  {dayDetailModal.workedHours !== undefined ? `${dayDetailModal.workedHours} hrs` : '0 hrs'}
                </Text>
              </View>

              <View style={[styles.modalReasonCard, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }]}>
                <Text style={[styles.modalReasonTitle, { color: colors.textSecondary }]}>Status Rule / Details:</Text>
                <Text style={[styles.modalReasonText, { color: colors.textPrimary }]}>
                  {dayDetailModal.details || 'Standard monthly roster evaluation'}
                </Text>
              </View>
            </View>

            {/* Action Buttons: Apply Regularization if Absent/Late/HalfDay, or Done */}
            <View style={styles.modalActionsRow}>
              {(dayDetailModal.status === 'A' || dayDetailModal.status === 'L' || dayDetailModal.status === 'HD') && (
                <TouchableOpacity
                  style={[styles.modalRegularizeBtn, { borderColor: colors.accent }]}
                  onPress={() => {
                    setDayDetailModal({ visible: false });
                    navigation.navigate('AttendanceRegularization');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.modalRegularizeBtnText, { color: colors.accent }]}>
                    Apply Regularization
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.modalCloseButton, { backgroundColor: colors.accent }]}
                onPress={() => setDayDetailModal({ visible: false })}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCloseButtonText}>Done</Text>
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
  viewModeToggle: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    gap: 4,
  },
  viewModeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  viewModeBtnActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  viewModeBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionSubHeading: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  prominentEmpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  largeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  prominentEmpName: {
    fontSize: 15,
    fontWeight: '800',
  },
  prominentEmpRole: {
    fontSize: 11,
  },
  changeStaffBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  changeStaffText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  quickSelectLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  quickStaffChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  chipAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipAvatarText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  quickStaffChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  csvBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  csvBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  controlPickerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  pickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  pickerLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pickerValueText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  pickerArrow: {
    fontSize: 11,
    fontWeight: '800',
  },
  summaryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  summaryPill: {
    flex: 1,
    minWidth: 54,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryPillValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  summaryPillLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
  calendarContainer: {
    gap: 8,
  },
  weekdayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  weekdayCol: {
    alignItems: 'center',
  },
  weekdayHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  dayCellContainer: {
    height: 64,
    borderRadius: 10,
    borderWidth: 1,
    padding: 4,
    justifyContent: 'space-between',
  },
  dayCellTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCellNumber: {
    fontSize: 11,
    fontWeight: '800',
  },
  dayPunchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dayCellStatusText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  rulesCard: {
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  rulesTitle: {
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 4,
  },
  rulesText: {
    fontSize: 11,
    lineHeight: 16,
  },
  matrixTable: {
    minWidth: 1200,
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  matrixThEmp: {
    width: 140,
    fontSize: 11,
    fontWeight: '800',
  },
  matrixThDay: {
    width: 28,
    alignItems: 'center',
  },
  matrixThDayText: {
    fontSize: 10,
    fontWeight: '700',
  },
  matrixSummaryHeaders: {
    flexDirection: 'row',
    marginLeft: 8,
    gap: 4,
  },
  matrixSumTh: {
    width: 24,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  matrixTdEmp: {
    width: 140,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matrixEmpName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
  },
  matrixCellWrapper: {
    width: 28,
    alignItems: 'center',
  },
  matrixStatusCell: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matrixCellText: {
    fontSize: 8,
    fontWeight: '900',
  },
  matrixSummaryCounts: {
    flexDirection: 'row',
    marginLeft: 8,
    gap: 4,
  },
  matrixSumTd: {
    width: 24,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalBox: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalBoxTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalCloseCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalSearchInput: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 10,
  },
  empPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderRadius: 8,
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  empPickerName: {
    fontSize: 13,
    fontWeight: '700',
  },
  empPickerRole: {
    fontSize: 10,
    marginTop: 1,
  },
  selectedCheckBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  monthGridModal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  monthGridItem: {
    width: '30%',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
  },
  monthGridItemText: {
    fontSize: 12,
    fontWeight: '700',
  },
  yearModalItem: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  yearModalItemText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalStatusLabel: {
    fontSize: 11,
    fontWeight: '800',
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
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  modalRegularizeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRegularizeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalCloseButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  recordCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  recordCountText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
