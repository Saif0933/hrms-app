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
  BellCurvePoint,
  useBellCurveDistribution,
  useSaveAppraisal,
} from '../../api/hook/usePerformance';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'BellCurveAnalytics'>;

export const BellCurveAnalyticsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [selectedCycle, setSelectedCycle] = useState('H1 2026');
  const [selectedEmpId, setSelectedEmpId] = useState('EMP001');
  const [appraisalRating, setAppraisalRating] = useState(4);

  // TanStack Queries & Mutations
  const { data: empRes } = useEmployees();
  const { data: bellCurveRes, isLoading } = useBellCurveDistribution(selectedCycle);
  const saveAppraisalMutation = useSaveAppraisal();

  const employees = empRes?.data || [];

  const points: BellCurvePoint[] = bellCurveRes?.data || [
    { rating: 'Grade 1 (Unsatisfactory - 1★)', Employees: 1 },
    { rating: 'Grade 2 (Needs Improvement - 2★)', Employees: 2 },
    { rating: 'Grade 3 (Meets Expectations - 3★)', Employees: 5 },
    { rating: 'Grade 4 (Exceeds Expectations - 4★)', Employees: 3 },
    { rating: 'Grade 5 (Outstanding / Star - 5★)', Employees: 1 },
  ];

  const totalEvaluated = points.reduce((acc, p) => acc + p.Employees, 0);

  const handleSaveAppraisalRating = () => {
    saveAppraisalMutation.mutate(
      {
        employeeId: selectedEmpId,
        cycle: selectedCycle,
        rating: appraisalRating,
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Appraisal Rating Saved 🏆',
            `Assigned Grade ${appraisalRating} rating for ${selectedCycle} cycle!`
          );
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const getBucketColor = (index: number) => {
    switch (index) {
      case 0:
        return '#ef4444';
      case 1:
        return '#f59e0b';
      case 2:
        return '#3b82f6';
      case 3:
        return '#8b5cf6';
      case 4:
      default:
        return '#10b981';
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
            Bell Curve Appraisal Analytics
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Normal Distribution & Forced Ranking Curve
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Appraisal Cycle Selector */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            🗓️ Select Appraisal Cycle
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            {['H1 2026', 'Annual 2025-26', 'H2 2025'].map(cycle => {
              const isSelected = selectedCycle === cycle;
              return (
                <TouchableOpacity
                  key={cycle}
                  style={[
                    styles.cycleChip,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.background,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setSelectedCycle(cycle)}
                >
                  <Text
                    style={{
                      color: isSelected ? '#ffffff' : colors.textPrimary,
                      fontWeight: '700',
                      fontSize: 12,
                    }}
                  >
                    {cycle}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Bell Curve Normal Distribution Buckets */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Appraisal Bell Curve Distribution ({totalEvaluated} Staff Evaluated)
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          points.map((pt, idx) => {
            const color = getBucketColor(idx);
            const pct = Math.round((pt.Employees / totalEvaluated) * 100);

            return (
              <View
                key={pt.rating}
                style={[
                  styles.card,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.bucketRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bucketTitle, { color: colors.textPrimary }]}>
                      {pt.rating}
                    </Text>
                    <Text style={[styles.bucketSub, { color: colors.textSecondary }]}>
                      Target Ideal Curve: {idx === 0 ? '10%' : idx === 1 ? '20%' : idx === 2 ? '40%' : idx === 3 ? '20%' : '10%'}
                    </Text>
                  </View>

                  <View style={[styles.countBadge, { backgroundColor: `${color}20` }]}>
                    <Text style={[styles.countText, { color }]}>{pt.Employees} Staff ({pct}%)</Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressTrack}>
                  <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: color }]} />
                </View>
              </View>
            );
          })
        )}

        {/* Assign & Save Appraisal Rating Form */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            🏆 Assign Appraisal Rating
          </Text>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SELECT EMPLOYEE *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {employees.map(emp => {
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
                  <Text style={{ color: isSelected ? '#fff' : colors.textPrimary, fontSize: 11, fontWeight: '600' }}>
                    {emp.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>APPRAISAL RATING (GRADE 1 TO 5) *</Text>
          <View style={styles.ratingChipsRow}>
            {[1, 2, 3, 4, 5].map(grade => {
              const isSelected = appraisalRating === grade;
              return (
                <TouchableOpacity
                  key={grade}
                  style={[
                    styles.gradeChip,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.background,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setAppraisalRating(grade)}
                >
                  <Text style={{ color: isSelected ? '#fff' : colors.textPrimary, fontWeight: '800', fontSize: 13 }}>
                    Grade {grade}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: colors.accent },
              saveAppraisalMutation.isPending && { opacity: 0.7 },
            ]}
            onPress={handleSaveAppraisalRating}
            disabled={saveAppraisalMutation.isPending}
            activeOpacity={0.85}
          >
            {saveAppraisalMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveBtnText}>💾 Save Appraisal Rating</Text>
            )}
          </TouchableOpacity>
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
  cycleChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  empChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  bucketRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bucketTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  bucketSub: {
    fontSize: 11,
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countText: {
    fontSize: 11,
    fontWeight: '900',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(100,100,100,0.1)',
    overflow: 'hidden',
    marginTop: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  ratingChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  gradeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  saveBtn: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
