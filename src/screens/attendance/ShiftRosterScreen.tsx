import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
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
import {
  useCreateShiftTiming,
  useDeleteShiftTiming,
  useRosters,
  useSaveRosters,
  useShiftTimings
} from '../../api/hook/useAttendance';
import { Employee, useEmployees } from '../../api/hook/useEmployee';

import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ShiftRoster'>;

export type ShiftCode = 'MORNING' | 'EVENING' | 'NIGHT' | 'OFF' | string;

// ISO Week Generator Helper
const getCurrentIsoWeek = (): string => {
  const date = new Date();
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo < 10 ? '0' + weekNo : weekNo}`;
};

const getWeekOptions = (currentWeek: string) => {
  const match = currentWeek.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return [{ key: currentWeek, label: currentWeek, isCurrent: true }];
  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);

  const list: { key: string; label: string; isCurrent: boolean }[] = [];
  for (let offset = -2; offset <= 2; offset++) {
    let w = week + offset;
    let y = year;
    if (w < 1) {
      w += 52;
      y -= 1;
    } else if (w > 52) {
      w -= 52;
      y += 1;
    }
    const key = `${y}-W${w < 10 ? '0' + w : w}`;
    list.push({
      key,
      label: key,
      isCurrent: key === currentWeek,
    });
  }
  return list;
};

export const ShiftRosterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  // Organization Shift Timings API Hooks
  const { data: timingsRes } = useShiftTimings();
  const createShiftTimingMutation = useCreateShiftTiming();
  const deleteShiftTimingMutation = useDeleteShiftTiming();

  const shiftTimings = useMemo(() => timingsRes?.data || [], [timingsRes?.data]);

  // Current ISO Week calculation
  const currentIsoWeek = useMemo(() => getCurrentIsoWeek(), []);
  const weekOptions = useMemo(() => getWeekOptions(currentIsoWeek), [currentIsoWeek]);
  const [selectedWeek, setSelectedWeek] = useState(currentIsoWeek);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShift, setFilterShift] = useState<string>('ALL');

  // API Hooks
  const { data: rosterRes, isLoading: isLoadingRosters } = useRosters(selectedWeek);
  const { data: empRes, isLoading: isLoadingEmps } = useEmployees();
  const saveRosterMutation = useSaveRosters();

  const employees = useMemo(() => empRes?.data || [], [empRes?.data]);
  const rosters = useMemo(() => rosterRes?.data || [], [rosterRes?.data]);

  // Edit Shift Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEmpName, setEditingEmpName] = useState('');
  const [editingEmpId, setEditingEmpId] = useState('');
  const [editingDay, setEditingDay] = useState<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'>('mon');
  const [selectedShift, setSelectedShift] = useState<ShiftCode>('MORNING');

  // Add New Shift Timing Modal State
  const [addShiftModalOpen, setAddShiftModalOpen] = useState(false);
  const [newShiftName, setNewShiftName] = useState('');
  const [newShiftCode, setNewShiftCode] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:30 AM');
  const [newEndTime, setNewEndTime] = useState('06:30 PM');
  const [newShiftColor, setNewShiftColor] = useState('#10b981');

  // Dynamic Roster Mapping State
  const [customRosterMap, setCustomRosterMap] = useState<Record<string, Record<string, ShiftCode>>>({});

  // Sync state when employees or rosters load/change
  useEffect(() => {
    if (!employees.length) return;

    const initialMap: Record<string, Record<string, ShiftCode>> = {};

    employees.forEach((emp: Employee, index: number) => {
      const found = rosters.find(r => r.employeeId === emp.id);
      if (found) {
        initialMap[emp.id] = {
          mon: (found.mon as ShiftCode) || 'MORNING',
          tue: (found.tue as ShiftCode) || 'MORNING',
          wed: (found.wed as ShiftCode) || 'MORNING',
          thu: (found.thu as ShiftCode) || 'MORNING',
          fri: (found.fri as ShiftCode) || 'MORNING',
          sat: (found.sat as ShiftCode) || 'OFF',
          sun: (found.sun as ShiftCode) || 'OFF',
        };
      } else {
        const defaultShift: ShiftCode = index % 3 === 0 ? 'MORNING' : index % 3 === 1 ? 'EVENING' : 'NIGHT';
        initialMap[emp.id] = {
          mon: defaultShift,
          tue: defaultShift,
          wed: defaultShift,
          thu: defaultShift,
          fri: defaultShift,
          sat: index % 2 === 0 ? 'OFF' : defaultShift,
          sun: 'OFF',
        };
      }
    });

    setCustomRosterMap(initialMap);
  }, [employees, rosters, selectedWeek]);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp: Employee) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        emp.name.toLowerCase().includes(q) ||
        (emp.designation && emp.designation.toLowerCase().includes(q)) ||
        (emp.department?.name && emp.department.name.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterShift !== 'ALL') {
        const empRoster = customRosterMap[emp.id];
        if (!empRoster) return false;
        const hasShift = Object.values(empRoster).includes(filterShift);
        if (!hasShift) return false;
      }

      return true;
    });
  }, [employees, searchQuery, filterShift, customRosterMap]);

  // Statistics calculation for scheduled shifts
  const shiftStats = useMemo(() => {
    let morning = 0;
    let evening = 0;
    let night = 0;
    let off = 0;
    let custom = 0;

    Object.values(customRosterMap).forEach(empRoster => {
      ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach(d => {
        const s = empRoster[d];
        if (s === 'MORNING') morning++;
        else if (s === 'EVENING') evening++;
        else if (s === 'NIGHT') night++;
        else if (s === 'OFF') off++;
        else custom++;
      });
    });

    return { morning, evening, night, off, custom, total: morning + evening + night + off + custom };
  }, [customRosterMap]);

  const getShiftBadge = (shift: string) => {
    const found = shiftTimings.find(t => t.code === shift);
    if (found) {
      return {
        bg: found.bgColor,
        border: found.color,
        text: found.color === '#38bdf8' ? '#38bdf8' : found.color,
        label: found.shortLabel,
      };
    }
    return { bg: 'rgba(100,100,100,0.1)', border: 'rgba(100,100,100,0.2)', text: '#94a3b8', label: shift };
  };

  const handleOpenEditShift = (
    empId: string,
    empName: string,
    day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
  ) => {
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
        ...(prev[editingEmpId] || {
          mon: 'MORNING',
          tue: 'MORNING',
          wed: 'MORNING',
          thu: 'MORNING',
          fri: 'MORNING',
          sat: 'OFF',
          sun: 'OFF',
        }),
        [editingDay]: selectedShift,
      },
    }));
    setEditModalOpen(false);
  };

  const handleApplyShiftToAllWorkingDays = (shift: ShiftCode) => {
    setCustomRosterMap(prev => ({
      ...prev,
      [editingEmpId]: {
        mon: shift,
        tue: shift,
        wed: shift,
        thu: shift,
        fri: shift,
        sat: prev[editingEmpId]?.sat || 'OFF',
        sun: prev[editingEmpId]?.sun || 'OFF',
      },
    }));
    setEditModalOpen(false);
  };

  const handleApplyPresetToFiltered = (preset: 'MORNING' | 'EVENING' | 'ROTATIONAL') => {
    const updatedMap = { ...customRosterMap };
    filteredEmployees.forEach((emp: Employee, i: number) => {
      let targetShift: ShiftCode = 'MORNING';
      if (preset === 'EVENING') targetShift = 'EVENING';
      else if (preset === 'ROTATIONAL') {
        targetShift = i % 3 === 0 ? 'MORNING' : i % 3 === 1 ? 'EVENING' : 'NIGHT';
      }

      updatedMap[emp.id] = {
        mon: targetShift,
        tue: targetShift,
        wed: targetShift,
        thu: targetShift,
        fri: targetShift,
        sat: preset === 'ROTATIONAL' && i % 2 === 0 ? targetShift : 'OFF',
        sun: 'OFF',
      };
    });
    setCustomRosterMap(updatedMap);
    Alert.alert('Preset Applied 🪄', `Applied ${preset} preset schedule to ${filteredEmployees.length} employee(s).`);
  };

  // Organization Add New Shift Timing Handler
  const handleAddShiftTiming = () => {
    if (!newShiftName.trim() || !newShiftCode.trim()) {
      Alert.alert('Validation Error', 'Please enter Shift Name and Shift Code.');
      return;
    }

    const codeUpper = newShiftCode.trim().toUpperCase().replace(/\s+/g, '_');

    if (shiftTimings.some(t => t.code === codeUpper)) {
      Alert.alert('Duplicate Code', `Shift Code "${codeUpper}" already exists in your organization. Please enter a unique code.`);
      return;
    }

    const startHour = newStartTime.trim().split(':')[0] || '09';
    const endHour = newEndTime.trim().split(':')[0] || '18';
    const shortLabel = `${codeUpper.substring(0, 3)} (${startHour}-${endHour})`;

    createShiftTimingMutation.mutate(
      {
        code: codeUpper,
        name: newShiftName.trim(),
        startTime: newStartTime.trim() || '09:00 AM',
        endTime: newEndTime.trim() || '06:00 PM',
        shortLabel,
        color: newShiftColor,
        bgColor: `${newShiftColor}18`,
        isSystem: false,
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Shift Timing Added ⏰',
            `Organization Shift "${newShiftName.trim()}" (${newStartTime} - ${newEndTime}) has been saved successfully!`
          );
          setNewShiftName('');
          setNewShiftCode('');
          setAddShiftModalOpen(false);
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  // Organization Delete Shift Timing Handler
  const handleDeleteShiftTiming = (id: string, name: string, isSystem?: boolean) => {
    if (isSystem) {
      Alert.alert('System Default', `Shift "${name}" is a default system shift and cannot be deleted.`);
      return;
    }

    Alert.alert(
      'Delete Shift Timing 🗑️',
      `Are you sure you want to remove "${name}" shift timing from your organization configuration?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteShiftTimingMutation.mutate(id, {
              onSuccess: () => {
                Alert.alert('Shift Deleted', `Shift "${name}" removed successfully.`);
              },
              onError: err => Alert.alert('Error', err.message),
            });
          },
        },
      ]
    );
  };

  const handleSaveFullRoster = () => {
    const payload = employees.map((emp: Employee) => ({
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
        onSuccess: res => {
          Alert.alert('Rosters Saved 📅', res.message || `Shift rosters for week ${selectedWeek} updated successfully!`);
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const daysList: Array<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'> = [
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
    'sat',
    'sun',
  ];

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
            Dynamic Organization Shift Schedules ({selectedWeek})
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
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>📅 Select Roster Week</Text>
            {selectedWeek === currentIsoWeek && (
              <View style={[styles.currentBadge, { backgroundColor: colors.accent + '20' }]}>
                <Text style={[styles.currentBadgeText, { color: colors.accent }]}>Current Week</Text>
              </View>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {weekOptions.map(wk => {
              const isSelected = selectedWeek === wk.key;
              return (
                <TouchableOpacity
                  key={wk.key}
                  style={[
                    styles.weekChip,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.background,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setSelectedWeek(wk.key)}
                >
                  <Text
                    style={{
                      color: isSelected ? '#fff' : colors.textPrimary,
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    Week: {wk.key} {wk.isCurrent ? '(Now)' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Organization Shift Timings Configuration Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>⏰ Organization Shift Timings</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                Add & manage company shift timing rules
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addTimingBtn, { backgroundColor: colors.accent }]}
              onPress={() => setAddShiftModalOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.addTimingBtnText}>+ Add Shift</Text>
            </TouchableOpacity>
          </View>

          {shiftTimings.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
              {shiftTimings.map(t => (
                <View
                  key={t.id || t.code}
                  style={[
                    styles.timingChipCard,
                    { backgroundColor: t.bgColor, borderColor: t.color },
                  ]}
                >
                  <View style={styles.timingChipHeader}>
                    <View style={[styles.colorDot, { backgroundColor: t.color }]} />
                    <Text style={[styles.timingNameText, { color: t.color === '#38bdf8' ? '#38bdf8' : colors.textPrimary }]}>
                      {t.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteShiftTiming(t.id, t.name, t.isSystem)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{ marginLeft: 6 }}
                    >
                      <Text style={{ fontSize: 11, color: '#ef4444', fontWeight: '800' }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.timingHoursText, { color: colors.textSecondary }]}>
                    {t.startTime} - {t.endTime}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={{ fontSize: 12, color: colors.textSecondary, fontStyle: 'italic', marginVertical: 6 }}>
              No organization shift timings added yet. Tap "+ Add Shift" to add your company shift timings.
            </Text>
          )}
        </View>

        {/* Shift Summary Analytics Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>📊 Scheduled Shift Overview</Text>
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: '#2563eb12', borderColor: '#2563eb40' }]}>
              <Text style={[styles.statNumber, { color: '#2563eb' }]}>{shiftStats.morning}</Text>
              <Text style={styles.statLabel}>Morning (M)</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#8b5cf612', borderColor: '#8b5cf640' }]}>
              <Text style={[styles.statNumber, { color: '#8b5cf6' }]}>{shiftStats.evening}</Text>
              <Text style={styles.statLabel}>Evening (E)</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#38bdf812', borderColor: '#38bdf840' }]}>
              <Text style={[styles.statNumber, { color: '#0284c7' }]}>{shiftStats.night}</Text>
              <Text style={styles.statLabel}>Night (N)</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: 'rgba(100,100,100,0.08)', borderColor: 'rgba(100,100,100,0.2)' }]}>
              <Text style={[styles.statNumber, { color: colors.textSecondary }]}>{shiftStats.off}</Text>
              <Text style={styles.statLabel}>Off Days</Text>
            </View>
          </View>
        </View>

        {/* Search & Filter Bar */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>🔍 Search & Quick Presets</Text>

          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.cardBorder,
                color: colors.textPrimary,
              },
            ]}
            placeholder="Search employee name, designation, department..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
            {['ALL', ...shiftTimings.map(t => t.code)].map(sh => (
              <TouchableOpacity
                key={sh}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: filterShift === sh ? colors.accent : colors.background,
                    borderColor: filterShift === sh ? colors.accent : colors.cardBorder,
                  },
                ]}
                onPress={() => setFilterShift(sh)}
              >
                <Text
                  style={{
                    color: filterShift === sh ? '#fff' : colors.textSecondary,
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {sh === 'ALL' ? 'All Shifts' : sh}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Quick Actions / Presets */}
          <View style={styles.presetRow}>
            <TouchableOpacity
              style={[styles.presetBtn, { borderColor: '#2563eb' }]}
              onPress={() => handleApplyPresetToFiltered('MORNING')}
            >
              <Text style={[styles.presetBtnText, { color: '#2563eb' }]}>Set All Morning</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.presetBtn, { borderColor: '#8b5cf6' }]}
              onPress={() => handleApplyPresetToFiltered('EVENING')}
            >
              <Text style={[styles.presetBtnText, { color: '#8b5cf6' }]}>Set All Evening</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.presetBtn, { borderColor: colors.accent }]}
              onPress={() => handleApplyPresetToFiltered('ROTATIONAL')}
            >
              <Text style={[styles.presetBtnText, { color: colors.accent }]}>Set Rotational</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Roster Matrix Table */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            👥 Weekly Shift Roster Grid ({filteredEmployees.length} Employees)
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Tap any day's shift badge to modify shift allocation for an employee.
          </Text>

          {isLoadingRosters || isLoadingEmps ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
          ) : filteredEmployees.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No employees matched the current filters.
            </Text>
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
                {filteredEmployees.map((emp: Employee) => {
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
                        <Text style={[styles.empNameText, { color: colors.textPrimary }]} numberOfLines={1}>
                          {emp.name}
                        </Text>
                        <Text style={[styles.empRoleText, { color: colors.textSecondary }]} numberOfLines={1}>
                          {emp.designation || emp.department?.name || 'Staff'}
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

            <ScrollView style={{ maxHeight: 260 }}>
              <View style={{ gap: 8 }}>
                {shiftTimings.map(st => {
                  const isSelected = selectedShift === st.code;
                  const info = getShiftBadge(st.code);

                  return (
                    <TouchableOpacity
                      key={st.code}
                      style={[
                        styles.shiftSelectCard,
                        {
                          backgroundColor: isSelected ? info.bg : colors.background,
                          borderColor: isSelected ? info.border : colors.cardBorder,
                        },
                      ]}
                      onPress={() => setSelectedShift(st.code)}
                    >
                      <Text style={[styles.shiftSelectTitle, { color: info.text }]}>
                        {st.name.toUpperCase()} ({info.label})
                      </Text>
                      {st.startTime !== '-' && (
                        <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>
                          Hours: {st.startTime} - {st.endTime}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.applyAllBtn, { backgroundColor: colors.background, borderColor: colors.accent }]}
              onPress={() => handleApplyShiftToAllWorkingDays(selectedShift)}
            >
              <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 12 }}>
                ⚡ Apply {selectedShift} to Mon-Fri for this Employee
              </Text>
            </TouchableOpacity>

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
                <Text style={{ color: '#fff', fontWeight: '700' }}>Apply Day Shift</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add New Organization Shift Timing Modal */}
      <Modal visible={addShiftModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              ⏰ Add Organization Shift Timing
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Add custom organization shift timing rules & hours for your employees.
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SHIFT NAME *</Text>
            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText },
              ]}
              placeholder="e.g. General Shift, Early Morning, Rotational"
              placeholderTextColor={colors.textSecondary}
              value={newShiftName}
              onChangeText={setNewShiftName}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SHIFT CODE *</Text>
            <TextInput
              style={[
                styles.modalInput,
                { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText },
              ]}
              placeholder="e.g. GENERAL, FLEXI, MID, SPLIT"
              placeholderTextColor={colors.textSecondary}
              value={newShiftCode}
              onChangeText={setNewShiftCode}
              autoCapitalize="characters"
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>START TIME *</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText },
                  ]}
                  placeholder="09:30 AM"
                  placeholderTextColor={colors.textSecondary}
                  value={newStartTime}
                  onChangeText={setNewStartTime}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>END TIME *</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText },
                  ]}
                  placeholder="06:30 PM"
                  placeholderTextColor={colors.textSecondary}
                  value={newEndTime}
                  onChangeText={setNewEndTime}
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>THEME COLOR</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginVertical: 4 }}>
              {['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#e11d48', '#0284c7'].map(c => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorOption,
                    { backgroundColor: c },
                    newShiftColor === c && { borderWidth: 3, borderColor: colors.textPrimary },
                  ]}
                  onPress={() => setNewShiftColor(c)}
                />
              ))}
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setAddShiftModalOpen(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: colors.accent },
                  createShiftTimingMutation.isPending && { opacity: 0.7 },
                ]}
                onPress={handleAddShiftTiming}
                disabled={createShiftTimingMutation.isPending}
              >
                {createShiftTimingMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Save Organization Shift</Text>
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
    gap: 16,
    paddingBottom: 40,
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
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 4,
  },
  currentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  addTimingBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addTimingBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  timingChipCard: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    minWidth: 130,
  },
  timingChipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timingNameText: {
    fontSize: 12,
    fontWeight: '800',
  },
  timingHoursText: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  weekChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  statBox: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  searchInput: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12,
    marginTop: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  presetBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 13,
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
    paddingRight: 6,
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
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  modalInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  colorOption: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
  applyAllBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 4,
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
