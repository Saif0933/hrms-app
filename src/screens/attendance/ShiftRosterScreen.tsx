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
import { useRosters, useSaveRosters } from '../../api/hook/useAttendance';
import { useEmployees } from '../../api/hook/useEmployee';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShiftRoster'>;

type ShiftCode = 'MORNING' | 'EVENING' | 'NIGHT' | 'OFF';

export const ShiftRosterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [selectedWeek, setSelectedWeek] = useState('2026-W31');

  // Roster Assignments State
  const { data: rosterRes, isLoading: isLoadingRosters } = useRosters(selectedWeek);
  const { data: empRes } = useEmployees();
  const saveRosterMutation = useSaveRosters();

  const employees = empRes?.data || [];
  const rosters = rosterRes?.data || [];

  // Edit Shift Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEmpName, setEditingEmpName] = useState('');
  const [editingEmpId, setEditingEmpId] = useState('');
  const [editingDay, setEditingDay] = useState<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'>('mon');
  const [selectedShift, setSelectedShift] = useState<ShiftCode>('MORNING');

  const [customRosterMap, setCustomRosterMap] = useState<Record<string, Record<string, ShiftCode>>>({
    EMP001: { mon: 'MORNING', tue: 'MORNING', wed: 'MORNING', thu: 'MORNING', fri: 'MORNING', sat: 'OFF', sun: 'OFF' },
    EMP002: { mon: 'EVENING', tue: 'EVENING', wed: 'EVENING', thu: 'EVENING', fri: 'EVENING', sat: 'OFF', sun: 'OFF' },
    EMP005: { mon: 'MORNING', tue: 'MORNING', wed: 'MORNING', thu: 'MORNING', fri: 'MORNING', sat: 'MORNING', sun: 'OFF' },
  });

  const getShiftBadge = (shift: ShiftCode | string) => {
    switch (shift) {
      case 'MORNING':
        return { bg: '#2563eb15', border: '#2563eb', text: '#2563eb', label: 'M (09-18)' };
      case 'EVENING':
        return { bg: '#8b5cf615', border: '#8b5cf6', text: '#8b5cf6', label: 'E (14-23)' };
      case 'NIGHT':
        return { bg: '#0f172a', border: '#334155', text: '#38bdf8', label: 'N (22-07)' };
      case 'OFF':
      default:
        return { bg: 'rgba(100,100,100,0.1)', border: 'rgba(100,100,100,0.2)', text: '#94a3b8', label: 'OFF' };
    }
  };

  const handleOpenEditShift = (empId: string, empName: string, day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun') => {
    setEditingEmpId(empId);
    setEditingEmpName(empName);
    setEditingDay(day);
    const curr = customRosterMap[empId]?.[day] || 'MORNING';
    setSelectedShift(curr);
    setEditModalOpen(true);
  };

  const handleSaveSingleShift = () => {
    setCustomRosterMap(prev => ({
      ...prev,
      [editingEmpId]: {
        ...(prev[editingEmpId] || { mon: 'MORNING', tue: 'MORNING', wed: 'MORNING', thu: 'MORNING', fri: 'MORNING', sat: 'OFF', sun: 'OFF' }),
        [editingDay]: selectedShift,
      },
    }));
    setEditModalOpen(false);
  };

  const handleSaveFullRoster = () => {
    const payload = employees.map(emp => ({
      employeeId: emp.id,
      mon: customRosterMap[emp.id]?.mon || 'MORNING',
      tue: customRosterMap[emp.id]?.tue || 'MORNING',
      wed: customRosterMap[emp.id]?.wed || 'MORNING',
      thu: customRosterMap[emp.id]?.thu || 'MORNING',
      fri: customRosterMap[emp.id]?.fri || 'MORNING',
      sat: customRosterMap[emp.id]?.sat || 'OFF',
      sun: customRosterMap[emp.id]?.sun || 'OFF',
    }));

    saveRosterMutation.mutate(
      { week: selectedWeek, rosters: payload },
      {
        onSuccess: () => {
          Alert.alert('Rosters Saved 📅', `Shift rosters for week ${selectedWeek} updated successfully!`);
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const daysList: Array<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'> = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Shift & Roster Manager</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Weekly Shift Assignments & Schedules
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Week Selector Bar */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            📅 Select Roster Week
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {['2026-W30', '2026-W31', '2026-W32', '2026-W33'].map(wk => {
              const isSelected = selectedWeek === wk;
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
                  onPress={() => setSelectedWeek(wk)}
                >
                  <Text
                    style={{
                      color: isSelected ? '#fff' : colors.textPrimary,
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    Week: {wk}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Roster Matrix Table */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            👥 Weekly Shift Roster Grid ({selectedWeek})
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Tap any shift badge to change employee shift assignment for that day.
          </Text>

          {isLoadingRosters ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 14 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tableGrid}>
                {/* Header Row */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thEmp, { color: colors.textPrimary }]}>Employee</Text>
                  {daysList.map(d => (
                    <Text key={d} style={[styles.thDay, { color: colors.textSecondary }]}>
                      {d.toUpperCase()}
                    </Text>
                  ))}
                </View>

                {/* Employee Roster Rows */}
                {employees.map(emp => {
                  const empRoster = customRosterMap[emp.id] || {
                    mon: 'MORNING',
                    tue: 'MORNING',
                    wed: 'MORNING',
                    thu: 'MORNING',
                    fri: 'MORNING',
                    sat: 'OFF',
                    sun: 'OFF',
                  };

                  return (
                    <View key={emp.id} style={styles.tableDataRow}>
                      <View style={styles.tdEmpInfo}>
                        <Text style={[styles.empNameText, { color: colors.textPrimary }]}>
                          {emp.name}
                        </Text>
                        <Text style={[styles.empRoleText, { color: colors.textSecondary }]}>
                          {emp.designation || 'Staff'}
                        </Text>
                      </View>

                      {daysList.map(d => {
                        const shiftVal = empRoster[d] || 'MORNING';
                        const badgeStyle = getShiftBadge(shiftVal);

                        return (
                          <TouchableOpacity
                            key={d}
                            style={[
                              styles.shiftBadgeCell,
                              { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border },
                            ]}
                            onPress={() => handleOpenEditShift(emp.id, emp.name, d)}
                          >
                            <Text style={[styles.shiftBadgeText, { color: badgeStyle.text }]}>
                              {badgeStyle.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}

          {/* Action Save Button */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: colors.accent },
              saveRosterMutation.isPending && { opacity: 0.7 },
            ]}
            onPress={handleSaveFullRoster}
            disabled={saveRosterMutation.isPending}
            activeOpacity={0.85}
          >
            {saveRosterMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveBtnText}>💾 Save All Roster Assignments</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Shift Modal */}
      <Modal visible={editModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Change Shift Assignment
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {editingEmpName} • Day: {editingDay.toUpperCase()}
            </Text>

            {(['MORNING', 'EVENING', 'NIGHT', 'OFF'] as const).map(sh => {
              const isSelected = selectedShift === sh;
              const info = getShiftBadge(sh);

              return (
                <TouchableOpacity
                  key={sh}
                  style={[
                    styles.shiftSelectCard,
                    {
                      backgroundColor: isSelected ? info.bg : colors.background,
                      borderColor: isSelected ? info.border : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setSelectedShift(sh)}
                >
                  <Text style={[styles.shiftSelectTitle, { color: info.text }]}>
                    {sh} SHIFT ({info.label})
                  </Text>
                </TouchableOpacity>
              );
            })}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setEditModalOpen(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: colors.accent }]}
                onPress={handleSaveSingleShift}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Apply Shift</Text>
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
    gap: 16,
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
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  weekChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  tableGrid: {
    minWidth: 640,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(100,100,100,0.2)',
  },
  thEmp: {
    width: 140,
    fontWeight: '800',
    fontSize: 12,
  },
  thDay: {
    width: 70,
    fontWeight: '700',
    fontSize: 11,
    textAlign: 'center',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(100,100,100,0.1)',
  },
  tdEmpInfo: {
    width: 140,
  },
  empNameText: {
    fontSize: 13,
    fontWeight: '700',
  },
  empRoleText: {
    fontSize: 10,
    marginTop: 1,
  },
  shiftBadgeCell: {
    width: 66,
    height: 36,
    marginHorizontal: 2,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  saveBtn: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
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
  },
  modalSubtitle: {
    fontSize: 12,
    marginBottom: 8,
  },
  shiftSelectCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  shiftSelectTitle: {
    fontSize: 12,
    fontWeight: '800',
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
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});
