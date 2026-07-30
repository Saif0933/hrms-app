import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { TravelClaim, useClaims } from '../../api/hook/useTravelClaims';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ExpenseReimbursements'>;

export const ExpenseReimbursementsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Receipt Preview Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  // TanStack Query
  const { data: claimsRes, isLoading } = useClaims();

  const claimsList: TravelClaim[] = claimsRes?.data || [
    {
      id: 'CLM101',
      employeeId: 'EMP001',
      employeeName: 'Aarav Sharma',
      type: 'Travel',
      amount: 12500,
      date: '2026-07-28',
      reason: 'Flight tickets to Mumbai for enterprise client deployment',
      status: 'Approved',
      receiptUrl: 'https://receipts.symbosys.com/flight_981.pdf',
    },
    {
      id: 'CLM102',
      employeeId: 'EMP001',
      employeeName: 'Aarav Sharma',
      type: 'Accommodation',
      amount: 8400,
      date: '2026-07-27',
      reason: 'Hotel stay (2 nights) at Taj Santacruz, Mumbai',
      status: 'Pending',
      receiptUrl: 'https://receipts.symbosys.com/hotel_441.pdf',
    },
    {
      id: 'CLM103',
      employeeId: 'EMP002',
      employeeName: 'Neha Patel',
      type: 'Food',
      amount: 2200,
      date: '2026-07-26',
      reason: 'Client dinner & team lunch during quarterly review',
      status: 'Approved',
      receiptUrl: 'https://receipts.symbosys.com/food_120.pdf',
    },
    {
      id: 'CLM104',
      employeeId: 'EMP31723',
      employeeName: 'sam',
      type: 'Mileage',
      amount: 1800,
      date: '2026-07-20',
      reason: 'Personal vehicle mileage (120 km) for client site visit',
      status: 'Rejected',
      receiptUrl: 'https://receipts.symbosys.com/fuel_301.pdf',
    },
  ];

  const filteredClaims = claimsList.filter(claim => {
    const matchesStatus =
      statusFilter === 'ALL' || claim.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesType =
      typeFilter === 'ALL' || claim.type.toLowerCase() === typeFilter.toLowerCase();
    return matchesStatus && matchesType;
  });

  const totalClaimed = claimsList.reduce((acc, c) => acc + c.amount, 0);
  const totalApproved = claimsList
    .filter(c => c.status === 'Approved')
    .reduce((acc, c) => acc + c.amount, 0);
  const totalPending = claimsList
    .filter(c => c.status === 'Pending')
    .reduce((acc, c) => acc + c.amount, 0);

  const getStatusPill = (st: string) => {
    switch (st) {
      case 'Approved':
        return { bg: '#10b98120', text: '#10b981' };
      case 'Rejected':
        return { bg: '#ef444420', text: '#ef4444' };
      case 'Pending':
      default:
        return { bg: '#f59e0b20', text: '#f59e0b' };
    }
  };

  const getTypeIcon = (tp: string) => {
    switch (tp) {
      case 'Travel':
        return '✈️';
      case 'Mileage':
        return '🚗';
      case 'Food':
        return '🍲';
      case 'Accommodation':
        return '🏨';
      default:
        return '📁';
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
            Expense Reimbursements Ledger
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Personal Claims, Payout History & Receipts
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addTopBtn, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('NewTravelRequest')}
        >
          <Text style={styles.addTopBtnText}>+ New Claim</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Summary Metrics Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.sumBox, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
            <Text style={[styles.sumVal, { color: '#3b82f6' }]}>
              ₹ {(totalClaimed / 1000).toFixed(1)}k
            </Text>
            <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>Total Claimed</Text>
          </View>

          <View style={[styles.sumBox, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
            <Text style={[styles.sumVal, { color: '#10b981' }]}>
              ₹ {(totalApproved / 1000).toFixed(1)}k
            </Text>
            <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>Approved Payouts</Text>
          </View>

          <View style={[styles.sumBox, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
            <Text style={[styles.sumVal, { color: '#f59e0b' }]}>
              ₹ {(totalPending / 1000).toFixed(1)}k
            </Text>
            <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>Pending Approval</Text>
          </View>
        </View>

        {/* Status Filter Tabs */}
        <View style={styles.tabRow}>
          {['ALL', 'Pending', 'Approved', 'Rejected'].map(st => {
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

        {/* Expense Category Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['ALL', 'Travel', 'Accommodation', 'Food', 'Mileage', 'Other'].map(type => {
            const isSelected = typeFilter === type;
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.cardBackground,
                    borderColor: isSelected ? colors.accent : colors.cardBorder,
                  },
                ]}
                onPress={() => setTypeFilter(type)}
              >
                <Text
                  style={{
                    color: isSelected ? '#ffffff' : colors.textPrimary,
                    fontSize: 11,
                    fontWeight: '600',
                  }}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Claims Roster List */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Reimbursement Claims ({filteredClaims.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          filteredClaims.map(claim => {
            const pill = getStatusPill(claim.status);
            const icon = getTypeIcon(claim.type);

            return (
              <View
                key={claim.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.claimHeaderRow}>
                  <View style={styles.typeIconBadge}>
                    <Text style={{ fontSize: 18 }}>{icon}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.empNameText, { color: colors.textPrimary }]}>
                      {claim.employeeName}
                    </Text>
                    <Text style={[styles.claimMetaText, { color: colors.textSecondary }]}>
                      {claim.type} • {claim.date}
                    </Text>
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: pill.text }}>
                      {claim.status}
                    </Text>
                  </View>
                </View>

                {/* Reason Notes */}
                <Text style={[styles.reasonText, { color: colors.textPrimary }]}>
                  {claim.reason}
                </Text>

                {/* Footer Payout Row */}
                <View style={[styles.claimFooterRow, { borderTopColor: colors.cardBorder }]}>
                  <View>
                    <Text style={[styles.amtLabel, { color: colors.textSecondary }]}>Reimbursement Amount</Text>
                    <Text style={[styles.amtVal, { color: colors.textPrimary }]}>₹ {claim.amount.toLocaleString()}</Text>
                  </View>

                  {claim.receiptUrl ? (
                    <TouchableOpacity
                      style={[styles.receiptBtn, { borderColor: colors.accent }]}
                      onPress={() => setSelectedReceipt(claim.receiptUrl || null)}
                    >
                      <Text style={[styles.receiptBtnText, { color: colors.accent }]}>📎 View Receipt</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Receipt Viewer Modal */}
      <Modal visible={!!selectedReceipt} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Attached Expense Receipt / Invoice
            </Text>
            <View style={[styles.receiptBox, { backgroundColor: colors.background }]}>
              <Text style={{ fontSize: 32 }}>📄</Text>
              <Text style={[styles.receiptUrlText, { color: colors.textPrimary }]}>
                {selectedReceipt}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: colors.accent }]}
              onPress={() => setSelectedReceipt(null)}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Close Preview</Text>
            </TouchableOpacity>
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
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
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
  claimHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(100,100,100,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  claimMetaText: {
    fontSize: 10,
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reasonText: {
    fontSize: 12,
    lineHeight: 17,
  },
  claimFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  amtLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  amtVal: {
    fontSize: 15,
    fontWeight: '900',
  },
  receiptBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  receiptBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  receiptBox: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  receiptUrlText: {
    fontSize: 12,
    textAlign: 'center',
  },
  modalCloseBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});
