import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
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
import { useDepartments, useCreateDepartment, Department } from '../../api/hook/useDepartment';
import { useProfile } from '../../api/hook/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Departments'>;

export const DepartmentsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const { width, wp, moderateScale, isSmallDevice } = useResponsive();

  const { data: profileRes } = useProfile();
  const organizationId = profileRes?.data?.user?.organizationId;

  const { data: deptRes, isLoading: isDeptsLoading } = useDepartments(organizationId);
  const departments: Department[] = deptRes?.data || [];

  const { data: empRes } = useEmployees();
  const employees = empRes?.data || [];

  const createDeptMutation = useCreateDepartment();

  const [modalOpen, setModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [isCodeManual, setIsCodeManual] = useState(false);

  // Live Auto-Generation of Department Code from Name
  const generateDeptCode = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return '';
    const words = trimmed.split(/\s+/);
    if (words.length > 1) {
      return words.map(w => w[0]).join('').toUpperCase().slice(0, 5);
    }
    return trimmed.slice(0, 3).toUpperCase();
  };

  const handleNameChange = (val: string) => {
    setNewDeptName(val);
    if (!isCodeManual) {
      setNewDeptCode(generateDeptCode(val));
    }
  };

  const handleCodeChange = (val: string) => {
    setNewDeptCode(val.toUpperCase());
    setIsCodeManual(true);
  };

  const handleCreateDepartment = () => {
    if (!newDeptName.trim()) {
      Alert.alert('Validation Error', 'Department name is required.');
      return;
    }

    const finalCode = (newDeptCode.trim() || generateDeptCode(newDeptName)).toUpperCase();

    createDeptMutation.mutate(
      {
        name: newDeptName.trim(),
        code: finalCode,
        description: newDeptDesc.trim() || undefined,
      },
      {
        onSuccess: () => {
          setModalOpen(false);
          setNewDeptName('');
          setNewDeptCode('');
          setNewDeptDesc('');
          setIsCodeManual(false);
          Alert.alert('Success', `Department "${newDeptName.trim()}" (${finalCode}) created successfully!`);
        },
        onError: (err: any) => {
          const msg =
            err.response?.data?.message ||
            err.message ||
            'Department with this name or code already exists in this organization.';
          Alert.alert('Error', msg);
        },
      }
    );
  };

  const renderDeptCard = ({ item }: { item: Department }) => {
    const headcount = employees.filter(
      e =>
        e.departmentId === item.id ||
        e.department?.id === item.id ||
        (e.department?.name && e.department.name.toLowerCase() === item.name.toLowerCase())
    ).length;

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.codeBadge, { backgroundColor: `${colors.accent}20` }]}>
            <Text style={[styles.codeText, { color: colors.accent }]}>{item.code}</Text>
          </View>
          <View style={styles.headerTitleBox}>
            <Text style={[styles.deptName, { color: colors.textPrimary }]}>{item.name}</Text>
            {item.description ? (
              <Text style={[styles.deptDesc, { color: colors.textSecondary }]}>
                {item.description}
              </Text>
            ) : (
              <Text style={[styles.deptHead, { color: colors.textSecondary }]}>
                Head: {item.manager?.name || 'Unassigned'}
              </Text>
            )}
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countNumber}>{headcount}</Text>
            <Text style={styles.countLabel}>Members</Text>
          </View>
        </View>
      </View>
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary, fontSize: moderateScale(isSmallDevice ? 15 : 18) }]}>
            Departments
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {departments.length} Active Departments
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.accent }]}
          onPress={() => {
            setNewDeptName('');
            setNewDeptCode('');
            setNewDeptDesc('');
            setIsCodeManual(false);
            setModalOpen(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Add Dept</Text>
        </TouchableOpacity>
      </View>

      {isDeptsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading organization departments...
          </Text>
        </View>
      ) : (
        <FlatList
          data={departments}
          renderItem={renderDeptCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Departments Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Tap + Add Dept above to create your organization's first department.
              </Text>
            </View>
          }
        />
      )}

      {/* Add Department Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, borderWidth: isDark ? 1 : 0 }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add New Department</Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DEPARTMENT NAME *</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText },
              ]}
              value={newDeptName}
              onChangeText={handleNameChange}
              placeholder="e.g. Quality Assurance"
              placeholderTextColor={colors.inputPlaceholder}
            />

            <View style={styles.labelRow}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DEPARTMENT CODE *</Text>
              <Text style={[styles.autoNote, { color: colors.accent }]}>Auto-generated (Editable)</Text>
            </View>
            <TextInput
              style={[
                styles.input,
                styles.codeInput,
                { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText },
              ]}
              value={newDeptCode}
              onChangeText={handleCodeChange}
              placeholder="QA"
              placeholderTextColor={colors.inputPlaceholder}
              autoCapitalize="characters"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DESCRIPTION</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText },
              ]}
              value={newDeptDesc}
              onChangeText={setNewDeptDesc}
              placeholder="Brief description of department scope..."
              placeholderTextColor={colors.inputPlaceholder}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setModalOpen(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  { backgroundColor: colors.accent, opacity: createDeptMutation.isPending ? 0.6 : 1 },
                ]}
                onPress={handleCreateDepartment}
                disabled={createDeptMutation.isPending}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                  {createDeptMutation.isPending ? 'Creating...' : 'Create Department'}
                </Text>
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
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 12,
  },
  codeText: {
    fontSize: 14,
    fontWeight: '900',
  },
  headerTitleBox: {
    flex: 1,
  },
  deptName: {
    fontSize: 16,
    fontWeight: '700',
  },
  deptDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  deptHead: {
    fontSize: 12,
    marginTop: 2,
  },
  countBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(100,100,100,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  countNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563eb',
  },
  countLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  autoNote: {
    fontSize: 10,
    fontWeight: '600',
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  codeInput: {
    fontWeight: '800',
    letterSpacing: 1,
  },
  textArea: {
    height: 70,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});
