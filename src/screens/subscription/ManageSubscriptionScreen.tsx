import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  useCreateSubscriptionPlan,
  useCurrentSubscription,
  useUpdateSubscriptionPlan,
} from '../../api/hook/useSubscription';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ManageSubscription'>;

interface InvoiceRecord {
  id: string;
  invoiceNo: string;
  date: string;
  amount: string;
  planName: string;
  status: 'PAID' | 'PENDING' | 'FAILED';
}

export const ManageSubscriptionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  // Queries & Mutations
  const { data: currentSubRes, isLoading: subLoading } = useCurrentSubscription();
  const createPlanMutation = useCreateSubscriptionPlan();
  const updatePlanMutation = useUpdateSubscriptionPlan();

  const currentSub = currentSubRes?.data;

  // Local state
  const [autoRenew, setAutoRenew] = useState<boolean>(currentSub?.autoRenew ?? true);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // New Plan form state
  const [planCode, setPlanCode] = useState('');
  const [planName, setPlanName] = useState('');
  const [planTagline, setPlanTagline] = useState('');
  const [planPrice, setPlanPrice] = useState('');
  const [planMaxEmp, setPlanMaxEmp] = useState('');
  const [planFeatures, setPlanFeatures] = useState('');
  const [isPopular, setIsPopular] = useState(false);

  // Sample Invoices Ledger Data
  const invoices: InvoiceRecord[] = [
    {
      id: 'INV-2026-001',
      invoiceNo: 'INV-2026-0891',
      date: '2026-07-01',
      amount: '₹19,999',
      planName: 'Enterprise Ultra (Annual)',
      status: 'PAID',
    },
    {
      id: 'INV-2025-012',
      invoiceNo: 'INV-2025-0744',
      date: '2025-07-01',
      amount: '₹19,999',
      planName: 'Enterprise Ultra (Annual)',
      status: 'PAID',
    },
    {
      id: 'INV-2024-006',
      invoiceNo: 'INV-2024-0312',
      date: '2024-07-01',
      amount: '₹7,999',
      planName: 'Professional HR Suite (Annual)',
      status: 'PAID',
    },
  ];

  const handleToggleAutoRenew = (value: boolean) => {
    setAutoRenew(value);
    Alert.alert(
      'Auto-Renewal Preference',
      value
        ? 'Auto-renewal has been enabled. Your plan will automatically renew on the next billing date.'
        : 'Auto-renewal disabled. Your subscription will expire at the end of the current billing cycle.'
    );
  };

  const handleDownloadInvoice = (inv: InvoiceRecord) => {
    Alert.alert(
      'Downloading Receipt PDF 📄',
      `Invoice #${inv.invoiceNo} receipt for ${inv.amount} downloaded to your local files.`
    );
  };

  const handleCreatePlanSubmit = () => {
    if (!planCode.trim() || !planName.trim() || !planPrice.trim()) {
      Alert.alert('Validation Error', 'Plan Code, Name, and Price are required.');
      return;
    }

    const priceNum = parseFloat(planPrice);
    const maxEmpNum = parseInt(planMaxEmp, 10) || 50;
    const featuresList = planFeatures
      ? planFeatures.split(',').map(f => f.trim()).filter(Boolean)
      : ['Custom Features'];

    createPlanMutation.mutate(
      {
        code: planCode.toUpperCase(),
        name: planName,
        tagline: planTagline || 'Custom Enterprise Plan',
        price: priceNum,
        billing: 'per month billed annually',
        btnText: `Subscribe ${planName}`,
        popular: isPopular,
        features: featuresList,
        maxEmployees: maxEmpNum,
        status: 'ACTIVE',
        sortOrder: 10,
      },
      {
        onSuccess: () => {
          Alert.alert('Success ✨', `Subscription Plan "${planName}" created successfully!`);
          setIsAdminModalOpen(false);
          setPlanCode('');
          setPlanName('');
          setPlanTagline('');
          setPlanPrice('');
          setPlanMaxEmp('');
          setPlanFeatures('');
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
            Manage Subscription
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Billing Portal, Auto-Renew & Invoice Receipts
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Active Billing Summary */}
        <View
          style={[
            styles.summaryCard,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.summaryHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.summaryLabel, { color: colors.accent }]}>
                ORGANIZATION BILLING OVERVIEW
              </Text>
              <Text style={[styles.planTitle, { color: colors.textPrimary }]}>
                🚀 {currentSub?.currentPlan?.name || 'Enterprise Ultra Plan'}
              </Text>
            </View>

            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>
                {currentSub?.paymentStatus?.toUpperCase() || 'ACTIVE ✅'}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

          <View style={styles.detailsGrid}>
            <View style={styles.gridItem}>
              <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Billing Cycle</Text>
              <Text style={[styles.gridVal, { color: colors.textPrimary }]}>
                {currentSub?.billingCycle || 'ANNUAL (20% Savings)'}
              </Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Current Rate</Text>
              <Text style={[styles.gridVal, { color: colors.textPrimary }]}>
                ₹{currentSub?.pricePaid ? currentSub.pricePaid.toLocaleString('en-IN') : '19,999'} / mo
              </Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Next Renewal Date</Text>
              <Text style={[styles.gridVal, { color: colors.textPrimary }]}>
                {currentSub?.endDate || '2027-07-30'}
              </Text>
            </View>

            <View style={styles.gridItem}>
              <Text style={[styles.gridLabel, { color: colors.textSecondary }]}>Employee Seat Capacity</Text>
              <Text style={[styles.gridVal, { color: colors.textPrimary }]}>
                Up to {currentSub?.currentPlan?.maxEmployees || 500} Staff Seats
              </Text>
            </View>
          </View>

          {/* Auto Renew Switch */}
          <View style={[styles.autoRenewRow, { backgroundColor: colors.subItemBg }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.autoRenewTitle, { color: colors.textPrimary }]}>
                Automatic Subscription Renewal
              </Text>
              <Text style={[styles.autoRenewSub, { color: colors.textSecondary }]}>
                Charge registered payment method automatically on cycle end
              </Text>
            </View>
            <Switch
              value={autoRenew}
              onValueChange={handleToggleAutoRenew}
              trackColor={{ false: colors.cardBorder, true: colors.accent }}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate('PlansPricing')}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>⚡ Change / Upgrade Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryActionBtn,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
            onPress={() => setIsAdminModalOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>
              🛠️ Create Plan (Admin)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Invoice History Ledger */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Invoice Receipts Ledger
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Past payment transactions & downloadable tax receipts
          </Text>
        </View>

        {invoices.map(inv => (
          <View
            key={inv.id}
            style={[
              styles.invoiceCard,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.invLeft}>
              <Text style={{ fontSize: 20 }}>🧾</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.invNo, { color: colors.textPrimary }]}>
                  {inv.invoiceNo}
                </Text>
                <Text style={[styles.invPlan, { color: colors.textSecondary }]}>
                  {inv.planName} • {inv.date}
                </Text>
              </View>
            </View>

            <View style={styles.invRight}>
              <Text style={[styles.invAmount, { color: colors.textPrimary }]}>
                {inv.amount}
              </Text>
              <TouchableOpacity
                style={[styles.dlBtn, { borderColor: colors.accent }]}
                onPress={() => handleDownloadInvoice(inv)}
              >
                <Text style={[styles.dlBtnText, { color: colors.accent }]}>PDF 📥</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Admin Plan Creation Modal */}
      <Modal visible={isAdminModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Create New Subscription Plan
            </Text>

            <ScrollView style={{ maxHeight: 380, width: '100%' }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Plan Code (e.g. VIP)</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.inputText,
                  },
                ]}
                placeholder="VIP_CUSTOM"
                placeholderTextColor={colors.inputPlaceholder}
                value={planCode}
                onChangeText={setPlanCode}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Plan Display Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.inputText,
                  },
                ]}
                placeholder="VIP Ultra Corporate"
                placeholderTextColor={colors.inputPlaceholder}
                value={planName}
                onChangeText={setPlanName}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Tagline</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.inputText,
                  },
                ]}
                placeholder="Custom corporate features & SLA"
                placeholderTextColor={colors.inputPlaceholder}
                value={planTagline}
                onChangeText={setPlanTagline}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Monthly Price (₹)</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.inputText,
                  },
                ]}
                placeholder="25000"
                keyboardType="numeric"
                placeholderTextColor={colors.inputPlaceholder}
                value={planPrice}
                onChangeText={setPlanPrice}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Max Employees</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.inputText,
                  },
                ]}
                placeholder="1000"
                keyboardType="numeric"
                placeholderTextColor={colors.inputPlaceholder}
                value={planMaxEmp}
                onChangeText={setPlanMaxEmp}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Features (Comma Separated)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.inputText,
                  },
                ]}
                placeholder="GPS Attendance, Custom Payroll, Dedicated SLA"
                placeholderTextColor={colors.inputPlaceholder}
                value={planFeatures}
                onChangeText={setPlanFeatures}
              />
            </ScrollView>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setIsAdminModalOpen(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.accent }]}
                onPress={handleCreatePlanSubmit}
                disabled={createPlanMutation.isPending}
              >
                {createPlanMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '800' }}>Create Plan ✨</Text>
                )}
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
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#10b98120',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  gridItem: {
    width: '50%',
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  gridVal: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  autoRenewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  autoRenewTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  autoRenewSub: {
    fontSize: 10,
    marginTop: 1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  invoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  invLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  invNo: {
    fontSize: 13,
    fontWeight: '700',
  },
  invPlan: {
    fontSize: 11,
    marginTop: 1,
  },
  invRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  invAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  dlBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  dlBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 2,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    borderWidth: 1,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
});
