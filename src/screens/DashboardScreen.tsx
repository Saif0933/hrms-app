import React from 'react';
import {
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
import { useLogout } from '../api/hook/useAuth';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark, toggleTheme } = useTheme();
  const logout = useLogout();

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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
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
            <View>
              <Text style={[styles.greetingText, { color: colors.textSecondary }]}>Welcome Back 👋</Text>
              <Text style={[styles.userName, { color: colors.textPrimary }]}>John Doe</Text>
              <Text style={[styles.userRole, { color: colors.textMuted }]}>Software Engineer • HRMS Portal</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
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
              <Text style={styles.avatarText}>JD</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Overview</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.statAttendanceBg }]}>
            <Text style={[styles.statValue, { color: colors.statAttendanceText }]}>96%</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Attendance</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.statLeaveBg }]}>
            <Text style={[styles.statValue, { color: colors.statLeaveText }]}>14</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Leave Balance</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.statRequestsBg }]}>
            <Text style={[styles.statValue, { color: colors.statRequestsText }]}>2</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending Requests</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.statHoursBg }]}>
            <Text style={[styles.statValue, { color: colors.statHoursText }]}>8.5h</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Hours/Day</Text>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.accent }]} activeOpacity={0.85}>
            <Text style={styles.actionButtonText}>Mark Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.secondaryActionButton,
              {
                backgroundColor: colors.buttonSecondaryBg,
                borderColor: colors.buttonSecondaryBorder,
              },
            ]}
            activeOpacity={0.85}
          >
            <Text style={[styles.actionButtonText, { color: colors.buttonSecondaryText }]}>Apply Leave</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
        <View
          style={[
            styles.activityCard,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.activityItem}>
            <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
            <View style={styles.activityContent}>
              <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>Check-in Registered</Text>
              <Text style={[styles.activityTime, { color: colors.textMuted }]}>Today, 09:15 AM</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.activityItem}>
            <View style={[styles.statusDot, { backgroundColor: '#3b82f6' }]} />
            <View style={styles.activityContent}>
              <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>Casual Leave Approved</Text>
              <Text style={[styles.activityTime, { color: colors.textMuted }]}>Yesterday, 04:30 PM</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  menuIconButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  hamburgerLine: {
    width: 20,
    height: 2.5,
    borderRadius: 2,
    marginVertical: 2,
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 2,
  },
  userRole: {
    fontSize: 13,
    marginTop: 2,
  },
  profileBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 14,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 14,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryActionButton: {
    borderWidth: 1.5,
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  activityCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  activityTime: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
});

