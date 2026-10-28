import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
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

export interface DayHistoryGroup {
  dateKey: string; // e.g. "Mon, Oct 23, 2026"
  dateObj: Date;
  status: 'LATE' | 'ON-TIME' | 'ABSENT';
  punchInTime: string | null;
  punchOutTime: string | null;
}

const PAGE_SIZE = 10;

export const AttendanceHistoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  // Filter States
  const [filterMode, setFilterMode] = useState<'month' | 'all'>('month');
  const [selectedMonthOffset, setSelectedMonthOffset] = useState(0);

  // Infinite Pagination States
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const onEndReachedCalledDuringMomentum = useRef(true);

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

  // Process & Group Punches dynamically
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

      // Filter by Month or Include All
      const matches =
        filterMode === 'all' ||
        (pDate.getFullYear() === targetYear && pDate.getMonth() === targetMonth);

      if (matches) {
        const key = pDate.toLocaleDateString('en-US', {
          weekday: 'long',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
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

    // Sort descending by date (latest date first)
    apiEntries.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

    return apiEntries;
  }, [punches, currentMonthDate, filterMode]);

  // Reset pagination when filter or data changes
  useEffect(() => {
    setPage(1);
    onEndReachedCalledDuringMomentum.current = true;
  }, [filterMode, selectedMonthOffset, employeeId]);

  // Paginated records to display based on current page
  const displayedHistoryData = useMemo(() => {
    return historyData.slice(0, page * PAGE_SIZE);
  }, [historyData, page]);

  const hasMore = displayedHistoryData.length < historyData.length;

  // Dynamic Statistics calculation from all records in the active filter
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

  // Infinite Scroll Trigger
  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    // Smooth page loading simulation
    setTimeout(() => {
      setPage(prev => prev + 1);
      setLoadingMore(false);
    }, 350);
  }, [loadingMore, hasMore]);

  const handleEndReached = useCallback(() => {
    if (!onEndReachedCalledDuringMomentum.current && hasMore && !loadingMore) {
      handleLoadMore();
      onEndReachedCalledDuringMomentum.current = true;
    }
  }, [hasMore, loadingMore, handleLoadMore]);

  // Refresh Trigger
  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await Promise.all([refetchPunches(), refetchProfile()]);
    setRefreshing(false);
  };

  // Render individual Day Card
  const renderHistoryItem = ({ item }: { item: DayHistoryGroup }) => {
    const isLate = item.status === 'LATE';
    const isOnTime = item.status === 'ON-TIME';
    const isAbsent = item.status === 'ABSENT';

    const accentColor = isLate || isAbsent ? '#ef4444' : '#10b981';
    const badgeBg = isLate || isAbsent ? '#fee2e2' : '#d1fae5';

    return (
      <View
        key={item.dateKey}
        style={[styles.historyCard, { borderLeftColor: accentColor }]}
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
  };

  // Header Component (Summary, Filter Switcher, Month Selector)
  const renderHeaderComponent = () => (
    <View>
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

      {/* Filter Mode Switcher (Monthly vs All Records) */}
      <View style={styles.filterModeRow}>
        <TouchableOpacity
          style={[
            styles.filterModeBtn,
            filterMode === 'month' && styles.filterModeBtnActive,
          ]}
          onPress={() => setFilterMode('month')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterModeText,
              filterMode === 'month' && styles.filterModeTextActive,
            ]}
          >
            By Month
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterModeBtn,
            filterMode === 'all' && styles.filterModeBtnActive,
          ]}
          onPress={() => setFilterMode('all')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.filterModeText,
              filterMode === 'all' && styles.filterModeTextActive,
            ]}
          >
            All History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Month Selector Bar or All History Banner */}
      {filterMode === 'month' ? (
        <View style={styles.monthSelectorBar}>
          <TouchableOpacity
            onPress={() => setSelectedMonthOffset(prev => prev - 1)}
            style={styles.monthNavBtn}
            activeOpacity={0.7}
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
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="chevron-right" size={24} color="#334155" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.allHistoryBanner}>
          <MaterialCommunityIcons name="history" size={20} color="#065f46" />
          <Text style={styles.allHistoryBannerText}>
            Showing all recorded attendance history
          </Text>
        </View>
      )}

      {/* Showing Count Indicator */}
      {historyData.length > 0 && (
        <View style={styles.paginationCountBadge}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.paginationLiveDot} />
            <Text style={styles.paginationCountText}>
              Showing {displayedHistoryData.length} of {historyData.length} records
            </Text>
          </View>
          {hasMore && (
            <Text style={[styles.paginationCountText, { color: '#059669', fontWeight: '700' }]}>
              Scroll down for more ↓
            </Text>
          )}
        </View>
      )}
    </View>
  );

  // Footer Component (Infinite Scroll Loading Indicator or End Indicator)
  const renderFooterComponent = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoadingContainer}>
          <ActivityIndicator size="small" color="#10b981" />
          <Text style={styles.footerLoadingText}>Loading more attendance records...</Text>
        </View>
      );
    }

    if (historyData.length > 0 && !hasMore) {
      return (
        <View style={styles.endOfRecordContainer}>
          <MaterialCommunityIcons name="check-circle-outline" size={20} color="#10b981" />
          <Text style={styles.endOfRecordText}>
            All {historyData.length} records loaded
          </Text>
        </View>
      );
    }

    return <View style={{ height: 20 }} />;
  };

  // Empty State Component
  const renderEmptyComponent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading attendance history...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <MaterialCommunityIcons name="clipboard-text-off-outline" size={44} color="#94a3b8" />
        </View>
        <Text style={styles.emptyTitle}>No Attendance Records</Text>
        <Text style={styles.emptySubtitle}>
          {filterMode === 'month'
            ? `No punch data recorded for ${monthYearLabel}.`
            : 'No punch data recorded in history.'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {navigation.canGoBack() && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backBtn}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#064e3b" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Attendance History</Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} activeOpacity={0.7} style={styles.refreshBtn}>
          {isRefetching || refreshing ? (
            <ActivityIndicator size="small" color="#064e3b" />
          ) : (
            <MaterialCommunityIcons name="refresh" size={24} color="#064e3b" />
          )}
        </TouchableOpacity>
      </View>

      {/* Main FlatList with Infinite Pagination */}
      <FlatList
        data={displayedHistoryData}
        keyExtractor={(item) => item.dateKey}
        renderItem={renderHistoryItem}
        ListHeaderComponent={renderHeaderComponent}
        ListFooterComponent={renderFooterComponent}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        onMomentumScrollBegin={() => {
          onEndReachedCalledDuringMomentum.current = false;
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isRefetching}
            onRefresh={handleRefresh}
            colors={['#10b981', '#064e3b']}
            tintColor="#10b981"
          />
        }
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
      />
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
    gap: 8,
  },
  backBtn: {
    padding: 4,
    marginRight: 4,
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
    flexGrow: 1,
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
  filterModeRow: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  filterModeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  filterModeBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterModeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  filterModeTextActive: {
    color: '#064e3b',
    fontWeight: '800',
  },
  monthSelectorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eef2ff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
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
  allHistoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  allHistoryBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065f46',
  },
  paginationCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  paginationCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  paginationLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
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
  footerLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  footerLoadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
  },
  endOfRecordContainer: {
    flexDirection: 'row',
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#064e3b',
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