import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { DashboardScreen } from '../screens/DashboardScreen';
import { MenuScreen } from '../screens/MenuScreen';

// Auth Screens
import { LoginScreen } from '../screens/login/LoginScreen';
import { RegisterScreen } from '../screens/login/RegisterScreen';

// Employee Screens
import { BulkImportsScreen } from '../screens/employee/BulkImportsScreen';
import { DepartmentsScreen } from '../screens/employee/DepartmentsScreen';
import { EmployeeDirectoryScreen } from '../screens/employee/EmployeeDirectoryScreen';
import { EmployeeMasterScreen } from '../screens/employee/EmployeeMasterScreen';
import { ExitSettlementScreen } from '../screens/employee/ExitSettlementScreen';
import { IdCardGeneratorScreen } from '../screens/employee/IdCardGeneratorScreen';
import { OrgChartScreen } from '../screens/employee/OrgChartScreen';
import { ResignationArchiveScreen } from '../screens/employee/ResignationArchiveScreen';
import { RolePermissionsScreen } from '../screens/employee/RolePermissionsScreen';

// Attendance Screens
import { AttendanceHistoryScreen } from '../screens/attendance/AttendanceHistory';
import { AttendanceRegularizationScreen } from '../screens/attendance/AttendanceRegularizationScreen';
import { AttendanceReportsScreen } from '../screens/attendance/AttendanceReportsScreen';
import { GeofencingConfigScreen } from '../screens/attendance/GeofencingConfigScreen';
import { GpsSelfiePunchScreen } from '../screens/attendance/GpsSelfiePunchScreen';
import { MusterRollScreen } from '../screens/attendance/MusterRollScreen';
import { ShiftRosterScreen } from '../screens/attendance/ShiftRosterScreen';

// Leave Screens
import { ApplyLeaveScreen } from '../screens/leave/ApplyLeaveScreen';
import { LeaveApprovalsScreen } from '../screens/leave/LeaveApprovalsScreen';
import { LeaveCalendarScreen } from '../screens/leave/LeaveCalendarScreen';
import { LeaveConfigurationsScreen } from '../screens/leave/LeaveConfigurationsScreen';
import { LeavePoliciesScreen } from '../screens/leave/LeavePoliciesScreen';

// Payroll Screens
import { InvestmentDeclarationsScreen } from '../screens/payroll/InvestmentDeclarationsScreen';
import { LoansAdvancesScreen } from '../screens/payroll/LoansAdvancesScreen';
import { PayrollReportsScreen } from '../screens/payroll/PayrollReportsScreen';
import { PayslipTemplatesScreen } from '../screens/payroll/PayslipTemplatesScreen';
import { SalaryProcessingScreen } from '../screens/payroll/SalaryProcessingScreen';
import { SalaryRevisionsScreen } from '../screens/payroll/SalaryRevisionsScreen';

// Performance Screens
import { BellCurveAnalyticsScreen } from '../screens/performance/BellCurveAnalyticsScreen';
import { Feedback360Screen } from '../screens/performance/Feedback360Screen';
import { KraGoalSettingScreen } from '../screens/performance/KraGoalSettingScreen';

// Engagement Screens
import { MoodAnalysisScreen } from '../screens/engagement/MoodAnalysisScreen';
import { SocialFeedScreen } from '../screens/engagement/SocialFeedScreen';
import { SurveysFeedbackScreen } from '../screens/engagement/SurveysFeedbackScreen';

// Travel & Claims Screens
import { ClaimApprovalsScreen } from '../screens/traveclims/ClaimApprovalsScreen';
import { ExpenseReimbursementsScreen } from '../screens/traveclims/ExpenseReimbursementsScreen';
import { NewTravelRequestScreen } from '../screens/traveclims/NewTravelRequestScreen';

// Timesheet Screens
import { ClientsProjectsScreen } from '../screens/Timesheet/ClientsProjectsScreen';
import { TimesheetEntryScreen } from '../screens/Timesheet/TimesheetEntryScreen';

// Recruitment Screens
import { CandidatePipelineScreen } from '../screens/recruitment/CandidatePipelineScreen';
import { JobRequisitionsScreen } from '../screens/recruitment/JobRequisitionsScreen';
import { PreOnboardingChecklistScreen } from '../screens/recruitment/PreOnboardingChecklistScreen';

// Document Vault Screens
import { DocumentComplianceScreen } from '../screens/document/DocumentComplianceScreen';
import { DocumentVaultScreen } from '../screens/document/DocumentVaultScreen';
import { UploadDocumentScreen } from '../screens/document/UploadDocumentScreen';

// Asset Management Screens
import { AssetAllocationScreen } from '../screens/assetManagement/AssetAllocationScreen';
import { AssetInventoryScreen } from '../screens/assetManagement/AssetInventoryScreen';
import { RegisterAssetScreen } from '../screens/assetManagement/RegisterAssetScreen';

// Letter Generator Screens
import { GenerateLetterScreen } from '../screens/Letter/GenerateLetterScreen';
import { IssuedLettersArchiveScreen } from '../screens/Letter/IssuedLettersArchiveScreen';
import { LetterTemplatesScreen } from '../screens/Letter/LetterTemplatesScreen';

// HR Help Desk Screens
import { HelpdeskSlaAnalyticsScreen } from '../screens/helpdesk/HelpdeskSlaAnalyticsScreen';
import { RaiseTicketScreen } from '../screens/helpdesk/RaiseTicketScreen';
import { SupportTicketsScreen } from '../screens/helpdesk/SupportTicketsScreen';

// Subscription & Plans Screens
import { ManageSubscriptionScreen } from '../screens/subscription/ManageSubscriptionScreen';
import { PlanComparisonScreen } from '../screens/subscription/PlanComparisonScreen';
import { PlansPricingScreen } from '../screens/subscription/PlansPricingScreen';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  Menu: undefined;
  EmployeeDirectory: { employeeId?: string; openMyProfile?: boolean } | undefined;
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
  AttendanceHistory: undefined;

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

  // Timesheet Routes
  TimesheetEntry: undefined;
  ClientsProjects: undefined;

  // Recruitment Routes
  JobRequisitions: undefined;
  CandidatePipeline: undefined;
  PreOnboardingChecklist: undefined;

  // Document Vault Routes
  DocumentVault: undefined;
  UploadDocument: undefined;
  DocumentCompliance: undefined;

  // Asset Management Routes
  AssetInventory: undefined;
  AssetAllocation: undefined;
  RegisterAsset: undefined;

  // Letter Generator Routes
  GenerateLetter: undefined;
  IssuedLettersArchive: undefined;
  LetterTemplates: undefined;

  // HR Help Desk Routes
  SupportTickets: undefined;
  RaiseTicket: undefined;
  HelpdeskSlaAnalytics: undefined;

  // Subscription & Plans Routes
  PlansPricing: undefined;
  PlanComparison: undefined;
  ManageSubscription: undefined;
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
        options={{
          headerShown: false,
          presentation: 'transparentModal',
          animation: 'fade',
          contentStyle: { backgroundColor: 'transparent' },
        }}
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
      <Stack.Screen
        name="AttendanceHistory"
        component={AttendanceHistoryScreen}
        options={{ headerShown: false }}
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

      {/* Timesheet Stack Screens */}
      <Stack.Screen
        name="TimesheetEntry"
        component={TimesheetEntryScreen}
        options={{ title: 'Timesheet Entry' }}
      />
      <Stack.Screen
        name="ClientsProjects"
        component={ClientsProjectsScreen}
        options={{ title: 'Clients & Projects' }}
      />

      {/* Recruitment Stack Screens */}
      <Stack.Screen
        name="JobRequisitions"
        component={JobRequisitionsScreen}
        options={{ title: 'Job Requisitions' }}
      />
      <Stack.Screen
        name="CandidatePipeline"
        component={CandidatePipelineScreen}
        options={{ title: 'Candidate Pipeline' }}
      />
      <Stack.Screen
        name="PreOnboardingChecklist"
        component={PreOnboardingChecklistScreen}
        options={{ title: 'Pre-Onboarding Checklist' }}
      />

      {/* Document Vault Stack Screens */}
      <Stack.Screen
        name="DocumentVault"
        component={DocumentVaultScreen}
        options={{ title: 'Document Vault' }}
      />
      <Stack.Screen
        name="UploadDocument"
        component={UploadDocumentScreen}
        options={{ title: 'Upload Document' }}
      />
      <Stack.Screen
        name="DocumentCompliance"
        component={DocumentComplianceScreen}
        options={{ title: 'Document Compliance' }}
      />

      {/* Asset Management Stack Screens */}
      <Stack.Screen
        name="AssetInventory"
        component={AssetInventoryScreen}
        options={{ title: 'Asset Inventory' }}
      />
      <Stack.Screen
        name="AssetAllocation"
        component={AssetAllocationScreen}
        options={{ title: 'Asset Allocation' }}
      />
      <Stack.Screen
        name="RegisterAsset"
        component={RegisterAssetScreen}
        options={{ title: 'Register Asset' }}
      />

      {/* Letter Generator Stack Screens */}
      <Stack.Screen
        name="GenerateLetter"
        component={GenerateLetterScreen}
        options={{ title: 'Generate Letter' }}
      />
      <Stack.Screen
        name="IssuedLettersArchive"
        component={IssuedLettersArchiveScreen}
        options={{ title: 'Issued Letters Archive' }}
      />
      <Stack.Screen
        name="LetterTemplates"
        component={LetterTemplatesScreen}
        options={{ title: 'Letter Templates' }}
      />

      {/* HR Help Desk Stack Screens */}
      <Stack.Screen
        name="SupportTickets"
        component={SupportTicketsScreen}
        options={{ title: 'Support Tickets Queue' }}
      />
      <Stack.Screen
        name="RaiseTicket"
        component={RaiseTicketScreen}
        options={{ title: 'Raise Support Ticket' }}
      />
      <Stack.Screen
        name="HelpdeskSlaAnalytics"
        component={HelpdeskSlaAnalyticsScreen}
        options={{ title: 'Help Desk SLA Analytics' }}
      />

      {/* Subscription & Plans Stack Screens */}
      <Stack.Screen
        name="PlansPricing"
        component={PlansPricingScreen}
        options={{ title: 'Subscription Plans & Pricing' }}
      />
      <Stack.Screen
        name="PlanComparison"
        component={PlanComparisonScreen}
        options={{ title: 'Feature Comparison Matrix' }}
      />
      <Stack.Screen
        name="ManageSubscription"
        component={ManageSubscriptionScreen}
        options={{ title: 'Manage Subscription & Invoices' }}
      />
    </Stack.Navigator>
  );
};


