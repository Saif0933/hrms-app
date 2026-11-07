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
import {
  CorporateSurvey,
  useCreateSurvey,
  useSubmitSurveyResponse,
  useSurveys,
  useDeleteSurvey,
} from '../../api/hook/useEngagement';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/stack.tsx';
import { SafeAreaView } from 'react-native-safe-area-context';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SurveysFeedback'>;

export const SurveysFeedbackScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const { moderateScale, isSmallDevice } = useResponsive();

  const [currentEmpId, setCurrentEmpId] = useState('');

  // Rating Responses State per survey
  const [selectedRatings, setSelectedRatings] = useState<{ [surveyId: string]: number }>({});

  // Create Survey Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyQuestion, setSurveyQuestion] = useState('');

  // TanStack Queries & Mutations
  const { data: empRes } = useEmployees();
  const employees = empRes?.data || [];

  React.useEffect(() => {
    if (employees.length > 0 && !currentEmpId) {
      setCurrentEmpId(employees[0].id);
    }
  }, [employees, currentEmpId]);

  const { data: surveyRes, isLoading } = useSurveys(currentEmpId);
  const submitResponseMutation = useSubmitSurveyResponse();
  const createSurveyMutation = useCreateSurvey();
  const deleteSurveyMutation = useDeleteSurvey();

  const [deletedSurveyIds, setDeletedSurveyIds] = useState<string[]>([]);

  const isStaticDummySurvey = (s: any) => {
    const t = (s.title || '').toLowerCase();
    const q = (s.question || '').toLowerCase();
    return t.includes('wfh hybrid policy review') ||
           t.includes('work-life balance & remote policy') ||
           t.includes('office cafeteria') ||
           t.includes('engineering tooling & devops') ||
           q.includes('how satisfied are you with our current work environment');
  };

  const handleDeleteSurvey = (surveyId: string) => {
    Alert.alert(
      'Delete Survey',
      'Are you sure you want to delete this pulse survey? All responses will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setDeletedSurveyIds(prev => [...new Set([...prev, surveyId])]);
            Alert.alert('Deleted', 'Pulse survey removed successfully.');
            deleteSurveyMutation.mutate(surveyId, {
              onError: () => {}
            });
          },
        },
      ]
    );
  };

  const surveysList: CorporateSurvey[] = (surveyRes?.data || []).filter(
    (s: any) => !deletedSurveyIds.includes(s.id) && !isStaticDummySurvey(s)
  );

  // Handle Rating Selection
  const handleRatingSelect = (surveyId: string, rating: number) => {
    setSelectedRatings(prev => ({ ...prev, [surveyId]: rating }));
  };

  // Handle Submit Response
  const handleSubmitResponse = (surveyId: string) => {
    const rating = selectedRatings[surveyId] || 5;
    const empId = currentEmpId || (employees[0]?.id ?? '');
    if (!empId) {
      Alert.alert('Error', 'No active employee identifier found.');
      return;
    }

    submitResponseMutation.mutate(
      { surveyId, employeeId: empId, rating },
      {
        onSuccess: () => {
          Alert.alert('Survey Submitted 📊', 'Thank you for submitting your feedback rating!');
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  // Handle Create Survey
  const handleCreateSurvey = () => {
    if (!surveyTitle.trim() || !surveyQuestion.trim()) {
      Alert.alert('Validation Error', 'Please complete Survey Title and Prompt Question.');
      return;
    }

    createSurveyMutation.mutate(
      {
        title: surveyTitle.trim(),
        question: surveyQuestion.trim(),
        closesAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      {
        onSuccess: () => {
          setModalOpen(false);
          setSurveyTitle('');
          setSurveyQuestion('');
          Alert.alert('Pulse Survey Launched 🚀', 'New survey is now active for employee responses.');
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
            Pulse Surveys & Feedback
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Corporate Satisfaction Surveys & Feedback Collection
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addTopBtn, { backgroundColor: colors.accent }]}
          onPress={() => setModalOpen(true)}
        >
          <Text style={styles.addTopBtnText}>+ New Survey</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Active Pulse Surveys Roster */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Active & Past Surveys ({surveysList.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : surveysList.length === 0 ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
                padding: 24,
                alignItems: 'center',
              },
            ]}
          >
            <Text style={{ fontSize: 28, marginBottom: 8 }}>📋</Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: colors.textPrimary,
                marginBottom: 4,
              }}
            >
              No Active Surveys
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: colors.textSecondary,
                textAlign: 'center',
                marginBottom: 14,
              }}
            >
              Tap "+ New Survey" above to launch your first corporate pulse survey.
            </Text>
            <TouchableOpacity
              style={[
                styles.addTopBtn,
                { backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 8 },
              ]}
              onPress={() => setModalOpen(true)}
            >
              <Text style={styles.addTopBtnText}>+ Create Pulse Survey</Text>
            </TouchableOpacity>
          </View>
        ) : (
          surveysList.map(survey => {
            const isActive = survey.status === 'ACTIVE';
            const currentRating = selectedRatings[survey.id] || 4;

            return (
              <View
                key={survey.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.surveyHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.surveyTitleText, { color: colors.textPrimary }]}>
                      {survey.title}
                    </Text>
                    <Text style={[styles.surveyDeadline, { color: colors.textSecondary }]}>
                      Closes on {new Date(survey.closesAt).toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: isActive ? '#10b98120' : '#64748b20' },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '800',
                          color: isActive ? '#10b981' : '#64748b',
                        }}
                      >
                        {survey.status}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDeleteSurvey(survey.id)}
                      style={{ padding: 6 }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={{ fontSize: 14 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Question Prompt */}
                <View style={[styles.questionBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.questionText, { color: colors.textPrimary }]}>
                    ❓ {survey.question}
                  </Text>
                </View>

                {/* Rating Input Bar (1 to 5 Stars) */}
                {isActive && (
                  <View style={styles.ratingSection}>
                    <Text style={[styles.ratingLabel, { color: colors.textSecondary }]}>
                      RATE YOUR SATISFACTION (1 TO 5 STARS):
                    </Text>
                    <View style={styles.starRow}>
                      {[1, 2, 3, 4, 5].map(star => {
                        const isSelected = currentRating >= star;
                        return (
                          <TouchableOpacity
                            key={star}
                            onPress={() => handleRatingSelect(survey.id, star)}
                          >
                            <Text
                              style={[
                                styles.starIcon,
                                { color: isSelected ? '#f59e0b' : '#cbd5e1' },
                              ]}
                            >
                              ★
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                      <Text style={[styles.scoreValText, { color: colors.textPrimary }]}>
                        {currentRating} / 5
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.submitResponseBtn,
                        { backgroundColor: colors.accent },
                        submitResponseMutation.isPending && { opacity: 0.7 },
                      ]}
                      onPress={() => handleSubmitResponse(survey.id)}
                      disabled={submitResponseMutation.isPending}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.submitResponseBtnText}>
                        📊 Submit Pulse Rating Response
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Launch New Survey Modal */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.modalBackground, borderColor: colors.cardBorder, borderWidth: 1 }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Launch New Corporate Pulse Survey
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SURVEY TITLE *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={surveyTitle}
              onChangeText={setSurveyTitle}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PROMPT QUESTION *</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={surveyQuestion}
              onChangeText={setSurveyQuestion}
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
                onPress={handleCreateSurvey}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Launch Survey</Text>
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
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  surveyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  surveyTitleText: {
    fontSize: 15,
    fontWeight: '700',
  },
  surveyDeadline: {
    fontSize: 11,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  questionBox: {
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  questionText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  ratingSection: {
    gap: 6,
    marginTop: 4,
  },
  ratingLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starIcon: {
    fontSize: 24,
  },
  scoreValText: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 8,
  },
  submitResponseBtn: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitResponseBtnText: {
    color: '#ffffff',
    fontSize: 13,
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
