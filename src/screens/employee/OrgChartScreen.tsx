import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useEmployees } from '../../api/hook/useEmployee';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrgChart'>;

export const OrgChartScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const { data: response, isLoading } = useEmployees();
  const employees = response?.data || [];

  // Group by manager
  const managers = employees.filter(e => !e.managerId || e.designation?.toLowerCase().includes('manager') || e.designation?.toLowerCase().includes('lead') || e.designation?.toLowerCase().includes('director'));

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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Organization Chart</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Team Structure & Hierarchy
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Executive Node */}
        <View style={styles.treeSection}>
          <View style={[styles.execCard, { backgroundColor: colors.accent }]}>
            <Text style={styles.execTitle}>Symbosys Corporate Hierarchy</Text>
            <Text style={styles.execSubtitle}>Total Headcount: {employees.length}</Text>
          </View>

          <View style={styles.treeLineVertical} />

          {/* Managers & Direct Reports */}
          {managers.map(m => {
            const reportees = employees.filter(e => e.managerId === m.id || (e.departmentId === m.departmentId && e.id !== m.id));

            return (
              <View key={m.id} style={styles.managerBlock}>
                <TouchableOpacity
                  style={[styles.managerNode, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
                  onPress={() => navigation.navigate('EmployeeMaster', { employeeId: m.id })}
                >
                  <View style={styles.managerHeader}>
                    <Text style={[styles.managerName, { color: colors.textPrimary }]}>{m.name}</Text>
                    <View style={styles.leadBadge}>
                      <Text style={styles.leadBadgeText}>LEAD / MANAGER</Text>
                    </View>
                  </View>
                  <Text style={[styles.managerRole, { color: colors.textSecondary }]}>
                    {m.designation || 'Engineering Lead'} • {m.department?.name || 'Technology'}
                  </Text>
                </TouchableOpacity>

                {reportees.length > 0 && <View style={styles.branchLine} />}

                {/* Sub-tree reportees */}
                <View style={styles.reporteesGrid}>
                  {reportees.map(rep => (
                    <TouchableOpacity
                      key={rep.id}
                      style={[styles.reportNode, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
                      onPress={() => navigation.navigate('EmployeeMaster', { employeeId: rep.id })}
                    >
                      <Text style={[styles.reportName, { color: colors.textPrimary }]}>{rep.name}</Text>
                      <Text style={[styles.reportRole, { color: colors.textMuted }]}>{rep.designation || 'Team Member'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })}
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
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  treeSection: {
    alignItems: 'center',
  },
  execCard: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
  },
  execTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  execSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  treeLineVertical: {
    width: 2,
    height: 24,
    backgroundColor: '#3b82f6',
  },
  managerBlock: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  managerNode: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  managerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  managerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  leadBadge: {
    backgroundColor: '#2563eb20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  leadBadgeText: {
    color: '#2563eb',
    fontSize: 10,
    fontWeight: '800',
  },
  managerRole: {
    fontSize: 12,
    marginTop: 4,
  },
  branchLine: {
    width: 2,
    height: 16,
    backgroundColor: '#94a3b8',
  },
  reporteesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    paddingLeft: 16,
  },
  reportNode: {
    flex: 1,
    minWidth: '45%',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  reportName: {
    fontSize: 13,
    fontWeight: '600',
  },
  reportRole: {
    fontSize: 11,
    marginTop: 2,
  },
});
