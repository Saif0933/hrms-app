import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLogout, useProfile } from '../api/hook/useAuth';
import { useTheme } from '../context/ThemeContext';
import { RootStackParamList } from '../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Menu'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.86, 350);

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

// Color palette config per module to match the target UI design
const getItemColorConfig = (id: string, isDark: boolean) => {
  switch (id) {
    case 'employees':
    case 'organization':
      return {
        iconColor: '#4F46E5',
        bgExpanded: isDark ? '#1E1B4B' : '#EEF2FF',
        activeSubBg: isDark ? '#312E81' : '#E0E7FF',
      };
    case 'attendance':
      return {
        iconColor: '#10B981',
        bgExpanded: isDark ? '#064E3B' : '#ECFDF5',
        activeSubBg: isDark ? '#065F46' : '#D1FAE5',
      };
    case 'leave':
      return {
        iconColor: '#F59E0B',
        bgExpanded: isDark ? '#451A03' : '#FFFBEB',
        activeSubBg: isDark ? '#78350F' : '#FEF3C7',
      };
    case 'payroll':
      return {
        iconColor: '#0D9488',
        bgExpanded: isDark ? '#134E4A' : '#F0FDFA',
        activeSubBg: isDark ? '#115E59' : '#E6FFFA',
      };
    case 'performance':
      return {
        iconColor: '#3B82F6',
        bgExpanded: isDark ? '#1E3A8A' : '#EFF6FF',
        activeSubBg: isDark ? '#1E40AF' : '#DBEAFE',
      };
    case 'engagement':
    case 'reports':
      return {
        iconColor: '#EC4899',
        bgExpanded: isDark ? '#831843' : '#FDF2F8',
        activeSubBg: isDark ? '#9D174D' : '#FCE7F3',
      };
    default:
      return {
        iconColor: '#64748B',
        bgExpanded: isDark ? '#1E293B' : '#F8FAFC',
        activeSubBg: isDark ? '#334155' : '#E2E8F0',
      };
  }
};

export const MenuScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark, toggleTheme } = useTheme();
  const logout = useLogout();
  const { data: profileResponse } = useProfile();

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedSubKey, setSelectedSubKey] = useState<string | null>('payroll_payslips');
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
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.poly(4)),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.poly(4)),
        useNativeDriver: true,
      }),
    ]).start();

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
        duration: 180,
        easing: Easing.in(Easing.poly(3)),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.poly(3)),
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
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    {
      id: 'employees',
      label: 'Employee Management',
      icon: '👥',
      subItems: [
        { id: 'directory', label: 'Employee Directory' },
        { id: 'master', label: 'Employee Master' },
        { id: 'orgchart', label: 'Organization Chart' },
        { id: 'exit', label: 'Exit & Settlement' },
        { id: 'resignation', label: 'Resignation Archive' },
        { id: 'bulk', label: 'Bulk Imports & Exports' },
        { id: 'roles', label: 'Role & Permissions' },
        { id: 'assignrole', label: 'Assign Role to Employee' },
        { id: 'departments', label: 'Departments' },
      ],
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: '📅',
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
      icon: '✈️',
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
      label: 'Payroll',
      icon: '💳',
      subItems: [
        { id: 'payslips', label: 'Payslips' },
        { id: 'process', label: 'Salary Structure' },
        { id: 'revisions', label: 'Allowances' },
        { id: 'loans', label: 'Deductions' },
        { id: 'investment', label: 'Investment Declarations' },
        { id: 'reports', label: 'Payroll Reports & ECR' },
      ],
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: '⭐',
      subItems: [
        { id: 'goals', label: 'KRA & Goal Setting' },
        { id: 'feedback', label: '360° Feedback' },
        { id: 'bellcurve', label: 'Bell Curve Analytics' },
      ],
    },
    {
      id: 'engagement',
      label: 'Reports',
      icon: '📊',
      subItems: [
        { id: 'feed', label: 'Social Feed & Posts' },
        { id: 'mood', label: 'Mood Analysis' },
        { id: 'surveys', label: 'Surveys & Feedback' },
      ],
    },
    {
      id: 'claims',
      label: 'Travel & Claims',
      icon: '🛫',
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
      label: 'Settings',
      icon: '⚙️',
      subItems: [
        { id: 'plans', label: 'Plans & Pricing' },
        { id: 'compare', label: 'Feature Comparison Matrix' },
        { id: 'manage', label: 'Manage Subscription & Invoices' },
      ],
    },
  ];

  const toggleDropdown = (id: string) => {
    setOpenDropdown(prev => (prev === id ? null : id));
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
        case 'assignrole':
          navigation.navigate('AssignRole');
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
    if (subItemId) {
      setSelectedSubKey(`${itemId}_${subItemId}`);
    }
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
            backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
            borderRightColor: isDark ? '#1E293B' : '#E2E8F0',
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header section matching exact reference image */}
          <View style={styles.brandHeaderContainer}>
            <View style={styles.brandLeftRow}>
              <View style={[styles.brandLogoBox, { backgroundColor: isDark ? '#312E81' : '#EEF2FF' }]}>
                <Text style={styles.brandLogoIcon}>👥</Text>
              </View>
              <View style={styles.brandTextContainer}>
                <Text style={[styles.brandTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>HRMS</Text>
                <Text style={[styles.brandSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]} numberOfLines={2}>
                  Human Resource Management System
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.collapseBtn}
              onPress={() => handleClose()}
              activeOpacity={0.7}
            >
              <Text style={[styles.collapseIconText, { color: isDark ? '#94A3B8' : '#94A3B8' }]}>«</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Search Bar & User / Theme Bar */}
          <View style={[styles.userControlsBar, { borderBottomColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
            <View style={[styles.searchBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: isDark ? '#334155' : '#E2E8F0' }]}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={[styles.searchInput, { color: isDark ? '#F8FAFC' : '#0F172A' }]}
                placeholder="Quick search..."
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={{ color: '#94A3B8', fontSize: 13, paddingHorizontal: 4 }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.themeBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
              onPress={toggleTheme}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 13 }}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>

          {/* Accordion Categories List with exact Tree Line UI */}
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {filteredMenuItems.map(item => {
              const isOpen = openDropdown === item.id || searchQuery.trim().length > 0;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const colorConfig = getItemColorConfig(item.id, isDark);

              return (
                <View key={item.id} style={styles.menuItemWrapper}>
                  {/* Top Level Menu Button */}
                  <TouchableOpacity
                    style={[
                      styles.menuHeaderButton,
                      isOpen && {
                        backgroundColor: colorConfig.bgExpanded,
                        borderRadius: 12,
                      },
                    ]}
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
                      <Text style={[styles.menuIcon, { color: isOpen ? colorConfig.iconColor : colorConfig.iconColor }]}>
                        {item.icon}
                      </Text>
                      <Text
                        style={[
                          styles.menuLabel,
                          {
                            color: isOpen
                              ? colorConfig.iconColor
                              : (isDark ? '#E2E8F0' : '#1E293B'),
                            fontWeight: isOpen ? '700' : '600',
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>

                    {hasSubItems && (
                      <Text
                        style={[
                          styles.dropdownArrow,
                          { color: isOpen ? colorConfig.iconColor : '#94A3B8' },
                        ]}
                      >
                        {isOpen ? '∨' : '›'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* Sub-menu Accordion with Vertical Left Accent Tree Line */}
                  {hasSubItems && isOpen && (
                    <View style={styles.subTreeContainer}>
                      {/* Vertical Accent Tree Line */}
                      <View
                        style={[
                          styles.verticalTreeLine,
                          { backgroundColor: colorConfig.iconColor },
                        ]}
                      />

                      <View style={styles.subItemsList}>
                        {item.subItems?.map(sub => {
                          const subKey = `${item.id}_${sub.id}`;
                          const isSelected = selectedSubKey === subKey;

                          return (
                            <TouchableOpacity
                              key={sub.id}
                              style={[
                                styles.subMenuItemButton,
                                isSelected && {
                                  backgroundColor: colorConfig.activeSubBg,
                                  borderRadius: 8,
                                },
                              ]}
                              onPress={() => handleSelectMenuItem(item.id, sub.id)}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.bulletDot,
                                  { color: isSelected ? colorConfig.iconColor : '#94A3B8' },
                                ]}
                              >
                                •
                              </Text>
                              <Text
                                style={[
                                  styles.subMenuLabel,
                                  {
                                    color: isSelected
                                      ? colorConfig.iconColor
                                      : (isDark ? '#CBD5E1' : '#475569'),
                                    fontWeight: isSelected ? '700' : '500',
                                  },
                                ]}
                              >
                                {sub.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Logout Button */}
            <TouchableOpacity
              style={[
                styles.logoutButton,
                {
                  backgroundColor: isDark ? '#450a0a40' : '#FEF2F2',
                  borderColor: isDark ? '#991b1b80' : '#FECACA',
                },
              ]}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={styles.logoutText}>Sign Out Account</Text>
            </TouchableOpacity>

            {/* Footer info */}
            <View style={[styles.footerContainer, { borderTopColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <Text style={[styles.footerBrand, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Symbosys HRMS v4.2
              </Text>
              <Text style={[styles.footerServer, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                Server: Cloud Secure Enterprise
              </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sidebarContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 8, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    borderRightWidth: 1,
  },
  safeArea: {
    flex: 1,
  },
  /* Brand Header styling matching reference screenshot */
  brandHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },
  brandLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandLogoBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  brandLogoIcon: {
    fontSize: 22,
  },
  brandTextContainer: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  brandSubtitle: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  collapseBtn: {
    padding: 6,
    marginLeft: 8,
  },
  collapseIconText: {
    fontSize: 22,
    fontWeight: '700',
  },
  /* User Controls & Search */
  userControlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  themeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 36,
  },
  menuItemWrapper: {
    marginBottom: 4,
  },
  menuHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  menuHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 14,
    width: 22,
    textAlign: 'center',
  },
  menuLabel: {
    fontSize: 15,
    letterSpacing: -0.1,
  },
  dropdownArrow: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  /* Sub-menu Tree Accent Line Layout */
  subTreeContainer: {
    position: 'relative',
    marginLeft: 26,
    paddingTop: 2,
    paddingBottom: 6,
  },
  verticalTreeLine: {
    position: 'absolute',
    left: 4,
    top: 6,
    bottom: 10,
    width: 2,
    borderRadius: 1,
  },
  subItemsList: {
    marginLeft: 14,
  },
  subMenuItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginVertical: 1,
  },
  bulletDot: {
    fontSize: 16,
    marginRight: 10,
    lineHeight: 18,
  },
  subMenuLabel: {
    fontSize: 13.5,
    letterSpacing: -0.1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 18,
    marginBottom: 10,
  },
  logoutIcon: {
    fontSize: 15,
    marginRight: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  footerContainer: {
    marginTop: 10,
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
});
