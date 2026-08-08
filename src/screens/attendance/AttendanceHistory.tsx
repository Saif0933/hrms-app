import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { usePunches } from '../../api/hook/useAttendance';
import { useProfile } from '../../api/hook/useAuth';
import { useEmployees } from '../../api/hook/useEmployee';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AttendanceHistory'>;

interface DayHistoryGroup {
  dateKey: string; // e.g. "Mon, Oct 23"
  dateObj: Date;
  status: 'LATE' | 'ON-TIME' | 'ABSENT';
  punchInTime: string | null;
  punchOutTime: string | null;
}

export const AttendanceHistoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [activeTab, setActiveTab] = useState<'Punch' | 'History' | 'Schedule' | 'Profile'>('History');
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0);

  // Dynamic Auth & Punches
  const { data: profileResponse, refetch: refetchProfile } = useProfile();
  const user = profileResponse?.data?.user;
  const { data: employeesRes } = useEmployees();
  const employees = employeesRes?.data || [];

  const matchedEmp = useMemo(() => {
    if (!user) return null;
    return employees.find((e: any) =>
      (user.employeeId && e.id === user.employeeId) ||
      (user.id && e.userId === user.id) ||
      (user.email && e.email?.toLowerCase() === user.email.toLowerCase()) ||
      (user.phone && e.phone === user.phone)
    ) || null;
  }, [user, employees]);

  const employeeId = matchedEmp?.id || user?.employeeId || user?.id || '';

  const { data: punchesRes, isLoading, refetch: refetchPunches, isRefetching } = usePunches(employeeId);
  const punches = punchesRes?.data || [];

  // Selected Month Display
  const currentMonthDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + selectedMonthOffset);
    return d;
  }, [selectedMonthOffset]);

  const monthYearLabel = useMemo(() => {
    return currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentMonthDate]);

  // Process & Group Punches dynamically by Selected Month
  const historyData = useMemo(() => {
    const targetYear = currentMonthDate.getFullYear();
    const targetMonth = currentMonthDate.getMonth();

    const map = new Map<string, { in?: string; out?: string; dateObj: Date }>();

    punches.forEach(p => {
      let pDate: Date | null = null;
      if (p.createdAt) {
        const d = new Date(p.createdAt);
        if (!isNaN(d.getTime())) pDate = d;
      }
      if (!pDate) {
        const d = new Date(p.time);
        if (!isNaN(d.getTime())) pDate = d;
      }
      if (!pDate) {
        pDate = new Date();
        if (typeof p.time === 'string' && p.time.toLowerCase().includes('yesterday')) {
          pDate.setDate(pDate.getDate() - 1);
        }
      }

      const matchesMonth = selectedMonthOffset === 0 || (pDate.getFullYear() === targetYear && pDate.getMonth() === targetMonth);
      if (matchesMonth) {
        const key = pDate.toLocaleDateString('en-US', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = pDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (!map.has(key)) {
          map.set(key, { dateObj: pDate });
        }
        const entry = map.get(key)!;
        const typeStr = (p.type || '').toLowerCase();
        if (typeStr.includes('in') && !entry.in) {
          entry.in = timeStr;
        } else if (typeStr.includes('out') && !entry.out) {
          entry.out = timeStr;
        }
      }
    });

    const apiEntries: DayHistoryGroup[] = Array.from(map.entries()).map(([dateKey, val]) => {
      const isLate = val.in ? val.in > '09:30 AM' : false;
      return {
        dateKey,
        dateObj: val.dateObj,
        status: isLate ? 'LATE' : 'ON-TIME',
        punchInTime: val.in || null,
        punchOutTime: val.out || null,
      };
    });

    return apiEntries;
  }, [punches, currentMonthDate, selectedMonthOffset]);

  // Dynamic Statistics calculation from real data
  const stats = useMemo(() => {
    const present = historyData.filter(d => d.status !== 'ABSENT').length;
    const late = historyData.filter(d => d.status === 'LATE').length;
    const totalDays = historyData.length;

    return {
      totalDays,
      present,
      late,
    };
  }, [historyData]);

  const handleRefresh = async () => {
    await Promise.all([refetchPunches(), refetchProfile()]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces',
            }}
            style={styles.avatar}
          />
          <Text style={styles.headerTitle}>Attendance History</Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} activeOpacity={0.7} style={styles.refreshBtn}>
          {isRefetching ? (
            <ActivityIndicator size="small" color="#064e3b" />
          ) : (
            <MaterialCommunityIcons name="refresh" size={24} color="#064e3b" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Summary Cards (Total Days, Present, Late) */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Days</Text>
            <Text style={[styles.summaryValue, { color: '#064e3b' }]}>{stats.totalDays}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Present</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>{stats.present}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Late</Text>
            <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{stats.late}</Text>
          </View>
        </View>



        {/* Month Selector Bar */}
        <View style={styles.monthSelectorBar}>
          <TouchableOpacity
            onPress={() => setSelectedMonthOffset(prev => prev - 1)}
            style={styles.monthNavBtn}
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color="#334155" />
          </TouchableOpacity>

          <View style={styles.monthTitleContainer}>
            <MaterialCommunityIcons name="calendar-month-outline" size={22} color="#064e3b" />
            <Text style={styles.monthTitleText}>{monthYearLabel}</Text>
          </View>

          <TouchableOpacity
            onPress={() => setSelectedMonthOffset(prev => prev + 1)}
            style={styles.monthNavBtn}
          >
            <MaterialCommunityIcons name="chevron-right" size={24} color="#334155" />
          </TouchableOpacity>
        </View>

        {/* History Item Cards / Empty State */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginVertical: 30 }} />
        ) : historyData.length > 0 ? (
          historyData.map((item, index) => {
            const isLate = item.status === 'LATE';
            const isOnTime = item.status === 'ON-TIME';
            const isAbsent = item.status === 'ABSENT';

            const accentColor = isLate || isAbsent ? '#ef4444' : '#10b981';
            const badgeBg = isLate || isAbsent ? '#fee2e2' : '#d1fae5';

            return (
              <View
                key={index}
                style={[
                  styles.historyCard,
                  { borderLeftColor: accentColor },
                ]}
              >
                {/* Header Row: Date & Status Badge */}
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.dateText}>{item.dateKey}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: badgeBg }]}>
                    <Text style={[styles.statusBadgeText, { color: accentColor }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                {/* Card Body: Punch IN & Punch OUT / Absent Message */}
                {isAbsent ? (
                  <View style={styles.absentContainer}>
                    <Text style={styles.absentText}>No punch data recorded for this day.</Text>
                  </View>
                ) : (
                  <View style={styles.punchDetailsRow}>
                    {/* Punch IN */}
                    <View style={styles.punchColumn}>
                      <View style={[styles.iconSquare, { backgroundColor: '#e0f2fe' }]}>
                        <MaterialCommunityIcons
                          name="login-variant"
                          size={22}
                          color={isLate ? '#ef4444' : '#10b981'}
                        />
                      </View>
                      <View>
                        <Text style={styles.punchLabel}>PUNCH IN</Text>
                        <Text style={[styles.punchTime, { color: isLate ? '#ef4444' : '#0f172a' }]}>
                          {item.punchInTime || '--:--'}
                        </Text>
                      </View>
                    </View>

                    {/* Punch OUT */}
                    <View style={styles.punchColumn}>
                      <View style={[styles.iconSquare, { backgroundColor: '#f1f5f9' }]}>
                        <MaterialCommunityIcons name="logout-variant" size={22} color="#475569" />
                      </View>
                      <View>
                        <Text style={styles.punchLabel}>PUNCH OUT</Text>
                        <Text style={styles.punchTime}>
                          {item.punchOutTime || '--:--'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <MaterialCommunityIcons name="clipboard-text-off-outline" size={44} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>No Attendance Records</Text>
            <Text style={styles.emptySubtitle}>No punch data recorded for {monthYearLabel}.</Text>
          </View>
        )}

        {/* End of Record Footer Indicator */}
        <View style={styles.endOfRecordContainer}>
          <MaterialCommunityIcons name="clock-outline" size={22} color="#94a3b8" />
          <Text style={styles.endOfRecordText}>End of monthly record</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#064e3b',
    letterSpacing: 0.2,
  },
  refreshBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '900',
  },
  monthSelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eef2ff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 18,
  },
  monthNavBtn: {
    padding: 4,
  },
  monthTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  monthTitleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderLeftWidth: 5,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  absentContainer: {
    paddingVertical: 8,
  },
  absentText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#64748b',
  },
  punchDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  punchColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  punchLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  punchTime: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  endOfRecordContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 20,
  },
  endOfRecordText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },

});