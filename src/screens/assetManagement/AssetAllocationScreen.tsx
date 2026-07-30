import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AssetRecord, useAssets, useAssignAsset } from '../../api/hook/useAssets';
import { useEmployees } from '../../api/hook/useEmployee';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AssetAllocation'>;

export const AssetAllocationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [selectedEmpId, setSelectedEmpId] = useState('EMP001');

  // Assign Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStockAssetId, setSelectedStockAssetId] = useState<string | null>(null);

  // TanStack Queries & Mutations
  const { data: empRes } = useEmployees();
  const { data: assetsRes, isLoading } = useAssets();
  const assignAssetMutation = useAssignAsset();

  const employees = empRes?.data || [];
  const allAssets: AssetRecord[] = assetsRes?.data || [
    {
      id: 'AST001',
      name: 'MacBook Pro M3 Max 16"',
      category: 'Hardware',
      serial: 'C02G8192MD6M',
      assignedTo: 'Aarav Sharma',
      employeeId: 'EMP001',
      status: 'Assigned',
    },
    {
      id: 'AST002',
      name: 'Dell UltraSharp 27" 4K Monitor',
      category: 'Hardware',
      serial: 'CN-09812-441',
      assignedTo: 'Aarav Sharma',
      employeeId: 'EMP001',
      status: 'Assigned',
    },
    {
      id: 'AST004',
      name: 'NFC RFID Smart Keycard',
      category: 'Keycard',
      serial: 'KC-88412-A',
      assignedTo: null,
      employeeId: null,
      status: 'In Stock',
    },
  ];

  // Employee's currently assigned assets
  const assignedAssets = allAssets.filter(
    a => a.employeeId === selectedEmpId || (selectedEmpId === 'EMP001' && a.assignedTo === 'Aarav Sharma')
  );

  // Unassigned assets in stock available for allocation
  const stockAssets = allAssets.filter(a => a.status === 'In Stock' || !a.employeeId);

  const handleAssignAssetToEmployee = () => {
    if (!selectedStockAssetId) {
      Alert.alert('Selection Error', 'Please select an available stock asset to assign.');
      return;
    }

    assignAssetMutation.mutate(
      { id: selectedStockAssetId, employeeId: selectedEmpId },
      {
        onSuccess: () => {
          setModalOpen(false);
          setSelectedStockAssetId(null);
          Alert.alert('Asset Allocated 💻', 'Selected asset has been allocated to employee profile!');
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const handleRevokeAsset = (astId: string, name: string) => {
    assignAssetMutation.mutate(
      { id: astId, employeeId: null },
      {
        onSuccess: () => {
          Alert.alert('Asset Unassigned ↩️', `${name} returned to company stock.`);
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
            Employee Asset Allocation
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Assigned Hardware, Serials & Keycard Management
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addTopBtn, { backgroundColor: colors.accent }]}
          onPress={() => setModalOpen(true)}
        >
          <Text style={styles.addTopBtnText}>+ Assign Asset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Employee Selector */}
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
                      <Text style={{ color: isSelected ? '#fff' : colors.textPrimary, fontWeight: '700', fontSize: 11 }}>
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
                    <Text style={{ color: selectedEmpId === id ? '#fff' : colors.textPrimary, fontWeight: '700', fontSize: 11 }}>
                      {id === 'EMP001' ? 'Aarav Sharma' : id === 'EMP31723' ? 'sam' : 'Neha Patel'}
                    </Text>
                  </TouchableOpacity>
                ))}
          </ScrollView>
        </View>

        {/* Allocated Hardware Roster */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Allocated Hardware & Assets ({assignedAssets.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          assignedAssets.map(ast => (
            <View
              key={ast.id}
              style={[
                styles.card,
                { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.assetRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.astNameText, { color: colors.textPrimary }]}>
                    💻 {ast.name}
                  </Text>
                  <Text style={[styles.astSerialText, { color: colors.textSecondary }]}>
                    Serial #: {ast.serial} • {ast.category}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.revokeBtn, { borderColor: '#ef4444' }]}
                  onPress={() => handleRevokeAsset(ast.id, ast.name)}
                >
                  <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '700' }}>
                    ↩️ Revoke
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {assignedAssets.length === 0 && !isLoading && (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            No hardware or devices currently assigned to this employee.
          </Text>
        )}
      </ScrollView>

      {/* Assign Asset Modal */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Assign Stock Asset to Employee
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SELECT IN-STOCK ASSET *</Text>
            {stockAssets.length > 0 ? (
              stockAssets.map(ast => {
                const isSelected = selectedStockAssetId === ast.id;
                return (
                  <TouchableOpacity
                    key={ast.id}
                    style={[
                      styles.stockItemBox,
                      {
                        backgroundColor: isSelected ? 'rgba(59,130,246,0.15)' : colors.background,
                        borderColor: isSelected ? colors.accent : colors.cardBorder,
                      },
                    ]}
                    onPress={() => setSelectedStockAssetId(ast.id)}
                  >
                    <Text style={[styles.stockItemTitle, { color: colors.textPrimary }]}>
                      📦 {ast.name} ({ast.category})
                    </Text>
                    <Text style={[styles.stockItemSerial, { color: colors.textSecondary }]}>
                      Serial: {ast.serial}
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={{ color: colors.textSecondary, fontSize: 12, paddingVertical: 10 }}>
                No unassigned assets available in company stock.
              </Text>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setModalOpen(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.accent }]}
                onPress={handleAssignAssetToEmployee}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Confirm Assignment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addTopBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addTopBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  astNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  astSerialText: {
    fontSize: 11,
    marginTop: 2,
  },
  revokeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  stockItemBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
  },
  stockItemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  stockItemSerial: {
    fontSize: 10,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});
