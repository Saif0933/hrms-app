import React from 'react';
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
import { HelpTicket, useTickets } from '../../api/hook/useHelpdesk';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'HelpdeskSlaAnalytics'>;

export const HelpdeskSlaAnalyticsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  // TanStack Query
  const { data: ticketsRes, isLoading } = useTickets();

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
      id: 'TCK003',
      employeeName: 'Neha Patel',
      employeeId: 'EMP002',
      subject: 'Form 16 Tax Deduction Revision Request',
      description: 'Need updated Form 16 Part B reflection incorporating Sec 80D medical insurance declarations.',
      category: 'Finance',
      priority: 'Medium',
      status: 'Open',
      slaHoursLeft: 3,
      date: '2026-07-27',
    },
  ];

  // At risk tickets (SLA < 5h and status != Resolved)
  const breachRiskTickets = ticketsList.filter(
    t => t.status !== 'Resolved' && t.slaHoursLeft <= 5
  );

  const categoryPerformance = [
    { category: 'IT Support', pct: 96, avgHours: '2.5h', color: '#10b981' },
    { category: 'Finance & Tax', pct: 94, avgHours: '3.8h', color: '#3b82f6' },
    { category: 'HR & Benefits', pct: 90, avgHours: '4.2h', color: '#8b5cf6' },
    { category: 'Facilities & Office', pct: 88, avgHours: '5.0h', color: '#f59e0b' },
  ];

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
            Help Desk SLA & Analytics
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Resolution Turnaround Time, Category Performance & Breach Risk
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* SLA Gauge Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            ⏱️ Overall Help Desk SLA Compliance
          </Text>

          <View style={styles.scoreRow}>
            <Text style={[styles.scoreBig, { color: '#10b981' }]}>92.4%</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.scoreTitle, { color: colors.textPrimary }]}>
                TARGET SLA ACHIEVED
              </Text>
              <Text style={[styles.scoreSub, { color: colors.textSecondary }]}>
                92.4% of support tickets resolved within mandatory SLA timeframes.
              </Text>
            </View>
          </View>

          {/* Progress Track */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressBar, { width: '92%', backgroundColor: '#10b981' }]} />
          </View>
        </View>

        {/* SLA Breach Risk Warning */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          ⚠️ SLA Breach Risk Queue ({breachRiskTickets.length} At-Risk Tickets)
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          breachRiskTickets.map(tck => (
            <View
              key={tck.id}
              style={[
                styles.card,
                { backgroundColor: 'rgba(239,68,68,0.05)', borderColor: '#ef4444' },
              ]}
            >
              <View style={styles.breachRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tckSubj, { color: colors.textPrimary }]}>
                    {tck.subject}
                  </Text>
                  <Text style={[styles.tckMeta, { color: colors.textSecondary }]}>
                    Requester: {tck.employeeName} • Category: {tck.category}
                  </Text>
                </View>

                <View style={styles.riskBadge}>
                  <Text style={styles.riskBadgeText}>⏳ {tck.slaHoursLeft}h SLA Left</Text>
                </View>
              </View>
            </View>
          ))
        )}

        {/* Category Performance Breakdown */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Category SLA Resolution Performance
        </Text>

        {categoryPerformance.map(cat => (
          <View
            key={cat.category}
            style={[
              styles.card,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.catPerfHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.catName, { color: colors.textPrimary }]}>
                  {cat.category}
                </Text>
                <Text style={[styles.catAvg, { color: colors.textSecondary }]}>
                  Avg Turnaround Time: {cat.avgHours}
                </Text>
              </View>

              <View style={[styles.pctBadge, { backgroundColor: `${cat.color}20` }]}>
                <Text style={[styles.pctText, { color: cat.color }]}>{cat.pct}%</Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: `${cat.pct}%`, backgroundColor: cat.color }]} />
            </View>
          </View>
        ))}
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
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 4,
  },
  scoreBig: {
    fontSize: 34,
    fontWeight: '900',
  },
  scoreTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  scoreSub: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(100,100,100,0.1)',
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  breachRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tckSubj: {
    fontSize: 13,
    fontWeight: '700',
  },
  tckMeta: {
    fontSize: 10,
    marginTop: 2,
  },
  riskBadge: {
    backgroundColor: '#ef444420',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  riskBadgeText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '800',
  },
  catPerfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catName: {
    fontSize: 14,
    fontWeight: '700',
  },
  catAvg: {
    fontSize: 11,
    marginTop: 2,
  },
  pctBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pctText: {
    fontSize: 12,
    fontWeight: '900',
  },
});
