import React from 'react';
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Employee, useEmployees } from '../../api/hook/useEmployee';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'ResignationArchive'>;

export const ResignationArchiveScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const { data: resignedRes } = useEmployees({ status: 'RESIGNED' });
  const { data: terminatedRes } = useEmployees({ status: 'TERMINATED' });

  const resignedEmployees = resignedRes?.data || [];
  const terminatedEmployees = terminatedRes?.data || [];
  const archivedEmployees = [...resignedEmployees, ...terminatedEmployees];

  const renderArchiveCard = ({ item }: { item: Employee }) => {
    const isTerminated = item.status === 'TERMINATED';

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={[styles.empName, { color: colors.textPrimary }]}>{item.name}</Text>
            <Text style={[styles.empRole, { color: colors.textSecondary }]}>
              {item.designation || 'Former Employee'} • {item.department?.name || 'Department'}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isTerminated ? '#ef444420' : '#f9731620' },
            ]}
          >
            <Text style={{ color: isTerminated ? '#ef4444' : '#f97316', fontSize: 11, fontWeight: '800' }}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Email:</Text>
          <Text style={[styles.infoVal, { color: colors.textPrimary }]}>{item.email}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Exit Date:</Text>
          <Text style={[styles.infoVal, { color: colors.textPrimary }]}>
            {item.exitDate ? new Date(item.exitDate).toLocaleDateString() : 'Recorded in HR System'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.viewSettlementBtn, { borderColor: colors.accent }]}
          onPress={() => navigation.navigate('ExitSettlement', { employeeId: item.id })}
        >
          <Text style={[styles.viewSettlementBtnText, { color: colors.accent }]}>
            View Clearance Details
          </Text>
        </TouchableOpacity>
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Resignation Archive</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Former Employee Records & Alumni
          </Text>
        </View>
      </View>

      <FlatList
        data={archivedEmployees}
        renderItem={renderArchiveCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📁</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Archive Empty</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              No resigned or terminated employee records found in archive.
            </Text>
          </View>
        }
      />
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  empName: {
    fontSize: 16,
    fontWeight: '700',
  },
  empRole: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  infoLabel: {
    fontSize: 12,
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewSettlementBtn: {
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  viewSettlementBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
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
  },
});
