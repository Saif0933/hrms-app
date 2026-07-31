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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { IssuedLetter, useIssuedLetters } from '../../api/hook/useLetters';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'IssuedLettersArchive'>;

export const IssuedLettersArchiveScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [templateFilter, setTemplateFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Document Preview Modal State
  const [selectedLetterPreview, setSelectedLetterPreview] = useState<IssuedLetter | null>(null);

  // TanStack Query
  const { data: lettersRes, isLoading } = useIssuedLetters();

  const lettersList: IssuedLetter[] = lettersRes?.data || [
    {
      id: 'LTR001',
      templateType: 'offer',
      recipientName: 'Aarav Sharma',
      recipientRole: 'Senior Full Stack Engineer',
      joiningDate: '2026-08-01',
      salaryCtc: '₹14,50,000 / yr',
      warningReason: null,
      createdAt: '2026-07-28',
    },
    {
      id: 'LTR002',
      templateType: 'warning',
      recipientName: 'sam',
      recipientRole: 'UI/UX Designer',
      joiningDate: null,
      salaryCtc: null,
      warningReason: 'Missed consecutive sprint delivery deadlines & client design reviews',
      createdAt: '2026-07-25',
    },
    {
      id: 'LTR003',
      templateType: 'experience',
      recipientName: 'Neha Patel',
      recipientRole: 'Lead Quality Assurance Engineer',
      joiningDate: '2026-07-20',
      salaryCtc: null,
      warningReason: null,
      createdAt: '2026-07-20',
    },
  ];

  const filteredLetters = lettersList.filter(ltr => {
    const matchesFilter =
      templateFilter === 'ALL' || ltr.templateType.toLowerCase() === templateFilter.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      ltr.recipientName.toLowerCase().includes(query) ||
      ltr.recipientRole.toLowerCase().includes(query);

    return matchesFilter && matchesSearch;
  });

  const getTemplatePill = (tp: string) => {
    switch (tp) {
      case 'offer':
        return { bg: '#10b98120', text: '#10b981', label: 'OFFER LETTER' };
      case 'warning':
        return { bg: '#ef444420', text: '#ef4444', label: 'WARNING NOTICE' };
      case 'experience':
      default:
        return { bg: '#3b82f620', text: '#3b82f6', label: 'RELIEVING / EXP' };
    }
  };

  const getTemplateIcon = (tp: string) => {
    switch (tp) {
      case 'offer':
        return '📄';
      case 'warning':
        return '⚠️';
      case 'experience':
      default:
        return '🎓';
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
            Issued Letters Archive
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Historical Repository of Corporate Letterhead Issued Documents
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addTopBtn, { backgroundColor: colors.accent }]}
          onPress={() => navigation.navigate('GenerateLetter')}
        >
          <Text style={styles.addTopBtnText}>+ New Letter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.cardBorder,
              color: colors.textPrimary,
            },
          ]}
          placeholder="Search by recipient name or role..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Template Filter Tabs */}
        <View style={styles.tabRow}>
          {[
            { key: 'ALL', label: 'ALL' },
            { key: 'offer', label: 'Offer' },
            { key: 'warning', label: 'Warning' },
            { key: 'experience', label: 'Experience' },
          ].map(t => {
            const isSelected = templateFilter === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: isSelected ? colors.accent : colors.cardBackground,
                    borderColor: isSelected ? colors.accent : colors.cardBorder,
                  },
                ]}
                onPress={() => setTemplateFilter(t.key)}
              >
                <Text
                  style={{
                    color: isSelected ? '#ffffff' : colors.textPrimary,
                    fontSize: 11,
                    fontWeight: '700',
                  }}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Letters Roster */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Issued Documents Archive ({filteredLetters.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          filteredLetters.map(ltr => {
            const pill = getTemplatePill(ltr.templateType);
            const icon = getTemplateIcon(ltr.templateType);

            return (
              <View
                key={ltr.id}
                style={[
                  styles.card,
                  { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.ltrHeaderRow}>
                  <View style={styles.iconBadge}>
                    <Text style={{ fontSize: 20 }}>{icon}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={[styles.recipientText, { color: colors.textPrimary }]}>
                      {ltr.recipientName}
                    </Text>
                    <Text style={[styles.roleText, { color: colors.accent }]}>
                      💼 {ltr.recipientRole}
                    </Text>
                    <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                      Issued on {ltr.createdAt}
                    </Text>
                  </View>

                  <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: pill.text }}>
                      {pill.label}
                    </Text>
                  </View>
                </View>

                {/* Additional Metadata */}
                {ltr.salaryCtc && (
                  <Text style={[styles.metaText, { color: colors.textPrimary }]}>
                    💰 Offerees Annual CTC: <Text style={{ fontWeight: '800' }}>{ltr.salaryCtc}</Text>
                  </Text>
                )}

                {ltr.warningReason && (
                  <Text style={[styles.metaText, { color: colors.textPrimary }]}>
                    ⚠️ Incident Notes: "{ltr.warningReason}"
                  </Text>
                )}

                {/* Action Buttons */}
                <View style={[styles.actionRow, { borderTopColor: colors.cardBorder }]}>
                  <TouchableOpacity
                    style={[styles.previewBtn, { borderColor: colors.accent }]}
                    onPress={() => setSelectedLetterPreview(ltr)}
                  >
                    <Text style={[styles.previewBtnText, { color: colors.accent }]}>
                      📄 Preview Letterhead
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.downloadBtn, { backgroundColor: colors.accent }]}
                    onPress={() => Alert.alert('PDF Download', `Downloading ${ltr.recipientName}_${ltr.templateType}.pdf...`)}
                  >
                    <Text style={styles.downloadBtnText}>📥 Download</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Document Preview Modal */}
      <Modal visible={!!selectedLetterPreview} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Official Document Preview
            </Text>

            <View style={[styles.previewLetterhead, { backgroundColor: '#ffffff' }]}>
              <Text style={styles.pCompName}>SYMBOSYS TECHNOLOGIES</Text>
              <Text style={styles.pSub}>Official Corporate Letterhead</Text>
              <View style={styles.pDivider} />

              <Text style={styles.pBody}>
                Issued to: <Text style={{ fontWeight: 'bold' }}>{selectedLetterPreview?.recipientName}</Text>{'\n'}
                Role: {selectedLetterPreview?.recipientRole}{'\n'}
                Template: {selectedLetterPreview?.templateType.toUpperCase()}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: colors.accent }]}
              onPress={() => setSelectedLetterPreview(null)}
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
  searchInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    borderWidth: 1,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
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
  ltrHeaderRow: {
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
  recipientText: {
    fontSize: 14,
    fontWeight: '700',
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  dateText: {
    fontSize: 10,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 11,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  previewBtn: {
    flex: 2,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  previewBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  downloadBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
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
  previewLetterhead: {
    padding: 16,
    borderRadius: 12,
    gap: 4,
  },
  pCompName: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900',
  },
  pSub: {
    color: '#64748b',
    fontSize: 10,
  },
  pDivider: {
    height: 1,
    backgroundColor: '#cbd5e1',
    marginVertical: 6,
  },
  pBody: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 18,
  },
  modalCloseBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
});
