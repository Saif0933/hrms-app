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
import { useCreateAsset } from '../../api/hook/useAssets';
import { useEmployees } from '../../api/hook/useEmployee';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'RegisterAsset'>;

type CategoryType = 'Hardware' | 'Mobile' | 'Keycard' | 'Other';

export const RegisterAssetScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [assetName, setAssetName] = useState('MacBook Pro M3 Max 16"');
  const [category, setCategory] = useState<CategoryType>('Hardware');
  const [serial, setSerial] = useState('C02G8192MD6M');
  const [assignedEmpId, setAssignedEmpId] = useState<string | null>(null);

  // TanStack Queries & Mutations
  const { data: empRes } = useEmployees();
  const createAssetMutation = useCreateAsset();

  const employees = empRes?.data || [];

  const handleRegisterAsset = () => {
    if (!assetName.trim() || !serial.trim()) {
      Alert.alert('Validation Error', 'Please complete Asset Name and Serial Number.');
      return;
    }

    createAssetMutation.mutate(
      {
        name: assetName.trim(),
        category,
        serial: serial.trim(),
        employeeId: assignedEmpId || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Asset Registered 💻',
            `${assetName} (${serial}) registered in inventory ledger!`
          );
          navigation.goBack();
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const categoriesList: { key: CategoryType; label: string; icon: string }[] = [
    { key: 'Hardware', label: 'Laptop / Hardware', icon: '💻' },
    { key: 'Mobile', label: 'Mobile Device', icon: '📱' },
    { key: 'Keycard', label: 'RFID Keycard', icon: '💳' },
    { key: 'Other', label: 'Other Asset', icon: '📦' },
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
            Register New Asset
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Add Equipment & Hardware to Company Inventory Ledger
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Category Selector */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ASSET CATEGORY *</Text>
          <View style={styles.catGrid}>
            {categoriesList.map(cat => {
              const isSelected = category === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.catBox,
                    {
                      backgroundColor: isSelected ? 'rgba(59,130,246,0.15)' : colors.background,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setCategory(cat.key)}
                >
                  <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.catLabel,
                      { color: isSelected ? colors.accent : colors.textPrimary },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Form Inputs Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ASSET NAME & MODEL *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={assetName}
            onChangeText={setAssetName}
            placeholder="e.g. MacBook Pro M3 Max 16"
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SERIAL NUMBER / TAG *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={serial}
            onChangeText={setSerial}
            placeholder="e.g. C02G8192MD6M"
          />

          {/* Initial Assignment Selector */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>INITIAL EMPLOYEE ASSIGNMENT (OPTIONAL)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
            <TouchableOpacity
              style={[
                styles.empChip,
                {
                  backgroundColor: assignedEmpId === null ? colors.accent : colors.background,
                  borderColor: assignedEmpId === null ? colors.accent : colors.cardBorder,
                },
              ]}
              onPress={() => setAssignedEmpId(null)}
            >
              <Text style={{ color: assignedEmpId === null ? '#fff' : colors.textPrimary, fontWeight: '700', fontSize: 11 }}>
                📦 Keep in Stock (Unassigned)
              </Text>
            </TouchableOpacity>

            {employees.length > 0
              ? employees.map(emp => {
                  const isSelected = assignedEmpId === emp.id;
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
                      onPress={() => setAssignedEmpId(emp.id)}
                    >
                      <Text style={{ color: isSelected ? '#fff' : colors.textPrimary, fontWeight: '700', fontSize: 11 }}>
                        👤 {emp.name}
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
                        backgroundColor: assignedEmpId === id ? colors.accent : colors.background,
                        borderColor: assignedEmpId === id ? colors.accent : colors.cardBorder,
                      },
                    ]}
                    onPress={() => setAssignedEmpId(id)}
                  >
                    <Text style={{ color: assignedEmpId === id ? '#fff' : colors.textPrimary, fontWeight: '700', fontSize: 11 }}>
                      👤 {id === 'EMP001' ? 'Aarav Sharma' : id === 'EMP31723' ? 'sam' : 'Neha Patel'}
                    </Text>
                  </TouchableOpacity>
                ))}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: colors.accent },
              createAssetMutation.isPending && { opacity: 0.7 },
            ]}
            onPress={handleRegisterAsset}
            disabled={createAssetMutation.isPending}
            activeOpacity={0.85}
          >
            {createAssetMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>🚀 Register Asset in Inventory</Text>
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
  catGrid: {
    gap: 8,
    marginTop: 4,
  },
  catBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  catLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  empChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
  },
  submitBtn: {
    marginTop: 10,
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
