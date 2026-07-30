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
import { Candidate, useAdvanceCandidate, useCandidates, useRejectCandidate } from '../../api/hook/useRecruitment';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CandidatePipeline'>;

type StageType = 'Applied' | 'Interview' | 'Offer' | 'Onboarding';

export const CandidatePipelineScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [stageFilter, setStageFilter] = useState('ALL');

  // TanStack Queries & Mutations
  const { data: candidatesRes, isLoading } = useCandidates();
  const advanceStageMutation = useAdvanceCandidate();
  const rejectCandidateMutation = useRejectCandidate();

  const candidatesList: Candidate[] = candidatesRes?.data || [
    {
      id: 'CND001',
      name: 'Rohan Deshmukh',
      role: 'Senior React Native Engineer',
      experience: '5.5 Years',
      email: 'rohan.d@gmail.com',
      stage: 'Applied',
      bgvChecked: false,
      contractSigned: false,
      hardwareAssigned: false,
    },
    {
      id: 'CND002',
      name: 'Priya Sharma',
      role: 'Lead UI/UX Product Designer',
      experience: '6 Years',
      email: 'priya.ux@outlook.com',
      stage: 'Interview',
      bgvChecked: false,
      contractSigned: false,
      hardwareAssigned: false,
    },
    {
      id: 'CND003',
      name: 'Vikram Malhotra',
      role: 'DevOps & Cloud Infrastructure Lead',
      experience: '7 Years',
      email: 'vikram.cloud@dev.io',
      stage: 'Offer',
      bgvChecked: true,
      contractSigned: true,
      hardwareAssigned: false,
    },
    {
      id: 'CND004',
      name: 'Ananya Verma',
      role: 'Talent Acquisition Specialist',
      experience: '4 Years',
      email: 'ananya.v@hrnet.com',
      stage: 'Onboarding',
      bgvChecked: true,
      contractSigned: true,
      hardwareAssigned: true,
    },
  ];

  const filteredCandidates = candidatesList.filter(c => {
    if (stageFilter === 'ALL') return true;
    return c.stage.toLowerCase() === stageFilter.toLowerCase();
  });

  const getNextStage = (curr: StageType): StageType | null => {
    switch (curr) {
      case 'Applied':
        return 'Interview';
      case 'Interview':
        return 'Offer';
      case 'Offer':
        return 'Onboarding';
      case 'Onboarding':
      default:
        return null;
    }
  };

  const handleAdvanceStage = (id: string, name: string, currStage: StageType) => {
    const next = getNextStage(currStage);
    if (!next) {
      Alert.alert('Onboarding Stage', `${name} is already in the final Onboarding stage!`);
      return;
    }

    advanceStageMutation.mutate(
      { id, stage: next },
      {
        onSuccess: () => {
          Alert.alert(
            'Stage Advanced ⏩',
            `${name} has been moved from ${currStage} to ${next} stage!`
          );
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const handleRejectCandidate = (id: string, name: string) => {
    Alert.alert('Confirm Rejection', `Are you sure you want to reject candidate ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: () => {
          rejectCandidateMutation.mutate(id, {
            onSuccess: () => {
              Alert.alert('Candidate Rejected ❌', `${name} has been removed from candidate pipeline.`);
            },
            onError: err => Alert.alert('Error', err.message),
          });
        },
      },
    ]);
  };

  const getStagePill = (st: string) => {
    switch (st) {
      case 'Applied':
        return { bg: '#8b5cf620', text: '#8b5cf6' };
      case 'Interview':
        return { bg: '#3b82f620', text: '#3b82f6' };
      case 'Offer':
        return { bg: '#f59e0b20', text: '#f59e0b' };
      case 'Onboarding':
      default:
        return { bg: '#10b98120', text: '#10b981' };
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
            Candidate Hiring Pipeline
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            ATS Candidate Stages & Pre-Screening Roster
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stage Filter Tabs */}
        <View style={styles.tabRow}>
          {['ALL', 'Applied', 'Interview', 'Offer', 'Onboarding'].map(st => {
            const isSelected = stageFilter === st;
            return (
              <TouchableOpacity
                key={st}
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.cardBackground,
                    borderColor: isSelected ? colors.accent : colors.cardBorder,
                  },
                ]}
                onPress={() => setStageFilter(st)}
              >
                <Text
                  style={{
                    color: isSelected ? '#ffffff' : colors.textPrimary,
                    fontSize: 10,
                    fontWeight: '700',
                  }}
                >
                  {st}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Candidates Roster */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Candidates Pipeline ({filteredCandidates.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          filteredCandidates.map(cnd => {
            const pill = getStagePill(cnd.stage);
            const nextStage = getNextStage(cnd.stage);

            return (
              <View
                key={cnd.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.cndHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cndNameText, { color: colors.textPrimary }]}>
                      {cnd.name}
                    </Text>
                    <Text style={[styles.cndRoleText, { color: colors.accent }]}>
                      💼 {cnd.role} ({cnd.experience})
                    </Text>
                    <Text style={[styles.cndEmailText, { color: colors.textSecondary }]}>
                      ✉️ {cnd.email}
                    </Text>
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: pill.text }}>
                      {cnd.stage}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={[styles.actionBtnRow, { borderTopColor: colors.cardBorder }]}>
                  <TouchableOpacity
                    style={[styles.actionRejectBtn, { borderColor: '#ef4444' }]}
                    onPress={() => handleRejectCandidate(cnd.id, cnd.name)}
                  >
                    <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '700' }}>
                      ❌ Reject
                    </Text>
                  </TouchableOpacity>

                  {nextStage && (
                    <TouchableOpacity
                      style={[styles.actionAdvanceBtn, { backgroundColor: colors.accent }]}
                      onPress={() => handleAdvanceStage(cnd.id, cnd.name, cnd.stage)}
                    >
                      <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '700' }}>
                        ⏩ Advance to {nextStage}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
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
  tabRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  cndHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cndNameText: {
    fontSize: 15,
    fontWeight: '700',
  },
  cndRoleText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  cndEmailText: {
    fontSize: 11,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  actionRejectBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionAdvanceBtn: {
    flex: 2,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
});
