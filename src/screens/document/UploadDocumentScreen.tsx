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
import { useUploadDocument } from '../../api/hook/useDocuments';
import { useEmployees } from '../../api/hook/useEmployee';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'UploadDocument'>;

type CategoryType = 'Identity' | 'Contract' | 'Academic' | 'Tax';

export const UploadDocumentScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const [selectedEmpId, setSelectedEmpId] = useState('EMP001');
  const [docName, setDocName] = useState('Employment_Agreement_2026.pdf');
  const [docCategory, setDocCategory] = useState<CategoryType>('Contract');
  const [expiresOn, setExpiresOn] = useState('2027-12-31');

  // TanStack Queries & Mutations
  const { data: empRes } = useEmployees();
  const uploadDocMutation = useUploadDocument();

  const employees = empRes?.data || [];

  const handleUploadDocument = () => {
    if (!docName.trim()) {
      Alert.alert('Validation Error', 'Please specify Document Title.');
      return;
    }

    uploadDocMutation.mutate(
      {
        employeeId: selectedEmpId,
        name: docName.trim(),
        category: docCategory,
        expiresOn: expiresOn.trim() || null,
      },
      {
        onSuccess: () => {
          Alert.alert(
            'Document Uploaded 📄',
            `${docName} has been encrypted and stored in the secure document vault!`
          );
          navigation.goBack();
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const categories: { key: CategoryType; label: string; icon: string }[] = [
    { key: 'Identity', label: 'Identity (Aadhaar/PAN)', icon: '🪪' },
    { key: 'Contract', label: 'Offer & Contract', icon: '📄' },
    { key: 'Academic', label: 'Academic Certificates', icon: '🎓' },
    { key: 'Tax', label: 'Tax & Form 16', icon: '🏦' },
  ];

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
            Upload Vault Document
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Encrypt & Store Employee Identity & Statutory Files
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Employee Selector */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>TARGET EMPLOYEE *</Text>
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

        {/* Category Selector */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DOCUMENT CATEGORY *</Text>
          <View style={styles.catGrid}>
            {categories.map(cat => {
              const isSelected = docCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.catBox,
                    {
                      backgroundColor: isSelected ? 'rgba(59,130,246,0.15)' : colors.background,
                      borderColor: isSelected ? colors.accent : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setDocCategory(cat.key)}
                >
                  <Text style={{ fontSize: 20 }}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.catLabel,
                      { color: isSelected ? colors.accent : colors.textPrimary },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Form Input Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DOCUMENT FILE NAME *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={docName}
            onChangeText={setDocName}
            placeholder="e.g. Passport_Scan.pdf"
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EXPIRATION DATE (OPTIONAL)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={expiresOn}
            onChangeText={setExpiresOn}
            placeholder="YYYY-MM-DD"
          />

          {/* Attachment Box Visualizer */}
          <TouchableOpacity style={[styles.fileDropBox, { backgroundColor: colors.background, borderColor: colors.cardBorder }]}>
            <Text style={{ fontSize: 32 }}>📁</Text>
            <Text style={[styles.fileDropText, { color: colors.textPrimary }]}>
              {docName || 'Tap to select PDF/Image file from device'}
            </Text>
            <Text style={[styles.fileDropSub, { color: colors.textSecondary }]}>
              Max File Size: 15MB • Supported: PDF, PNG, JPG
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: colors.accent },
              uploadDocMutation.isPending && { opacity: 0.7 },
            ]}
            onPress={handleUploadDocument}
            disabled={uploadDocMutation.isPending}
            activeOpacity={0.85}
          >
            {uploadDocMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>🚀 Upload to Secure Vault</Text>
            )}
          </TouchableOpacity>
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
  catGrid: {
    gap: 8,
    marginTop: 4,
  },
  catBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  catLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  fileDropBox: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  fileDropText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  fileDropSub: {
    fontSize: 10,
  },
  submitBtn: {
    marginTop: 8,
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
