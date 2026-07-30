import React from 'react';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
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
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
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
    </Stack.Navigator>
  );
};


