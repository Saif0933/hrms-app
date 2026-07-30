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
import { useApplyClaim } from '../../api/hook/useTravelClaims';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'NewTravelRequest'>;

type ClaimType = 'Travel' | 'Mileage' | 'Food' | 'Accommodation' | 'Other';

export const NewTravelRequestScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [selectedEmpId, setSelectedEmpId] = useState<string>('EMP001');
  const [claimType, setClaimType] = useState<ClaimType>('Travel');
  const [amount, setAmount] = useState('12500');
  const [claimDate, setClaimDate] = useState('2026-07-30');
  const [reason, setReason] = useState('Client site visit & software deployment in Mumbai');
  const [receiptUrl, setReceiptUrl] = useState('https://receipts.symbosys.com/r_98124.pdf');

  // TanStack Queries & Mutations
  const { data: empRes } = useEmployees();
  const applyClaimMutation = useApplyClaim();

  const employees = empRes?.data || [];

  const handleApplyClaim = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0 || !reason.trim()) {
      Alert.alert('Validation Error', 'Please enter a valid expense amount and reason.');
      return;
    }

    applyClaimMutation.mutate(
      {
        employeeId: selectedEmpId,
        type: claimType,
        amount: amt,
        date: claimDate,
        reason: reason.trim(),
        receiptUrl: receiptUrl.trim() || null,
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Expense Claim Submitted ✈️',
            `Your ${claimType} reimbursement claim for ₹${amt.toLocaleString()} has been submitted for manager approval.`
          );
          navigation.goBack();
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const typesList: { key: ClaimType; label: string; icon: string }[] = [
    { key: 'Travel', label: 'Travel', icon: '✈️' },
    { key: 'Mileage', label: 'Mileage', icon: '🚗' },
    { key: 'Food', label: 'Food', icon: '🍲' },
    { key: 'Accommodation', label: 'Hotel & Stay', icon: '🏨' },
    { key: 'Other', label: 'Other', icon: '📁' },
  ];

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
            New Travel & Expense Claim
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Reimbursement Request & Travel Advance Form
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Employee Picker */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SELECT EMPLOYEE *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {employees.length > 0
              ? employees.map(emp => {
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
                        {emp.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              : ['EMP001', 'EMP002', 'EMP31723'].map(id => (
                  <TouchableOpacity
                    key={id}
                    style={[
                      styles.empChip,
                      {
                        backgroundColor: selectedEmpId === id ? colors.accent : colors.background,
                        borderColor: selectedEmpId === id ? colors.accent : colors.cardBorder,
                      },
                    ]}
                    onPress={() => setSelectedEmpId(id)}
                  >
                    <Text
                      style={{
                        color: selectedEmpId === id ? '#ffffff' : colors.textPrimary,
                        fontWeight: '700',
                        fontSize: 12,
                      }}
                    >
                      {id === 'EMP001' ? 'Aarav Sharma' : id === 'EMP31723' ? 'sam' : 'Neha Patel'}
                    </Text>
                  </TouchableOpacity>
                ))}
          </ScrollView>
        </View>

        {/* Claim Category Selector */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EXPENSE CATEGORY *</Text>
          <View style={styles.typesGrid}>
            {typesList.map(t => {
              const isSelected = claimType === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.typeBox,
                    {
                      backgroundColor: isSelected ? 'rgba(59,130,246,0.15)' : colors.background,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setClaimType(t.key)}
                >
                  <Text style={{ fontSize: 22 }}>{t.icon}</Text>
                  <Text
                    style={[
                      styles.typeLabel,
                      { color: isSelected ? colors.accent : colors.textPrimary },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Claim Details Form */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            CLAIM AMOUNT (₹) *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.inputText,
              },
            ]}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="e.g. 5000"
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EXPENSE DATE *</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.inputText,
              },
            ]}
            value={claimDate}
            onChangeText={setClaimDate}
            placeholder="YYYY-MM-DD"
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            REASON & BUSINESS PURPOSE *
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.inputText,
              },
            ]}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            RECEIPT / INVOICE ATTACHMENT URL
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.inputText,
              },
            ]}
            value={receiptUrl}
            onChangeText={setReceiptUrl}
            placeholder="https://..."
          />

          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: colors.accent },
              applyClaimMutation.isPending && { opacity: 0.7 },
            ]}
            onPress={handleApplyClaim}
            disabled={applyClaimMutation.isPending}
            activeOpacity={0.85}
          >
            {applyClaimMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>🚀 Submit Expense Claim</Text>
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
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  empChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginTop: 4,
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  typeBox: {
    width: '31%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 70,
  },
  submitBtn: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
