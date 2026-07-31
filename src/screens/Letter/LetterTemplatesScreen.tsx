import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'LetterTemplates'>;

export const LetterTemplatesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [companyName, setCompanyName] = useState('Symbosys Technologies Pvt Ltd');
  const [address, setAddress] = useState('Plot 42, Tech Park, Cyber City, Hyderabad 500081');
  const [taxId, setTaxId] = useState('GSTIN36AABCS1429D1Z9');

  const [probationMonths, setProbationMonths] = useState('6');
  const [noticeDays, setNoticeDays] = useState('60');
  const [sealEnabled, setSealEnabled] = useState(true);

  const handleSaveConfig = () => {
    Alert.alert(
      'Template Configuration Saved 💾',
      'Corporate letterhead header, signature seal, and employment clauses updated successfully!'
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
            Letter Templates & Branding
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Corporate Letterhead Header, Digital Seal & Policy Clauses
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Company Header Settings */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            🏢 Corporate Letterhead Header Branding
          </Text>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>COMPANY LEGAL NAME *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={companyName}
            onChangeText={setCompanyName}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>CORPORATE HEADQUARTERS ADDRESS *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={address}
            onChangeText={setAddress}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>TAX REGISTRATION / GSTIN ID *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={taxId}
            onChangeText={setTaxId}
          />
        </View>

        {/* Clause Settings Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            📜 Standard Employment Clauses
          </Text>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PROBATION PERIOD (MONTHS) *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={probationMonths}
            onChangeText={setProbationMonths}
            keyboardType="numeric"
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>NOTICE PERIOD (DAYS) *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={noticeDays}
            onChangeText={setNoticeDays}
            keyboardType="numeric"
          />

          {/* Digital Seal Switch */}
          <View style={styles.sealSwitchRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sealTitle, { color: colors.textPrimary }]}>
                APPROVED DIGITAL SIGNATURE SEAL
              </Text>
              <Text style={[styles.sealSub, { color: colors.textSecondary }]}>
                Embed authorized corporate HR stamp seal on all generated PDF letterheads
              </Text>
            </View>

            <Switch
              value={sealEnabled}
              onValueChange={setSealEnabled}
              trackColor={{ false: '#64748b40', true: colors.accent }}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.accent }]}
          onPress={handleSaveConfig}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>💾 Save Letterhead Configuration</Text>
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
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  sealSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  sealTitle: {
    fontSize: 11,
    fontWeight: '800',
  },
  sealSub: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 1,
  },
  saveBtn: {
    marginTop: 6,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
