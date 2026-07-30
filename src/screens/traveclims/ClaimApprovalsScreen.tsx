import React from 'react';
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
import { TravelClaim, useClaims, useUpdateClaimStatus } from '../../api/hook/useTravelClaims';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ClaimApprovals'>;

export const ClaimApprovalsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  // TanStack Queries & Mutations
  const { data: claimsRes, isLoading } = useClaims({ status: 'Pending' });
  const updateStatusMutation = useUpdateClaimStatus();

  const allClaims: TravelClaim[] = claimsRes?.data || [
    {
      id: 'CLM102',
      employeeId: 'EMP001',
      employeeName: 'Aarav Sharma',
      type: 'Accommodation',
      amount: 8400,
      date: '2026-07-27',
      reason: 'Hotel stay (2 nights) at Taj Santacruz, Mumbai for deployment sprint',
      status: 'Pending',
      receiptUrl: 'https://receipts.symbosys.com/hotel_441.pdf',
    },
    {
      id: 'CLM105',
      employeeId: 'EMP002',
      employeeName: 'Neha Patel',
      type: 'Food',
      amount: 3500,
      date: '2026-07-26',
      reason: 'Departmental lunch & client hospitality entertainment',
      status: 'Pending',
      receiptUrl: 'https://receipts.symbosys.com/food_991.pdf',
    },
  ];

  const pendingClaims = allClaims.filter(c => c.status === 'Pending' || !c.status);

  const handleUpdateStatus = (claimId: string, empName: string, nextStatus: 'Approved' | 'Rejected') => {
    updateStatusMutation.mutate(
      { id: claimId, status: nextStatus },
      {
        onSuccess: () => {
          Alert.alert(
            `Claim ${nextStatus} ${nextStatus === 'Approved' ? '✅' : '❌'}`,
            `Travel claim for ${empName} was successfully ${nextStatus.toLowerCase()}.`
          );
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
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
            Claim Approvals Queue
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Pending Manager Approvals & Expense Verification
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Queue Info Card */}
        <View style={[styles.queueBanner, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
          <Text style={[styles.queueTitle, { color: '#f59e0b' }]}>
            ⏳ Pending Approval Queue ({pendingClaims.length} Claims)
          </Text>
          <Text style={[styles.queueSub, { color: colors.textSecondary }]}>
            Review employee receipts, verify expense policy limits, and process reimbursement decisions.
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          pendingClaims.map(claim => {
            const icon = getTypeIcon(claim.type);

            return (
              <View
                key={claim.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                {/* Header Row */}
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

                  <Text style={[styles.claimAmtText, { color: colors.accent }]}>
                    ₹ {claim.amount.toLocaleString()}
                  </Text>
                </View>

                {/* Reason Notes */}
                <View style={[styles.reasonBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.reasonText, { color: colors.textPrimary }]}>
                    "{claim.reason}"
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.actionBtnRow}>
                  <TouchableOpacity
                    style={[styles.actionRejectBtn, { borderColor: '#ef4444' }]}
                    onPress={() => handleUpdateStatus(claim.id, claim.employeeName, 'Rejected')}
                  >
                    <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '700' }}>
                      ❌ Reject Claim
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionApproveBtn, { backgroundColor: '#10b981' }]}
                    onPress={() => handleUpdateStatus(claim.id, claim.employeeName, 'Approved')}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>
                      ✅ Approve Claim
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {pendingClaims.length === 0 && !isLoading && (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No pending travel claims require approval at this time.
          </Text>
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
  queueBanner: {
    padding: 14,
    borderRadius: 14,
    gap: 4,
  },
  queueTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  queueSub: {
    fontSize: 11,
    lineHeight: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
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
  claimAmtText: {
    fontSize: 16,
    fontWeight: '900',
  },
  reasonBox: {
    padding: 10,
    borderRadius: 10,
  },
  reasonText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 17,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionRejectBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionApproveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
