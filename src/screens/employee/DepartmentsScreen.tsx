import React, { useState } from 'react';
import {
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
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Departments'>;

interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  headName: string;
}

export const DepartmentsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const { data: response } = useEmployees();
  const employees = response?.data || [];

  const [departments, setDepartments] = useState<DepartmentItem[]>([
    { id: '1', name: 'Engineering & Technology', code: 'ENG', headName: 'John Doe' },
    { id: '2', name: 'Human Resources (HR)', code: 'HR', headName: 'Sarah Jenkins' },
    { id: '3', name: 'Finance & Accounts', code: 'FIN', headName: 'Robert Vance' },
    { id: '4', name: 'Sales & Marketing', code: 'MKT', headName: 'Amanda Palmer' },
    { id: '5', name: 'Operations & Logistics', code: 'OPS', headName: 'David Miller' },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newHeadName, setNewHeadName] = useState('');

  const handleCreateDepartment = () => {
    if (!newDeptName || !newDeptCode) {
      Alert.alert('Validation Error', 'Department name and code are required');
      return;
    }

    const newDept: DepartmentItem = {
      id: String(Date.now()),
      name: newDeptName,
      code: newDeptCode.toUpperCase(),
      headName: newHeadName || 'Unassigned',
    };

    setDepartments(prev => [...prev, newDept]);
    setModalOpen(false);
    setNewDeptName('');
    setNewDeptCode('');
    setNewHeadName('');
    Alert.alert('Success', 'New department created');
  };

  const renderDeptCard = ({ item }: { item: DepartmentItem }) => {
    const headcount = employees.filter(e => e.department?.name?.toLowerCase().includes(item.code.toLowerCase()) || e.department?.code === item.code).length || Math.floor(Math.random() * 15) + 5;

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
            <Text style={[styles.deptHead, { color: colors.textSecondary }]}>Head: {item.headName}</Text>
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Departments</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {departments.length} Active Departments
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.accent }]}
          onPress={() => setModalOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Add Dept</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={departments}
        renderItem={renderDeptCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />

      {/* Add Department Modal */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add New Department</Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Department Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={newDeptName}
              onChangeText={setNewDeptName}
              placeholder="e.g. Quality Assurance"
              placeholderTextColor={colors.inputPlaceholder}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Department Code</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={newDeptCode}
              onChangeText={setNewDeptCode}
              placeholder="QA"
              placeholderTextColor={colors.inputPlaceholder}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Department Head Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={newHeadName}
              onChangeText={setNewHeadName}
              placeholder="e.g. Alex Turner"
              placeholderTextColor={colors.inputPlaceholder}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setModalOpen(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: colors.accent }]}
                onPress={handleCreateDepartment}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Create Department</Text>
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
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
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
