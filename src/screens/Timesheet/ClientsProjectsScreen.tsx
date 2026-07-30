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
import { useTimesheets } from '../../api/hook/useTimesheets';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ClientsProjects'>;

interface ProjectRecord {
  id: string;
  projectName: string;
  clientName: string;
  budgetedHours: number;
  loggedHours: number;
  status: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';
  team: { id: string; name: string; hours: number }[];
}

export const ClientsProjectsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  // Create Project Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('Enterprise Cloud Migration');
  const [newClientName, setNewClientName] = useState('Global FinTech Corp');
  const [newBudgetHours, setNewBudgetHours] = useState('450');

  // TanStack Queries
  const { data: empRes } = useEmployees();
  const { data: timesheetsRes, isLoading } = useTimesheets();

  const employees = empRes?.data || [];

  const [projectsList, setProjectsList] = useState<ProjectRecord[]>([
    {
      id: 'PRJ001',
      projectName: 'Symbosys HRMS Core Mobile App',
      clientName: 'Symbosys Technologies Pvt Ltd',
      budgetedHours: 500,
      loggedHours: 340,
      status: 'ACTIVE',
      team: [
        { id: 'EMP001', name: 'Aarav Sharma', hours: 160 },
        { id: 'EMP002', name: 'Neha Patel', hours: 100 },
        { id: 'EMP31723', name: 'sam', hours: 80 },
      ],
    },
    {
      id: 'PRJ002',
      projectName: 'HR Analytics & ECR Compliance Engine',
      clientName: 'Tata Consultancy Services',
      budgetedHours: 300,
      loggedHours: 195,
      status: 'ACTIVE',
      team: [
        { id: 'EMP002', name: 'Neha Patel', hours: 120 },
        { id: 'EMP001', name: 'Aarav Sharma', hours: 75 },
      ],
    },
    {
      id: 'PRJ003',
      projectName: 'Legacy Payroll Portal Migration',
      clientName: 'Wipro Technologies',
      budgetedHours: 200,
      loggedHours: 200,
      status: 'COMPLETED',
      team: [{ id: 'EMP31723', name: 'sam', hours: 200 }],
    },
  ]);

  const handleCreateProject = () => {
    if (!newProjectName.trim() || !newClientName.trim()) {
      Alert.alert('Validation Error', 'Please complete Project Name and Client Name.');
      return;
    }

    const bHrs = parseFloat(newBudgetHours) || 300;

    const newRecord: ProjectRecord = {
      id: `PRJ${Date.now().toString().slice(-3)}`,
      projectName: newProjectName.trim(),
      clientName: newClientName.trim(),
      budgetedHours: bHrs,
      loggedHours: 0,
      status: 'ACTIVE',
      team: [
        { id: 'EMP001', name: 'Aarav Sharma', hours: 0 },
        { id: 'EMP002', name: 'Neha Patel', hours: 0 },
      ],
    };

    setProjectsList(prev => [newRecord, ...prev]);
    setModalOpen(false);
    setNewProjectName('');
    setNewClientName('');
    Alert.alert('Project Registered 📁', `${newProjectName} created and team allocated!`);
  };

  const totalBudgeted = projectsList.reduce((acc, p) => acc + p.budgetedHours, 0);
  const totalLogged = projectsList.reduce((acc, p) => acc + p.loggedHours, 0);

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
            Clients & Project Allocations
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Client Roster, Budgeted Hours & Team Logging
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addTopBtn, { backgroundColor: colors.accent }]}
          onPress={() => setModalOpen(true)}
        >
          <Text style={styles.addTopBtnText}>+ Add Project</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Summary Metrics Cards */}
        <View style={styles.summaryGrid}>
          <View style={[styles.sumBox, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
            <Text style={[styles.sumVal, { color: '#3b82f6' }]}>{projectsList.length}</Text>
            <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>Active Client Projects</Text>
          </View>

          <View style={[styles.sumBox, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
            <Text style={[styles.sumVal, { color: '#10b981' }]}>{totalLogged} hrs</Text>
            <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>Total Hours Logged</Text>
          </View>

          <View style={[styles.sumBox, { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
            <Text style={[styles.sumVal, { color: '#8b5cf6' }]}>{totalBudgeted} hrs</Text>
            <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>Total Budgeted Hours</Text>
          </View>
        </View>

        {/* Projects List */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Client Projects Roster ({projectsList.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          projectsList.map(prj => {
            const pct = Math.min(100, Math.round((prj.loggedHours / prj.budgetedHours) * 100));
            const isCompleted = prj.status === 'COMPLETED';

            return (
              <View
                key={prj.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                {/* Top Row */}
                <View style={styles.prjHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.clientNameText, { color: colors.accent }]}>
                      🏢 {prj.clientName}
                    </Text>
                    <Text style={[styles.projectNameText, { color: colors.textPrimary }]}>
                      {prj.projectName}
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
                        fontSize: 10,
                        fontWeight: '800',
                        color: isCompleted ? '#10b981' : '#3b82f6',
                      }}
                    >
                      {prj.status}
                    </Text>
                  </View>
                </View>

                {/* Hours & Progress */}
                <View style={styles.hoursRow}>
                  <Text style={[styles.hoursLabel, { color: colors.textSecondary }]}>
                    Logged: <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>{prj.loggedHours} hrs</Text> / {prj.budgetedHours} hrs Budgeted
                  </Text>
                  <Text style={[styles.hoursPct, { color: colors.textPrimary }]}>{pct}%</Text>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${pct}%`, backgroundColor: isCompleted ? '#10b981' : colors.accent },
                    ]}
                  />
                </View>

                {/* Allocated Team Members */}
                <View style={[styles.teamBox, { backgroundColor: colors.background }]}>
                  <Text style={[styles.teamTitle, { color: colors.textSecondary }]}>ASSIGNED TEAM MEMBERS:</Text>
                  <View style={styles.teamChipsRow}>
                    {prj.team.map(m => (
                      <View key={m.id} style={styles.teamMemberBadge}>
                        <Text style={styles.teamMemberText}>
                          👤 {m.name} ({m.hours}h)
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Project Modal */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Register New Client Project
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PROJECT NAME *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={newProjectName}
              onChangeText={setNewProjectName}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CLIENT NAME *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={newClientName}
              onChangeText={setNewClientName}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>BUDGETED HOURS *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={newBudgetHours}
              onChangeText={setNewBudgetHours}
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
                onPress={handleCreateProject}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Register Project</Text>
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
    gap: 8,
  },
  sumBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sumVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  sumLbl: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
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
  prjHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  clientNameText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  projectNameText: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  hoursLabel: {
    fontSize: 11,
  },
  hoursPct: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(100,100,100,0.1)',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  teamBox: {
    padding: 10,
    borderRadius: 10,
    gap: 6,
    marginTop: 4,
  },
  teamTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  teamChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  teamMemberBadge: {
    backgroundColor: 'rgba(100,100,100,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  teamMemberText: {
    fontSize: 11,
    fontWeight: '600',
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
