import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { useEmployees } from '../../api/hook/useEmployee';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'MusterRoll'>;

type AttendanceStatus = 'P' | 'A' | 'L' | 'WO' | 'HD';

export const MusterRollScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [selectedMonth, setSelectedMonth] = useState('July 2026');

  // TanStack Query
  const { data: empRes, isLoading } = useEmployees();
  const employees = empRes?.data || [];

  // Generate 31 days array
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  const getStatusStyle = (st: AttendanceStatus) => {
    switch (st) {
      case 'P':
        return { bg: '#10b98120', text: '#10b981', border: '#10b981' };
      case 'A':
        return { bg: '#ef444420', text: '#ef4444', border: '#ef4444' };
      case 'L':
        return { bg: '#3b82f620', text: '#3b82f6', border: '#3b82f6' };
      case 'HD':
        return { bg: '#f59e0b20', text: '#f59e0b', border: '#f59e0b' };
      case 'WO':
      default:
        return { bg: 'rgba(100,100,100,0.1)', text: '#94a3b8', border: 'rgba(100,100,100,0.2)' };
    }
  };

  // Mock deterministic generator for demo
  const getEmpDayStatus = (empId: string, day: number): AttendanceStatus => {
    if (day % 7 === 0 || day % 7 === 6) return 'WO';
    if (day === 5 || day === 18) return 'L';
    if (day === 12 || day === 24) return 'A';
    if (day === 8) return 'HD';
    return 'P';
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
            Muster Roll & Calendar
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Monthly Attendance Roster Matrix
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Month Selector Bar */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            🗓️ Select Muster Month
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {['May 2026', 'June 2026', 'July 2026', 'August 2026'].map(mth => {
              const isSelected = selectedMonth === mth;
              return (
                <TouchableOpacity
                  key={mth}
                  style={[
                    styles.monthChip,
                    {
                      backgroundColor: isSelected ? colors.accent : colors.background,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setSelectedMonth(mth)}
                >
                  <Text
                    style={{
                      color: isSelected ? '#fff' : colors.textPrimary,
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {mth}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Status Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>P (Present)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>A (Absent)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>L (Leave)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>HD (Half Day)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#94a3b8' }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>WO (Week Off)</Text>
          </View>
        </View>

        {/* Muster Matrix Grid Table */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            📊 Monthly Muster Matrix ({selectedMonth})
          </Text>

          {isLoading ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.tableGrid}>
                {/* Day Numbers Header Row */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thEmp, { color: colors.textPrimary }]}>Employee Name</Text>
                  {daysInMonth.map(d => (
                    <Text key={d} style={[styles.thDay, { color: colors.textSecondary }]}>
                      {d}
                    </Text>
                  ))}
                </View>

                {/* Employee Row */}
                {employees.map(emp => (
                  <View key={emp.id} style={styles.tableDataRow}>
                    <View style={styles.tdEmpInfo}>
                      <Text style={[styles.empNameText, { color: colors.textPrimary }]}>
                        {emp.name}
                      </Text>
                    </View>

                    {daysInMonth.map(day => {
                      const st = getEmpDayStatus(emp.id, day);
                      const info = getStatusStyle(st);

                      return (
                        <View
                          key={day}
                          style={[
                            styles.statusCell,
                            { backgroundColor: info.bg, borderColor: info.border },
                          ]}
                        >
                          <Text style={[styles.statusCellText, { color: info.text }]}>{st}</Text>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
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
  monthChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tableGrid: {
    minWidth: 1100,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: 'rgba(100,100,100,0.2)',
  },
  thEmp: {
    width: 140,
    fontWeight: '800',
    fontSize: 12,
  },
  thDay: {
    width: 30,
    fontWeight: '700',
    fontSize: 10,
    textAlign: 'center',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: 'rgba(100,100,100,0.1)',
  },
  tdEmpInfo: {
    width: 140,
  },
  empNameText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusCell: {
    width: 28,
    height: 28,
    marginHorizontal: 1,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCellText: {
    fontSize: 9,
    fontWeight: '900',
  },
});
