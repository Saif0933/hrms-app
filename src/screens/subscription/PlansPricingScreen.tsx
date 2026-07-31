import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  SubscriptionPlan,
  useCurrentSubscription,
  useSubscribePlan,
  useSubscriptionPlans,
} from '../../api/hook/useSubscription';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PlansPricing'>;

export const PlansPricingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [isAnnual, setIsAnnual] = useState(true);

  // TanStack Queries & Mutations
  const { data: plansRes, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: currentSubRes } = useCurrentSubscription();
  const subscribeMutation = useSubscribePlan();

  const plansList: SubscriptionPlan[] = plansRes?.data || [
    {
      id: 'PLN_BASIC',
      code: 'BASIC',
      name: 'Starter HRMS',
      tagline: 'Ideal for small startups & growing teams up to 25 staff',
      icon: '🌱',
      price: 2999,
      billing: 'per month billed annually',
      btnText: 'Start Starter Plan',
      popular: false,
      maxEmployees: 25,
      status: 'ACTIVE',
      sortOrder: 1,
      features: [
        'GPS Selfie Punch & Geo-fence Attendance',
        'Basic Leave Apply & Approvals Engine',
        'Employee Master & Directory (25 Seats)',
        'Standard Email Support (48h SLA)',
      ],
    },
    {
      id: 'PLN_PRO',
      code: 'PRO',
      name: 'Professional HR Suite',
      tagline: 'Comprehensive suite for scaling companies up to 100 staff',
      icon: '🌟',
      price: 7999,
      billing: 'per month billed annually',
      btnText: 'Upgrade to Pro Suite',
      popular: true,
      maxEmployees: 100,
      status: 'ACTIVE',
      sortOrder: 2,
      features: [
        'Everything in Starter Plan',
        'Payroll Tax Engine & Automated Payslips',
        'Timesheet Project Billing & KRA Performance',
        'Document Vault & Expiry Compliance Alerts',
        'Priority HR Help Desk (12h SLA)',
      ],
    },
    {
      id: 'PLN_ENT',
      code: 'ENTERPRISE',
      name: 'Enterprise Ultra',
      tagline: 'Unlimited corporate power, custom SLAs & multi-branch support',
      icon: '🚀',
      price: 19999,
      billing: 'per month billed annually',
      btnText: 'Active Organization Plan',
      popular: false,
      maxEmployees: 500,
      status: 'ACTIVE',
      sortOrder: 3,
      features: [
        'Everything in Professional Plan',
        'Letter Generator with Custom Corporate Seals',
        'Bell Curve Performance & 360° Feedback',
        'Recruitment Pipeline & Candidate ATS',
        'Dedicated Account Manager & 4h SLA',
      ],
    },
  ];

  const currentSub = currentSubRes?.data;
  const currentPlanCode = currentSub?.currentPlan?.code || 'ENTERPRISE';

  const handleSubscribe = (plan: SubscriptionPlan) => {
    subscribeMutation.mutate(
      {
        planId: plan.id,
        billingCycle: isAnnual ? 'ANNUAL' : 'MONTHLY',
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Subscription Upgraded! 🌟',
            `Your organization has successfully subscribed to ${plan.name}!`
          );
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
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
            Subscription Plans & Pricing
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Flexible Tiers, Feature Matrix & Enterprise Scale
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.cmpBtn, { borderColor: colors.accent }]}
          onPress={() => navigation.navigate('PlanComparison')}
        >
          <Text style={[styles.cmpBtnText, { color: colors.accent }]}>Matrix</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Active Subscription Banner */}
        <View style={[styles.activeSubCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <View style={styles.activeHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.activeLabel, { color: colors.accent }]}>
                CURRENT ACTIVE PLAN
              </Text>
              <Text style={[styles.activeTitle, { color: colors.textPrimary }]}>
                🚀 Enterprise Ultra Plan
              </Text>
              <Text style={[styles.activeMeta, { color: colors.textSecondary }]}>
                Renewable on 2027-07-30 • Max 500 Employee Seats
              </Text>
            </View>

            <View style={styles.activePill}>
              <Text style={styles.activePillText}>ACTIVE ✅</Text>
            </View>
          </View>
        </View>

        {/* Billing Cycle Toggle */}
        <View style={[styles.toggleCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <Text style={{ color: !isAnnual ? colors.accent : colors.textSecondary, fontWeight: '700', fontSize: 12 }}>
            Monthly Billed
          </Text>

          <Switch
            value={isAnnual}
            onValueChange={setIsAnnual}
            trackColor={{ false: colors.cardBorder, true: colors.accent }}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ color: isAnnual ? colors.accent : colors.textSecondary, fontWeight: '700', fontSize: 12 }}>
              Annual Billing
            </Text>
            <View style={styles.discBadge}>
              <Text style={styles.discText}>⚡ 20% OFF</Text>
            </View>
          </View>
        </View>

        {/* Plans Catalog Cards */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Available Subscription Tiers
        </Text>

        {plansLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          plansList.map(plan => {
            const isCurrent = plan.code === currentPlanCode;
            const displayPrice = isAnnual ? Math.round(plan.price * 0.8) : plan.price;

            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: plan.popular ? colors.accent : colors.cardBorder,
                    borderWidth: plan.popular ? 2 : 1,
                  },
                ]}
              >
                {plan.popular && (
                  <View style={[styles.popularTag, { backgroundColor: colors.accent }]}>
                    <Text style={styles.popularTagText}>MOST POPULAR 🌟</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <Text style={{ fontSize: 24 }}>{plan.icon || '📦'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planName, { color: colors.textPrimary }]}>
                      {plan.name}
                    </Text>
                    <Text style={[styles.planTagline, { color: colors.textSecondary }]}>
                      {plan.tagline}
                    </Text>
                  </View>
                </View>

                {/* Price Display */}
                <View style={styles.priceRow}>
                  <Text style={[styles.priceBig, { color: colors.textPrimary }]}>
                    ₹{displayPrice.toLocaleString('en-IN')}
                  </Text>
                  <Text style={[styles.priceSub, { color: colors.textSecondary }]}>
                    / month {isAnnual ? '(billed annually)' : '(billed monthly)'}
                  </Text>
                </View>

                {/* Employee Limit Badge */}
                <View style={styles.seatBadge}>
                  <Text style={styles.seatText}>👥 Up to {plan.maxEmployees} Employees</Text>
                </View>

                {/* Feature List */}
                <View style={styles.featuresBox}>
                  {plan.features.map((feat, idx) => (
                    <Text key={idx} style={[styles.featItem, { color: colors.textPrimary }]}>
                      <Text style={{ color: '#10b981', fontWeight: 'bold' }}>✓ </Text>
                      {feat}
                    </Text>
                  ))}
                </View>

                {/* Subscribe / Current Button */}
                <TouchableOpacity
                  style={[
                    styles.subBtn,
                    {
                      backgroundColor: isCurrent ? 'rgba(16,185,129,0.15)' : colors.accent,
                      borderColor: isCurrent ? '#10b981' : colors.accent,
                      borderWidth: 1,
                    },
                    subscribeMutation.isPending && { opacity: 0.7 },
                  ]}
                  onPress={() => handleSubscribe(plan)}
                  disabled={isCurrent || subscribeMutation.isPending}
                >
                  <Text
                    style={{
                      color: isCurrent ? '#10b981' : '#ffffff',
                      fontSize: 13,
                      fontWeight: '800',
                    }}
                  >
                    {isCurrent ? 'Current Active Tier ✅' : `🚀 ${plan.btnText}`}
                  </Text>
                </TouchableOpacity>
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
  cmpBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  cmpBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  activeSubCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activeTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  activeMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  activePill: {
    backgroundColor: '#10b98120',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activePillText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '900',
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  discBadge: {
    backgroundColor: '#f59e0b20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discText: {
    color: '#f59e0b',
    fontSize: 9,
    fontWeight: '900',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    gap: 12,
    position: 'relative',
  },
  popularTag: {
    position: 'absolute',
    top: -12,
    right: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  popularTagText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planName: {
    fontSize: 16,
    fontWeight: '800',
  },
  planTagline: {
    fontSize: 11,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  priceBig: {
    fontSize: 26,
    fontWeight: '900',
  },
  priceSub: {
    fontSize: 11,
  },
  seatBadge: {
    backgroundColor: 'rgba(100,100,100,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  seatText: {
    fontSize: 11,
    fontWeight: '700',
  },
  featuresBox: {
    gap: 6,
    marginTop: 4,
  },
  featItem: {
    fontSize: 12,
    lineHeight: 18,
  },
  subBtn: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
});
