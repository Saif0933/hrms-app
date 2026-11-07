import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import { useProfile } from '../../api/hook/useAuth';
import {
  PerformanceGoal,
  useCreateGoal,
  useGoals,
  useUpdateGoalProgress,
} from '../../api/hook/usePerformance';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/stack.tsx';
import { SafeAreaView } from 'react-native-safe-area-context';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'KraGoalSetting'>;

export const KraGoalSettingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const { moderateScale, isSmallDevice } = useResponsive();

  const [selectedEmpId, setSelectedEmpId] = useState<string>('');

  // Create Goal Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalKra, setGoalKra] = useState('');
  const [goalWeight, setGoalWeight] = useState('');

  // TanStack Queries & Mutations
  const { data: profileRes } = useProfile();
  const loggedUser = profileRes?.data?.user;
  const { data: empRes } = useEmployees();

  const employees = React.useMemo(() => {
    return (empRes?.data || []).filter(e => {
      if (e.name?.startsWith('Admin -')) return false;
      const emailLower = (e.email || '').toLowerCase().trim();
      if (emailLower === 'info@symbosys.com' || emailLower === 'info@symbosys2.com' || emailLower === 'platform@hrms.com' || emailLower === 'admin@hrms.com') {
        return false;
      }
      return true;
    });
  }, [empRes?.data]);

  // Dynamically auto-select employee
  React.useEffect(() => {
    if (employees.length > 0 && (!selectedEmpId || !employees.some(e => e.id === selectedEmpId))) {
      const matchedMyEmp = employees.find(e => 
        (loggedUser?.employeeId && e.id === loggedUser.employeeId) ||
        (loggedUser?.id && e.userId === loggedUser.id) ||
        (loggedUser?.email && e.email?.toLowerCase() === loggedUser.email?.toLowerCase())
      );
      setSelectedEmpId(matchedMyEmp ? matchedMyEmp.id : employees[0].id);
    }
  }, [employees, loggedUser, selectedEmpId]);

  const { data: goalsRes, isLoading } = useGoals(selectedEmpId);
  const createGoalMutation = useCreateGoal();
  const updateProgressMutation = useUpdateGoalProgress();

  const STATIC_GOAL_TITLES = [
    'Deliver Redesigned Core UI Components',
    'Optimize Web Performance & Core Web Vitals',
    'Refactor State Management & Context Architecture',
  ];
  const rawGoalsList: PerformanceGoal[] = goalsRes?.data || [];
  const goalsList = rawGoalsList.filter(g => !STATIC_GOAL_TITLES.includes(g.title));

  const activeEmp = employees.find(e => e.id === selectedEmpId) || employees[0] || { name: 'Employee', id: selectedEmpId };

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
        weight: goalWeight.trim() ? (goalWeight.includes('%') ? goalWeight.trim() : `${goalWeight.trim()}%`) : '20%',
      },
      {
        onSuccess: () => {
          setModalOpen(false);
          setGoalTitle('');
          setGoalKra('');
          setGoalWeight('');
          Alert.alert('KRA Goal Assigned 🎯', `New performance goal registered for ${activeEmp.name}.`);
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: moderateScale(isSmallDevice ? 15 : 17) }]} numberOfLines={1}>
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
              : null}
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
          Assigned Performance Goals for {activeEmp.name} ({goalsList.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : goalsList.length === 0 ? (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, padding: 24, alignItems: 'center' },
            ]}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center' }}>
              No performance goals assigned to {activeEmp.name} yet.{'\n'}Tap "+ Assign Goal" to set new objectives.
            </Text>
          </View>
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
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.modalBackground, borderColor: colors.cardBorder, borderWidth: 1 }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Assign Performance KRA Goal
            </Text>

            <View style={{ backgroundColor: `${colors.accent}15`, padding: 8, borderRadius: 8, marginVertical: 6 }}>
              <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 12 }}>
                👤 Target Employee: {activeEmp.name}
              </Text>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>GOAL TITLE *</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={goalTitle}
              onChangeText={setGoalTitle}
              placeholder="e.g. Reduce bundle size by 20%"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={2}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>KRA CATEGORY *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={goalKra}
              onChangeText={setGoalKra}
              placeholder="e.g. Design System & Quality"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>WEIGHTAGE (%) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={goalWeight}
              onChangeText={setGoalWeight}
              placeholder="e.g. 25"
              placeholderTextColor={colors.textSecondary}
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
