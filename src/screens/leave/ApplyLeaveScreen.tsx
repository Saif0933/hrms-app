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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  HalfDaySession,
  useLeaveAllocations,
  useLeaveRequests,
  useLeaveTypes,
  useSubmitLeaveRequest,
} from '../../api/hook/useLeave';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ApplyLeave'>;

export const ApplyLeaveScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const currentEmployeeId = 'EMP001';

  // Form State
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<string>('');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-08-02');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState<HalfDaySession>('FIRST_HALF');
  const [reason, setReason] = useState('Personal work & family occasion');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // TanStack Queries & Mutations
  const { data: typesRes } = useLeaveTypes(true);
  const { data: allocationsRes } = useLeaveAllocations({ employeeId: currentEmployeeId });
  const { data: myRequestsRes, isLoading: isLoadingRequests } = useLeaveRequests({ employeeId: currentEmployeeId });
  const submitLeaveMutation = useSubmitLeaveRequest();

  const leaveTypes = typesRes?.data || [
    { id: 'LT001', name: 'Casual Leave', code: 'CL', defaultDays: 12 },
    { id: 'LT002', name: 'Sick Leave', code: 'SL', defaultDays: 10 },
    { id: 'LT003', name: 'Privilege Leave', code: 'PL', defaultDays: 15 },
  ];

  const allocations = allocationsRes?.data || [
    { id: 'LA01', leaveTypeId: 'LT001', allocated: 12, used: 4, pending: 1, leaveType: { name: 'Casual Leave', code: 'CL' } },
    { id: 'LA02', leaveTypeId: 'LT002', allocated: 10, used: 2, pending: 0, leaveType: { name: 'Sick Leave', code: 'SL' } },
    { id: 'LA03', leaveTypeId: 'LT003', allocated: 15, used: 1, pending: 0, leaveType: { name: 'Privilege Leave', code: 'PL' } },
  ];

  const myRequests = myRequestsRes?.data || [
    {
      id: 'LR001',
      employeeId: currentEmployeeId,
      leaveTypeId: 'LT001',
      startDate: '2026-07-15',
      endDate: '2026-07-16',
      totalDays: 2,
      reason: 'Urgent home maintenance',
      status: 'APPROVED' as const,
      appliedDate: '2026-07-10',
      leaveType: { name: 'Casual Leave', code: 'CL' },
    },
    {
      id: 'LR002',
      employeeId: currentEmployeeId,
      leaveTypeId: 'LT002',
      startDate: '2026-07-22',
      endDate: '2026-07-22',
      totalDays: 1,
      reason: 'Fever and medical consultation',
      status: 'APPROVED' as const,
      appliedDate: '2026-07-21',
      leaveType: { name: 'Sick Leave', code: 'SL' },
    },
  ];

  const handleSubmitLeave = () => {
    const typeId = selectedLeaveTypeId || leaveTypes[0]?.id;
    if (!typeId || !startDate || !endDate || !reason.trim()) {
      Alert.alert('Validation Error', 'Please complete all required fields.');
      return;
    }

    submitLeaveMutation.mutate(
      {
        employeeId: currentEmployeeId,
        leaveTypeId: typeId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        halfDay: isHalfDay,
        halfDaySession: isHalfDay ? halfDaySession : null,
        reason: reason.trim(),
        attachmentUrl: attachmentUrl || null,
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Leave Request Submitted 🌴',
            'Your leave application has been submitted for manager approval.'
          );
          setReason('');
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Apply for Leave</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Submit Leave Application & Check Balance
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Leave Quota Balances Grid */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Your Leave Balance Quotas
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quotaRow}>
          {allocations.map(alloc => {
            const remaining = alloc.allocated - alloc.used - alloc.pending;

            return (
              <View
                key={alloc.id}
                style={[
                  styles.quotaCard,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                <Text style={[styles.quotaName, { color: colors.accent }]}>
                  {alloc.leaveType?.name || 'Leave'}
                </Text>
                <Text style={[styles.quotaRem, { color: colors.textPrimary }]}>
                  {remaining} <Text style={{ fontSize: 11, fontWeight: '500', color: colors.textSecondary }}>/ {alloc.allocated} Days</Text>
                </Text>
                <Text style={[styles.quotaSub, { color: colors.textSecondary }]}>
                  Used: {alloc.used} • Pending: {alloc.pending}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Apply Leave Form */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            📝 Leave Application Form
          </Text>

          {/* Leave Type Dropdown Pills */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SELECT LEAVE TYPE *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {leaveTypes.map(lt => {
              const isSelected = (selectedLeaveTypeId || leaveTypes[0]?.id) === lt.id;
              return (
                <TouchableOpacity
                  key={lt.id}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.background,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setSelectedLeaveTypeId(lt.id)}
                >
                  <Text
                    style={{
                      color: isSelected ? '#ffffff' : colors.textPrimary,
                      fontWeight: '700',
                      fontSize: 12,
                    }}
                  >
                    {lt.name} ({lt.code})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Dates */}
          <View style={styles.dateRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>START DATE *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>END DATE *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </View>

          {/* Half-Day Switch */}
          <View style={styles.switchRow}>
            <View>
              <Text style={[styles.switchLabelTitle, { color: colors.textPrimary }]}>
                Half-Day Leave Option
              </Text>
              <Text style={[styles.switchLabelSub, { color: colors.textSecondary }]}>
                Apply for 0.5 day half-day duration
              </Text>
            </View>
            <Switch value={isHalfDay} onValueChange={setIsHalfDay} thumbColor={isHalfDay ? colors.accent : '#94a3b8'} />
          </View>

          {isHalfDay && (
            <View style={styles.halfDaySessionRow}>
              <TouchableOpacity
                style={[
                  styles.sessionBtn,
                  halfDaySession === 'FIRST_HALF' && { backgroundColor: colors.accent },
                ]}
                onPress={() => setHalfDaySession('FIRST_HALF')}
              >
                <Text style={{ color: halfDaySession === 'FIRST_HALF' ? '#fff' : colors.textSecondary, fontWeight: '700', fontSize: 11 }}>
                  First Half (Morning)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sessionBtn,
                  halfDaySession === 'SECOND_HALF' && { backgroundColor: colors.accent },
                ]}
                onPress={() => setHalfDaySession('SECOND_HALF')}
              >
                <Text style={{ color: halfDaySession === 'SECOND_HALF' ? '#fff' : colors.textSecondary, fontWeight: '700', fontSize: 11 }}>
                  Second Half (Afternoon)
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Reason */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>REASON FOR LEAVE *</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            placeholder="Specify reasons for leave request..."
            placeholderTextColor={colors.inputPlaceholder}
          />

          {/* Attachment URL */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>MEDICAL CERTIFICATE / ATTACHMENT URL</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={attachmentUrl}
            onChangeText={setAttachmentUrl}
            placeholder="https://..."
            placeholderTextColor={colors.inputPlaceholder}
          />

          {/* Submit Action */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: colors.accent },
              submitLeaveMutation.isPending && { opacity: 0.7 },
            ]}
            onPress={handleSubmitLeave}
            disabled={submitLeaveMutation.isPending}
            activeOpacity={0.85}
          >
            {submitLeaveMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>🌴 Submit Leave Application</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* My Leave Requests History */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          My Application History
        </Text>

        {isLoadingRequests ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 14 }} />
        ) : (
          myRequests.map(req => {
            const pill = getStatusPill(req.status);

            return (
              <View
                key={req.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.reqHeaderRow}>
                  <View>
                    <Text style={[styles.reqType, { color: colors.textPrimary }]}>
                      {req.leaveType?.name || 'Leave'}
                    </Text>
                    <Text style={[styles.reqDates, { color: colors.textSecondary }]}>
                      {req.startDate} to {req.endDate} ({req.totalDays} Day{req.totalDays > 1 ? 's' : ''})
                    </Text>
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
                    <Text style={[styles.statusPillText, { color: pill.text }]}>{req.status}</Text>
                  </View>
                </View>

                <Text style={[styles.reqReason, { color: colors.textSecondary }]}>
                  💬 {req.reason}
                </Text>
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
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  quotaRow: {
    width: '100%',
  },
  quotaCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 10,
    width: 140,
    gap: 4,
  },
  quotaName: {
    fontSize: 12,
    fontWeight: '800',
  },
  quotaRem: {
    fontSize: 18,
    fontWeight: '900',
  },
  quotaSub: {
    fontSize: 10,
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
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchLabelTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  switchLabelSub: {
    fontSize: 11,
    marginTop: 1,
  },
  halfDaySessionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sessionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(100,100,100,0.1)',
  },
  textArea: {
    minHeight: 70,
  },
  submitBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  reqHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reqType: {
    fontSize: 14,
    fontWeight: '700',
  },
  reqDates: {
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
  reqReason: {
    fontSize: 12,
  },
});
