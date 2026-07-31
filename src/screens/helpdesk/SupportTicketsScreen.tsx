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
import { HelpTicket, useResolveTicket, useTickets } from '../../api/hook/useHelpdesk';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SupportTickets'>;

type CategoryType = 'IT' | 'HR' | 'Facilities' | 'Finance';
type PriorityType = 'High' | 'Medium' | 'Low';

export const SupportTicketsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // TanStack Queries & Mutations
  const { data: ticketsRes, isLoading } = useTickets();
  const resolveTicketMutation = useResolveTicket();

  const ticketsList: HelpTicket[] = ticketsRes?.data || [
    {
      id: 'TCK001',
      employeeName: 'Aarav Sharma',
      employeeId: 'EMP001',
      subject: 'MacBook Pro M3 USB-C Display Port Hub Faulty',
      description: 'The dual monitor HDMI dongle is not recognizing external 4K monitor displays after recent macOS update.',
      category: 'IT',
      priority: 'High',
      status: 'Open',
      slaHoursLeft: 4,
      date: '2026-07-29',
    },
    {
      id: 'TCK002',
      employeeName: 'sam',
      employeeId: 'EMP31723',
      subject: 'Figma Enterprise Workspace License Renewal',
      description: 'Requesting renewal for UI/UX team Figma Organization seat license for Q3 design sprint.',
      category: 'IT',
      priority: 'Medium',
      status: 'Pending',
      slaHoursLeft: 12,
      date: '2026-07-28',
    },
    {
      id: 'TCK003',
      employeeName: 'Neha Patel',
      employeeId: 'EMP002',
      subject: 'Form 16 Tax Deduction Revision Request',
      description: 'Need updated Form 16 Part B reflection incorporating Sec 80D medical insurance declarations.',
      category: 'Finance',
      priority: 'Medium',
      status: 'Open',
      slaHoursLeft: 8,
      date: '2026-07-27',
    },
    {
      id: 'TCK004',
      employeeName: 'Aarav Sharma',
      employeeId: 'EMP001',
      subject: 'Ergonomic Standing Desk Assembly Request',
      description: 'Requesting Facilities team assist with dual-arm monitor mount installation on desk.',
      category: 'Facilities',
      priority: 'Low',
      status: 'Resolved',
      slaHoursLeft: 0,
      date: '2026-07-20',
    },
  ];

  const filteredTickets = ticketsList.filter(tck => {
    const matchesCat =
      categoryFilter === 'ALL' || tck.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesSt =
      statusFilter === 'ALL' || tck.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesCat && matchesSt;
  });

  const totalOpen = ticketsList.filter(t => t.status === 'Open').length;
  const totalPending = ticketsList.filter(t => t.status === 'Pending').length;
  const totalResolved = ticketsList.filter(t => t.status === 'Resolved').length;

  const handleResolveTicket = (id: string, subject: string) => {
    resolveTicketMutation.mutate(id, {
      onSuccess: () => {
        Alert.alert('Ticket Resolved ✅', `Support ticket "${subject}" has been marked as resolved!`);
      },
      onError: err => Alert.alert('Error', err.message),
    });
  };

  const getPriorityPill = (prio: PriorityType) => {
    switch (prio) {
      case 'High':
        return { bg: '#ef444420', text: '#ef4444' };
      case 'Medium':
        return { bg: '#f59e0b20', text: '#f59e0b' };
      case 'Low':
      default:
        return { bg: '#10b98120', text: '#10b981' };
    }
  };

  const getStatusPill = (st: string) => {
    switch (st) {
      case 'Resolved':
        return { bg: '#10b98120', text: '#10b981' };
      case 'Pending':
        return { bg: '#3b82f620', text: '#3b82f6' };
      case 'Open':
      default:
        return { bg: '#ef444420', text: '#ef4444' };
    }
  };

  const getCategoryIcon = (cat: CategoryType) => {
    switch (cat) {
      case 'IT':
        return '💻';
      case 'HR':
        return '👥';
      case 'Facilities':
        return '🏢';
      case 'Finance':
        return '💰';
      default:
        return '🎧';
    }
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
            HR Support Tickets Queue
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Help Desk Incident Management & SLA Tracking
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addTopBtn, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('RaiseTicket')}
        >
          <Text style={styles.addTopBtnText}>+ Raise Ticket</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Metrics Summary */}
        <View style={styles.summaryGrid}>
          <View style={[styles.sumBox, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
            <Text style={[styles.sumVal, { color: '#ef4444' }]}>{totalOpen}</Text>
            <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>Open Tickets</Text>
          </View>

          <View style={[styles.sumBox, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
            <Text style={[styles.sumVal, { color: '#3b82f6' }]}>{totalPending}</Text>
            <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>In Progress</Text>
          </View>

          <View style={[styles.sumBox, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
            <Text style={[styles.sumVal, { color: '#10b981' }]}>{totalResolved}</Text>
            <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>Resolved</Text>
          </View>
        </View>

        {/* Category Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['ALL', 'IT', 'HR', 'Facilities', 'Finance'].map(cat => {
            const isSelected = categoryFilter === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.cardBackground,
                    borderColor: isSelected ? colors.accent : colors.cardBorder,
                  },
                ]}
                onPress={() => setCategoryFilter(cat)}
              >
                <Text
                  style={{
                    color: isSelected ? '#ffffff' : colors.textPrimary,
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Status Filter Tabs */}
        <View style={styles.tabRow}>
          {['ALL', 'Open', 'Pending', 'Resolved'].map(st => {
            const isSelected = statusFilter === st;
            return (
              <TouchableOpacity
                key={st}
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.cardBackground,
                    borderColor: isSelected ? colors.accent : colors.cardBorder,
                  },
                ]}
                onPress={() => setStatusFilter(st)}
              >
                <Text
                  style={{
                    color: isSelected ? '#ffffff' : colors.textPrimary,
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {st}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Support Tickets List */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Support Tickets Queue ({filteredTickets.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          filteredTickets.map(tck => {
            const prioPill = getPriorityPill(tck.priority);
            const statusPill = getStatusPill(tck.status);
            const icon = getCategoryIcon(tck.category);
            const isResolved = tck.status === 'Resolved';

            return (
              <View
                key={tck.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                {/* Header Row */}
                <View style={styles.tckHeaderRow}>
                  <View style={styles.iconBadge}>
                    <Text style={{ fontSize: 20 }}>{icon}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tckSubject, { color: colors.textPrimary }]}>
                      {tck.subject}
                    </Text>
                    <Text style={[styles.tckMeta, { color: colors.textSecondary }]}>
                      👤 {tck.employeeName} ({tck.employeeId}) • {tck.category}
                    </Text>
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: statusPill.bg }]}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: statusPill.text }}>
                      {tck.status}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                <Text style={[styles.tckDesc, { color: colors.textPrimary }]}>
                  "{tck.description}"
                </Text>

                {/* SLA & Priority Footer */}
                <View style={[styles.tckFooterRow, { borderTopColor: colors.cardBorder }]}>
                  <View style={styles.badgeGroup}>
                    <View style={[styles.priorityPill, { backgroundColor: prioPill.bg }]}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: prioPill.text }}>
                        PRIORITY: {tck.priority.toUpperCase()}
                      </Text>
                    </View>

                    {!isResolved && (
                      <View style={styles.slaBadge}>
                        <Text style={styles.slaText}>⏳ SLA: {tck.slaHoursLeft}h Left</Text>
                      </View>
                    )}
                  </View>

                  {!isResolved && (
                    <TouchableOpacity
                      style={[
                        styles.resolveBtn,
                        { backgroundColor: '#10b981' },
                        resolveTicketMutation.isPending && { opacity: 0.7 },
                      ]}
                      onPress={() => handleResolveTicket(tck.id, tck.subject)}
                      disabled={resolveTicketMutation.isPending}
                    >
                      <Text style={styles.resolveBtnText}>✅ Mark Resolved</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
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
  addTopBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addTopBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  sumBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sumVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  sumLbl: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  tckHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(100,100,100,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tckSubject: {
    fontSize: 14,
    fontWeight: '700',
  },
  tckMeta: {
    fontSize: 10,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tckDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  tckFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slaBadge: {
    backgroundColor: 'rgba(100,100,100,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  slaText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  resolveBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resolveBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
