import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useEmployees } from '../../api/hook/useEmployee';
import {
  TimesheetEntry,
  useSubmitTimesheet,
  useTimesheets,
  useUpdateTimesheetStatus,
} from '../../api/hook/useTimesheets';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'TimesheetEntry'>;

export const TimesheetEntryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [selectedEmpId, setSelectedEmpId] = useState('EMP001');
  const [selectedWeek, setSelectedWeek] = useState('2026-W31');

  // Entry Form State
  const [projectName, setProjectName] = useState('Symbosys HRMS Core App');
  const [taskDesc, setTaskDesc] = useState('React Native Timesheet Module & Navigation Wiring');
  const [monHours, setMonHours] = useState('8');
  const [tueHours, setTueHours] = useState('8');
  const [wedHours, setWedHours] = useState('8');
  const [thuHours, setThuHours] = useState('8');
  const [friHours, setFriHours] = useState('8');

  // TanStack Queries & Mutations
  const { data: empRes } = useEmployees();
  const { data: timesheetsRes, isLoading } = useTimesheets();
  const submitTimesheetMutation = useSubmitTimesheet();
  const updateStatusMutation = useUpdateTimesheetStatus();

  const employees = empRes?.data || [];

  const timesheetLogs: TimesheetEntry[] = timesheetsRes?.data || [
    {
      id: 'TS101',
      employeeId: 'EMP001',
      employeeName: 'Aarav Sharma',
      project: 'Symbosys HRMS Core App',
      task: 'React Native Navigation & TanStack Query Integration',
      monHours: 8,
      tueHours: 8,
      wedHours: 8,
      thuHours: 8,
      friHours: 8,
      hours: 40,
      week: '2026-W31',
      status: 'Approved',
    },
    {
      id: 'TS102',
      employeeId: 'EMP002',
      employeeName: 'Neha Patel',
      project: 'HR Portal Audit & Compliance',
      task: 'Statutory Payroll Reports & ECR Verification',
      monHours: 8,
      tueHours: 7.5,
      wedHours: 8,
      thuHours: 8,
      friHours: 8.5,
      hours: 40,
      week: '2026-W31',
      status: 'Pending',
    },
    {
      id: 'TS103',
      employeeId: 'EMP31723',
      employeeName: 'sam',
      project: 'UI/UX Component System',
      task: 'Figma Mockup Conversion to React Native Styles',
      monHours: 7,
      tueHours: 8,
      wedHours: 8,
      thuHours: 7,
      friHours: 8,
      hours: 38,
      week: '2026-W31',
      status: 'Pending',
    },
  ];

  const calcTotalHours = () => {
    const m = parseFloat(monHours) || 0;
    const t = parseFloat(tueHours) || 0;
    const w = parseFloat(wedHours) || 0;
    const th = parseFloat(thuHours) || 0;
    const f = parseFloat(friHours) || 0;
    return m + t + w + th + f;
  };

  const totalHrs = calcTotalHours();

  // Submit Weekly Log
  const handleSubmitTimesheet = () => {
    if (!projectName.trim() || !taskDesc.trim()) {
      Alert.alert('Validation Error', 'Please specify Project Name and Task Description.');
      return;
    }

    submitTimesheetMutation.mutate(
      {
        employeeId: selectedEmpId,
        project: projectName.trim(),
        task: taskDesc.trim(),
        monHours: parseFloat(monHours) || 0,
        tueHours: parseFloat(tueHours) || 0,
        wedHours: parseFloat(wedHours) || 0,
        thuHours: parseFloat(thuHours) || 0,
        friHours: parseFloat(friHours) || 0,
        week: selectedWeek,
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Timesheet Submitted 📋',
            `Weekly timesheet for ${projectName} (${totalHrs} hrs) submitted for approval!`
          );
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  // Manager Update Status
  const handleUpdateStatus = (id: string, name: string, status: 'Approved' | 'Rejected') => {
    updateStatusMutation.mutate(
      { id, status },
      {
        onSuccess: () => {
          Alert.alert(
            `Timesheet ${status} ${status === 'Approved' ? '✅' : '❌'}`,
            `Weekly timesheet log for ${name} was ${status.toLowerCase()}.`
          );
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

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
            Weekly Timesheet Entry
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Project Hours Matrix & Manager Approval Queue
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Week & Employee Selector */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            🗓️ Select Week & Employee Profile
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
            {['2026-W31 (Jul 27 - Jul 31)', '2026-W30 (Jul 20 - Jul 24)', '2026-W29 (Jul 13 - Jul 17)'].map(wk => {
              const isSelected = selectedWeek === wk.split(' ')[0];
              return (
                <TouchableOpacity
                  key={wk}
                  style={[
                    styles.weekChip,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.background,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setSelectedWeek(wk.split(' ')[0])}
                >
                  <Text style={{ color: isSelected ? '#fff' : colors.textPrimary, fontWeight: '700', fontSize: 11 }}>
                    {wk}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>LOGGING FOR EMPLOYEE *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {employees.length > 0
              ? employees.map(emp => {
                  const isSelected = selectedEmpId === emp.id;
                  return (
                    <TouchableOpacity
                      key={emp.id}
                      style={[
                        styles.empChip,
                        {
                          backgroundColor: isSelected ? colors.accent : colors.background,
                          borderColor: isSelected ? colors.accent : colors.cardBorder,
                        },
                      ]}
                      onPress={() => setSelectedEmpId(emp.id)}
                    >
                      <Text style={{ color: isSelected ? '#fff' : colors.textPrimary, fontWeight: '600', fontSize: 11 }}>
                        {emp.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              : ['EMP001', 'EMP002', 'EMP31723'].map(id => (
                  <TouchableOpacity
                    key={id}
                    style={[
                      styles.empChip,
                      {
                        backgroundColor: selectedEmpId === id ? colors.accent : colors.background,
                        borderColor: selectedEmpId === id ? colors.accent : colors.cardBorder,
                      },
                    ]}
                    onPress={() => setSelectedEmpId(id)}
                  >
                    <Text style={{ color: selectedEmpId === id ? '#fff' : colors.textPrimary, fontWeight: '600', fontSize: 11 }}>
                      {id === 'EMP001' ? 'Aarav Sharma' : id === 'EMP31723' ? 'sam' : 'Neha Patel'}
                    </Text>
                  </TouchableOpacity>
                ))}
          </ScrollView>
        </View>

        {/* Weekly Hours Matrix Entry Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            📋 Log Weekly Work Hours ({selectedWeek})
          </Text>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PROJECT NAME *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={projectName}
            onChangeText={setProjectName}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>TASK DESCRIPTION *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={taskDesc}
            onChangeText={setTaskDesc}
          />

          {/* Daily Hours Inputs (Mon-Fri) */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DAILY HOURS (MON - FRI)</Text>
          <View style={styles.daysGrid}>
            <View style={styles.dayCol}>
              <Text style={[styles.dayLbl, { color: colors.textSecondary }]}>MON</Text>
              <TextInput
                style={[styles.dayInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={monHours}
                onChangeText={setMonHours}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.dayCol}>
              <Text style={[styles.dayLbl, { color: colors.textSecondary }]}>TUE</Text>
              <TextInput
                style={[styles.dayInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={tueHours}
                onChangeText={setTueHours}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.dayCol}>
              <Text style={[styles.dayLbl, { color: colors.textSecondary }]}>WED</Text>
              <TextInput
                style={[styles.dayInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={wedHours}
                onChangeText={setWedHours}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.dayCol}>
              <Text style={[styles.dayLbl, { color: colors.textSecondary }]}>THU</Text>
              <TextInput
                style={[styles.dayInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={thuHours}
                onChangeText={setThuHours}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.dayCol}>
              <Text style={[styles.dayLbl, { color: colors.textSecondary }]}>FRI</Text>
              <TextInput
                style={[styles.dayInput, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={friHours}
                onChangeText={setFriHours}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Total Calculated Banner */}
          <View style={[styles.totalBanner, { backgroundColor: colors.background }]}>
            <Text style={[styles.totalBannerLabel, { color: colors.textSecondary }]}>Total Weekly Hours:</Text>
            <Text style={[styles.totalBannerValue, { color: colors.accent }]}>{totalHrs} hrs</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: colors.accent },
              submitTimesheetMutation.isPending && { opacity: 0.7 },
            ]}
            onPress={handleSubmitTimesheet}
            disabled={submitTimesheetMutation.isPending}
            activeOpacity={0.85}
          >
            {submitTimesheetMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>🚀 Submit Weekly Timesheet Log</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Submitted Timesheets Roster */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Submitted Timesheets Ledger ({timesheetLogs.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          timesheetLogs.map(ts => {
            const pill = getStatusPill(ts.status);
            const isPending = ts.status === 'Pending';

            return (
              <View
                key={ts.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.tsHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tsEmpName, { color: colors.textPrimary }]}>
                      {ts.employeeName}
                    </Text>
                    <Text style={[styles.tsProject, { color: colors.accent }]}>
                      📁 {ts.project}
                    </Text>
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: pill.text }}>
                      {ts.status}
                    </Text>
                  </View>
                </View>

                {/* Task Notes */}
                <Text style={[styles.tsTaskText, { color: colors.textSecondary }]}>
                  {ts.task}
                </Text>

                {/* Daily Breakdown Grid */}
                <View style={[styles.breakdownRow, { backgroundColor: colors.background }]}>
                  <Text style={[styles.breakCell, { color: colors.textPrimary }]}>Mon: {ts.monHours}h</Text>
                  <Text style={[styles.breakCell, { color: colors.textPrimary }]}>Tue: {ts.tueHours}h</Text>
                  <Text style={[styles.breakCell, { color: colors.textPrimary }]}>Wed: {ts.wedHours}h</Text>
                  <Text style={[styles.breakCell, { color: colors.textPrimary }]}>Thu: {ts.thuHours}h</Text>
                  <Text style={[styles.breakCell, { color: colors.textPrimary }]}>Fri: {ts.friHours}h</Text>
                  <Text style={[styles.breakTotal, { color: colors.accent }]}>Total: {ts.hours}h</Text>
                </View>

                {/* Manager Decision Buttons */}
                {isPending && (
                  <View style={styles.decisionRow}>
                    <TouchableOpacity
                      style={[styles.rejectBtn, { borderColor: '#ef4444' }]}
                      onPress={() => handleUpdateStatus(ts.id, ts.employeeName, 'Rejected')}
                    >
                      <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '700' }}>
                        ❌ Reject
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.approveBtn, { backgroundColor: '#10b981' }]}
                      onPress={() => handleUpdateStatus(ts.id, ts.employeeName, 'Approved')}
                    >
                      <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700' }}>
                        ✅ Approve
                      </Text>
                    </TouchableOpacity>
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
  weekChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
  },
  empChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
    marginTop: 4,
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
  daysGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
  },
  dayLbl: {
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
  dayInput: {
    width: '100%',
    textAlign: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '700',
    borderWidth: 1,
  },
  totalBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  totalBannerLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  totalBannerValue: {
    fontSize: 14,
    fontWeight: '900',
  },
  submitBtn: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  tsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tsEmpName: {
    fontSize: 14,
    fontWeight: '700',
  },
  tsProject: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tsTaskText: {
    fontSize: 12,
    lineHeight: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
  },
  breakCell: {
    fontSize: 10,
    fontWeight: '600',
  },
  breakTotal: {
    fontSize: 11,
    fontWeight: '900',
  },
  decisionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  approveBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
});
