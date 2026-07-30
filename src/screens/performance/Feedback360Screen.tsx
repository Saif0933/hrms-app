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
  PerformanceFeedback,
  useCreateFeedback,
  useCreateMonthlyRating,
  useFeedbacks,
  useMonthlyRatings,
} from '../../api/hook/usePerformance';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Feedback360'>;

export const Feedback360Screen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [selectedEmpId, setSelectedEmpId] = useState<string>('EMP001');
  const [relationFilter, setRelationFilter] = useState<string>('ALL');

  // Modal State: Submit 360 Review
  const [modalOpen, setModalOpen] = useState(false);
  const [reviewerName, setReviewerName] = useState('Vikram Malhotra (Tech Lead)');
  const [selectedRelation, setSelectedRelation] = useState<'Manager' | 'Peer' | 'Direct Report'>('Manager');
  const [ratingVal, setRatingVal] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState(
    'Demonstrates exceptional problem-solving ability, leads technical design discussions smoothly, and supports junior developers consistently.'
  );

  // Monthly Rating Form State
  const [monthRating, setMonthRating] = useState(4);
  const [tasksRating, setTasksRating] = useState('Exceeds Expectation');
  const [qualityRating, setQualityRating] = useState('High Precision');
  const [teamworkRating, setTeamworkRating] = useState('Excellent Collaboration');

  // TanStack Queries & Mutations
  const { data: empRes } = useEmployees();
  const { data: feedbackRes, isLoading } = useFeedbacks(selectedEmpId);
  const { data: monthlyRatingsRes } = useMonthlyRatings(selectedEmpId);

  const createFeedbackMutation = useCreateFeedback();
  const createMonthlyRatingMutation = useCreateMonthlyRating();

  const employees = empRes?.data || [];

  const feedbacksList: PerformanceFeedback[] = feedbackRes?.data || [
    {
      id: 'FB001',
      employeeId: 'EMP001',
      reviewer: 'Vikram Malhotra (Tech Lead)',
      relation: 'Manager',
      rating: 5,
      text: 'Aarav has delivered stellar code quality on the HRMS project. His architectural foresight prevented critical bottlenecks.',
      date: '2026-07-25',
      createdAt: '',
    },
    {
      id: 'FB002',
      employeeId: 'EMP001',
      reviewer: 'Neha Patel (HR Business Partner)',
      relation: 'Peer',
      rating: 4,
      text: 'Great team player, always accessible for cross-departmental coordination and sprint demos.',
      date: '2026-07-18',
      createdAt: '',
    },
    {
      id: 'FB003',
      employeeId: 'EMP001',
      reviewer: 'sam (UI/UX Designer)',
      relation: 'Direct Report',
      rating: 5,
      text: 'Provides constructive guidance during design handoffs and ensures component specifications are strictly met.',
      date: '2026-07-10',
      createdAt: '',
    },
  ];

  const filteredFeedbacks = feedbacksList.filter(fb => {
    if (relationFilter === 'ALL') return true;
    return fb.relation.toLowerCase() === relationFilter.toLowerCase();
  });

  // Handle Submit 360 Feedback
  const handleSubmitFeedback = () => {
    if (!reviewerName.trim() || !feedbackText.trim()) {
      Alert.alert('Validation Error', 'Please complete Reviewer Name and Feedback notes.');
      return;
    }

    createFeedbackMutation.mutate(
      {
        employeeId: selectedEmpId,
        reviewer: reviewerName.trim(),
        relation: selectedRelation,
        rating: ratingVal,
        text: feedbackText.trim(),
      },
      {
        onSuccess: () => {
          setModalOpen(false);
          Alert.alert('360° Feedback Submitted 💬', 'Peer & manager review registered successfully!');
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  // Handle Submit Monthly Performance Rating
  const handleSubmitMonthlyRating = () => {
    createMonthlyRatingMutation.mutate(
      {
        employeeId: selectedEmpId,
        month: 'July 2026',
        rating: monthRating,
        tasks: tasksRating,
        quality: qualityRating,
        teamwork: teamworkRating,
        feedback: 'Consistently meets performance benchmarks for the month of July.',
      },
      {
        onSuccess: () => {
          Alert.alert('Monthly Rating Saved ⭐', `July 2026 performance rating saved for active employee.`);
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
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
            360° Feedback & Performance Reviews
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Peer, Manager & Direct Report Multi-Rater Evaluations
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addTopBtn, { backgroundColor: colors.accent }]}
          onPress={() => setModalOpen(true)}
        >
          <Text style={styles.addTopBtnText}>+ Give Feedback</Text>
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
            👤 Select Employee Review Target
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

        {/* Monthly Performance Rating Form Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            ⭐ Monthly Performance Evaluation (July 2026)
          </Text>

          <View style={styles.ratingStarRow}>
            {[1, 2, 3, 4, 5].map(star => {
              const isSelected = monthRating >= star;
              return (
                <TouchableOpacity key={star} onPress={() => setMonthRating(star)}>
                  <Text style={[styles.starIcon, { color: isSelected ? '#f59e0b' : '#cbd5e1' }]}>
                    ★
                  </Text>
                </TouchableOpacity>
              );
            })}
            <Text style={[styles.ratingScoreText, { color: colors.textPrimary }]}>
              {monthRating} / 5.0 Rating
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveRatingBtn, { backgroundColor: colors.accent }]}
            onPress={handleSubmitMonthlyRating}
            activeOpacity={0.85}
          >
            <Text style={styles.saveRatingBtnText}>💾 Submit Monthly Scorecard</Text>
          </TouchableOpacity>
        </View>

        {/* Relationship Filter Chips */}
        <View style={styles.relFilterRow}>
          {['ALL', 'Manager', 'Peer', 'Direct Report'].map(rel => {
            const isSelected = relationFilter === rel;
            return (
              <TouchableOpacity
                key={rel}
                style={[
                  styles.relChip,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.cardBackground,
                    borderColor: isSelected ? colors.accent : colors.cardBorder,
                  },
                ]}
                onPress={() => setRelationFilter(rel)}
              >
                <Text
                  style={{
                    color: isSelected ? '#ffffff' : colors.textPrimary,
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {rel}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Feedback Reviews Roster */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          360° Feedback Reviews ({filteredFeedbacks.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          filteredFeedbacks.map(fb => (
            <View
              key={fb.id}
              style={[
                styles.card,
                { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.fbHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reviewerNameText, { color: colors.textPrimary }]}>
                    {fb.reviewer}
                  </Text>
                  <Text style={[styles.fbDateText, { color: colors.textSecondary }]}>
                    Evaluated on {fb.date}
                  </Text>
                </View>

                <View
                  style={[
                    styles.relationBadge,
                    {
                      backgroundColor:
                        fb.relation === 'Manager'
                          ? '#2563eb20'
                          : fb.relation === 'Peer'
                          ? '#10b98120'
                          : '#8b5cf620',
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '800',
                      color:
                        fb.relation === 'Manager'
                          ? '#2563eb'
                          : fb.relation === 'Peer'
                          ? '#10b981'
                          : '#8b5cf6',
                    }}
                  >
                    {fb.relation}
                  </Text>
                </View>
              </View>

              {/* Star Rating Display */}
              <Text style={styles.starsDisplay}>{renderStars(fb.rating)}</Text>

              {/* Feedback Body */}
              <View style={[styles.quoteBox, { backgroundColor: colors.background }]}>
                <Text style={[styles.quoteText, { color: colors.textPrimary }]}>
                  "{fb.text}"
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Give 360 Feedback Modal */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Submit 360° Feedback Review
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>REVIEWER NAME & TITLE *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={reviewerName}
              onChangeText={setReviewerName}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>RELATIONSHIP TYPE *</Text>
            <View style={styles.relSelectorRow}>
              {(['Manager', 'Peer', 'Direct Report'] as const).map(rel => {
                const isSelected = selectedRelation === rel;
                return (
                  <TouchableOpacity
                    key={rel}
                    style={[
                      styles.relSelBtn,
                      {
                        backgroundColor: isSelected ? colors.accent : colors.background,
                        borderColor: isSelected ? colors.accent : colors.cardBorder,
                      },
                    ]}
                    onPress={() => setSelectedRelation(rel)}
                  >
                    <Text
                      style={{
                        color: isSelected ? '#ffffff' : colors.textPrimary,
                        fontSize: 11,
                        fontWeight: '700',
                      }}
                    >
                      {rel}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>RATING (1 TO 5 STARS) *</Text>
            <View style={styles.modalStarRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setRatingVal(star)}>
                  <Text style={[styles.starIcon, { color: ratingVal >= star ? '#f59e0b' : '#cbd5e1' }]}>
                    ★
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>FEEDBACK / REVIEW COMMENTS *</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={feedbackText}
              onChangeText={setFeedbackText}
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
                onPress={handleSubmitFeedback}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Submit Review</Text>
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
  ratingStarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starIcon: {
    fontSize: 24,
  },
  ratingScoreText: {
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 8,
  },
  saveRatingBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  saveRatingBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  relFilterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  relChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  fbHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewerNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  fbDateText: {
    fontSize: 10,
    marginTop: 1,
  },
  relationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  starsDisplay: {
    color: '#f59e0b',
    fontSize: 16,
  },
  quoteBox: {
    padding: 12,
    borderRadius: 10,
  },
  quoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
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
  relSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  relSelBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalStarRow: {
    flexDirection: 'row',
    gap: 6,
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
