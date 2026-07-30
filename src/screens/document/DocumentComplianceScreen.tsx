import React from 'react';
import {
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
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'DocumentCompliance'>;

interface ComplianceMetric {
  id: string;
  title: string;
  count: number;
  status: 'compliant' | 'warning' | 'critical';
  description: string;
}

const mockMetrics: ComplianceMetric[] = [
  {
    id: '1',
    title: 'Identity Verification (ID/Passport)',
    count: 142,
    status: 'compliant',
    description: '98.5% employees have verified ID documents uploaded.',
  },
  {
    id: '2',
    title: 'Employment Contracts',
    count: 140,
    status: 'compliant',
    description: 'All active staff signed employment contracts archived.',
  },
  {
    id: '3',
    title: 'Tax & Declarations (Form 16/W4)',
    count: 12,
    status: 'warning',
    description: '12 employees missing annual tax declaration attachments.',
  },
  {
    id: '4',
    title: 'Expiring Visas / Work Permits',
    count: 4,
    status: 'critical',
    description: '4 work permits expiring within next 30 days.',
  },
];

export const DocumentComplianceScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const getStatusColor = (status: ComplianceMetric['status']) => {
    switch (status) {
      case 'compliant':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'critical':
        return '#EF4444';
      default:
        return colors.textSecondary;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Banner Card */}
        <View style={[styles.headerCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Document Compliance Overview</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Real-time audit tracking for organization document verification and validity.
          </Text>
          <View style={styles.overallBadge}>
            <View style={[styles.dot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.badgeText}>Overall Compliance: 94.2%</Text>
          </View>
        </View>

        {/* Audit Metrics Checklist */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Compliance Categories</Text>
        {mockMetrics.map((item) => (
          <View
            key={item.id}
            style={[styles.metricCard, { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder }]}
          >
            <View style={styles.metricHeader}>
              <View style={styles.metricTitleRow}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                <Text style={[styles.metricTitle, { color: colors.textPrimary }]}>{item.title}</Text>
              </View>
              <Text style={[styles.metricCount, { color: getStatusColor(item.status) }]}>
                {item.count} items
              </Text>
            </View>
            <Text style={[styles.metricDesc, { color: colors.textSecondary }]}>
              {item.description}
            </Text>
          </View>
        ))}

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('DocumentVault')}
        >
          <Text style={styles.actionBtnText}>Go to Document Vault</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  overallBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeText: {
    color: '#10B981',
    fontWeight: '600',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  metricCard: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  metricTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  metricCount: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  metricDesc: {
    fontSize: 13,
    lineHeight: 18,
    paddingLeft: 20,
  },
  actionBtn: {
    marginTop: 12,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
