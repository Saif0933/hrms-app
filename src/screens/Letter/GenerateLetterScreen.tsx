import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useEmployees } from '../../api/hook/useEmployee';
import { useIssueLetter } from '../../api/hook/useLetters';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GenerateLetter'>;

type TemplateType = 'offer' | 'warning' | 'experience';

export const GenerateLetterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [templateType, setTemplateType] = useState<TemplateType>('offer');
  const [recipientName, setRecipientName] = useState('Aarav Sharma');
  const [recipientRole, setRecipientRole] = useState('Senior Full Stack Engineer');
  const [joiningDate, setJoiningDate] = useState('2026-08-01');
  const [salaryCtc, setSalaryCtc] = useState('₹14,50,000 / yr');
  const [warningReason, setWarningReason] = useState(
    'Repeated unexcused late arrivals and missed sprint deliverables'
  );

  // TanStack Queries & Mutations
  const { data: empRes } = useEmployees();
  const issueLetterMutation = useIssueLetter();

  const employees = empRes?.data || [];

  const handleIssueLetter = () => {
    if (!recipientName.trim() || !recipientRole.trim()) {
      Alert.alert('Validation Error', 'Please specify Recipient Name and Recipient Role.');
      return;
    }

    issueLetterMutation.mutate(
      {
        templateType,
        recipientName: recipientName.trim(),
        recipientRole: recipientRole.trim(),
        joiningDate: templateType !== 'warning' ? joiningDate.trim() : null,
        salaryCtc: templateType === 'offer' ? salaryCtc.trim() : null,
        warningReason: templateType === 'warning' ? warningReason.trim() : null,
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Official Letter Issued ✉️',
            `${templateType.toUpperCase()} letter has been generated & issued for ${recipientName}!`
          );
          navigation.navigate('IssuedLettersArchive');
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
            Generate Corporate Letter
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Official Offer Letters, Warning Notices & Relieving Certificates
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Template Selector Tabs */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>SELECT LETTER TEMPLATE *</Text>
          <View style={styles.templateRow}>
            {[
              { key: 'offer', label: 'Offer Letter', icon: '📄' },
              { key: 'warning', label: 'Warning Notice', icon: '⚠️' },
              { key: 'experience', label: 'Relieving & Exp.', icon: '🎓' },
            ].map(t => {
              const isSelected = templateType === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.tmplBtn,
                    {
                      backgroundColor: isSelected ? 'rgba(59,130,246,0.15)' : colors.background,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setTemplateType(t.key as TemplateType)}
                >
                  <Text style={{ fontSize: 18 }}>{t.icon}</Text>
                  <Text
                    style={[
                      styles.tmplLabel,
                      { color: isSelected ? colors.accent : colors.textPrimary },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Dynamic Form Controls Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>RECIPIENT NAME *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={recipientName}
            onChangeText={setRecipientName}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DESIGNATION / ROLE *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={recipientRole}
            onChangeText={setRecipientRole}
          />

          {templateType !== 'warning' && (
            <>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {templateType === 'offer' ? 'EFFECTIVE JOINING DATE' : 'RELIEVING / EFFECTIVE DATE'} *
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={joiningDate}
                onChangeText={setJoiningDate}
              />
            </>
          )}

          {templateType === 'offer' && (
            <>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ANNUAL SALARY CTC *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={salaryCtc}
                onChangeText={setSalaryCtc}
              />
            </>
          )}

          {templateType === 'warning' && (
            <>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>WARNING REASON & INCIDENT NOTES *</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
                value={warningReason}
                onChangeText={setWarningReason}
                multiline
                numberOfLines={3}
              />
            </>
          )}
        </View>

        {/* Live Letterhead Preview */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Live Letterhead Document Preview
        </Text>

        <View style={[styles.letterheadCard, { backgroundColor: '#ffffff', borderColor: colors.cardBorder }]}>
          {/* Company Branding */}
          <View style={styles.letterheadHeader}>
            <Text style={styles.compName}>SYMBOSYS TECHNOLOGIES PVT LTD</Text>
            <Text style={styles.compAddr}>Plot 42, Tech Park, Cyber City, Hyderabad 500081</Text>
            <View style={styles.letterDivider} />
          </View>

          {/* Letter Details */}
          <Text style={styles.letterDate}>Date: {new Date().toISOString().split('T')[0]}</Text>
          <Text style={styles.recipientBlock}>To: {recipientName}</Text>
          <Text style={styles.recipientRoleBlock}>Role: {recipientRole}</Text>

          <Text style={styles.letterSubject}>
            SUBJECT: {templateType.toUpperCase()} LETTER FOR {recipientRole.toUpperCase()}
          </Text>

          {/* Body Content */}
          <View style={styles.letterBody}>
            {templateType === 'offer' && (
              <Text style={styles.bodyText}>
                We are pleased to offer you the position of <Text style={{ fontWeight: 'bold' }}>{recipientRole}</Text> at Symbosys Technologies. Your starting date will be <Text style={{ fontWeight: 'bold' }}>{joiningDate}</Text> with an agreed annual CTC of <Text style={{ fontWeight: 'bold' }}>{salaryCtc}</Text>.
              </Text>
            )}

            {templateType === 'warning' && (
              <Text style={styles.bodyText}>
                This official notice serves as a formal written warning regarding: <Text style={{ fontWeight: 'bold' }}>"{warningReason}"</Text>. Continued non-compliance may result in disciplinary action under corporate HR policy.
              </Text>
            )}

            {templateType === 'experience' && (
              <Text style={styles.bodyText}>
                This is to certify that <Text style={{ fontWeight: 'bold' }}>{recipientName}</Text> was employed with Symbosys Technologies as <Text style={{ fontWeight: 'bold' }}>{recipientRole}</Text> until <Text style={{ fontWeight: 'bold' }}>{joiningDate}</Text>. During their tenure, their performance was satisfactory.
              </Text>
            )}
          </View>

          {/* Signature & Seal */}
          <View style={styles.signatureRow}>
            <View>
              <Text style={styles.sigTitle}>Authorized HR Signatory</Text>
              <Text style={styles.sigSub}>Symbosys Technologies</Text>
            </View>

            <View style={styles.sealBadge}>
              <Text style={styles.sealText}>APPROVED SEAL</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: colors.accent },
            issueLetterMutation.isPending && { opacity: 0.7 },
          ]}
          onPress={handleIssueLetter}
          disabled={issueLetterMutation.isPending}
          activeOpacity={0.85}
        >
          {issueLetterMutation.isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>🚀 Generate & Issue Official Letter</Text>
          )}
        </TouchableOpacity>
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
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  templateRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  tmplBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  tmplLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 70,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  letterheadCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    gap: 10,
  },
  letterheadHeader: {
    alignItems: 'center',
    marginBottom: 4,
  },
  compName: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  compAddr: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  letterDivider: {
    height: 2,
    backgroundColor: '#3b82f6',
    width: '100%',
    marginTop: 8,
  },
  letterDate: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
  },
  recipientBlock: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
  },
  recipientRoleBlock: {
    color: '#475569',
    fontSize: 11,
  },
  letterSubject: {
    color: '#1e40af',
    fontSize: 12,
    fontWeight: '900',
    marginVertical: 4,
  },
  letterBody: {
    marginVertical: 6,
  },
  bodyText: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 18,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  sigTitle: {
    color: '#0f172a',
    fontSize: 11,
    fontWeight: '800',
  },
  sigSub: {
    color: '#64748b',
    fontSize: 10,
  },
  sealBadge: {
    backgroundColor: '#10b98115',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  sealText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '900',
  },
  submitBtn: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
