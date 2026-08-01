import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  Pressable,
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
import { useLogout, useProfile } from '../api/hook/useAuth';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../navigation/stack.tsx';
import { SafeAreaView } from 'react-native-safe-area-context';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Menu'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.84, 340);

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
  const logout = useLogout();
  const { data: profileResponse } = useProfile();

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Animated values for sidebar sliding and backdrop fade
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isClosingRef = useRef(false);

  // User Profile Data
  const userName = profileResponse?.data?.user?.name || 'John Doe';
  const userRole = profileResponse?.data?.user?.role || 'Software Engineer • HRMS Portal';
  const userInitials = userName
    ? userName
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'JD';

  useEffect(() => {
    // Slide in from left & fade in backdrop overlay
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // Android hardware back button handler
    const onBackPress = () => {
      handleClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, []);

  const handleClose = (onFinished?: () => void) => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.goBack();
      if (onFinished) {
        onFinished();
      }
    });
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          handleClose(async () => {
            await logout();
            navigation.replace('Login');
          });
        },
      },
    ]);
  };

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
    {
      id: 'documents',
      label: 'Document Vault',
      icon: '📁',
      subItems: [
        { id: 'vault', label: 'Document Vault & Repository' },
        { id: 'upload', label: 'Upload & Manage Documents' },
        { id: 'compliance', label: 'Document Expiry & Compliance' },
      ],
    },
    {
      id: 'assets',
      label: 'Asset Management',
      icon: '💻',
      subItems: [
        { id: 'inventory', label: 'Company Asset Inventory' },
        { id: 'allocation', label: 'Employee Asset Allocation' },
        { id: 'register', label: 'Register New Asset' },
      ],
    },
    {
      id: 'letters',
      label: 'Letter Generator',
      icon: '✉️',
      subItems: [
        { id: 'generate', label: 'Generate Official Letter' },
        { id: 'archive', label: 'Issued Letters Archive' },
        { id: 'templates', label: 'Corporate Letter Templates' },
      ],
    },
    {
      id: 'helpdesk',
      label: 'HR Help Desk',
      icon: '🎧',
      subItems: [
        { id: 'tickets', label: 'Support Tickets Queue' },
        { id: 'raise', label: 'Raise Support Ticket' },
        { id: 'sla', label: 'Help Desk SLA & Analytics' },
      ],
    },
    {
      id: 'subscription',
      label: 'Subscription & Plans',
      icon: '🌟',
      subItems: [
        { id: 'plans', label: 'Plans & Pricing' },
        { id: 'compare', label: 'Feature Comparison Matrix' },
        { id: 'manage', label: 'Manage Subscription & Invoices' },
      ],
    },
  ];

  const toggleDropdown = (id: string) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const navigateToRoute = (itemId: string, subItemId?: string) => {
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

    if (itemId === 'attendance') {
      switch (subItemId) {
        case 'punch':
          navigation.navigate('GpsSelfiePunch');
          break;
        case 'roster':
          navigation.navigate('ShiftRoster');
          break;
        case 'regularize':
          navigation.navigate('AttendanceRegularization');
          break;
        case 'muster':
          navigation.navigate('MusterRoll');
          break;
        case 'reports':
          navigation.navigate('AttendanceReports');
          break;
        case 'geofence':
          navigation.navigate('GeofencingConfig');
          break;
        default:
          navigation.navigate('GpsSelfiePunch');
          break;
      }
    }

    if (itemId === 'leave') {
      switch (subItemId) {
        case 'apply':
          navigation.navigate('ApplyLeave');
          break;
        case 'approvals':
          navigation.navigate('LeaveApprovals');
          break;
        case 'calendar':
          navigation.navigate('LeaveCalendar');
          break;
        case 'policies':
          navigation.navigate('LeavePolicies');
          break;
        case 'admin':
          navigation.navigate('LeaveConfigurations');
          break;
        default:
          navigation.navigate('ApplyLeave');
          break;
      }
    }

    if (itemId === 'payroll') {
      switch (subItemId) {
        case 'process':
          navigation.navigate('SalaryProcessing');
          break;
        case 'revisions':
          navigation.navigate('SalaryRevisions');
          break;
        case 'loans':
          navigation.navigate('LoansAdvances');
          break;
        case 'investment':
          navigation.navigate('InvestmentDeclarations');
          break;
        case 'payslips':
          navigation.navigate('PayslipTemplates');
          break;
        case 'reports':
          navigation.navigate('PayrollReports');
          break;
        default:
          navigation.navigate('SalaryProcessing');
          break;
      }
    }

    if (itemId === 'performance') {
      switch (subItemId) {
        case 'goals':
          navigation.navigate('KraGoalSetting');
          break;
        case 'feedback':
          navigation.navigate('Feedback360');
          break;
        case 'bellcurve':
          navigation.navigate('BellCurveAnalytics');
          break;
        default:
          navigation.navigate('KraGoalSetting');
          break;
      }
    }

    if (itemId === 'engagement') {
      switch (subItemId) {
        case 'feed':
          navigation.navigate('SocialFeed');
          break;
        case 'mood':
          navigation.navigate('MoodAnalysis');
          break;
        case 'surveys':
          navigation.navigate('SurveysFeedback');
          break;
        default:
          navigation.navigate('SocialFeed');
          break;
      }
    }

    if (itemId === 'claims') {
      switch (subItemId) {
        case 'apply-claim':
          navigation.navigate('NewTravelRequest');
          break;
        case 'my-claims':
          navigation.navigate('ExpenseReimbursements');
          break;
        case 'approvals':
          navigation.navigate('ClaimApprovals');
          break;
        default:
          navigation.navigate('NewTravelRequest');
          break;
      }
    }

    if (itemId === 'timesheets') {
      switch (subItemId) {
        case 'entry':
          navigation.navigate('TimesheetEntry');
          break;
        case 'projects':
          navigation.navigate('ClientsProjects');
          break;
        default:
          navigation.navigate('TimesheetEntry');
          break;
      }
    }

    if (itemId === 'recruitment') {
      switch (subItemId) {
        case 'jobs':
          navigation.navigate('JobRequisitions');
          break;
        case 'candidates':
          navigation.navigate('CandidatePipeline');
          break;
        case 'onboarding':
          navigation.navigate('PreOnboardingChecklist');
          break;
        default:
          navigation.navigate('JobRequisitions');
          break;
      }
    }

    if (itemId === 'documents') {
      switch (subItemId) {
        case 'vault':
          navigation.navigate('DocumentVault');
          break;
        case 'upload':
          navigation.navigate('UploadDocument');
          break;
        case 'compliance':
          navigation.navigate('DocumentCompliance');
          break;
        default:
          navigation.navigate('DocumentVault');
          break;
      }
    }

    if (itemId === 'assets') {
      switch (subItemId) {
        case 'inventory':
          navigation.navigate('AssetInventory');
          break;
        case 'allocation':
          navigation.navigate('AssetAllocation');
          break;
        case 'register':
          navigation.navigate('RegisterAsset');
          break;
        default:
          navigation.navigate('AssetInventory');
          break;
      }
    }

    if (itemId === 'letters') {
      switch (subItemId) {
        case 'generate':
          navigation.navigate('GenerateLetter');
          break;
        case 'archive':
          navigation.navigate('IssuedLettersArchive');
          break;
        case 'templates':
          navigation.navigate('LetterTemplates');
          break;
        default:
          navigation.navigate('GenerateLetter');
          break;
      }
    }

    if (itemId === 'helpdesk') {
      switch (subItemId) {
        case 'tickets':
          navigation.navigate('SupportTickets');
          break;
        case 'raise':
          navigation.navigate('RaiseTicket');
          break;
        case 'sla':
          navigation.navigate('HelpdeskSlaAnalytics');
          break;
        default:
          navigation.navigate('SupportTickets');
          break;
      }
    }

    if (itemId === 'subscription') {
      switch (subItemId) {
        case 'plans':
          navigation.navigate('PlansPricing');
          break;
        case 'compare':
          navigation.navigate('PlanComparison');
          break;
        case 'manage':
          navigation.navigate('ManageSubscription');
          break;
        default:
          navigation.navigate('PlansPricing');
          break;
      }
    }
  };

  const handleSelectMenuItem = (itemId: string, subItemId?: string) => {
    handleClose(() => {
      navigateToRoute(itemId, subItemId);
    });
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchesTitle = item.label.toLowerCase().includes(query);
    const matchesSub = item.subItems?.some(sub => sub.label.toLowerCase().includes(query));
    return matchesTitle || matchesSub;
  });

  return (
    <View style={styles.overlayRoot}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

      {/* Dark Semi-transparent Backdrop Overlay */}
      <Pressable style={StyleSheet.absoluteFill} onPress={() => handleClose()}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: fadeAnim,
            },
          ]}
        />
      </Pressable>

      {/* Sliding Sidebar Drawer Panel */}
      <Animated.View
        style={[
          styles.sidebarContainer,
          {
            width: SIDEBAR_WIDTH,
            backgroundColor: colors.background,
            borderRightColor: colors.cardBorder,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Drawer Profile Header */}
          <View style={[styles.sidebarHeader, { backgroundColor: isDark ? '#1e293b' : '#e0f2fe', borderBottomColor: colors.cardBorder }]}>
            {/* Sheet Drag Handle Indicator */}
            <View style={styles.sheetHandleContainer}>
              <View style={[styles.sheetHandleBar, { backgroundColor: isDark ? '#475569' : '#cbd5e1' }]} />
            </View>

            <View style={styles.profileRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{userInitials}</Text>
                <View style={styles.onlineBadge} />
              </View>

              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: isDark ? '#ffffff' : '#0f172a' }]} numberOfLines={1}>
                  {userName}
                </Text>
                <Text style={[styles.profileRole, { color: isDark ? '#94a3b8' : '#475569' }]} numberOfLines={1}>
                  {userRole}
                </Text>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusPillText}>Active • HRMS Portal</Text>
                </View>
              </View>

              {/* Action Buttons: Theme Switcher & Close Drawer */}
              <View style={styles.headerActionBtns}>
                <TouchableOpacity
                  style={[styles.iconBtn, { backgroundColor: isDark ? '#334155' : '#ffffff' }]}
                  onPress={toggleTheme}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 14 }}>{isDark ? '☀️' : '🌙'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.iconBtn, { backgroundColor: isDark ? '#334155' : '#ffffff' }]}
                  onPress={() => handleClose()}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.closeIconText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Module Search Section */}
          <View style={[styles.searchSection, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
            <View style={[styles.searchBox, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={[styles.searchInput, { color: colors.inputText }]}
                placeholder="Search modules..."
                placeholderTextColor={colors.inputPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={{ color: colors.textMuted, fontSize: 14, paddingHorizontal: 6 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Accordion Categories List */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {filteredMenuItems.map(item => {
              const isOpen = openDropdown === item.id || searchQuery.trim().length > 0;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const subCount = item.subItems ? item.subItems.length : 0;

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
                      if (hasSubItems && !searchQuery.trim()) {
                        toggleDropdown(item.id);
                      } else {
                        handleSelectMenuItem(item.id);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuHeaderLeft}>
                      <View style={[styles.menuIconBox, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}>
                        <Text style={styles.menuIcon}>{item.icon}</Text>
                      </View>
                      <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                    </View>

                    {hasSubItems && (
                      <View style={styles.menuHeaderRight}>
                        <View style={[styles.badgePill, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]}>
                          <Text style={[styles.badgeText, { color: isDark ? '#cbd5e1' : '#475569' }]}>{subCount}</Text>
                        </View>
                        <Text style={[styles.dropdownArrow, { color: colors.textSecondary }]}>
                          {isOpen ? '▲' : '▼'}
                        </Text>
                      </View>
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

            {/* Logout Button */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={styles.logoutText}>Sign Out Account</Text>
            </TouchableOpacity>

            {/* Footer info */}
            <View style={[styles.footerContainer, { borderTopColor: colors.divider }]}>
              <Text style={[styles.footerBrand, { color: colors.footerText }]}>Symbosys HRMS v4.2</Text>
              <Text style={[styles.footerServer, { color: colors.textMuted }]}>Server: Cloud Secure Enterprise</Text>
              <View style={styles.syncStatus}>
                <View style={styles.syncDot} />
                <Text style={styles.syncText}>Live Sync Active</Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sidebarContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    elevation: 25,
    shadowColor: '#000000',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    borderRightWidth: 1.5,
  },
  safeArea: {
    flex: 1,
  },
  sidebarHeader: {
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  sheetHandleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 4,
  },
  sheetHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 10,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileInfo: {
    flex: 1,
    marginRight: 6,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '800',
  },
  profileRole: {
    fontSize: 11,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 4,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#22c55e',
  },
  headerActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconText: {
    fontSize: 14,
    fontWeight: '700',
  },
  searchSection: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 2,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 30,
  },
  menuCard: {
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  menuHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  menuHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  menuIcon: {
    fontSize: 15,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  menuHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dropdownArrow: {
    fontSize: 9,
    marginLeft: 2,
  },
  subMenuContainer: {
    paddingVertical: 4,
    paddingHorizontal: 14,
    borderTopWidth: 1,
  },
  subMenuItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  subMenuDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 10,
  },
  subMenuLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef444415',
    borderWidth: 1,
    borderColor: '#ef444440',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  logoutIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },
  footerContainer: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  footerBrand: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerServer: {
    fontSize: 10,
    marginTop: 2,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 5,
  },
  syncText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#22c55e',
    textTransform: 'uppercase',
  },
});
