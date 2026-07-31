import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
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
import { useLogout, useProfile } from '../api/hook/useAuth';
import {
  useDashboardData,
  PendingLeaveApproval,
  PendingClaimApproval,
} from '../api/hook/useDashboard';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark, toggleTheme } = useTheme();
  const logout = useLogout();

  const { data: profileResponse } = useProfile();
  const {
    data: dashboardResponse,
    isLoading,
    isRefetching,
    refetch,
  } = useDashboardData();

  const [activeChartTab, setActiveChartTab] = useState<'attendance' | 'departments' | 'diversity'>('attendance');

  // Dynamic User Profile
  const userName = profileResponse?.data?.user?.name || 'John Doe';
  const greetingName = userName.split(' ')[0] || 'John';
  const userRole = profileResponse?.data?.user?.role || 'Software Engineer • HRMS Portal';
  const userInitials = userName
    ? userName
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'JD';

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const dbDashboard = dashboardResponse?.data;
  const kpis = dbDashboard?.kpis;

  // Local state for pending approvals so user can interactively approve/reject
  const [pendingLeaves, setPendingLeaves] = useState<PendingLeaveApproval[]>(
    dbDashboard?.pendingApprovals?.leaves || [
      { id: 'l1', employeeName: 'Sarah Jenkins', type: 'Casual Leave', startDate: 'Aug 02', endDate: 'Aug 04', days: 3, reason: 'Family event' },
      { id: 'l2', employeeName: 'Michael Scott', type: 'Sick Leave', startDate: 'Aug 01', endDate: 'Aug 01', days: 1, reason: 'Doctor appointment' },
    ]
  );

  const [pendingClaims, setPendingClaims] = useState<PendingClaimApproval[]>(
    dbDashboard?.pendingApprovals?.claims || [
      { id: 'c1', employeeName: 'Dwight Schrute', type: 'Travel Allowance', amount: 3500, date: 'Jul 28', reason: 'Client Visit' },
    ]
  );

  // Sync state if dashboardResponse arrives
  React.useEffect(() => {
    if (dbDashboard?.pendingApprovals) {
      setPendingLeaves(dbDashboard.pendingApprovals.leaves);
      setPendingClaims(dbDashboard.pendingApprovals.claims);
    }
  }, [dbDashboard]);

  const pendingCount = pendingLeaves.length + pendingClaims.length;

  const handleApproveLeave = (id: string, name: string) => {
    setPendingLeaves(prev => prev.filter(item => item.id !== id));
    Alert.alert('Approved', `Leave request for ${name} has been approved.`);
  };

  const handleRejectLeave = (id: string, name: string) => {
    setPendingLeaves(prev => prev.filter(item => item.id !== id));
    Alert.alert('Rejected', `Leave request for ${name} has been rejected.`);
  };

  const handleApproveClaim = (id: string, name: string, amount: number) => {
    setPendingClaims(prev => prev.filter(item => item.id !== id));
    Alert.alert('Approved', `Travel claim of ₹${amount.toLocaleString()} for ${name} approved.`);
  };

  const handleRejectClaim = (id: string, name: string) => {
    setPendingClaims(prev => prev.filter(item => item.id !== id));
    Alert.alert('Rejected', `Travel claim for ${name} rejected.`);
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const auditLogs = dbDashboard?.auditLogs || [
    { id: 'a1', user: 'John Doe', action: 'Check-in Registered', module: 'Attendance', timestamp: 'Today, 09:15 AM', details: 'Location: Main Office' },
    { id: 'a2', user: 'HR Admin', action: 'Casual Leave Approved', module: 'Leave Management', timestamp: 'Yesterday, 04:30 PM', details: '3 days approved' },
    { id: 'a3', user: 'Finance Lead', action: 'Expense Claim Processed', module: 'Claims', timestamp: '2 days ago', details: '₹3,500 reimbursed' },
  ];

  const attendanceTrend = dbDashboard?.attendanceTrend || [
    { name: 'Mon', Present: 98, Late: 2, Absent: 0 },
    { name: 'Tue', Present: 96, Late: 4, Absent: 0 },
    { name: 'Wed', Present: 95, Late: 3, Absent: 2 },
    { name: 'Thu', Present: 97, Late: 1, Absent: 2 },
    { name: 'Fri', Present: 92, Late: 6, Absent: 2 },
  ];

  const deptDistribution = dbDashboard?.departmentDistribution || [
    { name: 'Engineering', value: 45 },
    { name: 'Human Resources', value: 12 },
    { name: 'Sales & Marketing', value: 38 },
    { name: 'Design', value: 15 },
    { name: 'Operations', value: 38 },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
      >
        {/* Top App Bar Header */}
        <View style={styles.topHeader}>
          <TouchableOpacity
            style={[
              styles.menuIconButton,
              {
                backgroundColor: colors.hamburgerBg,
                borderColor: colors.hamburgerBorder,
              },
            ]}
            onPress={() => navigation.navigate('Menu')}
            activeOpacity={0.7}
            accessibilityLabel="Open Navigation Menu"
          >
            <View style={[styles.hamburgerLine, { backgroundColor: colors.hamburgerLine }]} />
            <View style={[styles.hamburgerLine, { backgroundColor: colors.hamburgerLine }]} />
            <View style={[styles.hamburgerLine, { backgroundColor: colors.hamburgerLine }]} />
          </TouchableOpacity>

          <View style={styles.topHeaderRight}>
            <TouchableOpacity
              style={[styles.themeToggleButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
              onPress={toggleTheme}
              activeOpacity={0.8}
            >
              <Text style={styles.themeToggleIcon}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutHeaderButton}
              onPress={handleLogout}
              activeOpacity={0.8}
              accessibilityLabel="Log Out"
            >
              <Text style={styles.logoutHeaderIcon}>🚪</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.profileBadge} activeOpacity={0.8}>
              <Text style={styles.avatarText}>{userInitials}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dynamic Greeting Header Card */}
        <View style={[styles.greetingCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
          <View style={styles.greetingTextContainer}>
            <Text style={[styles.greetingTitle, { color: colors.textPrimary }]}>
              Welcome back, {greetingName}! ✨
            </Text>
            <Text style={[styles.greetingSubtitle, { color: colors.textMuted }]}>
              Enterprise dashboard snapshot • {currentDateFormatted}
            </Text>
          </View>

          <View style={styles.headerActionsRow}>
            <TouchableOpacity
              style={[styles.headerActionButton, { backgroundColor: colors.accent }]}
              onPress={() => navigation.navigate('GpsSelfiePunch')}
              activeOpacity={0.85}
            >
              <Text style={styles.headerActionText}>⏰ Clock In / Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.headerActionButton,
                styles.headerSecondaryAction,
                { backgroundColor: colors.buttonSecondaryBg, borderColor: colors.buttonSecondaryBorder },
              ]}
              onPress={() => navigation.navigate('ApplyLeave')}
              activeOpacity={0.85}
            >
              <Text style={[styles.headerActionText, { color: colors.buttonSecondaryText }]}>📅 Apply Leave</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading Dashboard Data...</Text>
          </View>
        ) : (
          <>
            {/* 5 KPI Cards Grid */}
            <View style={styles.kpiGrid}>
              {/* Card 1: Total Headcount */}
              <View style={[styles.kpiCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                <View style={styles.kpiHeader}>
                  <Text style={[styles.kpiTag, { color: colors.textMuted }]}>HEADCOUNT</Text>
                  <View style={[styles.kpiIconBox, { backgroundColor: '#3b82f615' }]}>
                    <Text style={styles.kpiIconText}>👥</Text>
                  </View>
                </View>
                <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
                  {kpis ? kpis.totalEmployees : 148}
                </Text>
                <Text style={styles.kpiBadgeGreen}>+1 new this month</Text>
              </View>

              {/* Card 2: Active Staff */}
              <View style={[styles.kpiCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                <View style={styles.kpiHeader}>
                  <Text style={[styles.kpiTag, { color: colors.textMuted }]}>ACTIVE STAFF</Text>
                  <View style={[styles.kpiIconBox, { backgroundColor: '#22c55e15' }]}>
                    <Text style={styles.kpiIconText}>✅</Text>
                  </View>
                </View>
                <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
                  {kpis ? kpis.activeEmployees : 142}
                </Text>
                <Text style={[styles.kpiSubtext, { color: colors.textSecondary }]}>
                  {kpis ? kpis.probationEmployees : 6} on probation
                </Text>
              </View>

              {/* Card 3: New Joinings */}
              <View style={[styles.kpiCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                <View style={styles.kpiHeader}>
                  <Text style={[styles.kpiTag, { color: colors.textMuted }]}>NEW JOININGS</Text>
                  <View style={[styles.kpiIconBox, { backgroundColor: '#a855f715' }]}>
                    <Text style={styles.kpiIconText}>👤+</Text>
                  </View>
                </View>
                <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
                  {kpis ? kpis.probationEmployees : 6}
                </Text>
                <Text style={[styles.kpiSubtext, { color: colors.textSecondary }]}>Recent recruits</Text>
              </View>

              {/* Card 4: Out of Office */}
              <View style={[styles.kpiCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                <View style={styles.kpiHeader}>
                  <Text style={[styles.kpiTag, { color: colors.textMuted }]}>OUT OF OFFICE</Text>
                  <View style={[styles.kpiIconBox, { backgroundColor: '#f59e0b15' }]}>
                    <Text style={styles.kpiIconText}>📅</Text>
                  </View>
                </View>
                <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
                  {kpis ? kpis.leaveEmployees : 4}
                </Text>
                <Text style={styles.kpiBadgeAmber}>Active Leave Logs</Text>
              </View>

              {/* Card 5: Pending Approvals */}
              <View style={[styles.kpiCardFull, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                <View style={styles.kpiHeader}>
                  <Text style={[styles.kpiTag, { color: colors.textMuted }]}>PENDING APPROVALS</Text>
                  <View style={[styles.kpiIconBox, { backgroundColor: '#ef444415' }]}>
                    <Text style={styles.kpiIconText}>🛡️</Text>
                  </View>
                </View>
                <View style={styles.kpiRowFlex}>
                  <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
                    {pendingCount}
                  </Text>
                  <Text style={styles.kpiBadgeRed}>Action Items Required</Text>
                </View>
              </View>
            </View>

            {/* HR Operational Analytics Card */}
            <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <View style={styles.sectionHeaderBetween}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>⚡ Operational Analytics</Text>
                <View style={styles.tabContainer}>
                  {(['attendance', 'departments', 'diversity'] as const).map(tab => (
                    <TouchableOpacity
                      key={tab}
                      style={[
                        styles.tabButton,
                        activeChartTab === tab && { backgroundColor: colors.accent },
                      ]}
                      onPress={() => setActiveChartTab(tab)}
                    >
                      <Text
                        style={[
                          styles.tabButtonText,
                          { color: activeChartTab === tab ? '#ffffff' : colors.textSecondary },
                        ]}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Attendance Tab */}
              {activeChartTab === 'attendance' && (
                <View style={styles.analyticsBody}>
                  <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
                      <Text style={[styles.legendText, { color: colors.textSecondary }]}>Present</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                      <Text style={[styles.legendText, { color: colors.textSecondary }]}>Late</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                      <Text style={[styles.legendText, { color: colors.textSecondary }]}>Absent</Text>
                    </View>
                  </View>

                  <View style={styles.barList}>
                    {attendanceTrend.map((day, idx) => (
                      <View key={idx} style={styles.barRow}>
                        <Text style={[styles.barDayLabel, { color: colors.textSecondary }]}>{day.name}</Text>
                        <View style={styles.barTrack}>
                          <View style={[styles.barSegment, { flex: day.Present, backgroundColor: '#3b82f6' }]} />
                          <View style={[styles.barSegment, { flex: day.Late, backgroundColor: '#f59e0b' }]} />
                          <View style={[styles.barSegment, { flex: day.Absent || 0.5, backgroundColor: '#ef4444' }]} />
                        </View>
                        <Text style={[styles.barValueText, { color: colors.textMuted }]}>{day.Present}%</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Departments Tab */}
              {activeChartTab === 'departments' && (
                <View style={styles.analyticsBody}>
                  {deptDistribution.map((dept, idx) => {
                    const colorsList = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
                    const barColor = colorsList[idx % colorsList.length];
                    return (
                      <View key={idx} style={styles.deptItem}>
                        <View style={styles.deptHeader}>
                          <Text style={[styles.deptName, { color: colors.textPrimary }]}>{dept.name}</Text>
                          <Text style={[styles.deptCount, { color: colors.textSecondary }]}>{dept.value} Staff</Text>
                        </View>
                        <View style={[styles.deptTrack, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                          <View style={[styles.deptFill, { width: `${(dept.value / 50) * 100}%`, backgroundColor: barColor }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Diversity Tab */}
              {activeChartTab === 'diversity' && (
                <View style={styles.analyticsBody}>
                  <Text style={[styles.diversityTitle, { color: colors.textSecondary }]}>Gender Inclusion Ratio</Text>
                  <View style={styles.diversityRow}>
                    <View style={[styles.diversityBox, { backgroundColor: '#3b82f615', borderColor: '#3b82f640' }]}>
                      <Text style={styles.diversityIcon}>👨</Text>
                      <Text style={[styles.diversityCount, { color: '#3b82f6' }]}>
                        {dbDashboard?.genderDiversity?.male ?? 88}
                      </Text>
                      <Text style={[styles.diversityLabel, { color: colors.textSecondary }]}>Male Staff</Text>
                    </View>

                    <View style={[styles.diversityBox, { backgroundColor: '#ec489915', borderColor: '#ec489940' }]}>
                      <Text style={styles.diversityIcon}>👩</Text>
                      <Text style={[styles.diversityCount, { color: '#ec4899' }]}>
                        {dbDashboard?.genderDiversity?.female ?? 60}
                      </Text>
                      <Text style={[styles.diversityLabel, { color: colors.textSecondary }]}>Female Staff</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Quick System Workflows Grid */}
            <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>🚀 Quick System Workflows</Text>
              <View style={styles.workflowGrid}>
                <TouchableOpacity
                  style={[styles.workflowItem, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.cardBorder }]}
                  onPress={() => navigation.navigate('EmployeeMaster', {})}
                  activeOpacity={0.75}
                >
                  <Text style={styles.workflowIcon}>➕</Text>
                  <Text style={[styles.workflowText, { color: colors.textPrimary }]}>Add Employee</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.workflowItem, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.cardBorder }]}
                  onPress={() => navigation.navigate('SalaryProcessing')}
                  activeOpacity={0.75}
                >
                  <Text style={styles.workflowIcon}>💳</Text>
                  <Text style={[styles.workflowText, { color: colors.textPrimary }]}>Run Salaries</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.workflowItem, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.cardBorder }]}
                  onPress={() => navigation.navigate('KraGoalSetting')}
                  activeOpacity={0.75}
                >
                  <Text style={styles.workflowIcon}>🏆</Text>
                  <Text style={[styles.workflowText, { color: colors.textPrimary }]}>Appraisals</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.workflowItem, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.cardBorder }]}
                  onPress={() => navigation.navigate('JobRequisitions')}
                  activeOpacity={0.75}
                >
                  <Text style={styles.workflowIcon}>💼</Text>
                  <Text style={[styles.workflowText, { color: colors.textPrimary }]}>Create Job</Text>
                </TouchableOpacity>
              </View>

              {/* Mood Index Banner */}
              <View style={[styles.moodBanner, { backgroundColor: isDark ? '#064e3b25' : '#ecfdf5', borderColor: '#10b98140' }]}>
                <Text style={styles.moodIcon}>😊</Text>
                <View style={styles.moodContent}>
                  <Text style={[styles.moodTitle, { color: isDark ? '#34d399' : '#047857' }]}>
                    Company Mood Index: Very Happy (84%)
                  </Text>
                  <Text style={[styles.moodSubtitle, { color: colors.textMuted }]}>
                    Based on weekly enterprise pulse checks
                  </Text>
                </View>
              </View>
            </View>

            {/* Pending Approvals Workflow Card */}
            <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <View style={styles.sectionHeaderBetween}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>📋 Pending Approvals</Text>
                <View style={styles.badgeAmber}>
                  <Text style={styles.badgeAmberText}>{pendingCount} Action Items</Text>
                </View>
              </View>

              {pendingLeaves.length === 0 && pendingClaims.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    🎉 All approvals are up to date!
                  </Text>
                </View>
              ) : (
                <View style={styles.approvalsList}>
                  {/* Leaves */}
                  {pendingLeaves.map(leave => (
                    <View key={leave.id} style={[styles.approvalCard, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.cardBorder }]}>
                      <View style={styles.approvalHeader}>
                        <Text style={[styles.approvalName, { color: colors.textPrimary }]}>{leave.employeeName}</Text>
                        <View style={styles.badgeBlue}>
                          <Text style={styles.badgeBlueText}>{leave.type}</Text>
                        </View>
                      </View>
                      <Text style={[styles.approvalDetail, { color: colors.textSecondary }]}>
                        {leave.startDate} - {leave.endDate} ({leave.days}d) • "{leave.reason}"
                      </Text>
                      <View style={styles.approvalActions}>
                        <TouchableOpacity
                          style={[styles.btnApprove, { backgroundColor: '#22c55e' }]}
                          onPress={() => handleApproveLeave(leave.id, leave.employeeName)}
                        >
                          <Text style={styles.btnActionText}>✓ Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.btnReject, { backgroundColor: '#ef4444' }]}
                          onPress={() => handleRejectLeave(leave.id, leave.employeeName)}
                        >
                          <Text style={styles.btnActionText}>✕ Reject</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  {/* Claims */}
                  {pendingClaims.map(claim => (
                    <View key={claim.id} style={[styles.approvalCard, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.cardBorder }]}>
                      <View style={styles.approvalHeader}>
                        <Text style={[styles.approvalName, { color: colors.textPrimary }]}>{claim.employeeName}</Text>
                        <View style={styles.badgePurple}>
                          <Text style={styles.badgePurpleText}>{claim.type}</Text>
                        </View>
                      </View>
                      <Text style={[styles.approvalDetail, { color: colors.textSecondary }]}>
                        Amount: ₹{claim.amount.toLocaleString()} • Applied: {claim.date} • "{claim.reason}"
                      </Text>
                      <View style={styles.approvalActions}>
                        <TouchableOpacity
                          style={[styles.btnApprove, { backgroundColor: '#22c55e' }]}
                          onPress={() => handleApproveClaim(claim.id, claim.employeeName, claim.amount)}
                        >
                          <Text style={styles.btnActionText}>✓ Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.btnReject, { backgroundColor: '#ef4444' }]}
                          onPress={() => handleRejectClaim(claim.id, claim.employeeName)}
                        >
                          <Text style={styles.btnActionText}>✕ Reject</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Session Audit Logs */}
            <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>📜 Session Audit Logs</Text>
              <View style={styles.auditList}>
                {auditLogs.map((log, index) => (
                  <View key={log.id || index.toString()} style={styles.auditItem}>
                    <View style={[styles.auditDot, { backgroundColor: index % 2 === 0 ? '#3b82f6' : '#22c55e' }]} />
                    <View style={styles.auditContent}>
                      <View style={styles.auditHeader}>
                        <Text style={[styles.auditAction, { color: colors.textPrimary }]}>{log.action}</Text>
                        <Text style={[styles.auditTime, { color: colors.textMuted }]}>{log.timestamp}</Text>
                      </View>
                      <Text style={[styles.auditDetails, { color: colors.textSecondary }]}>{log.details}</Text>
                      <Text style={[styles.auditUser, { color: colors.textMuted }]}>Logged by: {log.user}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Celebrations & Holidays Grid */}
            <View style={styles.doubleGrid}>
              {/* Celebrations */}
              <View style={[styles.halfCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>🎂 Celebrations</Text>
                <View style={styles.celebrationItem}>
                  <Text style={styles.celebEmoji}>🎂</Text>
                  <View style={styles.celebContent}>
                    <Text style={[styles.celebTitle, { color: colors.textPrimary }]}>Aarav Sharma's Birthday</Text>
                    <Text style={[styles.celebSub, { color: colors.textMuted }]}>Turns a year older today!</Text>
                  </View>
                </View>

                <View style={styles.celebrationItem}>
                  <Text style={styles.celebEmoji}>💼</Text>
                  <View style={styles.celebContent}>
                    <Text style={[styles.celebTitle, { color: colors.textPrimary }]}>2-Year Work Anniversary</Text>
                    <Text style={[styles.celebSub, { color: colors.textMuted }]}>Neha Patel (2 Yrs at HRMS)</Text>
                  </View>
                </View>
              </View>

              {/* Upcoming Holidays */}
              <View style={[styles.halfCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>🏖️ Upcoming Holidays</Text>
                <View style={styles.holidayItem}>
                  <View>
                    <Text style={[styles.holidayName, { color: colors.textPrimary }]}>Independence Day</Text>
                    <Text style={[styles.holidayType, { color: colors.textMuted }]}>Public Holiday</Text>
                  </View>
                  <View style={[styles.dateChip, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                    <Text style={[styles.dateChipText, { color: colors.textSecondary }]}>Aug 15</Text>
                  </View>
                </View>

                <View style={styles.holidayItem}>
                  <View>
                    <Text style={[styles.holidayName, { color: colors.textPrimary }]}>Ganesh Chaturthi</Text>
                    <Text style={[styles.holidayType, { color: colors.textMuted }]}>Gazetted Holiday</Text>
                  </View>
                  <View style={[styles.dateChip, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                    <Text style={[styles.dateChipText, { color: colors.textSecondary }]}>Sep 14</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Organizational Structure Preview */}
            <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>🌳 Organizational Structure</Text>
              <View style={styles.orgPreviewBox}>
                <View style={[styles.orgNodeTop, { backgroundColor: '#3b82f615', borderColor: '#3b82f650' }]}>
                  <Text style={[styles.orgName, { color: '#3b82f6' }]}>Vikram Malhotra</Text>
                  <Text style={[styles.orgRole, { color: colors.textMuted }]}>CEO / EXECUTIVE</Text>
                </View>

                <View style={[styles.lineVertical, { backgroundColor: colors.divider }]} />

                <View style={styles.orgNodeRow}>
                  <View style={[styles.orgNodeChild, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.cardBorder }]}>
                    <Text style={[styles.orgNameChild, { color: colors.textPrimary }]}>Neha Patel</Text>
                    <Text style={[styles.orgRoleChild, { color: colors.textMuted }]}>Engineering Lead</Text>
                  </View>

                  <View style={[styles.orgNodeChild, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.cardBorder }]}>
                    <Text style={[styles.orgNameChild, { color: colors.textPrimary }]}>Shalini Sen</Text>
                    <Text style={[styles.orgRoleChild, { color: colors.textMuted }]}>HR Lead</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.btnOrgLink}
                  onPress={() => navigation.navigate('OrgChart')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnOrgLinkText}>View Full Org Chart →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuIconButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburgerLine: {
    width: 20,
    height: 2.5,
    borderRadius: 2,
    marginVertical: 2,
  },
  themeToggleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggleIcon: {
    fontSize: 18,
  },
  logoutHeaderButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#ef444440',
    backgroundColor: '#ef444415',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutHeaderIcon: {
    fontSize: 16,
  },
  profileBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
  greetingCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  greetingTextContainer: {
    marginBottom: 14,
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  greetingSubtitle: {
    fontSize: 12,
    marginTop: 4,
  },
  headerActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  headerActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSecondaryAction: {
    borderWidth: 1,
  },
  headerActionText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  kpiCardFull: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiTag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  kpiIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconText: {
    fontSize: 12,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },
  kpiRowFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiBadgeGreen: {
    fontSize: 10,
    fontWeight: '700',
    color: '#22c55e',
    marginTop: 4,
  },
  kpiBadgeAmber: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f59e0b',
    marginTop: 4,
  },
  kpiBadgeRed: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ef4444',
    marginTop: 4,
  },
  kpiSubtext: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#00000010',
    borderRadius: 8,
    padding: 2,
  },
  tabButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  analyticsBody: {
    paddingTop: 4,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
  },
  barList: {
    gap: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barDayLabel: {
    width: 32,
    fontSize: 11,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#00000010',
  },
  barSegment: {
    height: '100%',
  },
  barValueText: {
    width: 36,
    fontSize: 11,
    textAlign: 'right',
    fontWeight: '600',
  },
  deptItem: {
    marginBottom: 10,
  },
  deptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  deptName: {
    fontSize: 12,
    fontWeight: '600',
  },
  deptCount: {
    fontSize: 11,
  },
  deptTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  deptFill: {
    height: '100%',
    borderRadius: 4,
  },
  diversityTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  diversityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  diversityBox: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  diversityIcon: {
    fontSize: 22,
  },
  diversityCount: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  diversityLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  workflowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  workflowItem: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  workflowIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  workflowText: {
    fontSize: 12,
    fontWeight: '600',
  },
  moodBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  moodIcon: {
    fontSize: 22,
  },
  moodContent: {
    flex: 1,
  },
  moodTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  moodSubtitle: {
    fontSize: 10,
    marginTop: 2,
  },
  badgeAmber: {
    backgroundColor: '#f59e0b20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeAmberText: {
    color: '#d97706',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
  },
  approvalsList: {
    gap: 10,
  },
  approvalCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  approvalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  approvalName: {
    fontSize: 13,
    fontWeight: '700',
  },
  badgeBlue: {
    backgroundColor: '#3b82f620',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeBlueText: {
    color: '#2563eb',
    fontSize: 9,
    fontWeight: '700',
  },
  badgePurple: {
    backgroundColor: '#a855f720',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePurpleText: {
    color: '#9333ea',
    fontSize: 9,
    fontWeight: '700',
  },
  approvalDetail: {
    fontSize: 11,
    marginBottom: 8,
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  btnApprove: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnReject: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  btnActionText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  auditList: {
    gap: 10,
  },
  auditItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  auditDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  auditContent: {
    flex: 1,
  },
  auditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  auditAction: {
    fontSize: 12,
    fontWeight: '700',
  },
  auditTime: {
    fontSize: 10,
  },
  auditDetails: {
    fontSize: 11,
    marginTop: 2,
  },
  auditUser: {
    fontSize: 9,
    marginTop: 2,
  },
  doubleGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  halfCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  celebrationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  celebEmoji: {
    fontSize: 18,
  },
  celebContent: {
    flex: 1,
  },
  celebTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  celebSub: {
    fontSize: 9,
    marginTop: 1,
  },
  holidayItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  holidayName: {
    fontSize: 11,
    fontWeight: '700',
  },
  holidayType: {
    fontSize: 9,
    marginTop: 1,
  },
  dateChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dateChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  orgPreviewBox: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  orgNodeTop: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  orgName: {
    fontSize: 12,
    fontWeight: '700',
  },
  orgRole: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  lineVertical: {
    width: 2,
    height: 14,
    marginVertical: 4,
  },
  orgNodeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  orgNodeChild: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  orgNameChild: {
    fontSize: 11,
    fontWeight: '600',
  },
  orgRoleChild: {
    fontSize: 8,
    marginTop: 1,
  },
  btnOrgLink: {
    marginTop: 4,
  },
  btnOrgLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
});



