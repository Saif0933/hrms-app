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
  useApplyRegularization,
  useRegularizations,
  useUpdateRegularization,
} from '../../api/hook/useAttendance';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AttendanceRegularization'>;

export const AttendanceRegularizationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  // Modal State for Apply Regularization
  const [modalOpen, setModalOpen] = useState(false);
  const [date, setDate] = useState('2026-07-28');
  const [timeIn, setTimeIn] = useState('09:15 AM');
  const [timeOut, setTimeOut] = useState('06:30 PM');
  const [reason, setReason] = useState('Biometric scanner failed during morning check-in');

  // TanStack Queries & Mutations
  const { data: regRes, isLoading } = useRegularizations();
  const applyMutation = useApplyRegularization();
  const updateMutation = useUpdateRegularization();

  const regularizations = regRes?.data || [
    {
      id: 'REG001',
      employeeName: 'Aarav Sharma',
      employeeId: 'EMP001',
      date: '2026-07-28',
      timeIn: '09:15 AM',
      timeOut: '06:30 PM',
      reason: 'Biometric device failed during morning punch',
      status: 'Pending' as const,
    },
    {
      id: 'REG002',
      employeeName: 'Neha Patel',
      employeeId: 'EMP002',
      date: '2026-07-25',
      timeIn: '09:30 AM',
      timeOut: '07:00 PM',
      reason: 'Client meeting outside office location',
      status: 'Approved' as const,
    },
  ];

  const handleApplySubmit = () => {
    if (!date || !timeIn || !reason) {
      Alert.alert('Validation Error', 'Please fill in Date, Time In, and Reason.');
      return;
    }

    applyMutation.mutate(
      {
        employeeId: 'EMP001',
        date,
        timeIn,
        timeOut,
        reason,
      },
      {
        onSuccess: () => {
          setModalOpen(false);
          Alert.alert('Request Submitted 📝', 'Attendance regularization request sent for manager approval.');
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const handleUpdateStatus = (id: string, newStatus: 'Approved' | 'Rejected') => {
    updateMutation.mutate(
      { id, status: newStatus },
      {
        onSuccess: () => {
          Alert.alert('Status Updated', `Regularization request ${id} marked as ${newStatus}`);
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'Approved':
        return { bg: '#10b98120', text: '#10b981' };
      case 'Rejected':
        return { bg: '#ef444420', text: '#ef4444' };
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
            Attendance Regularization
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Missed Punch & Regularization Requests
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.applyTopBtn, { backgroundColor: colors.accent }]}
          onPress={() => setModalOpen(true)}
        >
          <Text style={styles.applyTopBtnText}>+ Apply</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Submissions List */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Regularization Submissions ({regularizations.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          regularizations.map(item => {
            const badge = getStatusBadge(item.status);

            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={[styles.empName, { color: colors.textPrimary }]}>
                      {item.employeeName}
                    </Text>
                    <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                      Date: {item.date} • ({item.timeIn} - {item.timeOut})
                    </Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusText, { color: badge.text }]}>{item.status}</Text>
                  </View>
                </View>

                <View style={[styles.reasonBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.reasonText, { color: colors.textSecondary }]}>
                    💬 Reason: {item.reason}
                  </Text>
                </View>

                {item.status === 'Pending' && (
                  <View style={styles.actionBtnRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
                      onPress={() => handleUpdateStatus(item.id, 'Approved')}
                    >
                      <Text style={styles.actionBtnText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { backgroundColor: '#ef4444' }]}
                      onPress={() => handleUpdateStatus(item.id, 'Rejected')}
                    >
                      <Text style={styles.actionBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Apply Regularization Modal */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Apply for Regularization
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DATE (YYYY-MM-DD) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={date}
              onChangeText={setDate}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EXPECTED TIME IN *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={timeIn}
              onChangeText={setTimeIn}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EXPECTED TIME OUT *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={timeOut}
              onChangeText={setTimeOut}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>REASON FOR REGULARIZATION *</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setModalOpen(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.accent }]}
                onPress={handleApplySubmit}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Submit Request</Text>
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
  applyTopBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  applyTopBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  empName: {
    fontSize: 15,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  reasonBox: {
    padding: 10,
    borderRadius: 8,
  },
  reasonText: {
    fontSize: 12,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
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
    gap: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
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
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});
