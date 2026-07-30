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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  LeaveStatus,
  useCancelLeaveRequest,
  useLeaveRequests,
  useProcessLeaveRequest,
} from '../../api/hook/useLeave';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'LeaveApprovals'>;

export const LeaveApprovalsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('PENDING');

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // TanStack Queries & Mutations
  const { data: requestsRes, isLoading } = useLeaveRequests();
  const processMutation = useProcessLeaveRequest();
  const cancelMutation = useCancelLeaveRequest();

  const leaveRequests = requestsRes?.data || [
    {
      id: 'LR101',
      employeeId: 'EMP002',
      employee: { id: 'EMP002', name: 'Neha Patel', email: 'neha@symbosys.com' },
      leaveTypeId: 'LT001',
      leaveType: { name: 'Casual Leave', code: 'CL', id: 'LT001', defaultDays: 12, carryForward: true, isActive: true, createdAt: '', updatedAt: '' },
      startDate: '2026-08-05',
      endDate: '2026-08-07',
      totalDays: 3,
      reason: 'Attending family wedding in Gujarat',
      status: 'PENDING' as LeaveStatus,
      appliedDate: '2026-07-29',
      createdAt: '',
      updatedAt: '',
      halfDay: false,
    },
    {
      id: 'LR102',
      employeeId: 'EMP003',
      employee: { id: 'EMP003', name: 'Vikram Malhotra', email: 'vikram@symbosys.com' },
      leaveTypeId: 'LT002',
      leaveType: { name: 'Sick Leave', code: 'SL', id: 'LT002', defaultDays: 10, carryForward: false, isActive: true, createdAt: '', updatedAt: '' },
      startDate: '2026-07-30',
      endDate: '2026-07-30',
      totalDays: 1,
      reason: 'Severe migraine & doctor consultation',
      status: 'PENDING' as LeaveStatus,
      appliedDate: '2026-07-30',
      createdAt: '',
      updatedAt: '',
      halfDay: false,
    },
    {
      id: 'LR103',
      employeeId: 'EMP004',
      employee: { id: 'EMP004', name: 'Karan Johar', email: 'karan@symbosys.com' },
      leaveTypeId: 'LT003',
      leaveType: { name: 'Privilege Leave', code: 'PL', id: 'LT003', defaultDays: 15, carryForward: true, isActive: true, createdAt: '', updatedAt: '' },
      startDate: '2026-07-20',
      endDate: '2026-07-25',
      totalDays: 5,
      reason: 'Annual vacation trip',
      status: 'APPROVED' as LeaveStatus,
      appliedDate: '2026-07-15',
      createdAt: '',
      updatedAt: '',
      halfDay: false,
    },
  ];

  const filteredRequests = leaveRequests.filter(r => {
    if (selectedStatusFilter === 'ALL') return true;
    return r.status === selectedStatusFilter;
  });

  const handleApprove = (id: string, empName?: string) => {
    processMutation.mutate(
      { id, data: { status: 'APPROVED' } },
      {
        onSuccess: () => {
          Alert.alert('Leave Approved ✅', `Approved leave request for ${empName || 'employee'}.`);
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const handleOpenRejectModal = (id: string) => {
    setSelectedReqId(id);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!selectedReqId) return;

    processMutation.mutate(
      {
        id: selectedReqId,
        data: { status: 'REJECTED', rejectionReason },
      },
      {
        onSuccess: () => {
          setRejectModalOpen(false);
          Alert.alert('Leave Rejected ❌', 'Leave request marked as REJECTED.');
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const handleCancelRequest = (id: string) => {
    Alert.alert('Confirm Cancel', 'Cancel this leave request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: () => {
          cancelMutation.mutate(id, {
            onSuccess: () => Alert.alert('Cancelled', 'Leave request cancelled.'),
          });
        },
      },
    ]);
  };

  const getStatusPill = (st: string) => {
    switch (st) {
      case 'APPROVED':
        return { bg: '#10b98120', text: '#10b981' };
      case 'REJECTED':
        return { bg: '#ef444420', text: '#ef4444' };
      case 'CANCELLED':
        return { bg: 'rgba(100,100,100,0.1)', text: '#94a3b8' };
      case 'PENDING':
      default:
        return { bg: '#f59e0b20', text: '#f59e0b' };
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
            Leave Approvals Dashboard
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Manager Approval Feed & Processing
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Filter Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(st => {
            const isSelected = selectedStatusFilter === st;
            return (
              <TouchableOpacity
                key={st}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.cardBackground,
                    borderColor: isSelected ? colors.accent : colors.cardBorder,
                  },
                ]}
                onPress={() => setSelectedStatusFilter(st)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? '#ffffff' : colors.textPrimary },
                  ]}
                >
                  {st}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Applications ({filteredRequests.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          filteredRequests.map(req => {
            const pill = getStatusPill(req.status);

            return (
              <View
                key={req.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={styles.avatarMini}>
                    <Text style={styles.avatarMiniText}>
                      {req.employee?.name
                        ? req.employee.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .slice(0, 2)
                        : 'EMP'}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.empName, { color: colors.textPrimary }]}>
                      {req.employee?.name || 'Employee'}
                    </Text>
                    <Text style={[styles.reqTypeSub, { color: colors.textSecondary }]}>
                      {req.leaveType?.name || 'Leave'} • Applied: {req.appliedDate}
                    </Text>
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
                    <Text style={[styles.statusPillText, { color: pill.text }]}>{req.status}</Text>
                  </View>
                </View>

                {/* Dates & Duration Info */}
                <View style={[styles.durationBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.durationText, { color: colors.textPrimary }]}>
                    🗓️ Date Range: <Text style={{ fontWeight: '800' }}>{req.startDate} to {req.endDate}</Text> ({req.totalDays} Day{req.totalDays > 1 ? 's' : ''})
                  </Text>
                  <Text style={[styles.reasonText, { color: colors.textSecondary }]}>
                    💬 Reason: {req.reason}
                  </Text>
                </View>

                {/* Action Buttons for Pending Requests */}
                {req.status === 'PENDING' && (
                  <View style={styles.actionBtnRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
                      onPress={() => handleApprove(req.id, req.employee?.name)}
                    >
                      <Text style={styles.actionBtnText}>Approve ✅</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
                      onPress={() => handleOpenRejectModal(req.id)}
                    >
                      <Text style={styles.actionBtnText}>Reject ❌</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.cancelBtn, { borderColor: colors.cardBorder }]}
                      onPress={() => handleCancelRequest(req.id)}
                    >
                      <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Rejection Modal */}
      <Modal visible={rejectModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Reject Leave Application
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Please state the rejection rationale for the employee.
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>REJECTION REASON</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={3}
              placeholder="e.g. Critical project deadline / Staff shortage..."
              placeholderTextColor={colors.inputPlaceholder}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setRejectModalOpen(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalRejectBtn, { backgroundColor: '#ef4444' }]}
                onPress={handleConfirmReject}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Reject Leave</Text>
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
    gap: 12,
    paddingBottom: 40,
  },
  filterRow: {
    width: '100%',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarMini: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  empName: {
    fontSize: 15,
    fontWeight: '700',
  },
  reqTypeSub: {
    fontSize: 11,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  durationBox: {
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  durationText: {
    fontSize: 12,
  },
  reasonText: {
    fontSize: 12,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    gap: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 70,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalRejectBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});
