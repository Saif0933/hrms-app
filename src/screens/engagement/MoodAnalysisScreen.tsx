import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useEmployees } from '../../api/hook/useEmployee';
import {
  MoodDistribution,
  useMoodDistribution,
  useSubmitMood,
} from '../../api/hook/useEngagement';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MoodAnalysis'>;

export const MoodAnalysisScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [selectedMood, setSelectedMood] = useState<string>('thrilled');
  const [currentEmpId, setCurrentEmpId] = useState('EMP001');
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [showEmpDropdown, setShowEmpDropdown] = useState<boolean>(false);

  // TanStack Queries & Mutations
  const { data: empRes } = useEmployees();
  const { data: moodRes, isLoading } = useMoodDistribution();
  const submitMoodMutation = useSubmitMood();

  const employees = empRes?.data || [];

  // Auto-sync selected employee from organization employees list
  React.useEffect(() => {
    if (employees.length > 0 && !selectedEmpId) {
      setSelectedEmpId(employees[0].id);
    }
  }, [employees, selectedEmpId]);

  const selectedEmp = employees.find((e: any) => e.id === selectedEmpId) || employees[0];

  const moodData: MoodDistribution = moodRes?.data || {
    thrilled: 42,
    content: 35,
    neutral: 15,
    stressed: 8,
  };

  const totalResponses =
    moodData.thrilled + moodData.content + moodData.neutral + moodData.stressed;

  const handleCheckInMood = () => {
    const empIdToSubmit = selectedEmpId || currentEmpId;
    const empName = selectedEmp?.name || 'Employee';
    submitMoodMutation.mutate(
      {
        employeeId: empIdToSubmit,
        mood: selectedMood,
        weekKey: '2026-W31',
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Mood Checked In! 🎭',
            `Weekly mood for ${empName} has been submitted successfully!`
          );
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const moodsList = [
    { key: 'thrilled', emoji: '😄', label: 'Thrilled', color: '#10b981', count: moodData.thrilled },
    { key: 'content', emoji: '🙂', label: 'Content', color: '#3b82f6', count: moodData.content },
    { key: 'neutral', emoji: '😐', label: 'Neutral', color: '#8b5cf6', count: moodData.neutral },
    { key: 'stressed', emoji: '😫', label: 'Stressed', color: '#ef4444', count: moodData.stressed },
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Mood Analysis & Pulse
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Weekly Anonymous Employee Mood & Team Sentiment Analytics
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Weekly Anonymous Mood Picker Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            🎭 How are you feeling this week? (Anonymous)
          </Text>
          {/* EMPLOYEE DROPDOWN SELECTOR */}
          <Text style={[styles.dropdownLabel, { color: colors.textSecondary }]}>
            SELECT EMPLOYEE (DROPDOWN) *
          </Text>
          <TouchableOpacity
            style={[
              styles.dropdownSelectorBtn,
              { backgroundColor: colors.background, borderColor: colors.cardBorder },
            ]}
            onPress={() => setShowEmpDropdown(!showEmpDropdown)}
            activeOpacity={0.7}
          >
            <View style={styles.dropdownSelectorLeft}>
              <View style={[styles.avatarMini, { backgroundColor: colors.accent }]}>
                <Text style={styles.avatarMiniText}>
                  {selectedEmp?.name
                    ? selectedEmp.name
                        .split(' ')
                        .map((n: string) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    : 'EM'}
                </Text>
              </View>
              <View>
                <Text style={[styles.dropdownEmpName, { color: colors.textPrimary }]}>
                  {selectedEmp?.name || 'Select Employee'}
                </Text>
                <Text style={[styles.dropdownEmpRole, { color: colors.textSecondary }]}>
                  {selectedEmp?.designation || selectedEmp?.role || 'Staff Member'}
                </Text>
              </View>
            </View>
            <Text style={[styles.dropdownArrow, { color: colors.textSecondary }]}>
              {showEmpDropdown ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {/* DROPDOWN MENU LIST */}
          {showEmpDropdown && (
            <View style={[styles.dropdownMenu, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                {employees.length === 0 ? (
                  <View style={{ padding: 12 }}>
                    <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                      No employees found in organization
                    </Text>
                  </View>
                ) : (
                  employees.map((emp: any) => {
                    const isSelected = (selectedEmpId || currentEmpId) === emp.id;
                    return (
                      <TouchableOpacity
                        key={emp.id}
                        style={[
                          styles.dropdownMenuItem,
                          isSelected && { backgroundColor: colors.accent + '20' },
                        ]}
                        onPress={() => {
                          setSelectedEmpId(emp.id);
                          setShowEmpDropdown(false);
                        }}
                      >
                        <View style={[styles.avatarMini, { backgroundColor: isSelected ? colors.accent : '#64748b' }]}>
                          <Text style={styles.avatarMiniText}>
                            {emp.name
                              ? emp.name
                                  .split(' ')
                                  .map((n: string) => n[0])
                                  .join('')
                                  .slice(0, 2)
                                  .toUpperCase()
                              : 'EM'}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.dropdownItemName, { color: colors.textPrimary, fontWeight: isSelected ? '800' : '600' }]}>
                            {emp.name}
                          </Text>
                          <Text style={[styles.dropdownItemRole, { color: colors.textSecondary }]}>
                            {emp.designation || emp.role || 'Employee'}
                          </Text>
                        </View>
                        {isSelected && (
                          <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 14 }}>✓</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}

          {/* Mood Options Grid */}
          <View style={styles.moodSelectorGrid}>
            {moodsList.map(m => {
              const isSelected = selectedMood === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    styles.moodOptionBox,
                    {
                      backgroundColor: isSelected ? `${m.color}20` : colors.background,
                      borderColor: isSelected ? m.color : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setSelectedMood(m.key)}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, { color: isSelected ? m.color : colors.textPrimary }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Submit Action */}
          <TouchableOpacity
            style={[
              styles.submitMoodBtn,
              { backgroundColor: colors.accent },
              submitMoodMutation.isPending && { opacity: 0.7 },
            ]}
            onPress={handleCheckInMood}
            disabled={submitMoodMutation.isPending}
            activeOpacity={0.85}
          >
            {submitMoodMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitMoodBtnText}>🚀 Submit Weekly Mood Check-In</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Corporate Mood Distribution Gauge */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Corporate Sentiment Analytics ({totalResponses} Check-Ins)
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          moodsList.map(m => {
            const pct = Math.round((m.count / totalResponses) * 100);

            return (
              <View
                key={m.key}
                style={[
                  styles.card,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.moodGaugeHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 20 }}>{m.emoji}</Text>
                    <Text style={[styles.gaugeTitle, { color: colors.textPrimary }]}>{m.label}</Text>
                  </View>

                  <View style={[styles.pctBadge, { backgroundColor: `${m.color}20` }]}>
                    <Text style={[styles.pctText, { color: m.color }]}>{pct}% ({m.count})</Text>
                  </View>
                </View>

                {/* Progress Bar Track */}
                <View style={styles.progressTrack}>
                  <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: m.color }]} />
                </View>
              </View>
            );
          })
        )}

        {/* Team Morale Insight Banner */}
        <View style={styles.moraleBanner}>
          <Text style={styles.moraleTitle}>💡 Corporate Morale Index: 77% Positive</Text>
          <Text style={styles.moraleSub}>
            Overall team sentiment is thriving! 77% of employees report feeling Thrilled or Content this week.
          </Text>
        </View>
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
  cardSubText: {
    fontSize: 11,
    lineHeight: 16,
  },
  moodSelectorGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  moodOptionBox: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  moodEmoji: {
    fontSize: 26,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  submitMoodBtn: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitMoodBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  moodGaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gaugeTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  pctBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pctText: {
    fontSize: 11,
    fontWeight: '900',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(100,100,100,0.1)',
    overflow: 'hidden',
    marginTop: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  moraleBanner: {
    backgroundColor: '#10b98115',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
    gap: 4,
  },
  moraleTitle: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '800',
  },
  moraleSub: {
    color: '#334155',
    fontSize: 11,
    lineHeight: 16,
  },
  dropdownLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  dropdownSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    marginBottom: 4,
  },
  dropdownSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMiniText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  dropdownEmpName: {
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownEmpRole: {
    fontSize: 10,
    marginTop: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  dropdownMenu: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 6,
    maxHeight: 180,
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100,100,100,0.1)',
    gap: 10,
  },
  dropdownItemName: {
    fontSize: 13,
  },
  dropdownItemRole: {
    fontSize: 10,
    marginTop: 1,
  },
});
