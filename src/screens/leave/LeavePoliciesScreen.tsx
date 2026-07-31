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
import { useLeaveTypes } from '../../api/hook/useLeave';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'LeavePolicies'>;

export const LeavePoliciesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();

  const { data: typesRes, isLoading } = useLeaveTypes();

  const policiesList = [
    {
      title: 'Casual Leave (CL) Policy',
      code: 'CL',
      icon: '🌴',
      days: '12 Days / Year',
      rules: [
        'Can be availed for personal work or unannounced short absences.',
        'Maximum 3 consecutive days of CL can be taken at one time.',
        'Unused CL lapses at the end of the calendar year and cannot be carried forward.',
      ],
    },
    {
      title: 'Sick Leave (SL) Policy',
      code: 'SL',
      icon: '🤒',
      days: '10 Days / Year',
      rules: [
        'Applicable for employee illness, medical consultations, or hospitalization.',
        'Medical certificate is mandatory for sick leave exceeding 2 consecutive days.',
        'Can be combined with Privilege Leave upon HR & Manager approval.',
      ],
    },
    {
      title: 'Privilege / Annual Leave (PL) Policy',
      code: 'PL',
      icon: '🏖️',
      days: '15 Days / Year',
      rules: [
        'Accrued at 1.25 days per completed month of service.',
        'Requires minimum 7 days prior notice to manager for planning.',
        'Up to 30 days of unused PL can be carried forward to the next calendar year.',
      ],
    },
    {
      title: 'Maternity & Paternity Leave Policy',
      code: 'MPL',
      icon: '🤱',
      days: '26 Wks (M) / 10 Days (P)',
      rules: [
        'Female employees with 80+ days of service are eligible for 26 weeks paid maternity leave.',
        'Male employees are eligible for 10 consecutive days paid paternity leave upon childbirth.',
      ],
    },
  ];

  const getPolicyTheme = (index: number) => {
    const palette = [
      { accent: '#3b82f6', bg: isDark ? 'rgba(59, 130, 246, 0.14)' : '#eff6ff', border: isDark ? 'rgba(59, 130, 246, 0.3)' : '#bfdbfe' },
      { accent: '#ef4444', bg: isDark ? 'rgba(239, 68, 68, 0.14)' : '#fef2f2', border: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca' },
      { accent: '#10b981', bg: isDark ? 'rgba(16, 185, 129, 0.14)' : '#ecfdf5', border: isDark ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0' },
      { accent: '#8b5cf6', bg: isDark ? 'rgba(139, 92, 246, 0.14)' : '#f5f3ff', border: isDark ? 'rgba(139, 92, 246, 0.3)' : '#ddd6fe' },
    ];
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
            Company Leave Policies
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Official Entitlements & Compliance Guidelines
          </Text>
        </View>
        <View style={[styles.editionBadge, { backgroundColor: colors.statLeaveBg }]}>
          <Text style={[styles.editionBadgeText, { color: colors.statLeaveText }]}>2026 Policy</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* KPI Highlights Bar */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <Text style={[styles.kpiVal, { color: colors.accent }]}>37 Days</Text>
            <Text style={[styles.kpiLbl, { color: colors.textSecondary }]}>Annual Paid Leave</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <Text style={[styles.kpiVal, { color: '#10b981' }]}>4 Categories</Text>
            <Text style={[styles.kpiLbl, { color: colors.textSecondary }]}>Leave Types</Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
            <Text style={[styles.kpiVal, { color: '#8b5cf6' }]}>100% Paid</Text>
            <Text style={[styles.kpiLbl, { color: colors.textSecondary }]}>HR Compliant</Text>
          </View>
        </View>

        {/* Overview Banner Card */}
        <View
          style={[
            styles.bannerCard,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.bannerHeaderRow}>
            <Text style={styles.bannerIcon}>📜</Text>
            <View style={styles.bannerTextGroup}>
              <Text style={[styles.bannerTitle, { color: colors.textPrimary }]}>
                Official Leave Policy Overview
              </Text>
              <Text style={[styles.bannerSubtitle, { color: colors.textSecondary }]}>
                Active leave entitlements & rules defined by Symbosys Technologies HR Policy (2026 Edition).
              </Text>
            </View>
          </View>
        </View>

        {/* Policies List Cards */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading company policies...
            </Text>
          </View>
        ) : (
          policiesList.map((pol, idx) => {
            const theme = getPolicyTheme(idx);

            return (
              <View
                key={idx}
                style={[
                  styles.policyCard,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                {/* Header Row */}
                <View style={styles.polHeaderRow}>
                  <View style={styles.polTitleGroup}>
                    <View style={[styles.iconCircle, { backgroundColor: theme.bg }]}>
                      <Text style={styles.iconEmoji}>{pol.icon}</Text>
                    </View>
                    <Text style={[styles.polTitle, { color: colors.textPrimary }]}>
                      {pol.title}
                    </Text>
                  </View>

                  <View style={[styles.daysPill, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                    <Text style={[styles.daysPillText, { color: theme.accent }]}>{pol.days}</Text>
                  </View>
                </View>

                {/* Rules List */}
                <View style={styles.rulesList}>
                  {pol.rules.map((rule, rIdx) => (
                    <View
                      key={rIdx}
                      style={[
                        styles.ruleItem,
                        { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(248,250,252,0.7)' },
                      ]}
                    >
                      <View style={[styles.bulletDot, { backgroundColor: theme.accent }]}>
                        <Text style={styles.bulletCheck}>✓</Text>
                      </View>
                      <Text style={[styles.ruleText, { color: colors.textPrimary }]}>{rule}</Text>
                    </View>
                  ))}
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
  editionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  editionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiVal: {
    fontSize: 13,
    fontWeight: '800',
  },
  kpiLbl: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  bannerCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bannerIcon: {
    fontSize: 24,
    marginTop: 2,
  },
  bannerTextGroup: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  bannerSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  policyCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  polHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  polTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 16,
  },
  polTitle: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  daysPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  daysPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  rulesList: {
    gap: 8,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bulletDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  bulletCheck: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
  ruleText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
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
});
