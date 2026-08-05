import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { useLogout, useProfile } from '../api/hook/useAuth';
import {
  PendingClaimApproval,
  PendingLeaveApproval,
  useDashboardData,
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

  const [activeInsightTab, setActiveInsightTab] = useState<'attendance' | 'departments' | 'diversity'>('attendance');
  const [activeApprovalTab, setActiveApprovalTab] = useState<'leaves' | 'claims'>('leaves');

  // Dynamic User Profile Data
  const userName = profileResponse?.data?.user?.name || 'John';
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

  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const dateFormatted = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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

  React.useEffect(() => {
    if (dbDashboard?.pendingApprovals) {
      setPendingLeaves(dbDashboard.pendingApprovals.leaves);
      setPendingClaims(dbDashboard.pendingApprovals.claims);
    }
  }, [dbDashboard]);

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

  const attendanceTrend = [
    { name: 'Mon', percentage: '98%', Present: 98, Late: 2, Absent: 0 },
    { name: 'Tue', percentage: '96%', Present: 96, Late: 4, Absent: 0 },
    { name: 'Wed', percentage: '95%', Present: 95, Late: 3, Absent: 2 },
    { name: 'Thu', percentage: '97%', Present: 97, Late: 1, Absent: 2 },
    { name: 'Fri', percentage: '92%', Present: 92, Late: 6, Absent: 2 },
  ];

  const deptDistribution = dbDashboard?.departmentDistribution || [
    { name: 'Engineering', value: 45 },
    { name: 'Human Resources', value: 12 },
    { name: 'Sales & Marketing', value: 38 },
    { name: 'Design', value: 15 },
    { name: 'Operations', value: 38 },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0f172a' : '#f8fafc' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#0f172a' : '#f8fafc'} />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={['#2563eb']}
            tintColor="#2563eb"
          />
        }
      >
        {/* Top App Bar Navigation Header */}
        <View style={styles.topAppBar}>
          <TouchableOpacity
            style={styles.hamburgerButton}
            onPress={() => navigation.navigate('Menu')}
            activeOpacity={0.7}
            accessibilityLabel="Open Menu"
          >
            <View style={[styles.hamburgerLine, { backgroundColor: isDark ? '#f8fafc' : '#1e293b' }]} />
            <View style={[styles.hamburgerLine, { backgroundColor: isDark ? '#f8fafc' : '#1e293b' }]} />
            <View style={[styles.hamburgerLine, { backgroundColor: isDark ? '#f8fafc' : '#1e293b' }]} />
          </TouchableOpacity>

          <View style={styles.brandTitleContainer}>
            <View style={styles.brandLogoBox}>
              <Text style={styles.brandLogoIcon}>H</Text>
            </View>
            <Text style={[styles.brandTitleText, { color: isDark ? '#ffffff' : '#0f172a' }]}>HRMS Portal</Text>
          </View>

          <View style={styles.topRightActions}>
            <TouchableOpacity
              style={[styles.circleIconButton, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
              onPress={toggleTheme}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 16 }}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.circleIconButton, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 14 }}>🔔</Text>
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>3</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Greeting Banner */}
        <View style={[styles.profileBanner, { backgroundColor: isDark ? '#1e293b' : '#e0f2fe' }]}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{userInitials}</Text>
            </View>
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.profileTextContainer}>
            <Text style={[styles.greetingLabel, { color: isDark ? '#94a3b8' : '#475569' }]}>Good Morning,</Text>
            <Text style={[styles.userNameText, { color: isDark ? '#ffffff' : '#0f172a' }]}>{greetingName}! 👋</Text>
            <Text style={[styles.userRoleText, { color: isDark ? '#cbd5e1' : '#64748b' }]}>{userRole}</Text>
          </View>

          <View style={styles.dateBadgeContainer}>
            <Text style={[styles.dateDayText, { color: isDark ? '#94a3b8' : '#475569' }]}>{dayOfWeek}</Text>
            <Text style={[styles.dateFormattedText, { color: isDark ? '#cbd5e1' : '#64748b' }]}>{dateFormatted}</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Loading Dashboard Data...</Text>
          </View>
        ) : (
          <>
            {/* Key Metrics Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: isDark ? '#ffffff' : '#0f172a' }]}>Key Metrics</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AttendanceReports' as any)}>
                <Text style={styles.viewDetailsLink}>View Details →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.metricsGrid}>
              {/* Card 1: Total Employees (Blue Tint) */}
              <View style={[styles.metricCard, { backgroundColor: isDark ? '#1e293b' : '#e0f2fe' }]}>
                <View style={[styles.metricIconCircle, { backgroundColor: '#3b82f625' }]}>
                  <Text style={{ fontSize: 18 }}>👥</Text>
                </View>
                <Text style={[styles.metricLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>Total Employees</Text>
                <Text style={[styles.metricValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                  {kpis ? kpis.totalEmployees.toLocaleString() : '1,248'}
                </Text>
                <Text style={styles.metricTrendGreen}>↑ +12% vs last month</Text>
              </View>

              {/* Card 2: Today Present (Green Tint) */}
              <View style={[styles.metricCard, { backgroundColor: isDark ? '#14532d30' : '#dcfce7' }]}>
                <View style={[styles.metricIconCircle, { backgroundColor: '#22c55e25' }]}>
                  <Text style={{ fontSize: 18 }}>📅</Text>
                </View>
                <Text style={[styles.metricLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>Today Present</Text>
                <Text style={[styles.metricValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                  {kpis ? `${kpis.activeEmployees.toLocaleString()} (92.6%)` : '1,156 (92.6%)'}
                </Text>
                <Text style={styles.metricTrendGreen}>↑ +2.4% vs yesterday</Text>
              </View>

              {/* Card 3: Pending Leave (Orange Tint) */}
              <View style={[styles.metricCard, { backgroundColor: isDark ? '#7c2d1230' : '#ffedd5' }]}>
                <View style={[styles.metricIconCircle, { backgroundColor: '#f9731625' }]}>
                  <Text style={{ fontSize: 18 }}>✈️</Text>
                </View>
                <Text style={[styles.metricLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>Pending Leave</Text>
                <Text style={[styles.metricValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                  {pendingLeaves.length}
                </Text>
                <Text style={styles.metricSubOrange}>Needs your approval</Text>
              </View>

              {/* Card 4: Pending Claims (Purple Tint) */}
              <View style={[styles.metricCard, { backgroundColor: isDark ? '#581c8730' : '#f3e8ff' }]}>
                <View style={[styles.metricIconCircle, { backgroundColor: '#a855f725' }]}>
                  <Text style={{ fontSize: 18 }}>📄</Text>
                </View>
                <Text style={[styles.metricLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>Pending Claims</Text>
                <Text style={[styles.metricValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                  {pendingClaims.length}
                </Text>
                <Text style={styles.metricSubPurple}>Needs your approval</Text>
              </View>
            </View>

            {/* Quick Actions Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: isDark ? '#ffffff' : '#0f172a' }]}>Quick Actions</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Menu')}>
                <Text style={styles.viewDetailsLink}>See All →</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quickActionsRow}>
              {/* Action 1: Leave Mgmt */}
              <TouchableOpacity
                style={[styles.quickActionItem, { backgroundColor: isDark ? '#14532d20' : '#e6f4ea' }]}
                onPress={() => navigation.navigate('ApplyLeave')}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#22c55e20' }]}>
                  <Text style={{ fontSize: 20 }}>🌱</Text>
                </View>
                <Text style={[styles.quickActionLabel, { color: '#16a34a' }]}>Leave Mgmt</Text>
              </TouchableOpacity>

              {/* Action 2: Claims */}
              <TouchableOpacity
                style={[styles.quickActionItem, { backgroundColor: isDark ? '#1e3a8a20' : '#e0f2fe' }]}
                onPress={() => navigation.navigate('ExpenseReimbursements')}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#3b82f620' }]}>
                  <Text style={{ fontSize: 20 }}>📄</Text>
                </View>
                <Text style={[styles.quickActionLabel, { color: '#2563eb' }]}>Claims</Text>
              </TouchableOpacity>

              {/* Action 3: Team Directory */}
              <TouchableOpacity
                style={[styles.quickActionItem, { backgroundColor: isDark ? '#581c8720' : '#f3e8ff' }]}
                onPress={() => navigation.navigate('EmployeeDirectory')}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#a855f720' }]}>
                  <Text style={{ fontSize: 20 }}>👥</Text>
                </View>
                <Text style={[styles.quickActionLabel, { color: '#9333ea' }]}>Team Directory</Text>
              </TouchableOpacity>

              {/* Action 4: My Profile */}
              <TouchableOpacity
                style={[styles.quickActionItem, { backgroundColor: isDark ? '#83184320' : '#ffe4e6' }]}
                onPress={() => navigation.navigate('EmployeeDirectory')}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#f43f5e20' }]}>
                  <Text style={{ fontSize: 20 }}>👤</Text>
                </View>
                <Text style={[styles.quickActionLabel, { color: '#e11d48' }]}>My Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Workforce Insights Section */}
            <View style={[styles.contentCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
              <Text style={[styles.cardHeading, { color: isDark ? '#ffffff' : '#0f172a' }]}>Workforce Insights</Text>

              {/* Pill Tabs */}
              <View style={styles.pillTabsContainer}>
                <TouchableOpacity
                  style={[styles.pillTab, activeInsightTab === 'attendance' && styles.pillTabActive]}
                  onPress={() => setActiveInsightTab('attendance')}
                >
                  <Text style={[styles.pillTabText, activeInsightTab === 'attendance' && styles.pillTabTextActive]}>
                    Attendance Trend
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pillTab, activeInsightTab === 'departments' && styles.pillTabActive]}
                  onPress={() => setActiveInsightTab('departments')}
                >
                  <Text style={[styles.pillTabText, activeInsightTab === 'departments' && styles.pillTabTextActive]}>
                    Departments
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pillTab, activeInsightTab === 'diversity' && styles.pillTabActive]}
                  onPress={() => setActiveInsightTab('diversity')}
                >
                  <Text style={[styles.pillTabText, activeInsightTab === 'diversity' && styles.pillTabTextActive]}>
                    Diversity
                  </Text>
                </TouchableOpacity>
              </View>

              {activeInsightTab === 'attendance' && (
                <View style={styles.chartContainer}>
                  <View style={styles.chartLegendRow}>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
                      <Text style={styles.legendLabel}>Present</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                      <Text style={styles.legendLabel}>Late</Text>
                    </View>
                    <View style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                      <Text style={styles.legendLabel}>Absent</Text>
                    </View>
                  </View>

                  <View style={styles.verticalBarColumnsContainer}>
                    {attendanceTrend.map((item, idx) => (
                      <View key={idx} style={styles.barColumnWrapper}>
                        <Text style={styles.barTopPercentText}>{item.percentage}</Text>
                        <View style={styles.stackedBarTrack}>
                          <View style={{ flex: item.Present, backgroundColor: '#22c55e', width: '100%' }} />
                          <View style={{ flex: item.Late, backgroundColor: '#f59e0b', width: '100%' }} />
                          <View style={{ flex: item.Absent || 0.5, backgroundColor: '#ef4444', width: '100%' }} />
                        </View>
                        <Text style={styles.barBottomDayLabel}>{item.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {activeInsightTab === 'departments' && (
                <View style={{ paddingTop: 12 }}>
                  {deptDistribution.map((dept, idx) => (
                    <View key={idx} style={{ marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#ffffff' : '#0f172a' }}>{dept.name}</Text>
                        <Text style={{ fontSize: 12, color: '#64748b' }}>{dept.value} Employees</Text>
                      </View>
                      <View style={{ height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                        <View style={{ height: '100%', width: `${(dept.value / 50) * 100}%`, backgroundColor: '#2563eb', borderRadius: 4 }} />
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {activeInsightTab === 'diversity' && (
                <View style={{ flexDirection: 'row', gap: 12, paddingTop: 12 }}>
                  <View style={{ flex: 1, padding: 16, backgroundColor: '#e0f2fe', borderRadius: 14, alignItems: 'center' }}>
                    <Text style={{ fontSize: 24 }}>👨</Text>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: '#2563eb', marginTop: 6 }}>88 Staff</Text>
                    <Text style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Male Employees</Text>
                  </View>
                  <View style={{ flex: 1, padding: 16, backgroundColor: '#ffe4e6', borderRadius: 14, alignItems: 'center' }}>
                    <Text style={{ fontSize: 24 }}>👩</Text>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: '#e11d48', marginTop: 6 }}>60 Staff</Text>
                    <Text style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Female Employees</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Pending Approvals Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: isDark ? '#ffffff' : '#0f172a' }]}>Pending Approvals</Text>
              <TouchableOpacity onPress={() => navigation.navigate('LeaveApprovals')}>
                <Text style={styles.viewDetailsLink}>View All →</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.contentCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
              {/* Approval Tabs */}
              <View style={styles.pillTabsContainer}>
                <TouchableOpacity
                  style={[styles.pillTab, activeApprovalTab === 'leaves' && styles.pillTabActive]}
                  onPress={() => setActiveApprovalTab('leaves')}
                >
                  <Text style={[styles.pillTabText, activeApprovalTab === 'leaves' && styles.pillTabTextActive]}>
                    Leave Requests ({pendingLeaves.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.pillTab, activeApprovalTab === 'claims' && styles.pillTabActive]}
                  onPress={() => setActiveApprovalTab('claims')}
                >
                  <Text style={[styles.pillTabText, activeApprovalTab === 'claims' && styles.pillTabTextActive]}>
                    Travel Claims ({pendingClaims.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {activeApprovalTab === 'leaves' && (
                <View style={{ gap: 14, paddingTop: 6 }}>
                  {pendingLeaves.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: '#64748b', paddingVertical: 12 }}>
                      🎉 All leave approvals completed!
                    </Text>
                  ) : (
                    pendingLeaves.map(item => (
                      <View key={item.id} style={styles.approvalItemCard}>
                        <View style={styles.approvalItemTopRow}>
                          <View style={styles.approvalUserFlex}>
                            <View style={[styles.avatarInitialsCircle, { backgroundColor: '#dcfce7' }]}>
                              <Text style={{ color: '#15803d', fontWeight: '700', fontSize: 13 }}>
                                {item.employeeName.split(' ').map(n => n[0]).join('')}
                              </Text>
                            </View>
                            <View>
                              <Text style={styles.approvalUserName}>{item.employeeName}</Text>
                              <Text style={styles.approvalSubtitle}>
                                {item.type} • {item.startDate} – {item.endDate}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.statusPendingBadge}>
                            <Text style={styles.statusPendingText}>Pending</Text>
                          </View>
                        </View>

                        <Text style={styles.approvalDetailLine}>
                          📅 {item.days} {item.days === 1 ? 'day' : 'days'} • {item.reason}
                        </Text>

                        <View style={styles.approvalButtonsRow}>
                          <TouchableOpacity
                            style={styles.btnOutlineReject}
                            onPress={() => handleRejectLeave(item.id, item.employeeName)}
                          >
                            <Text style={styles.btnRejectText}>Reject</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.btnSolidApprove}
                            onPress={() => handleApproveLeave(item.id, item.employeeName)}
                          >
                            <Text style={styles.btnApproveText}>Approve</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}

              {activeApprovalTab === 'claims' && (
                <View style={{ gap: 14, paddingTop: 6 }}>
                  {pendingClaims.length === 0 ? (
                    <Text style={{ textAlign: 'center', color: '#64748b', paddingVertical: 12 }}>
                      🎉 All claim approvals completed!
                    </Text>
                  ) : (
                    pendingClaims.map(item => (
                      <View key={item.id} style={styles.approvalItemCard}>
                        <View style={styles.approvalItemTopRow}>
                          <View style={styles.approvalUserFlex}>
                            <View style={[styles.avatarInitialsCircle, { backgroundColor: '#f3e8ff' }]}>
                              <Text style={{ color: '#7e22ce', fontWeight: '700', fontSize: 13 }}>
                                {item.employeeName.split(' ').map(n => n[0]).join('')}
                              </Text>
                            </View>
                            <View>
                              <Text style={styles.approvalUserName}>{item.employeeName}</Text>
                              <Text style={styles.approvalSubtitle}>
                                {item.type} • ₹{item.amount.toLocaleString()}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.statusPendingBadge}>
                            <Text style={styles.statusPendingText}>Pending</Text>
                          </View>
                        </View>

                        <Text style={styles.approvalDetailLine}>
                          📄 Applied {item.date} • {item.reason}
                        </Text>

                        <View style={styles.approvalButtonsRow}>
                          <TouchableOpacity
                            style={styles.btnOutlineReject}
                            onPress={() => handleRejectClaim(item.id, item.employeeName)}
                          >
                            <Text style={styles.btnRejectText}>Reject</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.btnSolidApprove}
                            onPress={() => handleApproveClaim(item.id, item.employeeName, item.amount)}
                          >
                            <Text style={styles.btnApproveText}>Approve</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* Recent Activity Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: isDark ? '#ffffff' : '#0f172a' }]}>Recent Activity</Text>
              <TouchableOpacity onPress={() => navigation.navigate('MusterRoll')}>
                <Text style={styles.viewDetailsLink}>View All →</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.contentCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
              <View style={styles.recentActivityList}>
                {/* Item 1 */}
                <View style={styles.activityItemRow}>
                  <View style={[styles.activityIconCircle, { backgroundColor: '#dcfce7' }]}>
                    <Text style={{ color: '#16a34a', fontWeight: '800', fontSize: 14 }}>✓</Text>
                  </View>
                  <View style={styles.activityTextFlex}>
                    <Text style={[styles.activityTitleText, { color: isDark ? '#ffffff' : '#0f172a' }]}>Check-in Registered</Text>
                    <Text style={styles.activitySubtitleText}>John Doe • Attendance</Text>
                  </View>
                  <Text style={styles.activityTimestampText}>Today, 09:15 AM</Text>
                </View>

                <View style={styles.itemDivider} />

                {/* Item 2 */}
                <View style={styles.activityItemRow}>
                  <View style={[styles.activityIconCircle, { backgroundColor: '#e0f2fe' }]}>
                    <Text style={{ fontSize: 14 }}>📅</Text>
                  </View>
                  <View style={styles.activityTextFlex}>
                    <Text style={[styles.activityTitleText, { color: isDark ? '#ffffff' : '#0f172a' }]}>Casual Leave Approved</Text>
                    <Text style={styles.activitySubtitleText}>HR Admin • Leave Management</Text>
                  </View>
                  <Text style={styles.activityTimestampText}>Yesterday, 04:30 PM</Text>
                </View>

                <View style={styles.itemDivider} />

                {/* Item 3 */}
                <View style={styles.activityItemRow}>
                  <View style={[styles.activityIconCircle, { backgroundColor: '#f3e8ff' }]}>
                    <Text style={{ fontSize: 14 }}>📄</Text>
                  </View>
                  <View style={styles.activityTextFlex}>
                    <Text style={[styles.activityTitleText, { color: isDark ? '#ffffff' : '#0f172a' }]}>Expense Claim Processed</Text>
                    <Text style={styles.activitySubtitleText}>Finance Lead • Claims</Text>
                  </View>
                  <Text style={styles.activityTimestampText}>2 days ago</Text>
                </View>
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
    paddingBottom: 24,
  },
  topAppBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  hamburgerButton: {
    padding: 8,
  },
  hamburgerLine: {
    width: 20,
    height: 2.5,
    borderRadius: 2,
    marginVertical: 2,
  },
  brandTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogoBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoIcon: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
  },
  brandTitleText: {
    fontSize: 18,
    fontWeight: '800',
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  profileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileTextContainer: {
    flex: 1,
  },
  greetingLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 1,
  },
  userRoleText: {
    fontSize: 12,
    marginTop: 2,
  },
  dateBadgeContainer: {
    alignItems: 'flex-end',
  },
  dateDayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateFormattedText: {
    fontSize: 11,
    marginTop: 2,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '800',
  },
  viewDetailsLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    borderRadius: 18,
    padding: 14,
  },
  metricIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
  },
  metricTrendGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
    marginTop: 4,
  },
  metricSubOrange: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ea580c',
    marginTop: 4,
  },
  metricSubPurple: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9333ea',
    marginTop: 4,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  quickActionItem: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  contentCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  pillTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
  },
  pillTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  pillTabActive: {
    backgroundColor: '#2563eb',
  },
  pillTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  pillTabTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  chartContainer: {
    paddingTop: 4,
  },
  chartLegendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 14,
    marginBottom: 16,
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
  legendLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  verticalBarColumnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 140,
    paddingBottom: 4,
  },
  barColumnWrapper: {
    alignItems: 'center',
    width: 44,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTopPercentText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  stackedBarTrack: {
    width: 30,
    height: 90,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barBottomDayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 8,
  },
  approvalItemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
  },
  approvalItemTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  approvalUserFlex: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarInitialsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approvalUserName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  approvalSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  statusPendingBadge: {
    backgroundColor: '#ffedd5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPendingText: {
    color: '#c2410c',
    fontSize: 10,
    fontWeight: '700',
  },
  approvalDetailLine: {
    fontSize: 12,
    color: '#475569',
    marginTop: 8,
    marginBottom: 10,
  },
  approvalButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  btnOutlineReject: {
    borderWidth: 1.5,
    borderColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnRejectText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  btnSolidApprove: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnApproveText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  recentActivityList: {
    gap: 4,
  },
  activityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  activityIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityTextFlex: {
    flex: 1,
  },
  activityTitleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  activitySubtitleText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  activityTimestampText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
  },
});





