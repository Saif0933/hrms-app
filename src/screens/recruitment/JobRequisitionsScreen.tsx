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
import { JobRequisition, useCreateJob, useJobs } from '../../api/hook/useRecruitment';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'JobRequisitions'>;

export const JobRequisitionsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // Create Job Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [jobTitle, setJobTitle] = useState('Senior Full Stack React Native Engineer');
  const [jobDepartment, setJobDepartment] = useState('Engineering');

  // TanStack Queries & Mutations
  const { data: jobsRes, isLoading } = useJobs();
  const createJobMutation = useCreateJob();

  const jobsList: JobRequisition[] = jobsRes?.data || [
    {
      id: 'JOB001',
      title: 'Senior Full Stack React Native Engineer',
      department: 'Engineering',
      status: 'OPEN',
      applicants: 18,
    },
    {
      id: 'JOB002',
      title: 'Lead UI/UX Product Designer',
      department: 'Design & UX',
      status: 'OPEN',
      applicants: 12,
    },
    {
      id: 'JOB003',
      title: 'Talent Acquisition & HR Specialist',
      department: 'Human Resources',
      status: 'INTERVIEWING',
      applicants: 9,
    },
    {
      id: 'JOB004',
      title: 'DevOps & Cloud Infrastructure Lead',
      department: 'Engineering',
      status: 'OPEN',
      applicants: 6,
    },
    {
      id: 'JOB005',
      title: 'Enterprise Account Executive',
      department: 'Sales',
      status: 'FILLED',
      applicants: 15,
    },
  ];

  const filteredJobs = jobsList.filter(job => {
    if (departmentFilter === 'ALL') return true;
    return job.department.toLowerCase() === departmentFilter.toLowerCase();
  });

  const totalApplicants = jobsList.reduce((acc, j) => acc + j.applicants, 0);
  const totalOpen = jobsList.filter(j => j.status === 'OPEN').length;

  const handleCreateJob = () => {
    if (!jobTitle.trim() || !jobDepartment.trim()) {
      Alert.alert('Validation Error', 'Please complete Job Title and Department.');
      return;
    }

    createJobMutation.mutate(
      {
        title: jobTitle.trim(),
        department: jobDepartment.trim(),
      },
      {
        onSuccess: () => {
          setModalOpen(false);
          setJobTitle('');
          Alert.alert(
            'Job Requisition Created 💼',
            `Requisition for ${jobTitle} (${jobDepartment}) has been opened for candidates!`
          );
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const getStatusPill = (st: string) => {
    switch (st) {
      case 'OPEN':
        return { bg: '#10b98120', text: '#10b981' };
      case 'INTERVIEWING':
        return { bg: '#3b82f620', text: '#3b82f6' };
      case 'FILLED':
      default:
        return { bg: '#64748b20', text: '#64748b' };
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
            Job Requisitions & Hiring Openings
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Recruitment Openings, Department Budgets & Applicant Volume
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addTopBtn, { backgroundColor: colors.accent }]}
          onPress={() => setModalOpen(true)}
        >
          <Text style={styles.addTopBtnText}>+ Create Job</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Summary Header Metrics */}
        <View style={styles.summaryGrid}>
          <View style={[styles.sumBox, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
            <Text style={[styles.sumVal, { color: '#10b981' }]}>{totalOpen}</Text>
            <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>Open Requisitions</Text>
          </View>

          <View style={[styles.sumBox, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
            <Text style={[styles.sumVal, { color: '#3b82f6' }]}>{totalApplicants}</Text>
            <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>Total Active Candidates</Text>
          </View>
        </View>

        {/* Department Filter Chips */}
        <View style={styles.deptFilterBox}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>FILTER BY DEPARTMENT</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
            {['ALL', 'Engineering', 'Design & UX', 'Human Resources', 'Sales'].map(dept => {
              const isSelected = departmentFilter === dept;
              return (
                <TouchableOpacity
                  key={dept}
                  style={[
                    styles.deptChip,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.cardBackground,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setDepartmentFilter(dept)}
                >
                  <Text
                    style={{
                      color: isSelected ? '#ffffff' : colors.textPrimary,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    {dept}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Job Requisitions List */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Requisitions Roster ({filteredJobs.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          filteredJobs.map(job => {
            const pill = getStatusPill(job.status);

            return (
              <View
                key={job.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.jobHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.deptBadgeText, { color: colors.accent }]}>
                      🏢 {job.department}
                    </Text>
                    <Text style={[styles.jobTitleText, { color: colors.textPrimary }]}>
                      {job.title}
                    </Text>
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: pill.text }}>
                      {job.status}
                    </Text>
                  </View>
                </View>

                {/* Applicants Counter & Actions */}
                <View style={[styles.applicantFooterRow, { borderTopColor: colors.cardBorder }]}>
                  <View style={styles.applicantCountBadge}>
                    <Text style={[styles.applicantCountText, { color: colors.textPrimary }]}>
                      👥 <Text style={{ fontWeight: '900', color: colors.accent }}>{job.applicants}</Text> Applicants Applied
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.viewPipelineBtn, { backgroundColor: colors.accent }]}
                    onPress={() => navigation.navigate('CandidatePipeline')}
                  >
                    <Text style={styles.viewPipelineBtnText}>View Pipeline ➔</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Create Job Requisition Modal */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Create Job Requisition
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>JOB TITLE *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={jobTitle}
              onChangeText={setJobTitle}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DEPARTMENT *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={jobDepartment}
              onChangeText={setJobDepartment}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setModalOpen(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSubmitBtn,
                  { backgroundColor: colors.accent },
                  createJobMutation.isPending && { opacity: 0.7 },
                ]}
                onPress={handleCreateJob}
                disabled={createJobMutation.isPending}
              >
                {createJobMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Publish Requisition</Text>
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
  deptFilterBox: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  deptChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
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
  jobHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  deptBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  jobTitleText: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  applicantFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  applicantCountBadge: {
    flex: 1,
  },
  applicantCountText: {
    fontSize: 12,
  },
  viewPipelineBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewPipelineBtnText: {
    color: '#ffffff',
    fontSize: 11,
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
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
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
