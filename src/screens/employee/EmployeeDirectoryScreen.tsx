import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
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
import { Employee, useEmployees } from '../../api/hook/useEmployee';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const EmployeeDirectoryScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const { data: response, isLoading, refetch, isRefetching } = useEmployees({
    search: searchQuery ? searchQuery : undefined,
    status: selectedStatus !== 'ALL' ? (selectedStatus as any) : undefined,
  });

  const employees = response?.data || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#22c55e';
      case 'PROBATION':
        return '#eab308';
      case 'ON_LEAVE':
        return '#3b82f6';
      case 'RESIGNED':
        return '#f97316';
      case 'TERMINATED':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const renderEmployeeCard = ({ item }: { item: Employee }) => {
    const statusColor = getStatusColor(item.status);
    const initials = item.name
      ? item.name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : 'EM';

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.cardBorder,
          },
        ]}
        onPress={() => setSelectedEmployee(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.cardHeaderInfo}>
            <Text style={[styles.employeeName, { color: colors.textPrimary }]}>{item.name}</Text>
            <Text style={[styles.employeeDesignation, { color: colors.textSecondary }]}>
              {item.designation || 'Software Engineer'}
            </Text>
            <Text style={[styles.employeeDepartment, { color: colors.textMuted }]}>
              {item.department?.name || 'Engineering'} • {item.location || 'HQ Office'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        <View style={[styles.cardDivider, { backgroundColor: colors.divider }]} />

        <View style={styles.cardFooter}>
          <Text style={[styles.contactText, { color: colors.textSecondary }]}>✉️ {item.email}</Text>
          {item.phone && (
            <Text style={[styles.contactText, { color: colors.textSecondary }]}>📞 {item.phone}</Text>
          )}
        </View>
      </TouchableOpacity>
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Employee Directory</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {employees.length} Members Listed
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('EmployeeMaster', {})}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Filter Bar */}
      <View style={styles.searchSection}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
              color: colors.inputText,
            },
          ]}
          placeholder="Search by name, email or designation..."
          placeholderTextColor={colors.inputPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {['ALL', 'ACTIVE', 'PROBATION', 'ON_LEAVE'].map(status => {
            const isSelected = selectedStatus === status;
            return (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.cardBackground,
                    borderColor: isSelected ? colors.accent : colors.cardBorder,
                  },
                ]}
                onPress={() => setSelectedStatus(status)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    { color: isSelected ? '#ffffff' : colors.textSecondary },
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Employee List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading Employee Directory...
          </Text>
        </View>
      ) : (
        <FlatList
          data={employees}
          renderItem={renderEmployeeCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No Employees Found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Try adjusting your search criteria or add a new employee profile.
              </Text>
            </View>
          }
        />
      )}

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <Modal
          visible={!!selectedEmployee}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedEmployee(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Employee Profile
                </Text>
                <TouchableOpacity onPress={() => setSelectedEmployee(null)}>
                  <Text style={[styles.closeIcon, { color: colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={[styles.detailName, { color: colors.textPrimary }]}>
                  {selectedEmployee.name}
                </Text>
                <Text style={[styles.detailRole, { color: colors.textSecondary }]}>
                  {selectedEmployee.designation || 'Employee'} • {selectedEmployee.department?.name || 'General'}
                </Text>

                <View style={styles.detailGrid}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Email:</Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                      {selectedEmployee.email}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Phone:</Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                      {selectedEmployee.phone || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Joined:</Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
                      {selectedEmployee.joiningDate ? new Date(selectedEmployee.joiningDate).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Status:</Text>
                    <Text style={[styles.detailValue, { color: getStatusColor(selectedEmployee.status) }]}>
                      {selectedEmployee.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalActionButtons}>
                  <TouchableOpacity
                    style={[styles.modalPrimaryBtn, { backgroundColor: colors.accent }]}
                    onPress={() => {
                      const empId = selectedEmployee.id;
                      setSelectedEmployee(null);
                      navigation.navigate('EmployeeMaster', { employeeId: empId });
                    }}
                  >
                    <Text style={styles.modalPrimaryBtnText}>Edit Full Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalSecondaryBtn, { borderColor: colors.cardBorder }]}
                    onPress={() => {
                      const empId = selectedEmployee.id;
                      setSelectedEmployee(null);
                      navigation.navigate('IdCardGenerator', { employeeId: empId });
                    }}
                  >
                    <Text style={[styles.modalSecondaryBtnText, { color: colors.textPrimary }]}>
                      View ID Card
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  searchInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '700',
  },
  employeeDesignation: {
    fontSize: 13,
    marginTop: 2,
  },
  employeeDepartment: {
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  contactText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 320,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeIcon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    gap: 12,
  },
  detailName: {
    fontSize: 20,
    fontWeight: '700',
  },
  detailRole: {
    fontSize: 14,
  },
  detailGrid: {
    marginTop: 8,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalPrimaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  modalSecondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalSecondaryBtnText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
