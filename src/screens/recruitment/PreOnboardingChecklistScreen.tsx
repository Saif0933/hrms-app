import React from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Candidate, useCandidates, useUpdateCandidateChecklist } from '../../api/hook/useRecruitment';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PreOnboardingChecklist'>;

export const PreOnboardingChecklistScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  // TanStack Queries & Mutations
  const { data: candidatesRes, isLoading } = useCandidates();
  const updateChecklistMutation = useUpdateCandidateChecklist();

  const candidatesList: Candidate[] = candidatesRes?.data || [
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
    {
      id: 'CND002',
      name: 'Priya Sharma',
      role: 'Lead UI/UX Product Designer',
      experience: '6 Years',
      email: 'priya.ux@outlook.com',
      stage: 'Offer',
      bgvChecked: false,
      contractSigned: false,
      hardwareAssigned: false,
    },
  ];

  // Filter candidates in Offer or Onboarding stage
  const onboardingCandidates = candidatesList.filter(
    c => c.stage === 'Offer' || c.stage === 'Onboarding'
  );

  const handleToggleChecklist = (
    cndId: string,
    cndName: string,
    field: 'bgvChecked' | 'contractSigned' | 'hardwareAssigned',
    currentVal: boolean
  ) => {
    const updatedPayload = {
      id: cndId,
      [field]: !currentVal,
    };

    updateChecklistMutation.mutate(updatedPayload, {
      onSuccess: () => {
        Alert.alert(
          'Checklist Updated ✔️',
          `Updated ${field} status for ${cndName} to ${!currentVal ? 'Verified' : 'Pending'}.`
        );
      },
      onError: err => Alert.alert('Error', err.message),
    });
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
            Pre-Onboarding Checklist
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Background Verification, Contract Signing & Hardware Provisioning
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Candidates Preparing for Onboarding ({onboardingCandidates.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          onboardingCandidates.map(cnd => {
            const completedCount =
              (cnd.bgvChecked ? 1 : 0) +
              (cnd.contractSigned ? 1 : 0) +
              (cnd.hardwareAssigned ? 1 : 0);
            const pct = Math.round((completedCount / 3) * 100);
            const isReady = pct === 100;

            return (
              <View
                key={cnd.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                {/* Candidate Info Row */}
                <View style={styles.cndHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cndNameText, { color: colors.textPrimary }]}>
                      {cnd.name}
                    </Text>
                    <Text style={[styles.cndRoleText, { color: colors.accent }]}>
                      💼 {cnd.role}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.readyPill,
                      { backgroundColor: isReady ? '#10b98120' : '#f59e0b20' },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '800',
                        color: isReady ? '#10b981' : '#f59e0b',
                      }}
                    >
                      {isReady ? 'READY TO JOIN ✅' : `IN PROGRESS (${pct}%)`}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${pct}%`, backgroundColor: isReady ? '#10b981' : colors.accent },
                    ]}
                  />
                </View>

                {/* Checklist Toggles List */}
                <View style={[styles.checklistContainer, { backgroundColor: colors.background }]}>
                  {/* Item 1: BGV */}
                  <View style={styles.checkItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.checkTitle, { color: colors.textPrimary }]}>
                        🔍 Background Verification (BGV)
                      </Text>
                      <Text style={[styles.checkSub, { color: colors.textSecondary }]}>
                        Criminal history & employment credential verification
                      </Text>
                    </View>
                    <Switch
                      value={cnd.bgvChecked}
                      onValueChange={() =>
                        handleToggleChecklist(cnd.id, cnd.name, 'bgvChecked', cnd.bgvChecked)
                      }
                      trackColor={{ false: '#64748b40', true: colors.accent }}
                    />
                  </View>

                  {/* Item 2: Contract */}
                  <View style={styles.checkItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.checkTitle, { color: colors.textPrimary }]}>
                        📄 Signed Employment Contract
                      </Text>
                      <Text style={[styles.checkSub, { color: colors.textSecondary }]}>
                        Signed offer letter & NDA confidentiality agreement
                      </Text>
                    </View>
                    <Switch
                      value={cnd.contractSigned}
                      onValueChange={() =>
                        handleToggleChecklist(cnd.id, cnd.name, 'contractSigned', cnd.contractSigned)
                      }
                      trackColor={{ false: '#64748b40', true: colors.accent }}
                    />
                  </View>

                  {/* Item 3: Hardware */}
                  <View style={styles.checkItemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.checkTitle, { color: colors.textPrimary }]}>
                        💻 Laptop & Hardware Provisioned
                      </Text>
                      <Text style={[styles.checkSub, { color: colors.textSecondary }]}>
                        Company MacBook/Laptop & security credentials assigned
                      </Text>
                    </View>
                    <Switch
                      value={cnd.hardwareAssigned}
                      onValueChange={() =>
                        handleToggleChecklist(cnd.id, cnd.name, 'hardwareAssigned', cnd.hardwareAssigned)
                      }
                      trackColor={{ false: '#64748b40', true: colors.accent }}
                    />
                  </View>
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
  readyPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(100,100,100,0.1)',
    overflow: 'hidden',
    marginTop: 2,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  checklistContainer: {
    padding: 12,
    borderRadius: 12,
    gap: 10,
    marginTop: 4,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  checkTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  checkSub: {
    fontSize: 10,
    marginTop: 1,
  },
});
