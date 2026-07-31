import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
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
import { useEmployees, useUpdateEmployeeSalary } from '../../api/hook/useEmployee';
import { useApplyBulkRevision } from '../../api/hook/usePayroll';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SalaryRevisions'>;

type ViewMode = 'MANUAL' | 'BULK';
type RevisionType = 'INCREMENT' | 'DECREMENT';

export const SalaryRevisionsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  // Screen View Mode Switcher
  const [viewMode, setViewMode] = useState<ViewMode>('MANUAL');

  // Manual Employee Selection State
  const [selectedEmpId, setSelectedEmpId] = useState<string>('EMP31723');

  // Individual Salary Revision Config State
  const [indivActionType, setIndivActionType] = useState<RevisionType>('INCREMENT');
  const [indivPercentage, setIndivPercentage] = useState('8');
  const [customNewGross, setCustomNewGross] = useState('');

  // Bulk Revision Config State
  const [revisionType, setRevisionType] = useState<RevisionType>('INCREMENT');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [percentage, setPercentage] = useState('8');

  // TanStack Queries & Mutations
  const { data: empRes, isLoading } = useEmployees();
  const updateSalaryMutation = useUpdateEmployeeSalary();
  const bulkRevisionMutation = useApplyBulkRevision();

  const apiEmployees = empRes?.data || [];

  // Default Editable Roster State (populates dynamically from API)
  const [empListState, setEmpListState] = useState<any[]>([]);

  // Sync state with fetched organization employees dynamically
  React.useEffect(() => {
    if (apiEmployees.length > 0) {
      const mapped = apiEmployees.map(emp => {
        const basic = emp.basic || 15000;
        const hra = emp.hra || Math.round(basic * 0.4);
        const special = emp.allowance || Math.round(basic * 0.2);
        const monthlyGross = basic + hra + special;
        const annualCtc = monthlyGross * 12;
        const epf = Math.min(1800, Math.round(basic * 0.12));
        const pt = 200;
        const tds = basic > 30000 ? Math.round(basic * 0.05) : 0;

        return {
          id: emp.id,
          name: emp.name,
          code: emp.id,
          status: emp.status || 'CONFIRMED',
          designation: emp.designation || 'Staff',
          dept: emp.department?.name || 'General',
          joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '2025-01-01',
          annualCtc,
          monthlyGross,
          basic,
          hra,
          special,
          epf,
          pt,
          tds,
          bankName: emp.bankName || 'HDFC Bank',
          bankAccount: emp.bankAccount || '•••• 4829',
          ifscCode: emp.ifsc || 'HDFC0000123',
          panUan: emp.pan || 'ABCDE1234F',
        };
      });
      setEmpListState(mapped);
    } else {
      setEmpListState([]);
    }
  }, [empRes?.data]);

  // Selected Manual Employee
  const activeEmp = empListState.find(e => e.id === selectedEmpId) || empListState[0];

  const netDeductions = activeEmp ? (activeEmp.epf + activeEmp.pt + activeEmp.tds) : 0;
  const netTakeHome = activeEmp ? (activeEmp.monthlyGross - netDeductions) : 0;

  // Handle Individual Salary Revision (Increment / Decrement)
  const handleApplyIndividualRevision = () => {
    let newGross = 0;
    const pct = parseFloat(indivPercentage);

    if (customNewGross.trim()) {
      newGross = parseFloat(customNewGross);
    } else if (!isNaN(pct) && pct > 0) {
      const factor = indivActionType === 'INCREMENT' ? (1 + pct / 100) : (1 - pct / 100);
      newGross = Math.round(activeEmp.monthlyGross * factor);
    } else {
      Alert.alert('Validation Error', 'Please enter a valid percentage or new gross salary.');
      return;
    }

    if (isNaN(newGross) || newGross <= 0) {
      Alert.alert('Validation Error', 'Gross salary must be greater than zero.');
      return;
    }

    const newAnnualCtc = newGross * 12;
    const newBasic = Math.round(newGross * 0.50);
    const newHra = Math.round(newGross * 0.20);
    const newSpecial = Math.max(0, newGross - newBasic - newHra);
    const newEpf = Math.min(1800, Math.round(newBasic * 0.12));
    const netPayable = newGross - (newEpf + activeEmp.pt + activeEmp.tds);

    // Execute API Mutation PUT /api/v1/employees/:id/salary
    updateSalaryMutation.mutate(
      {
        id: activeEmp.id,
        data: {
          basic: newBasic,
          hra: newHra,
          allowance: newSpecial,
          deductions: newEpf + activeEmp.pt + activeEmp.tds,
          netSalary: netPayable,
          salary: newGross,
        },
      },
      {
        onSuccess: res => {
          setEmpListState(prev =>
            prev.map(item => {
              if (item.id === activeEmp.id) {
                return {
                  ...item,
                  monthlyGross: newGross,
                  annualCtc: newAnnualCtc,
                  basic: newBasic,
                  hra: newHra,
                  special: newSpecial,
                  epf: newEpf,
                };
              }
              return item;
            })
          );

          const actionText = indivActionType === 'INCREMENT' ? 'Increment (+)' : 'Decrement (-)';
          Alert.alert(
            'Individual Salary Revision Applied 📈',
            res.message ||
              `Updated ${activeEmp.name}'s (${activeEmp.code}) monthly salary from ₹${activeEmp.monthlyGross.toLocaleString()} to ₹${newGross.toLocaleString()} (${actionText}).`
          );
          setCustomNewGross('');
        },
        onError: err => {
          Alert.alert('API Error', err.message);
        },
      }
    );
  };

  // Handle Bulk Revision Submit
  const handleApplyBulkRevision = () => {
    const pctVal = parseFloat(percentage);
    if (isNaN(pctVal) || pctVal <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid percentage value.');
      return;
    }

    const finalPct = revisionType === 'INCREMENT' ? pctVal : -pctVal;

    // Execute TanStack Mutation
    bulkRevisionMutation.mutate(
      {
        incrementPercentage: finalPct,
        departmentId: selectedDept === 'ALL' ? null : selectedDept,
      },
      {
        onSuccess: res => {
          // Update local state roster as well
          const factor = revisionType === 'INCREMENT' ? (1 + pctVal / 100) : (1 - pctVal / 100);
          setEmpListState(prev =>
            prev.map(emp => {
              const matchesDept =
                selectedDept === 'ALL' || emp.dept.toLowerCase() === selectedDept.toLowerCase();
              if (matchesDept) {
                const newGross = Math.round(emp.monthlyGross * factor);
                const newAnnual = newGross * 12;
                const newBasic = Math.round(newGross * 0.5);
                const newHra = Math.round(newGross * 0.2);
                const newSpecial = Math.max(0, newGross - newBasic - newHra);
                return {
                  ...emp,
                  monthlyGross: newGross,
                  annualCtc: newAnnual,
                  basic: newBasic,
                  hra: newHra,
                  special: newSpecial,
                };
              }
              return emp;
            })
          );

          Alert.alert(
            'Bulk Revision Executed ⚡',
            res.data?.message ||
              `Successfully applied ${revisionType === 'INCREMENT' ? '+' : '-'}${pctVal}% salary ${revisionType.toLowerCase()} across target roster.`
          );
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Salary Structure & Revisions
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Individual Manual Revision & Bulk Salary Panel
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* VIEW MODE TOGGLE BUTTONS */}
        <View style={styles.viewModeToggleRow}>
          <TouchableOpacity
            style={[
              styles.modeTabBtn,
              viewMode === 'MANUAL' && { backgroundColor: colors.accent },
            ]}
            onPress={() => setViewMode('MANUAL')}
          >
            <Text
              style={[
                styles.modeTabBtnText,
                { color: viewMode === 'MANUAL' ? '#ffffff' : colors.textSecondary },
              ]}
            >
              👤 Employee Manual Structure
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeTabBtn,
              viewMode === 'BULK' && { backgroundColor: colors.accent },
            ]}
            onPress={() => setViewMode('BULK')}
          >
            <Text
              style={[
                styles.modeTabBtnText,
                { color: viewMode === 'BULK' ? '#ffffff' : colors.textSecondary },
              ]}
            >
              ⚡ Bulk Revision Panel
            </Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'MANUAL' ? (
          empListState.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No employee records found in organization.
              </Text>
            </View>
          ) : (
          <>
            {/* Employee Selector Chips */}
            <View
              style={[
                styles.card,
                { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                👤 Select Employee Profile
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                {empListState.map(emp => {
                  const isSelected = selectedEmpId === emp.id;
                  return (
                    <TouchableOpacity
                      key={emp.id}
                      style={[
                        styles.empChip,
                        {
                          backgroundColor: isSelected ? colors.accent : colors.background,
                          borderColor: isSelected ? colors.accent : colors.cardBorder,
                        },
                      ]}
                      onPress={() => setSelectedEmpId(emp.id)}
                    >
                      <Text
                        style={{
                          color: isSelected ? '#ffffff' : colors.textPrimary,
                          fontWeight: '700',
                          fontSize: 12,
                        }}
                      >
                        {emp.name} ({emp.code})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 1. EMPLOYEE HEADER SUMMARY CARD */}
            <View
              style={[
                styles.card,
                { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.empMainName, { color: colors.textPrimary }]}>
                    {activeEmp.name}
                  </Text>
                  <Text style={[styles.empSubDetail, { color: colors.textSecondary }]}>
                    Emp ID: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{activeEmp.code}</Text> • Designation: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{activeEmp.designation}</Text> • Joining: <Text style={{ fontWeight: '700', color: colors.textPrimary }}>{activeEmp.joiningDate}</Text>
                  </Text>
                </View>

                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        activeEmp.status === 'PROBATION' ? '#f59e0b20' : '#10b98120',
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: activeEmp.status === 'PROBATION' ? '#f59e0b' : '#10b981',
                      fontWeight: '900',
                      fontSize: 11,
                    }}
                  >
                    {activeEmp.status}
                  </Text>
                </View>
              </View>

              {/* Annual CTC & Net Take Home Highlight Row */}
              <View style={styles.ctcHighlightRow}>
                <View style={[styles.ctcBox, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                  <Text style={[styles.ctcLabel, { color: colors.textSecondary }]}>Annual CTC</Text>
                  <Text style={[styles.ctcValue, { color: '#3b82f6' }]}>
                    ₹{activeEmp.annualCtc.toLocaleString()} <Text style={{ fontSize: 11, fontWeight: '500' }}>/ yr</Text>
                  </Text>
                </View>

                <View style={[styles.ctcBox, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                  <Text style={[styles.ctcLabel, { color: colors.textSecondary }]}>Net Monthly Take Home</Text>
                  <Text style={[styles.ctcValue, { color: '#10b981' }]}>
                    ₹{netTakeHome.toLocaleString()} <Text style={{ fontSize: 11, fontWeight: '500' }}>/ mo</Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* 2. INDIVIDUAL EMPLOYEE SALARY REVISION CARD (INCREMENT / DECREMENT) */}
            <View
              style={[
                styles.card,
                { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                ⚡ Individual Salary Revision ({activeEmp.name})
              </Text>

              {/* Increment vs Decrement Action Selector */}
              <View style={styles.actionToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.actionToggleBtn,
                    indivActionType === 'INCREMENT' && { backgroundColor: '#10b981' },
                  ]}
                  onPress={() => setIndivActionType('INCREMENT')}
                >
                  <Text
                    style={[
                      styles.actionToggleBtnText,
                      { color: indivActionType === 'INCREMENT' ? '#ffffff' : colors.textSecondary },
                    ]}
                  >
                    Increment (+%) 📈
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionToggleBtn,
                    indivActionType === 'DECREMENT' && { backgroundColor: '#ef4444' },
                  ]}
                  onPress={() => setIndivActionType('DECREMENT')}
                >
                  <Text
                    style={[
                      styles.actionToggleBtnText,
                      { color: indivActionType === 'DECREMENT' ? '#ffffff' : colors.textSecondary },
                    ]}
                  >
                    Decrement (-%) 📉
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Quick Preset Percentage Chips */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                REVISION PERCENTAGE (%) *
              </Text>
              <View style={styles.pctRow}>
                {['5', '8', '10', '12', '15'].map(pct => {
                  const isSelected = indivPercentage === pct;
                  const sign = indivActionType === 'INCREMENT' ? '+' : '-';
                  return (
                    <TouchableOpacity
                      key={pct}
                      style={[
                        styles.pctChip,
                        {
                          backgroundColor: isSelected
                            ? (indivActionType === 'INCREMENT' ? '#10b981' : '#ef4444')
                            : colors.background,
                          borderColor: isSelected
                            ? (indivActionType === 'INCREMENT' ? '#10b981' : '#ef4444')
                            : colors.cardBorder,
                        },
                      ]}
                      onPress={() => {
                        setIndivPercentage(pct);
                        setCustomNewGross('');
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? '#ffffff' : colors.textPrimary,
                          fontWeight: '800',
                          fontSize: 12,
                        }}
                      >
                        {sign}{pct}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Or Direct New Gross Amount */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                OR ENTER DIRECT NEW MONTHLY GROSS (₹)
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={customNewGross}
                onChangeText={setCustomNewGross}
                keyboardType="numeric"
                placeholder={`Current: ₹${activeEmp.monthlyGross.toLocaleString()}`}
                placeholderTextColor={colors.inputPlaceholder}
              />

              {/* Submit Action for Individual Employee */}
              <TouchableOpacity
                style={[
                  styles.applyBtn,
                  { backgroundColor: indivActionType === 'INCREMENT' ? '#10b981' : '#ef4444' },
                  updateSalaryMutation.isPending && { opacity: 0.7 },
                ]}
                onPress={handleApplyIndividualRevision}
                disabled={updateSalaryMutation.isPending}
                activeOpacity={0.85}
              >
                {updateSalaryMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.applyBtnText}>
                    🚀 Apply {indivActionType === 'INCREMENT' ? 'Increment' : 'Decrement'} for {activeEmp.name}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* 3. ADJUST STRUCTURE BREAKDOWN CARD */}
            <View
              style={[
                styles.card,
                { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  ⚙️ Adjust Structure
                </Text>
                <TouchableOpacity
                  style={[styles.miniEditBtn, { backgroundColor: colors.accent }]}
                  onPress={() => Alert.alert('Edit Mode', 'Salary component structure adjustment unlocked.')}
                >
                  <Text style={styles.miniEditBtnText}>✏️ Edit Component Ratio</Text>
                </TouchableOpacity>
              </View>

              {/* Monthly Earnings Group */}
              <View style={[styles.structureSection, { backgroundColor: colors.background }]}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitleText, { color: colors.textPrimary }]}>
                    Monthly Earnings
                  </Text>
                  <Text style={[styles.sectionTotalVal, { color: colors.textPrimary }]}>
                    ₹{activeEmp.monthlyGross.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.lineItemRow}>
                  <Text style={[styles.lineItemLabel, { color: colors.textSecondary }]}>
                    Basic Salary (50%)
                  </Text>
                  <Text style={[styles.lineItemVal, { color: colors.textPrimary }]}>
                    ₹{activeEmp.basic.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.lineItemRow}>
                  <Text style={[styles.lineItemLabel, { color: colors.textSecondary }]}>
                    House Rent Allowance (HRA)
                  </Text>
                  <Text style={[styles.lineItemVal, { color: colors.textPrimary }]}>
                    ₹{activeEmp.hra.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.lineItemRow}>
                  <Text style={[styles.lineItemLabel, { color: colors.textSecondary }]}>
                    Special / Executive Allowance
                  </Text>
                  <Text style={[styles.lineItemVal, { color: colors.textPrimary }]}>
                    ₹{activeEmp.special.toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Statutory Deductions Group */}
              <View style={[styles.structureSection, { backgroundColor: colors.background }]}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionTitleText, { color: '#ef4444' }]}>
                    Statutory Deductions
                  </Text>
                  <Text style={[styles.sectionTotalVal, { color: '#ef4444' }]}>
                    ₹{netDeductions.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.lineItemRow}>
                  <Text style={[styles.lineItemLabel, { color: colors.textSecondary }]}>
                    Provident Fund (EPF 12%)
                  </Text>
                  <Text style={[styles.lineItemVal, { color: '#ef4444' }]}>
                    ₹{activeEmp.epf.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.lineItemRow}>
                  <Text style={[styles.lineItemLabel, { color: colors.textSecondary }]}>
                    Professional Tax (PT)
                  </Text>
                  <Text style={[styles.lineItemVal, { color: '#ef4444' }]}>
                    ₹{activeEmp.pt.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.lineItemRow}>
                  <Text style={[styles.lineItemLabel, { color: colors.textSecondary }]}>
                    Income Tax (TDS Estimate)
                  </Text>
                  <Text style={[styles.lineItemVal, { color: '#ef4444' }]}>
                    ₹{activeEmp.tds.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* 4. BANK & REMITTANCE INFO CARD */}
            <View
              style={[
                styles.card,
                { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  🏦 Bank & Remittance Info
                </Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>Verified ✓</Text>
                </View>
              </View>

              <View style={[styles.bankGrid, { backgroundColor: colors.background }]}>
                <View style={styles.bankCol}>
                  <Text style={[styles.bankLabel, { color: colors.textSecondary }]}>Bank Name</Text>
                  <Text style={[styles.bankVal, { color: colors.textPrimary }]}>{activeEmp.bankName}</Text>
                </View>

                <View style={styles.bankCol}>
                  <Text style={[styles.bankLabel, { color: colors.textSecondary }]}>Account Number</Text>
                  <Text style={[styles.bankVal, { color: colors.textPrimary }]}>{activeEmp.bankAccount}</Text>
                </View>

                <View style={styles.bankCol}>
                  <Text style={[styles.bankLabel, { color: colors.textSecondary }]}>IFSC Code</Text>
                  <Text style={[styles.bankVal, { color: colors.textPrimary }]}>{activeEmp.ifscCode}</Text>
                </View>

                <View style={styles.bankCol}>
                  <Text style={[styles.bankLabel, { color: colors.textSecondary }]}>PAN / UAN</Text>
                  <Text style={[styles.bankVal, { color: colors.textPrimary }]}>{activeEmp.panUan}</Text>
                </View>
              </View>
            </View>
          </>
          )
        ) : (
          // ==========================================
          // SECTION 2: BULK SALARY REVISION PANEL
          // ==========================================
          <>
            {/* Bulk Revision Configurator Card */}
            <View
              style={[
                styles.card,
                { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                ⚡ Bulk Salary Revision Panel
              </Text>

              {/* Mode Toggle: Increment vs Decrement */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>REVISION ACTION *</Text>
              <View style={styles.actionToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.actionToggleBtn,
                    revisionType === 'INCREMENT' && { backgroundColor: '#10b981' },
                  ]}
                  onPress={() => setRevisionType('INCREMENT')}
                >
                  <Text
                    style={[
                      styles.actionToggleBtnText,
                      { color: revisionType === 'INCREMENT' ? '#ffffff' : colors.textSecondary },
                    ]}
                  >
                    Increment (+%) 📈
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionToggleBtn,
                    revisionType === 'DECREMENT' && { backgroundColor: '#ef4444' },
                  ]}
                  onPress={() => setRevisionType('DECREMENT')}
                >
                  <Text
                    style={[
                      styles.actionToggleBtnText,
                      { color: revisionType === 'DECREMENT' ? '#ffffff' : colors.textSecondary },
                    ]}
                  >
                    Decrement (-%) 📉
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Quick Preset Percentage Chips */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                PERCENTAGE (%) VALUE *
              </Text>
              <View style={styles.pctRow}>
                {['5', '8', '10', '12', '15'].map(pct => {
                  const isSelected = percentage === pct;
                  const sign = revisionType === 'INCREMENT' ? '+' : '-';
                  return (
                    <TouchableOpacity
                      key={pct}
                      style={[
                        styles.pctChip,
                        {
                          backgroundColor: isSelected ? (revisionType === 'INCREMENT' ? '#10b981' : '#ef4444') : colors.background,
                          borderColor: isSelected ? (revisionType === 'INCREMENT' ? '#10b981' : '#ef4444') : colors.cardBorder,
                        },
                      ]}
                      onPress={() => setPercentage(pct)}
                    >
                      <Text
                        style={{
                          color: isSelected ? '#ffffff' : colors.textPrimary,
                          fontWeight: '800',
                          fontSize: 12,
                        }}
                      >
                        {sign}{pct}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={percentage}
                onChangeText={setPercentage}
                keyboardType="numeric"
                placeholder="Enter percentage value..."
              />

              {/* Department Filter */}
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>FILTER BY DEPARTMENT *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {['ALL', 'Hshdhdjssj', 'UI/UX designer', 'Engineering', 'Human Resources'].map(dept => {
                  const isSelected = selectedDept === dept;
                  return (
                    <TouchableOpacity
                      key={dept}
                      style={[
                        styles.deptChip,
                        {
                          backgroundColor: isSelected ? colors.accent : colors.background,
                          borderColor: isSelected ? colors.accent : colors.cardBorder,
                        },
                      ]}
                      onPress={() => setSelectedDept(dept)}
                    >
                      <Text
                        style={{
                          color: isSelected ? '#ffffff' : colors.textPrimary,
                          fontWeight: '700',
                          fontSize: 11,
                        }}
                      >
                        {dept}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Apply Action */}
              <TouchableOpacity
                style={[
                  styles.applyBtn,
                  { backgroundColor: revisionType === 'INCREMENT' ? '#10b981' : '#ef4444' },
                  bulkRevisionMutation.isPending && { opacity: 0.7 },
                ]}
                onPress={handleApplyBulkRevision}
                disabled={bulkRevisionMutation.isPending}
                activeOpacity={0.85}
              >
                {bulkRevisionMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.applyBtnText}>
                    🚀 Apply {revisionType === 'INCREMENT' ? '+' : '-'}{percentage}% Bulk Salary Revision
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* AFFECTED EMPLOYEES PREVIEW TABLE */}
            <View
              style={[
                styles.card,
                { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                Affected Employees Preview ({empListState.length} Records)
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.previewTable}>
                  {/* Table Header */}
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.thCellEmp, { color: colors.textPrimary }]}>Employee Name</Text>
                    <Text style={[styles.thCellDept, { color: colors.textSecondary }]}>Department</Text>
                    <Text style={[styles.thCellGross, { color: colors.textSecondary }]}>Current Monthly Gross</Text>
                    <Text style={[styles.thCellGross, { color: colors.textSecondary }]}>Revised Monthly Gross</Text>
                    <Text style={[styles.thCellDiff, { color: colors.textSecondary }]}>Differential ({revisionType === 'INCREMENT' ? '+₹' : '-₹'})</Text>
                  </View>

                  {/* Table Rows */}
                  {empListState.map(emp => {
                    const pctVal = parseFloat(percentage) || 0;
                    const factor = revisionType === 'INCREMENT' ? (1 + pctVal / 100) : (1 - pctVal / 100);
                    const revisedGross = Math.round(emp.monthlyGross * factor);
                    const diff = Math.abs(revisedGross - emp.monthlyGross);
                    const isInc = revisionType === 'INCREMENT';

                    return (
                      <View key={emp.id} style={styles.tableDataRow}>
                        <View style={styles.tdCellEmp}>
                          <Text style={[styles.tableEmpName, { color: colors.textPrimary }]}>
                            {emp.name}
                          </Text>
                          <Text style={[styles.tableEmpCode, { color: colors.textSecondary }]}>
                            {emp.code}
                          </Text>
                        </View>

                        <Text style={[styles.tdCellDept, { color: colors.textPrimary }]}>
                          {emp.dept}
                        </Text>

                        <Text style={[styles.tdCellGross, { color: colors.textPrimary }]}>
                          ₹{emp.monthlyGross.toLocaleString()}
                        </Text>

                        <Text
                          style={[
                            styles.tdCellGross,
                            { color: isInc ? '#10b981' : '#ef4444', fontWeight: '800' },
                          ]}
                        >
                          ₹{revisedGross.toLocaleString()}
                        </Text>

                        <Text
                          style={[
                            styles.tdCellDiff,
                            { color: isInc ? '#10b981' : '#ef4444', fontWeight: '900' },
                          ]}
                        >
                          {isInc ? '+' : '-'}₹{diff.toLocaleString()} / mo
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
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
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  viewModeToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeTabBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(100,100,100,0.1)',
  },
  modeTabBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  empChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  empMainName: {
    fontSize: 18,
    fontWeight: '900',
  },
  empSubDetail: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ctcHighlightRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  ctcBox: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
  },
  ctcLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  ctcValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  miniEditBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  miniEditBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  structureSection: {
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(100,100,100,0.15)',
    paddingBottom: 6,
  },
  sectionTitleText: {
    fontSize: 13,
    fontWeight: '800',
  },
  sectionTotalVal: {
    fontSize: 14,
    fontWeight: '900',
  },
  lineItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lineItemLabel: {
    fontSize: 12,
  },
  lineItemVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  verifiedBadge: {
    backgroundColor: '#10b98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    color: '#10b981',
    fontWeight: '800',
    fontSize: 10,
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  bankCol: {
    width: '48%',
  },
  bankLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  bankVal: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  actionToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(100,100,100,0.1)',
  },
  actionToggleBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  pctRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pctChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  deptChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
  },
  applyBtn: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  previewTable: {
    minWidth: 620,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(100,100,100,0.2)',
  },
  thCellEmp: {
    width: 140,
    fontWeight: '800',
    fontSize: 11,
  },
  thCellDept: {
    width: 110,
    fontWeight: '700',
    fontSize: 11,
  },
  thCellGross: {
    width: 130,
    fontWeight: '700',
    fontSize: 11,
  },
  thCellDiff: {
    width: 130,
    fontWeight: '700',
    fontSize: 11,
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(100,100,100,0.1)',
  },
  tdCellEmp: {
    width: 140,
  },
  tableEmpName: {
    fontSize: 13,
    fontWeight: '700',
  },
  tableEmpCode: {
    fontSize: 10,
    marginTop: 1,
  },
  tdCellDept: {
    width: 110,
    fontSize: 12,
  },
  tdCellGross: {
    width: 130,
    fontSize: 12,
  },
  tdCellDiff: {
    width: 130,
    fontSize: 12,
  },
  emptyBox: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
