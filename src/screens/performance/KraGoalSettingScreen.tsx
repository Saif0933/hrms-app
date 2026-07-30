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
import { useEmployees } from '../../api/hook/useEmployee';
import {
  PerformanceGoal,
  useCreateGoal,
  useGoals,
  useUpdateGoalProgress,
} from '../../api/hook/usePerformance';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'KraGoalSetting'>;

export const KraGoalSettingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [selectedEmpId, setSelectedEmpId] = useState<string>('EMP001');

  // Create Goal Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('Build Mobile App Design System & Component Library');
  const [goalKra, setGoalKra] = useState('Design & Engineering Excellence');
  const [goalWeight, setGoalWeight] = useState('25');

  // TanStack Queries & Mutations
  const { data: empRes } = useEmployees();
  const { data: goalsRes, isLoading } = useGoals(selectedEmpId);
  const createGoalMutation = useCreateGoal();
  const updateProgressMutation = useUpdateGoalProgress();

  const employees = empRes?.data || [];

  const goalsList: PerformanceGoal[] = goalsRes?.data || [
    {
      id: 'GOAL001',
      employeeId: 'EMP001',
      title: 'Deliver HRMS React Native Mobile Application on Schedule',
      kra: 'Product Delivery & Quality',
      weight: '30%',
      progress: 85,
      status: 'In Progress',
      createdAt: '2026-07-01',
      updatedAt: '2026-07-28',
      employee: { id: 'EMP001', name: 'Aarav Sharma' },
    },
    {
      id: 'GOAL002',
      employeeId: 'EMP001',
      title: 'Optimize API Response Latency below 120ms',
      kra: 'Core Architecture & Performance',
      weight: '25%',
      progress: 60,
      status: 'In Progress',
      createdAt: '2026-07-05',
      updatedAt: '2026-07-25',
      employee: { id: 'EMP001', name: 'Aarav Sharma' },
    },
    {
      id: 'GOAL003',
      employeeId: 'EMP001',
      title: 'Conduct Code Reviews & Mentor Junior Engineering Staff',
      kra: 'Team Mentorship & Leadership',
      weight: '20%',
      progress: 100,
      status: 'Completed',
      createdAt: '2026-07-01',
      updatedAt: '2026-07-20',
      employee: { id: 'EMP001', name: 'Aarav Sharma' },
    },
  ];

  const activeEmp = employees.find(e => e.id === selectedEmpId) || { name: 'Aarav Sharma', id: 'EMP001' };

  // Handle Progress Update
  const handleUpdateProgress = (goalId: string, currentProg: number, increment: number) => {
    const nextProg = Math.min(100, currentProg + increment);
    const nextStatus = nextProg === 100 ? 'Completed' : 'In Progress';

    updateProgressMutation.mutate(
      { id: goalId, progress: nextProg, status: nextStatus },
      {
        onSuccess: () => {
          Alert.alert('Progress Saved 🎯', `Goal progress updated to ${nextProg}% (${nextStatus}).`);
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  // Handle Create Goal
  const handleCreateGoal = () => {
    if (!goalTitle.trim() || !goalKra.trim()) {
      Alert.alert('Validation Error', 'Please complete Goal Title and KRA Category.');
      return;
    }

    createGoalMutation.mutate(
      {
        employeeId: selectedEmpId,
        title: goalTitle.trim(),
        kra: goalKra.trim(),
        weight: `${goalWeight}%`,
      },
      {
        onSuccess: () => {
          setModalOpen(false);
          setGoalTitle('');
          Alert.alert('KRA Goal Assigned 🎯', 'New performance goal registered successfully.');
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
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
            KRA & Goal Setting
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Performance Objectives & KRA Weightage Tracker
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addTopBtn, { backgroundColor: colors.accent }]}
          onPress={() => setModalOpen(true)}
        >
          <Text style={styles.addTopBtnText}>+ Assign Goal</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Employee Selector Bar */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            👤 Select Employee KRA Roster
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
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
                      <Text
                        style={{
                          color: isSelected ? '#ffffff' : colors.textPrimary,
                          fontWeight: '700',
                          fontSize: 12,
                        }}
                      >
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
                    <Text
                      style={{
                        color: selectedEmpId === id ? '#ffffff' : colors.textPrimary,
                        fontWeight: '700',
                        fontSize: 12,
                      }}
                    >
                      {id === 'EMP001' ? 'Aarav Sharma' : id === 'EMP31723' ? 'sam' : 'Neha Patel'}
                    </Text>
                  </TouchableOpacity>
                ))}
          </ScrollView>
        </View>

        {/* Goals Summary Header */}
        <View style={styles.summaryGrid}>
          <View style={[styles.sumBox, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
            <Text style={[styles.sumVal, { color: '#3b82f6' }]}>{goalsList.length}</Text>
            <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>Total Assigned Goals</Text>
          </View>

          <View style={[styles.sumBox, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
            <Text style={[styles.sumVal, { color: '#10b981' }]}>
              {goalsList.filter(g => g.status === 'Completed').length}
            </Text>
            <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>Completed Objectives</Text>
          </View>
        </View>

        {/* Active KRA Goals List */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Assigned Performance Goals ({goalsList.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          goalsList.map(goal => {
            const isCompleted = goal.status === 'Completed';

            return (
              <View
                key={goal.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                {/* Goal Top Row */}
                <View style={styles.goalHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.goalKraTag, { color: colors.accent }]}>
                      📌 {goal.kra}
                    </Text>
                    <Text style={[styles.goalTitleText, { color: colors.textPrimary }]}>
                      {goal.title}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: isCompleted ? '#10b98120' : '#3b82f620' },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '800',
                        color: isCompleted ? '#10b981' : '#3b82f6',
                      }}
                    >
                      {goal.status}
                    </Text>
                  </View>
                </View>

                {/* Weightage & Progress Header */}
                <View style={styles.weightProgressRow}>
                  <View style={styles.weightBadge}>
                    <Text style={styles.weightBadgeText}>KRA Weight: {goal.weight}</Text>
                  </View>
                  <Text style={[styles.progressPctText, { color: colors.textPrimary }]}>
                    {goal.progress}% Completed
                  </Text>
                </View>

                {/* Progress Track */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${goal.progress}%`,
                        backgroundColor: isCompleted ? '#10b981' : colors.accent,
                      },
                    ]}
                  />
                </View>

                {/* Update Progress Action Buttons */}
                {!isCompleted && (
                  <View style={styles.goalActionsRow}>
                    <TouchableOpacity
                      style={[styles.incBtn, { borderColor: colors.accent }]}
                      onPress={() => handleUpdateProgress(goal.id, goal.progress, 15)}
                    >
                      <Text style={[styles.incBtnText, { color: colors.accent }]}>+15% Progress 📈</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.completeBtn, { backgroundColor: '#10b981' }]}
                      onPress={() => handleUpdateProgress(goal.id, goal.progress, 100 - goal.progress)}
                    >
                      <Text style={styles.completeBtnText}>Mark 100% Done ✅</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Assign / Create KRA Goal Modal */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Assign Performance KRA Goal
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>GOAL TITLE *</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={goalTitle}
              onChangeText={setGoalTitle}
              multiline
              numberOfLines={2}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>KRA CATEGORY *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={goalKra}
              onChangeText={setGoalKra}
              placeholder="e.g. Design System & Quality"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>WEIGHTAGE (%) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={goalWeight}
              onChangeText={setGoalWeight}
              keyboardType="numeric"
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
                onPress={handleCreateGoal}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Assign Goal</Text>
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
  empChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  sumBox: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  sumVal: {
    fontSize: 22,
    fontWeight: '900',
  },
  sumLbl: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  goalKraTag: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalTitleText: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  weightProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  weightBadge: {
    backgroundColor: 'rgba(100,100,100,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  weightBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressPctText: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(100,100,100,0.1)',
    overflow: 'hidden',
    marginVertical: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  goalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  incBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  incBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  completeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeBtnText: {
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
    minHeight: 60,
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
