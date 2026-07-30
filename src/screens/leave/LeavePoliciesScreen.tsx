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
  const { colors } = useTheme();

  const { data: typesRes, isLoading } = useLeaveTypes();
  const leaveTypes = typesRes?.data || [];

  const policiesList = [
    {
      title: '🌴 Casual Leave (CL) Policy',
      days: '12 Days / Year',
      rules: [
        'Can be availed for personal work or unannounced short absences.',
        'Maximum 3 consecutive days of CL can be taken at one time.',
        'Unused CL lapses at the end of the calendar year and cannot be carried forward.',
      ],
    },
    {
      title: '🤒 Sick Leave (SL) Policy',
      days: '10 Days / Year',
      rules: [
        'Applicable for employee illness, medical consultations, or hospitalization.',
        'Medical certificate is mandatory for sick leave exceeding 2 consecutive days.',
        'Can be combined with Privilege Leave upon HR & Manager approval.',
      ],
    },
    {
      title: '🏖️ Privilege / Annual Leave (PL) Policy',
      days: '15 Days / Year',
      rules: [
        'Accrued at 1.25 days per completed month of service.',
        'Requires minimum 7 days prior notice to manager for planning.',
        'Up to 30 days of unused PL can be carried forward to the next calendar year.',
      ],
    },
    {
      title: '🤱 Maternity & Paternity Leave Policy',
      days: '26 Weeks (Maternity) / 10 Days (Paternity)',
      rules: [
        'Female employees with 80+ days of service are eligible for 26 weeks paid maternity leave.',
        'Male employees are eligible for 10 consecutive days paid paternity leave upon childbirth.',
      ],
    },
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
            Company Leave Policies
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Official Entitlements & Compliance Guidelines
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Entitlements Summary Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            📜 Official Leave Policy Overview
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Below are the active leave entitlements and rules defined by Symbosys Technologies HR Policy (2026 Edition).
          </Text>
        </View>

        {/* Policies List Cards */}
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          policiesList.map((pol, idx) => (
            <View
              key={idx}
              style={[
                styles.card,
                { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.polHeaderRow}>
                <Text style={[styles.polTitle, { color: colors.textPrimary }]}>{pol.title}</Text>
                <View style={[styles.daysPill, { backgroundColor: colors.accent + '20' }]}>
                  <Text style={[styles.daysPillText, { color: colors.accent }]}>{pol.days}</Text>
                </View>
              </View>

              <View style={styles.rulesList}>
                {pol.rules.map((rule, rIdx) => (
                  <View key={rIdx} style={styles.ruleItem}>
                    <Text style={{ color: colors.accent, fontWeight: '800' }}>•</Text>
                    <Text style={[styles.ruleText, { color: colors.textSecondary }]}>{rule}</Text>
                  </View>
                ))}
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
  cardSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  polHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  polTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  daysPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  daysPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  rulesList: {
    gap: 6,
    marginTop: 4,
  },
  ruleItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  ruleText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
