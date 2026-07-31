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
import { FeatureComparisonRow, useSubscriptionComparisons } from '../../api/hook/useSubscription';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PlanComparison'>;

export const PlanComparisonScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  // TanStack Query
  const { data: matrixRes, isLoading } = useSubscriptionComparisons();

  const comparisonRows: FeatureComparisonRow[] = matrixRes?.data || [
    {
      id: 'CMP001',
      label: 'Employee Seat Limit',
      basic: '25 Seats',
      pro: '100 Seats',
      ent: '500 Seats',
      sortOrder: 1,
    },
    {
      id: 'CMP002',
      label: 'GPS & Geofencing Punching',
      basic: '✓ GPS Only',
      pro: '✓ Geofencing',
      ent: '✓ Multi-branch Geofencing',
      sortOrder: 2,
    },
    {
      id: 'CMP003',
      label: 'Payroll Processing & ECR',
      basic: 'Basic Payslips',
      pro: '✓ Auto PF & ECR',
      ent: '✓ Custom Tax Slabs',
      sortOrder: 3,
    },
    {
      id: 'CMP004',
      label: 'Performance & 360 Feedback',
      basic: '✗ Not Included',
      pro: '✓ KRA & Goals',
      ent: '✓ 360° Bell Curve Analytics',
      sortOrder: 4,
    },
    {
      id: 'CMP005',
      label: 'Letter Generator & Seals',
      basic: '✗ Not Included',
      pro: 'Standard Templates',
      ent: '✓ Custom Corporate Seals',
      sortOrder: 5,
    },
    {
      id: 'CMP006',
      label: 'Help Desk Support SLA',
      basic: '48h Email SLA',
      pro: '12h Priority SLA',
      ent: '4h Dedicated Mgr',
      sortOrder: 6,
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
            Feature Comparison Matrix
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Side-by-Side Comparison Across Starter, Pro & Enterprise Tiers
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Tier Header Cards */}
        <View style={styles.tierHeaderRow}>
          <View style={[styles.tierHeaderBox, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
            <Text style={{ fontSize: 16 }}>🌱</Text>
            <Text style={[styles.tierTitle, { color: '#3b82f6' }]}>Starter</Text>
            <Text style={styles.tierPrice}>₹2.9k/mo</Text>
          </View>

          <View style={[styles.tierHeaderBox, { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
            <Text style={{ fontSize: 16 }}>🌟</Text>
            <Text style={[styles.tierTitle, { color: '#8b5cf6' }]}>Pro Suite</Text>
            <Text style={styles.tierPrice}>₹7.9k/mo</Text>
          </View>

          <View style={[styles.tierHeaderBox, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
            <Text style={{ fontSize: 16 }}>🚀</Text>
            <Text style={[styles.tierTitle, { color: '#10b981' }]}>Enterprise</Text>
            <Text style={styles.tierPrice}>₹19.9k/mo</Text>
          </View>
        </View>

        {/* Feature Rows */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Capabilities Breakdown
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          comparisonRows.map(row => (
            <View
              key={row.id}
              style={[
                styles.matrixCard,
                { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={[styles.featureLabel, { color: colors.textPrimary }]}>
                {row.label}
              </Text>

              <View style={styles.valRow}>
                <View style={styles.valCell}>
                  <Text style={[styles.valText, { color: row.basic.includes('✗') ? '#ef4444' : colors.textSecondary }]}>
                    {row.basic}
                  </Text>
                </View>

                <View style={styles.valCell}>
                  <Text style={[styles.valText, { color: colors.accent, fontWeight: '700' }]}>
                    {row.pro}
                  </Text>
                </View>

                <View style={styles.valCell}>
                  <Text style={[styles.valText, { color: '#10b981', fontWeight: '800' }]}>
                    {row.ent}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity
          style={[styles.upgradeBtn, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('PlansPricing')}
        >
          <Text style={styles.upgradeBtnText}>🚀 Choose Your Ideal Plan</Text>
        </TouchableOpacity>
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
  tierHeaderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tierHeaderBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tierTitle: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },
  tierPrice: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  matrixCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  featureLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  valRow: {
    flexDirection: 'row',
    gap: 6,
  },
  valCell: {
    flex: 1,
    backgroundColor: 'rgba(100,100,100,0.05)',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  valText: {
    fontSize: 10,
    textAlign: 'center',
  },
  upgradeBtn: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
