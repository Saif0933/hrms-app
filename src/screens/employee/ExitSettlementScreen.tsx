import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
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
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useEmployeeExit, useEmployees, useSaveEmployeeExit } from '../../api/hook/useEmployee';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ExitSettlement'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'ExitSettlement'>;

export const ExitSettlementScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { colors } = useTheme();

  const { data: empRes } = useEmployees();
  const employees = empRes?.data || [];

  const [selectedEmpId, setSelectedEmpId] = useState<string | undefined>(
    route.params?.employeeId || (employees.length > 0 ? employees[0].id : undefined)
  );

  const { data: exitRes, isLoading } = useEmployeeExit(selectedEmpId);
  const saveExitMutation = useSaveEmployeeExit();

  const [resignationDate, setResignationDate] = useState('2026-07-01');
  const [showResignationDatePicker, setShowResignationDatePicker] = useState(false);
  const [lastWorkingDay, setLastWorkingDay] = useState('2026-08-01');
  const [showLastWorkingDatePicker, setShowLastWorkingDatePicker] = useState(false);
  const [reason, setReason] = useState('Career advancement opportunity');
  const [noticeDays, setNoticeDays] = useState('30');
  const [leaveEncashDays, setLeaveEncashDays] = useState('10');
  const [penaltyDeduction, setPenaltyDeduction] = useState('0');

  // Clearance Checkboxes
  const [itClearance, setItClearance] = useState(false);
  const [financeClearance, setFinanceClearance] = useState(false);
  const [adminClearance, setAdminClearance] = useState(false);
  const [hrClearance, setHrClearance] = useState(false);

  useEffect(() => {
    if (exitRes?.data) {
      const ex = exitRes.data;
      setResignationDate(ex.resignationDate ? ex.resignationDate.split('T')[0] : '2026-07-01');
      setLastWorkingDay(ex.lastWorkingDay ? ex.lastWorkingDay.split('T')[0] : '2026-08-01');
      setReason(ex.reason || '');
      setNoticeDays(String(ex.noticeDays || 30));
      setLeaveEncashDays(String(ex.leaveEncashDays || 0));
      setPenaltyDeduction(String(ex.penaltyDeduction || 0));
      setItClearance(!!ex.itClearance);
      setFinanceClearance(!!ex.financeClearance);
      setAdminClearance(!!ex.adminClearance);
      setHrClearance(!!ex.hrClearance);
    }
  }, [exitRes]);

  const handleResignationDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowResignationDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setResignationDate(selectedDate.toISOString().split('T')[0]);
    } else if (event.type === 'dismissed') {
      setShowResignationDatePicker(false);
    }
  };

  const handleLastWorkingDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowLastWorkingDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setLastWorkingDay(selectedDate.toISOString().split('T')[0]);
    } else if (event.type === 'dismissed') {
      setShowLastWorkingDatePicker(false);
    }
  };

  const handleSaveExit = () => {
    if (!selectedEmpId) {
      Alert.alert('Select Employee', 'Please select an employee first.');
      return;
    }

    saveExitMutation.mutate(
      {
        employeeId: selectedEmpId,
        data: {
          resignationDate,
          lastWorkingDay,
          reason,
          noticeDays: parseInt(noticeDays) || 30,
          leaveEncashDays: parseInt(leaveEncashDays) || 0,
          penaltyDeduction: parseFloat(penaltyDeduction) || 0,
          itClearance,
          financeClearance,
          adminClearance,
          hrClearance,
          status: itClearance && financeClearance && adminClearance && hrClearance ? 'CLEARED' : 'PENDING',
        },
      },
      {
        onSuccess: () => Alert.alert('Success', 'Exit & Clearance record saved successfully'),
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const selectedEmployee = employees.find(e => e.id === selectedEmpId);

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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Exit & Settlement</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Clearance & Full & Final Settlement
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Employee Selector */}
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Select Resigning Employee</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {employees.map(emp => {
            const isSelected = selectedEmpId === emp.id;
            return (
              <TouchableOpacity
                key={emp.id}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.cardBackground,
                    borderColor: isSelected ? colors.accent : colors.cardBorder,
                  },
                ]}
                onPress={() => setSelectedEmpId(emp.id)}
              >
                <Text style={{ color: isSelected ? '#fff' : colors.textPrimary, fontSize: 12, fontWeight: '600' }}>
                  {emp.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginVertical: 30 }} />
        ) : (
          <View style={styles.formSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Resignation & Notice Details ({selectedEmployee?.name || 'Selected Employee'})
            </Text>

            {/* Resignation Date Picker */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Resignation Date</Text>
            <TouchableOpacity
              style={[styles.dateInputRow, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
              onPress={() => setShowResignationDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={{ color: resignationDate ? colors.inputText : colors.inputPlaceholder, fontSize: 14, flex: 1 }}>
                {resignationDate || 'YYYY-MM-DD'}
              </Text>
              <MaterialCommunityIcons name="calendar" size={20} color={colors.accent} />
            </TouchableOpacity>

            {showResignationDatePicker && (
              <DateTimePicker
                value={resignationDate ? new Date(resignationDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={handleResignationDateChange}
              />
            )}

            {/* Last Working Day Picker */}
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Last Working Day</Text>
            <TouchableOpacity
              style={[styles.dateInputRow, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
              onPress={() => setShowLastWorkingDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={{ color: lastWorkingDay ? colors.inputText : colors.inputPlaceholder, fontSize: 14, flex: 1 }}>
                {lastWorkingDay || 'YYYY-MM-DD'}
              </Text>
              <MaterialCommunityIcons name="calendar-clock" size={20} color={colors.accent} />
            </TouchableOpacity>

            {showLastWorkingDatePicker && (
              <DateTimePicker
                value={lastWorkingDay ? new Date(lastWorkingDay) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={handleLastWorkingDateChange}
              />
            )}

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Reason for Separation</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={reason}
              onChangeText={setReason}
              placeholder="Personal / Better Offer / Higher Studies"
              placeholderTextColor={colors.inputPlaceholder}
            />

            {/* Department Clearances */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 16 }]}>
              Departmental No-Dues Clearance
            </Text>

            <View style={[styles.switchRow, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>💻 IT Clearance (Laptop/Access)</Text>
              <Switch value={itClearance} onValueChange={setItClearance} thumbColor={itClearance ? colors.accent : '#94a3b8'} />
            </View>

            <View style={[styles.switchRow, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>💳 Finance Clearance (Loans/Claims)</Text>
              <Switch value={financeClearance} onValueChange={setFinanceClearance} thumbColor={financeClearance ? colors.accent : '#94a3b8'} />
            </View>

            <View style={[styles.switchRow, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>🏢 Admin Clearance (ID Card/Keys)</Text>
              <Switch value={adminClearance} onValueChange={setAdminClearance} thumbColor={adminClearance ? colors.accent : '#94a3b8'} />
            </View>

            <View style={[styles.switchRow, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>📋 HR Clearance (Interview/Docs)</Text>
              <Switch value={hrClearance} onValueChange={setHrClearance} thumbColor={hrClearance ? colors.accent : '#94a3b8'} />
            </View>

            {/* Settlement Computations */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 16 }]}>
              Full & Final (FnF) Settlement Calculations
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Leave Encashment (Days)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={leaveEncashDays}
              onChangeText={setLeaveEncashDays}
              keyboardType="numeric"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Penalty / Recovery Deductions ($)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={penaltyDeduction}
              onChangeText={setPenaltyDeduction}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.accent }]}
              onPress={handleSaveExit}
            >
              <Text style={styles.saveBtnText}>Save Clearance & Full Settlement</Text>
            </TouchableOpacity>
          </View>
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
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  formSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 4,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});
