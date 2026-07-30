import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Menu'>;

interface SubMenuItem {
  id: string;
  label: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  subItems?: SubMenuItem[];
}

export const MenuScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark, toggleTheme } = useTheme();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    {
      id: 'employees',
      label: 'Employee Center',
      icon: '👥',
      subItems: [
        { id: 'directory', label: 'Employee Directory' },
        { id: 'master', label: 'Employee Master' },
        { id: 'idcard', label: 'ID Card Generator' },
        { id: 'orgchart', label: 'Organization Chart' },
        { id: 'exit', label: 'Exit & Settlement' },
        { id: 'resignation', label: 'Resignation Archive' },
        { id: 'bulk', label: 'Bulk Imports & Exports' },
        { id: 'roles', label: 'Role & Permissions' },
        { id: 'departments', label: 'Departments' },
      ],
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: '⏰',
      subItems: [
        { id: 'punch', label: 'GPS / Selfie Punch' },
        { id: 'roster', label: 'Shift & Roster' },
        { id: 'regularize', label: 'Regularization' },
        { id: 'muster', label: 'Muster Roll / Calendar' },
        { id: 'reports', label: 'Attendance Reports' },
        { id: 'geofence', label: 'Geofencing Config' },
      ],
    },
    {
      id: 'leave',
      label: 'Leave Management',
      icon: '📅',
      subItems: [
        { id: 'apply', label: 'Apply Leave' },
        { id: 'approvals', label: 'Leave Approvals' },
        { id: 'calendar', label: 'Leave Calendar' },
        { id: 'policies', label: 'Leave Policies' },
        { id: 'admin', label: 'Leave Configurations' },
      ],
    },
    {
      id: 'payroll',
      label: 'Payroll Processing',
      icon: '💳',
      subItems: [
        { id: 'process', label: 'Salary Processing' },
        { id: 'revisions', label: 'Salary Structure & Revisions' },
        { id: 'loans', label: 'Loans & Advances' },
        { id: 'investment', label: 'Investment Declarations' },
        { id: 'payslips', label: 'Payslip Templates' },
        { id: 'reports', label: 'Payroll Reports & ECR' },
      ],
    },
    {
      id: 'performance',
      label: 'Performance (PMS)',
      icon: '🏆',
      subItems: [
        { id: 'goals', label: 'KRA & Goal Setting' },
        { id: 'feedback', label: '360° Feedback' },
        { id: 'bellcurve', label: 'Bell Curve Analytics' },
      ],
    },
    {
      id: 'engagement',
      label: 'Engagement & Surveys',
      icon: '❤️',
      subItems: [
        { id: 'feed', label: 'Social Feed & Posts' },
        { id: 'mood', label: 'Mood Analysis' },
        { id: 'surveys', label: 'Surveys & Feedback' },
      ],
    },
    {
      id: 'claims',
      label: 'Travel & Claims',
      icon: '✈️',
      subItems: [
        { id: 'apply-claim', label: 'New Travel Request' },
        { id: 'my-claims', label: 'Expense Reimbursements' },
        { id: 'approvals', label: 'Claim Approvals' },
      ],
    },
    {
      id: 'timesheets',
      label: 'Timesheets',
      icon: '📋',
      subItems: [
        { id: 'entry', label: 'Timesheet Entry' },
        { id: 'projects', label: 'Clients & Projects' },
      ],
    },
    {
      id: 'recruitment',
      label: 'Recruitment & ATS',
      icon: '💼',
      subItems: [
        { id: 'jobs', label: 'Job Requisitions' },
        { id: 'candidates', label: 'Candidate Pipeline' },
        { id: 'onboarding', label: 'Pre-Onboarding Checklist' },
      ],
    },
    { id: 'documents', label: 'Document Vault', icon: '📁' },
    { id: 'assets', label: 'Asset Management', icon: '💻' },
    { id: 'letters', label: 'Letter Generator', icon: '✉️' },
    { id: 'helpdesk', label: 'HR Help Desk', icon: '🎧' },
    { id: 'subscription', label: 'Subscription & Plans', icon: '🌟' },
  ];

  const toggleDropdown = (id: string) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const handleSelectMenuItem = (itemId: string, subItemId?: string) => {
    if (itemId === 'dashboard') {
      navigation.navigate('Dashboard');
      return;
    }

    if (itemId === 'employees') {
      switch (subItemId) {
        case 'directory':
          navigation.navigate('EmployeeDirectory');
          break;
        case 'master':
          navigation.navigate('EmployeeMaster', {});
          break;
        case 'idcard':
          navigation.navigate('IdCardGenerator', {});
          break;
        case 'orgchart':
          navigation.navigate('OrgChart');
          break;
        case 'exit':
          navigation.navigate('ExitSettlement', {});
          break;
        case 'resignation':
          navigation.navigate('ResignationArchive');
          break;
        case 'bulk':
          navigation.navigate('BulkImports');
          break;
        case 'roles':
          navigation.navigate('RolePermissions');
          break;
        case 'departments':
          navigation.navigate('Departments');
          break;
        default:
          navigation.navigate('EmployeeDirectory');
          break;
      }
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchesTitle = item.label.toLowerCase().includes(query);
    const matchesSub = item.subItems?.some(sub => sub.label.toLowerCase().includes(query));
    return matchesTitle || matchesSub;
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.headerBackground, borderBottomColor: colors.headerBorder }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.cardBackground }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={[styles.backButtonIcon, { color: colors.textPrimary }]}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Navigation Menu</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Symbosys HRMS Portal</Text>
        </View>
        <TouchableOpacity
          style={[styles.themeToggleButton, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
          onPress={toggleTheme}
          activeOpacity={0.8}
        >
          <Text style={styles.themeToggleIcon}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.inputText,
            },
          ]}
          placeholder="Search modules..."
          placeholderTextColor={colors.inputPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filteredMenuItems.map(item => {
          const isOpen = openDropdown === item.id || searchQuery.trim().length > 0;
          const hasSubItems = item.subItems && item.subItems.length > 0;

          return (
            <View
              key={item.id}
              style={[
                styles.menuCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.menuHeaderButton}
                onPress={() => {
                  if (hasSubItems) {
                    toggleDropdown(item.id);
                  } else {
                    handleSelectMenuItem(item.id);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.menuHeaderLeft}>
                  <Text style={styles.menuIcon}>{item.icon}</Text>
                  <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                </View>

                {hasSubItems && (
                  <Text style={[styles.dropdownArrow, { color: colors.textSecondary }]}>
                    {isOpen ? '▲' : '▼'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Sub-menu accordion */}
              {hasSubItems && isOpen && (
                <View style={[styles.subMenuContainer, { backgroundColor: colors.subItemBg, borderTopColor: colors.subItemBorder }]}>
                  {item.subItems?.map(sub => (
                    <TouchableOpacity
                      key={sub.id}
                      style={styles.subMenuItemButton}
                      onPress={() => handleSelectMenuItem(item.id, sub.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.subMenuDot, { backgroundColor: colors.accent }]} />
                      <Text style={[styles.subMenuLabel, { color: colors.subItemText }]}>{sub.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* Footer info */}
        <View style={[styles.footerContainer, { borderTopColor: colors.divider }]}>
          <Text style={[styles.footerBrand, { color: colors.footerText }]}>FactoCorp HRMS v4.2</Text>
          <Text style={[styles.footerServer, { color: colors.textMuted }]}>Server: Cloud Secure</Text>
          <View style={styles.syncStatus}>
            <View style={styles.syncDot} />
            <Text style={styles.syncText}>Live Sync Active</Text>
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
  backButtonIcon: {
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
  themeToggleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeToggleIcon: {
    fontSize: 16,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  menuCard: {
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
  },
  menuHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  menuHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  dropdownArrow: {
    fontSize: 10,
    marginLeft: 8,
  },
  subMenuContainer: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderTopWidth: 1,
  },
  subMenuItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  subMenuDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 12,
  },
  subMenuLabel: {
    fontSize: 13,
    fontWeight: '400',
  },
  footerContainer: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  footerBrand: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerServer: {
    fontSize: 11,
    marginTop: 2,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  syncText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#22c55e',
    textTransform: 'uppercase',
  },
});

