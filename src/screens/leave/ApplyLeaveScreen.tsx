import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
  const { colors, isDark } = useTheme();

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
        return {
          bg: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ecfdf5',
          text: isDark ? '#34d399' : '#059669',
          border: isDark ? 'rgba(52, 211, 153, 0.4)' : '#a7f3d0',
          icon: '✅',
        };
      case 'REJECTED':
        return {
          bg: isDark ? 'rgba(239, 68, 68, 0.18)' : '#fef2f2',
          text: isDark ? '#f87171' : '#dc2626',
          border: isDark ? 'rgba(248, 113, 113, 0.4)' : '#fecaca',
          icon: '❌',
        };
      case 'CANCELLED':
        return {
          bg: isDark ? 'rgba(148, 163, 184, 0.18)' : '#f1f5f9',
          text: isDark ? '#94a3b8' : '#64748b',
          border: isDark ? 'rgba(148, 163, 184, 0.4)' : '#e2e8f0',
          icon: '🚫',
        };
      case 'PENDING':
      default:
        return {
          bg: isDark ? 'rgba(245, 158, 11, 0.18)' : '#fffbeb',
          text: isDark ? '#fbbf24' : '#d97706',
          border: isDark ? 'rgba(251, 191, 36, 0.4)' : '#fde68a',
          icon: '⏳',
        };
    }
  };

  const getLeaveTheme = (code?: string, index: number = 0) => {
    switch (code) {
      case 'CL':
        return { accent: '#3b82f6', bg: isDark ? 'rgba(59, 130, 246, 0.12)' : '#eff6ff' };
      case 'SL':
        return { accent: '#ef4444', bg: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fef2f2' };
      case 'PL':
        return { accent: '#10b981', bg: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5' };
      default:
        const palette = [
          { accent: '#8b5cf6', bg: isDark ? 'rgba(139, 92, 246, 0.12)' : '#f5f3ff' },
          { accent: '#f59e0b', bg: isDark ? 'rgba(245, 158, 11, 0.12)' : '#fffbeb' },
        ];
        return palette[index % palette.length];
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
          style={[styles.backButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
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
        <View style={[styles.portalBadge, { backgroundColor: colors.statLeaveBg }]}>
          <Text style={[styles.portalBadgeText, { color: colors.statLeaveText }]}>🌴 Leave Hub</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Leave Quota Balances Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            🌴 Your Leave Balances
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Annual Quotas
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quotaRow}>
          {allocations.map((alloc, idx) => {
            const remaining = alloc.allocated - alloc.used - alloc.pending;
            const theme = getLeaveTheme(alloc.leaveType?.code, idx);
            const usagePercent = Math.min(100, Math.round(((alloc.used + alloc.pending) / alloc.allocated) * 100));

            return (
              <View
                key={alloc.id}
                style={[
                  styles.quotaCard,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.quotaTopRow}>
                  <View style={[styles.quotaTag, { backgroundColor: theme.bg }]}>
                    <Text style={[styles.quotaTagText, { color: theme.accent }]}>
                      {alloc.leaveType?.code || 'LV'}
                    </Text>
                  </View>
                  <Text style={[styles.quotaAllocatedText, { color: colors.textSecondary }]}>
                    {alloc.allocated} Days Total
                  </Text>
                </View>

                <Text style={[styles.quotaName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {alloc.leaveType?.name || 'Leave'}
                </Text>

                <View style={styles.quotaBalanceRow}>
                  <Text style={[styles.quotaRem, { color: theme.accent }]}>{remaining}</Text>
                  <Text style={[styles.quotaRemUnit, { color: colors.textSecondary }]}>
                    Days Avail.
                  </Text>
                </View>

                {/* Progress bar */}
                <View style={[styles.progressTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0' }]}>
                  <View style={[styles.progressBar, { width: `${100 - usagePercent}%`, backgroundColor: theme.accent }]} />
                </View>

                <Text style={[styles.quotaSub, { color: colors.textSecondary }]}>
                  Used: {alloc.used}d • Pending: {alloc.pending}d
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
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              📝 Leave Application Form
            </Text>
          </View>

          {/* Leave Type Dropdown Pills */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SELECT LEAVE TYPE *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 2 }}>
            {leaveTypes.map((lt, idx) => {
              const isSelected = (selectedLeaveTypeId || leaveTypes[0]?.id) === lt.id;
              const theme = getLeaveTheme(lt.code, idx);

              return (
                <TouchableOpacity
                  key={lt.id}
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: isSelected ? colors.accent : (isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9'),
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setSelectedLeaveTypeId(lt.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      { color: isSelected ? '#ffffff' : colors.textPrimary },
                    ]}
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
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>📅 START DATE *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.inputPlaceholder}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>📅 END DATE *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.inputPlaceholder}
              />
            </View>
          </View>

          {/* Half-Day Switch */}
          <View
            style={[
              styles.switchCard,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderColor: colors.cardBorder },
            ]}
          >
            <View style={styles.switchTextContainer}>
              <Text style={[styles.switchLabelTitle, { color: colors.textPrimary }]}>
                Half-Day Duration
              </Text>
              <Text style={[styles.switchLabelSub, { color: colors.textSecondary }]}>
                Apply for 0.5 day single session
              </Text>
            </View>
            <Switch
              value={isHalfDay}
              onValueChange={setIsHalfDay}
              thumbColor={isHalfDay ? colors.accent : '#94a3b8'}
              trackColor={{ false: '#cbd5e1', true: 'rgba(59, 130, 246, 0.4)' }}
            />
          </View>

          {isHalfDay && (
            <View style={styles.halfDaySessionRow}>
              <TouchableOpacity
                style={[
                  styles.sessionBtn,
                  { borderColor: halfDaySession === 'FIRST_HALF' ? colors.accent : colors.cardBorder },
                  halfDaySession === 'FIRST_HALF'
                    ? { backgroundColor: colors.accent }
                    : { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' },
                ]}
                onPress={() => setHalfDaySession('FIRST_HALF')}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    color: halfDaySession === 'FIRST_HALF' ? '#ffffff' : colors.textPrimary,
                    fontWeight: '700',
                    fontSize: 12,
                  }}
                >
                  🌅 First Half (Morning)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sessionBtn,
                  { borderColor: halfDaySession === 'SECOND_HALF' ? colors.accent : colors.cardBorder },
                  halfDaySession === 'SECOND_HALF'
                    ? { backgroundColor: colors.accent }
                    : { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' },
                ]}
                onPress={() => setHalfDaySession('SECOND_HALF')}
                activeOpacity={0.8}
              >
                <Text
                  style={{
                    color: halfDaySession === 'SECOND_HALF' ? '#ffffff' : colors.textPrimary,
                    fontWeight: '700',
                    fontSize: 12,
                  }}
                >
                  🌇 Second Half (Afternoon)
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Reason */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>💬 REASON FOR LEAVE *</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText },
            ]}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            placeholder="Specify reasons for leave request..."
            placeholderTextColor={colors.inputPlaceholder}
          />

          {/* Attachment URL */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            📎 MEDICAL CERTIFICATE / ATTACHMENT URL
          </Text>
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
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            📋 Application History
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Recent Submissions
          </Text>
        </View>

        {isLoadingRequests ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Fetching leave history...
            </Text>
          </View>
        ) : (
          myRequests.map((req, idx) => {
            const pill = getStatusPill(req.status);
            const theme = getLeaveTheme(req.leaveType?.code, idx);

            return (
              <View
                key={req.id}
                style={[
                  styles.historyCard,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.reqMainRow}>
                  {/* Left Code Badge */}
                  <View style={[styles.reqIconBadge, { backgroundColor: theme.bg }]}>
                    <Text style={[styles.reqIconBadgeText, { color: theme.accent }]}>
                      {req.leaveType?.code || 'LV'}
                    </Text>
                  </View>

                  {/* Middle Info */}
                  <View style={styles.reqInfoCol}>
                    <View style={styles.reqTitleLine}>
                      <Text style={[styles.reqType, { color: colors.textPrimary }]}>
                        {req.leaveType?.name || 'Leave Application'}
                      </Text>
                      <View style={[styles.dayCountTag, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }]}>
                        <Text style={[styles.dayCountText, { color: colors.textPrimary }]}>
                          {req.totalDays} {req.totalDays === 1 ? 'Day' : 'Days'}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.reqDates, { color: colors.textSecondary }]}>
                      🗓️ {req.startDate} → {req.endDate}
                    </Text>
                  </View>

                  {/* Right Status Pill */}
                  <View style={[styles.statusPill, { backgroundColor: pill.bg, borderColor: pill.border }]}>
                    <Text style={[styles.statusPillText, { color: pill.text }]}>
                      {pill.icon} {req.status}
                    </Text>
                  </View>
                </View>

                {Boolean(req.reason) && (
                  <View style={[styles.reasonBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderColor: colors.cardBorder }]}>
                    <Text style={[styles.reqReasonLabel, { color: colors.textMuted }]}>Reason:</Text>
                    <Text style={[styles.reqReason, { color: colors.textPrimary }]}>
                      {req.reason}
                    </Text>
                  </View>
                )}
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
  portalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  portalBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  quotaRow: {
    width: '100%',
  },
  quotaCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 10,
    width: 155,
    gap: 6,
  },
  quotaTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quotaTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  quotaTagText: {
    fontSize: 10,
    fontWeight: '900',
  },
  quotaAllocatedText: {
    fontSize: 10,
    fontWeight: '600',
  },
  quotaName: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  quotaBalanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  quotaRem: {
    fontSize: 22,
    fontWeight: '900',
  },
  quotaRemUnit: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  quotaSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    borderWidth: 1,
    marginTop: 4,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  switchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  switchTextContainer: {
    flex: 1,
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
    gap: 10,
  },
  sessionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  textArea: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  historyCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  reqMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reqIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reqIconBadgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  reqInfoCol: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  reqTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  reqType: {
    fontSize: 14,
    fontWeight: '700',
  },
  dayCountTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  dayCountText: {
    fontSize: 10,
    fontWeight: '700',
  },
  reqDates: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'center',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  reasonBox: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  reqReasonLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  reqReason: {
    flex: 1,
    fontSize: 12,
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
