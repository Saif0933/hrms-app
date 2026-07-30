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
import { useEmployees } from '../../api/hook/useEmployee';
import { useSaveTaxDeclaration, useTaxDeclaration } from '../../api/hook/usePayroll';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'InvestmentDeclarations'>;

export const InvestmentDeclarationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [financialYear, setFinancialYear] = useState('2026-2027');
  const [selectedEmpId, setSelectedEmpId] = useState('EMP001');

  // Form Fields
  const [sec80C, setSec80C] = useState('150000');
  const [sec80D, setSec80D] = useState('25000');
  const [declaredHra, setDeclaredHra] = useState('180000');

  // TanStack Queries & Mutations
  const { data: empRes } = useEmployees();
  const { data: taxRes, isLoading } = useTaxDeclaration(selectedEmpId, financialYear);
  const saveTaxMutation = useSaveTaxDeclaration();

  const employees = empRes?.data || [];

  const handleSaveTaxDeclaration = () => {
    saveTaxMutation.mutate(
      {
        employeeId: selectedEmpId,
        financialYear,
        sec80C: parseFloat(sec80C) || 0,
        sec80D: parseFloat(sec80D) || 0,
        declaredHra: parseFloat(declaredHra) || 0,
      },
      {
        onSuccess: () => {
          Alert.alert('Declaration Saved 📝', `Tax & IT savings declaration for ${financialYear} updated!`);
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const totalDeductions = (parseFloat(sec80C) || 0) + (parseFloat(sec80D) || 0) + (parseFloat(declaredHra) || 0);

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
            Investment Declarations
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Section 80C, 80D & HRA Tax Savings Declaration
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Financial Year Selector */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            🗓️ Financial Year & Employee Selection
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            {['2025-2026', '2026-2027', '2027-2028'].map(fy => {
              const isSelected = financialYear === fy;
              return (
                <TouchableOpacity
                  key={fy}
                  style={[
                    styles.fyChip,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.background,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setFinancialYear(fy)}
                >
                  <Text
                    style={{
                      color: isSelected ? '#ffffff' : colors.textPrimary,
                      fontWeight: '700',
                      fontSize: 12,
                    }}
                  >
                    FY {fy}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SELECT EMPLOYEE *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {employees.map(emp => {
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
                  <Text style={{ color: isSelected ? '#fff' : colors.textPrimary, fontSize: 11, fontWeight: '600' }}>
                    {emp.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Investment Declaration Form */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            📋 Income Tax Deductions (Section 80C / 80D / HRA)
          </Text>

          {/* Section 80C */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            SECTION 80C INVESTMENTS (PPF, ELSS, EPF, LIC) — MAX ₹ 1,50,000 *
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={sec80C}
            onChangeText={setSec80C}
            keyboardType="numeric"
            placeholder="150000"
          />

          {/* Section 80D */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            SECTION 80D HEALTH INSURANCE (SELF & FAMILY) *
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={sec80D}
            onChangeText={setSec80D}
            keyboardType="numeric"
            placeholder="25000"
          />

          {/* Declared HRA Rent */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            ANNUAL DECLARED HOUSE RENT (HRA EXEMPTION) *
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={declaredHra}
            onChangeText={setDeclaredHra}
            keyboardType="numeric"
            placeholder="180000"
          />

          {/* Tax Savings Preview Box */}
          <View style={[styles.taxPreviewBox, { backgroundColor: colors.background }]}>
            <Text style={[styles.taxPreviewTitle, { color: colors.textPrimary }]}>
              Estimated Total Tax Exemption: <Text style={{ color: '#10b981', fontWeight: '900' }}>₹ {totalDeductions.toLocaleString()}</Text>
            </Text>
            <Text style={[styles.taxPreviewSub, { color: colors.textSecondary }]}>
              Old Tax Regime Benefit: Reduces taxable income slab by ₹ {totalDeductions.toLocaleString()}.
            </Text>
          </View>

          {/* Submit Action */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: colors.accent },
              saveTaxMutation.isPending && { opacity: 0.7 },
            ]}
            onPress={handleSaveTaxDeclaration}
            disabled={saveTaxMutation.isPending}
            activeOpacity={0.85}
          >
            {saveTaxMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveBtnText}>💾 Save Tax Declaration</Text>
            )}
          </TouchableOpacity>
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
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  fyChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  empChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  taxPreviewBox: {
    padding: 12,
    borderRadius: 10,
    gap: 4,
    marginTop: 4,
  },
  taxPreviewTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  taxPreviewSub: {
    fontSize: 11,
  },
  saveBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
