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
import { useDeleteDocument, useDocuments, VaultDoc } from '../../api/hook/useDocuments';
import { useEmployees } from '../../api/hook/useEmployee';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'DocumentVault'>;

type CategoryType = 'Identity' | 'Contract' | 'Academic' | 'Tax';

export const DocumentVaultScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [selectedEmpId, setSelectedEmpId] = useState('EMP001');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedDocPreview, setSelectedDocPreview] = useState<VaultDoc | null>(null);

  // TanStack Queries & Mutations
  const { data: empRes } = useEmployees();
  const { data: docsRes, isLoading } = useDocuments({ employeeId: selectedEmpId });
  const deleteDocMutation = useDeleteDocument();

  const employees = empRes?.data || [];

  const docsList: VaultDoc[] = docsRes?.data || [
    {
      id: 'DOC001',
      employeeId: 'EMP001',
      name: 'Aadhaar_Card_Verified.pdf',
      category: 'Identity',
      uploadedOn: '2025-04-12',
      expiresOn: null,
      status: 'Active',
    },
    {
      id: 'DOC002',
      employeeId: 'EMP001',
      name: 'Employment_Agreement_2026.pdf',
      category: 'Contract',
      uploadedOn: '2026-01-15',
      expiresOn: '2026-08-15',
      status: 'Expiring Soon',
    },
    {
      id: 'DOC003',
      employeeId: 'EMP001',
      name: 'Form16_Tax_Return_2025.pdf',
      category: 'Tax',
      uploadedOn: '2025-06-30',
      expiresOn: '2026-03-31',
      status: 'Active',
    },
    {
      id: 'DOC004',
      employeeId: 'EMP001',
      name: 'BTech_Degree_Certificate.pdf',
      category: 'Academic',
      uploadedOn: '2024-08-20',
      expiresOn: null,
      status: 'Active',
    },
    {
      id: 'DOC005',
      employeeId: 'EMP001',
      name: 'Passport_Scan_Copy.pdf',
      category: 'Identity',
      uploadedOn: '2021-02-10',
      expiresOn: '2026-02-10',
      status: 'Expired',
    },
  ];

  const filteredDocs = docsList.filter(doc => {
    if (categoryFilter === 'ALL') return true;
    return doc.category.toLowerCase() === categoryFilter.toLowerCase();
  });

  const activeCount = docsList.filter(d => d.status === 'Active').length;
  const expiringCount = docsList.filter(d => d.status === 'Expiring Soon').length;
  const expiredCount = docsList.filter(d => d.status === 'Expired').length;

  const handleDeleteDoc = (id: string, name: string) => {
    Alert.alert('Delete Document', `Are you sure you want to delete ${name} from vault?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteDocMutation.mutate(id, {
            onSuccess: () => {
              Alert.alert('Document Deleted 🗑️', `${name} removed from secure vault.`);
            },
            onError: err => Alert.alert('Error', err.message),
          });
        },
      },
    ]);
  };

  const getStatusPill = (st: string) => {
    switch (st) {
      case 'Active':
        return { bg: '#10b98120', text: '#10b981' };
      case 'Expiring Soon':
        return { bg: '#f59e0b20', text: '#f59e0b' };
      case 'Expired':
      default:
        return { bg: '#ef444420', text: '#ef4444' };
    }
  };

  const getCategoryIcon = (cat: CategoryType) => {
    switch (cat) {
      case 'Identity':
        return '🪪';
      case 'Contract':
        return '📄';
      case 'Academic':
        return '🎓';
      case 'Tax':
        return '🏦';
      default:
        return '📁';
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
            Secure Document Vault
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Encrypted Employee Documents & Verification Vault
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addTopBtn, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('UploadDocument')}
        >
          <Text style={styles.addTopBtnText}>+ Upload</Text>
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
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SELECT EMPLOYEE VAULT *</Text>
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

        {/* Vault Summary Metrics */}
        <View style={styles.summaryGrid}>
          <View style={[styles.sumBox, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
            <Text style={[styles.sumVal, { color: '#10b981' }]}>{activeCount}</Text>
            <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>Active</Text>
          </View>

          <View style={[styles.sumBox, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
            <Text style={[styles.sumVal, { color: '#f59e0b' }]}>{expiringCount}</Text>
            <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>Expiring Soon</Text>
          </View>

          <View style={[styles.sumBox, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
            <Text style={[styles.sumVal, { color: '#ef4444' }]}>{expiredCount}</Text>
            <Text style={[styles.sumLbl, { color: colors.textSecondary }]}>Expired</Text>
          </View>
        </View>

        {/* Category Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['ALL', 'Identity', 'Contract', 'Academic', 'Tax'].map(cat => {
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

        {/* Vault Documents List */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Vault Documents ({filteredDocs.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          filteredDocs.map(doc => {
            const pill = getStatusPill(doc.status);
            const icon = getCategoryIcon(doc.category);

            return (
              <View
                key={doc.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.docHeaderRow}>
                  <View style={styles.iconBadge}>
                    <Text style={{ fontSize: 20 }}>{icon}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.docNameText, { color: colors.textPrimary }]}>
                      {doc.name}
                    </Text>
                    <Text style={[styles.docMetaText, { color: colors.textSecondary }]}>
                      {doc.category} • Uploaded on {doc.uploadedOn}
                    </Text>
                    {doc.expiresOn && (
                      <Text style={[styles.docExpiryText, { color: pill.text }]}>
                        Expires: {doc.expiresOn}
                      </Text>
                    )}
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: pill.text }}>
                      {doc.status}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={[styles.docActionRow, { borderTopColor: colors.cardBorder }]}>
                  <TouchableOpacity
                    style={[styles.actionViewBtn, { borderColor: colors.accent }]}
                    onPress={() => setSelectedDocPreview(doc)}
                  >
                    <Text style={[styles.actionViewText, { color: colors.accent }]}>
                      📄 Preview Document
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionDeleteBtn, { borderColor: '#ef4444' }]}
                    onPress={() => handleDeleteDoc(doc.id, doc.name)}
                  >
                    <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '700' }}>
                      🗑️ Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Document Preview Modal */}
      <Modal visible={!!selectedDocPreview} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {selectedDocPreview?.name}
            </Text>
            <View style={[styles.previewBox, { backgroundColor: colors.background }]}>
              <Text style={{ fontSize: 36 }}>📄</Text>
              <Text style={[styles.previewCategory, { color: colors.accent }]}>
                {selectedDocPreview?.category} Document
              </Text>
              <Text style={[styles.previewSub, { color: colors.textSecondary }]}>
                Uploaded on {selectedDocPreview?.uploadedOn} • Status: {selectedDocPreview?.status}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: colors.accent }]}
              onPress={() => setSelectedDocPreview(null)}
            >
              <Text style={{ color: '#fff', fontWeight: '700' }}>Close Preview</Text>
            </TouchableOpacity>
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
  summaryGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  sumBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sumVal: {
    fontSize: 20,
    fontWeight: '900',
  },
  sumLbl: {
    fontSize: 10,
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
  docHeaderRow: {
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
  docNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  docMetaText: {
    fontSize: 10,
    marginTop: 1,
  },
  docExpiryText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  docActionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  actionViewBtn: {
    flex: 2,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionViewText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionDeleteBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
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
    gap: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  previewBox: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  previewCategory: {
    fontSize: 14,
    fontWeight: '800',
  },
  previewSub: {
    fontSize: 11,
  },
  modalCloseBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});
