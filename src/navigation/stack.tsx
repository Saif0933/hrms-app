import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { DashboardScreen } from '../screens/DashboardScreen';
import { MenuScreen } from '../screens/MenuScreen';

// Auth Screens
import { LoginScreen } from '../screens/login/LoginScreen';
import { RegisterScreen } from '../screens/login/RegisterScreen';

// Employee Screens
import { EmployeeDirectoryScreen } from '../screens/employee/EmployeeDirectoryScreen';
import { EmployeeMasterScreen } from '../screens/employee/EmployeeMasterScreen';
import { IdCardGeneratorScreen } from '../screens/employee/IdCardGeneratorScreen';
import { OrgChartScreen } from '../screens/employee/OrgChartScreen';
import { ExitSettlementScreen } from '../screens/employee/ExitSettlementScreen';
import { ResignationArchiveScreen } from '../screens/employee/ResignationArchiveScreen';
import { BulkImportsScreen } from '../screens/employee/BulkImportsScreen';
import { RolePermissionsScreen } from '../screens/employee/RolePermissionsScreen';
import { DepartmentsScreen } from '../screens/employee/DepartmentsScreen';

// Attendance Screens
import { GpsSelfiePunchScreen } from '../screens/attendance/GpsSelfiePunchScreen';
import { ShiftRosterScreen } from '../screens/attendance/ShiftRosterScreen';
import { AttendanceRegularizationScreen } from '../screens/attendance/AttendanceRegularizationScreen';
import { MusterRollScreen } from '../screens/attendance/MusterRollScreen';
import { AttendanceReportsScreen } from '../screens/attendance/AttendanceReportsScreen';
import { GeofencingConfigScreen } from '../screens/attendance/GeofencingConfigScreen';

// Leave Screens
import { ApplyLeaveScreen } from '../screens/leave/ApplyLeaveScreen';
import { LeaveApprovalsScreen } from '../screens/leave/LeaveApprovalsScreen';
import { LeaveCalendarScreen } from '../screens/leave/LeaveCalendarScreen';
import { LeavePoliciesScreen } from '../screens/leave/LeavePoliciesScreen';
import { LeaveConfigurationsScreen } from '../screens/leave/LeaveConfigurationsScreen';

// Payroll Screens
import { SalaryProcessingScreen } from '../screens/payroll/SalaryProcessingScreen';
import { SalaryRevisionsScreen } from '../screens/payroll/SalaryRevisionsScreen';
import { LoansAdvancesScreen } from '../screens/payroll/LoansAdvancesScreen';
import { InvestmentDeclarationsScreen } from '../screens/payroll/InvestmentDeclarationsScreen';
import { PayslipTemplatesScreen } from '../screens/payroll/PayslipTemplatesScreen';
import { PayrollReportsScreen } from '../screens/payroll/PayrollReportsScreen';

// Performance Screens
import { KraGoalSettingScreen } from '../screens/performance/KraGoalSettingScreen';
import { Feedback360Screen } from '../screens/performance/Feedback360Screen';
import { BellCurveAnalyticsScreen } from '../screens/performance/BellCurveAnalyticsScreen';

// Engagement Screens
import { SocialFeedScreen } from '../screens/engagement/SocialFeedScreen';
import { MoodAnalysisScreen } from '../screens/engagement/MoodAnalysisScreen';
import { SurveysFeedbackScreen } from '../screens/engagement/SurveysFeedbackScreen';

// Travel & Claims Screens
import { NewTravelRequestScreen } from '../screens/traveclims/NewTravelRequestScreen';
import { ExpenseReimbursementsScreen } from '../screens/traveclims/ExpenseReimbursementsScreen';
import { ClaimApprovalsScreen } from '../screens/traveclims/ClaimApprovalsScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  Menu: undefined;
  EmployeeDirectory: undefined;
  EmployeeMaster: { employeeId?: string };
  IdCardGenerator: { employeeId?: string };
  OrgChart: undefined;
  ExitSettlement: { employeeId?: string };
  ResignationArchive: undefined;
  BulkImports: undefined;
  RolePermissions: undefined;
  Departments: undefined;

  // Attendance Routes
  GpsSelfiePunch: undefined;
  ShiftRoster: undefined;
  AttendanceRegularization: undefined;
  MusterRoll: undefined;
  AttendanceReports: undefined;
  GeofencingConfig: undefined;

  // Leave Routes
  ApplyLeave: undefined;
  LeaveApprovals: undefined;
  LeaveCalendar: undefined;
  LeavePolicies: undefined;
  LeaveConfigurations: undefined;

  // Payroll Routes
  SalaryProcessing: undefined;
  SalaryRevisions: undefined;
  LoansAdvances: undefined;
  InvestmentDeclarations: undefined;
  PayslipTemplates: undefined;
  PayrollReports: undefined;

  // Performance Routes
  KraGoalSetting: undefined;
  Feedback360: undefined;
  BellCurveAnalytics: undefined;

  // Engagement Routes
  SocialFeed: undefined;
  MoodAnalysis: undefined;
  SurveysFeedback: undefined;

  // Travel & Claims Routes
  NewTravelRequest: undefined;
  ExpenseReimbursements: undefined;
  ClaimApprovals: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppStackNavigator = () => {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);
  const { colors } = useTheme();

  useEffect(() => {
    const checkAuthToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          setInitialRoute('Dashboard');
        } else {
          setInitialRoute('Login');
        }
      } catch (err) {
        setInitialRoute('Login');
      }
    };
    checkAuthToken();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Login' }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Register' }}
      />
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'HRMS Dashboard' }}
      />
      <Stack.Screen
        name="Menu"
        component={MenuScreen}
        options={{ title: 'Navigation Menu' }}
      />
      <Stack.Screen
        name="EmployeeDirectory"
        component={EmployeeDirectoryScreen}
        options={{ title: 'Employee Directory' }}
      />
      <Stack.Screen
        name="EmployeeMaster"
        component={EmployeeMasterScreen}
        options={{ title: 'Employee Master' }}
      />
      <Stack.Screen
        name="IdCardGenerator"
        component={IdCardGeneratorScreen}
        options={{ title: 'ID Card Generator' }}
      />
      <Stack.Screen
        name="OrgChart"
        component={OrgChartScreen}
        options={{ title: 'Organization Chart' }}
      />
      <Stack.Screen
        name="ExitSettlement"
        component={ExitSettlementScreen}
        options={{ title: 'Exit & Settlement' }}
      />
      <Stack.Screen
        name="ResignationArchive"
        component={ResignationArchiveScreen}
        options={{ title: 'Resignation Archive' }}
      />
      <Stack.Screen
        name="BulkImports"
        component={BulkImportsScreen}
        options={{ title: 'Bulk Imports & Exports' }}
      />
      <Stack.Screen
        name="RolePermissions"
        component={RolePermissionsScreen}
        options={{ title: 'Role & Permissions' }}
      />
      <Stack.Screen
        name="Departments"
        component={DepartmentsScreen}
        options={{ title: 'Departments' }}
      />

      {/* Attendance Stack Screens */}
      <Stack.Screen
        name="GpsSelfiePunch"
        component={GpsSelfiePunchScreen}
        options={{ title: 'GPS & Selfie Punch' }}
      />
      <Stack.Screen
        name="ShiftRoster"
        component={ShiftRosterScreen}
        options={{ title: 'Shift & Roster' }}
      />
      <Stack.Screen
        name="AttendanceRegularization"
        component={AttendanceRegularizationScreen}
        options={{ title: 'Regularization' }}
      />
      <Stack.Screen
        name="MusterRoll"
        component={MusterRollScreen}
        options={{ title: 'Muster Roll & Calendar' }}
      />
      <Stack.Screen
        name="AttendanceReports"
        component={AttendanceReportsScreen}
        options={{ title: 'Attendance Reports' }}
      />
      <Stack.Screen
        name="GeofencingConfig"
        component={GeofencingConfigScreen}
        options={{ title: 'Geofencing Config' }}
      />

      {/* Leave Stack Screens */}
      <Stack.Screen
        name="ApplyLeave"
        component={ApplyLeaveScreen}
        options={{ title: 'Apply Leave' }}
      />
      <Stack.Screen
        name="LeaveApprovals"
        component={LeaveApprovalsScreen}
        options={{ title: 'Leave Approvals' }}
      />
      <Stack.Screen
        name="LeaveCalendar"
        component={LeaveCalendarScreen}
        options={{ title: 'Leave Calendar' }}
      />
      <Stack.Screen
        name="LeavePolicies"
        component={LeavePoliciesScreen}
        options={{ title: 'Leave Policies' }}
      />
      <Stack.Screen
        name="LeaveConfigurations"
        component={LeaveConfigurationsScreen}
        options={{ title: 'Leave Configurations' }}
      />

      {/* Payroll Stack Screens */}
      <Stack.Screen
        name="SalaryProcessing"
        component={SalaryProcessingScreen}
        options={{ title: 'Salary Processing' }}
      />
      <Stack.Screen
        name="SalaryRevisions"
        component={SalaryRevisionsScreen}
        options={{ title: 'Salary Revisions' }}
      />
      <Stack.Screen
        name="LoansAdvances"
        component={LoansAdvancesScreen}
        options={{ title: 'Loans & Advances' }}
      />
      <Stack.Screen
        name="InvestmentDeclarations"
        component={InvestmentDeclarationsScreen}
        options={{ title: 'Investment Declarations' }}
      />
      <Stack.Screen
        name="PayslipTemplates"
        component={PayslipTemplatesScreen}
        options={{ title: 'Payslip Templates' }}
      />
      <Stack.Screen
        name="PayrollReports"
        component={PayrollReportsScreen}
        options={{ title: 'Payroll Reports & ECR' }}
      />

      {/* Performance Stack Screens */}
      <Stack.Screen
        name="KraGoalSetting"
        component={KraGoalSettingScreen}
        options={{ title: 'KRA & Goal Setting' }}
      />
      <Stack.Screen
        name="Feedback360"
        component={Feedback360Screen}
        options={{ title: '360° Feedback' }}
      />
      <Stack.Screen
        name="BellCurveAnalytics"
        component={BellCurveAnalyticsScreen}
        options={{ title: 'Bell Curve Analytics' }}
      />

      {/* Engagement Stack Screens */}
      <Stack.Screen
        name="SocialFeed"
        component={SocialFeedScreen}
        options={{ title: 'Social Feed & Posts' }}
      />
      <Stack.Screen
        name="MoodAnalysis"
        component={MoodAnalysisScreen}
        options={{ title: 'Mood Analysis' }}
      />
      <Stack.Screen
        name="SurveysFeedback"
        component={SurveysFeedbackScreen}
        options={{ title: 'Surveys & Feedback' }}
      />

      {/* Travel & Claims Stack Screens */}
      <Stack.Screen
        name="NewTravelRequest"
        component={NewTravelRequestScreen}
        options={{ title: 'New Travel Request' }}
      />
      <Stack.Screen
        name="ExpenseReimbursements"
        component={ExpenseReimbursementsScreen}
        options={{ title: 'Expense Reimbursements' }}
      />
      <Stack.Screen
        name="ClaimApprovals"
        component={ClaimApprovalsScreen}
        options={{ title: 'Claim Approvals' }}
      />
    </Stack.Navigator>
  );
};


