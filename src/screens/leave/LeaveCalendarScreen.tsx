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
import { useLeaveRequests } from '../../api/hook/useLeave';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'LeaveCalendar'>;

export const LeaveCalendarScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [selectedMonth, setSelectedMonth] = useState('August 2026');

  // TanStack Query
  const { data: requestsRes, isLoading } = useLeaveRequests();

  const leaveRequests = requestsRes?.data || [
    {
      id: 'LR201',
      employeeId: 'EMP002',
      employee: { id: 'EMP002', name: 'Neha Patel', email: 'neha@symbosys.com' },
      startDate: '2026-08-01',
      endDate: '2026-08-03',
      totalDays: 3,
      reason: 'Family Event',
      status: 'APPROVED' as const,
      appliedDate: '2026-07-25',
      leaveType: { name: 'Casual Leave', code: 'CL', id: '', defaultDays: 12, carryForward: true, isActive: true, createdAt: '', updatedAt: '' },
      createdAt: '',
      updatedAt: '',
      halfDay: false,
    },
    {
      id: 'LR202',
      employeeId: 'EMP003',
      employee: { id: 'EMP003', name: 'Vikram Malhotra', email: 'vikram@symbosys.com' },
      startDate: '2026-08-05',
      endDate: '2026-08-05',
      totalDays: 1,
      reason: 'Medical Checkup',
      status: 'APPROVED' as const,
      appliedDate: '2026-07-28',
      leaveType: { name: 'Sick Leave', code: 'SL', id: '', defaultDays: 10, carryForward: false, isActive: true, createdAt: '', updatedAt: '' },
      createdAt: '',
      updatedAt: '',
      halfDay: true,
    },
    {
      id: 'LR203',
      employeeId: 'EMP004',
      employee: { id: 'EMP004', name: 'Karan Johar', email: 'karan@symbosys.com' },
      startDate: '2026-08-12',
      endDate: '2026-08-18',
      totalDays: 7,
      reason: 'Annual Summer Holiday',
      status: 'APPROVED' as const,
      appliedDate: '2026-07-20',
      leaveType: { name: 'Privilege Leave', code: 'PL', id: '', defaultDays: 15, carryForward: true, isActive: true, createdAt: '', updatedAt: '' },
      createdAt: '',
      updatedAt: '',
      halfDay: false,
    },
  ];

  const approvedLeaves = leaveRequests.filter(r => r.status === 'APPROVED');

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
            Team Leave Calendar
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Approved Workforce Leave Schedule
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
            🗓️ Select Month View
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {['July 2026', 'August 2026', 'September 2026', 'October 2026'].map(mth => {
              const isSelected = selectedMonth === mth;
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
                  onPress={() => setSelectedMonth(mth)}
                >
                  <Text
                    style={{
                      color: isSelected ? '#fff' : colors.textPrimary,
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {mth}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Overview Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
            <Text style={[styles.statVal, { color: '#3b82f6' }]}>{approvedLeaves.length}</Text>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>Approved Leaves</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
            <Text style={[styles.statVal, { color: '#10b981' }]}>1</Text>
            <Text style={[styles.statLbl, { color: colors.textSecondary }]}>On Leave Today</Text>
          </View>
        </View>

        {/* Leave Schedule List */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Approved Leave Schedule ({selectedMonth})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          approvedLeaves.map(leave => (
            <View
              key={leave.id}
              style={[
                styles.card,
                { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.leaveHeaderRow}>
                <View style={styles.avatarMini}>
                  <Text style={styles.avatarMiniText}>
                    {leave.employee?.name
                      ? leave.employee.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .slice(0, 2)
                      : 'EMP'}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.empName, { color: colors.textPrimary }]}>
                    {leave.employee?.name || 'Employee'}
                  </Text>
                  <Text style={[styles.leaveTypePill, { color: colors.accent }]}>
                    {leave.leaveType?.name || 'Leave'} {leave.halfDay ? '(Half-Day)' : ''}
                  </Text>
                </View>

                <View style={styles.daysBadge}>
                  <Text style={styles.daysBadgeText}>{leave.totalDays} Day{leave.totalDays > 1 ? 's' : ''}</Text>
                </View>
              </View>

              <View style={[styles.dateBox, { backgroundColor: colors.background }]}>
                <Text style={[styles.dateText, { color: colors.textPrimary }]}>
                  🗓️ {leave.startDate} → {leave.endDate}
                </Text>
                <Text style={[styles.reasonText, { color: colors.textSecondary }]}>
                  💬 {leave.reason}
                </Text>
              </View>
            </View>
          ))
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
  statsRow: {
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
    fontSize: 24,
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
  leaveHeaderRow: {
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
  leaveTypePill: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  daysBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#10b98120',
  },
  daysBadgeText: {
    color: '#10b981',
    fontWeight: '800',
    fontSize: 11,
  },
  dateBox: {
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '700',
  },
  reasonText: {
    fontSize: 12,
  },
});
