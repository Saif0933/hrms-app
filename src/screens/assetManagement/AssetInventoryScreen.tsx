import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'AssetInventory'>;

type CategoryType = 'Hardware' | 'Mobile' | 'Keycard' | 'Other';

export const AssetInventoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // TanStack Queries & Mutations
  const { data: assetsRes, isLoading } = useAssets();
  const { data: empRes } = useEmployees();
  const assignAssetMutation = useAssignAsset();

  const employees = empRes?.data || [];

  const assetsList: AssetRecord[] = assetsRes?.data || [
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
      id: 'AST003',
      name: 'iPhone 15 Pro Test Device',
      category: 'Mobile',
      serial: 'DN6H71920K1A',
      assignedTo: 'sam',
      employeeId: 'EMP31723',
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
    {
      id: 'AST005',
      name: 'Lenovo ThinkPad P1 Gen 6',
      category: 'Hardware',
      serial: 'PF-39812-L',
      assignedTo: null,
      employeeId: null,
      status: 'Maintenance',
    },
  ];

  const filteredAssets = assetsList.filter(ast => {
    const matchesCat =
      categoryFilter === 'ALL' || ast.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesSt =
      statusFilter === 'ALL' || ast.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesCat && matchesSt;
  });

  const totalAssigned = assetsList.filter(a => a.status === 'Assigned').length;
  const totalStock = assetsList.filter(a => a.status === 'In Stock').length;
  const totalMaint = assetsList.filter(a => a.status === 'Maintenance').length;

  const handleToggleAssign = (ast: AssetRecord) => {
    const isCurrentlyAssigned = ast.status === 'Assigned';
    const nextEmpId = isCurrentlyAssigned ? null : 'EMP001';

    assignAssetMutation.mutate(
      { id: ast.id, employeeId: nextEmpId },
      {
        onSuccess: () => {
          Alert.alert(
            `Asset ${isCurrentlyAssigned ? 'Revoked ↩️' : 'Assigned 🔄'}`,
            `Asset ${ast.name} has been ${isCurrentlyAssigned ? 'unassigned to In Stock' : 'assigned to Aarav Sharma'}.`
          );
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const getStatusPill = (st: string) => {
    switch (st) {
      case 'Assigned':
        return { bg: '#10b98120', text: '#10b981' };
      case 'In Stock':
        return { bg: '#3b82f620', text: '#3b82f6' };
      case 'Maintenance':
      default:
        return { bg: '#f59e0b20', text: '#f59e0b' };
    }
  };

  const getCategoryIcon = (cat: CategoryType) => {
    switch (cat) {
      case 'Hardware':
        return '💻';
      case 'Mobile':
        return '📱';
      case 'Keycard':
        return '💳';
      case 'Other':
      default:
        return '📦';
    }
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
            Company Asset Inventory
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Hardware, Mobile Devices, Keycards & Equipment Ledger
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addTopBtn, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('RegisterAsset')}
        >
          <Text style={styles.addTopBtnText}>+ Add Asset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Metrics Header */}
        <View style={styles.summaryGrid}>
          <View style={[styles.sumBox, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
            <Text style={[styles.sumVal, { color: '#3b82f6' }]}>{assetsList.length}</Text>
            <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>Total Assets</Text>
          </View>

          <View style={[styles.sumBox, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
            <Text style={[styles.sumVal, { color: '#10b981' }]}>{totalAssigned}</Text>
            <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>Assigned</Text>
          </View>

          <View style={[styles.sumBox, { backgroundColor: 'rgba(139,92,246,0.1)' }]}>
            <Text style={[styles.sumVal, { color: '#8b5cf6' }]}>{totalStock}</Text>
            <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>In Stock</Text>
          </View>

          <View style={[styles.sumBox, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
            <Text style={[styles.sumVal, { color: '#f59e0b' }]}>{totalMaint}</Text>
            <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>Maintenance</Text>
          </View>
        </View>

        {/* Category Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['ALL', 'Hardware', 'Mobile', 'Keycard', 'Other'].map(cat => {
            const isSelected = categoryFilter === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catChip,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.cardBackground,
                    borderColor: isSelected ? colors.accent : colors.cardBorder,
                  },
                ]}
                onPress={() => setCategoryFilter(cat)}
              >
                <Text
                  style={{
                    color: isSelected ? '#ffffff' : colors.textPrimary,
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Assets Roster List */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Assets Ledger ({filteredAssets.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          filteredAssets.map(ast => {
            const pill = getStatusPill(ast.status);
            const icon = getCategoryIcon(ast.category);
            const isAssigned = ast.status === 'Assigned';

            return (
              <View
                key={ast.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.astHeaderRow}>
                  <View style={styles.iconBadge}>
                    <Text style={{ fontSize: 20 }}>{icon}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.astNameText, { color: colors.textPrimary }]}>
                      {ast.name}
                    </Text>
                    <Text style={[styles.astSerialText, { color: colors.textSecondary }]}>
                      Serial #: {ast.serial} • {ast.category}
                    </Text>
                    <Text style={[styles.astAssigneeText, { color: colors.accent }]}>
                      {isAssigned ? `👤 Assigned to: ${ast.assignedTo}` : '📦 In Company Stock'}
                    </Text>
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: pill.text }}>
                      {ast.status}
                    </Text>
                  </View>
                </View>

                {/* Assign / Unassign Action */}
                <TouchableOpacity
                  style={[
                    styles.actionBtn,
                    { borderColor: isAssigned ? '#ef4444' : colors.accent },
                    assignAssetMutation.isPending && { opacity: 0.7 },
                  ]}
                  onPress={() => handleToggleAssign(ast)}
                  disabled={assignAssetMutation.isPending}
                >
                  <Text
                    style={{
                      color: isAssigned ? '#ef4444' : colors.accent,
                      fontSize: 11,
                      fontWeight: '700',
                    }}
                  >
                    {isAssigned ? '↩️ Revoke & Return to Stock' : '🔄 Assign to Employee'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
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
  summaryGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  sumBox: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  sumVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  sumLbl: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  astHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(100,100,100,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  astNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  astSerialText: {
    fontSize: 10,
    marginTop: 1,
  },
  astAssigneeText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionBtn: {
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 4,
  },
});
