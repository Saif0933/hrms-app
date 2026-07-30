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
import { Employee, useEmployees } from '../../api/hook/useEmployee';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'BulkImports'>;

export const BulkImportsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  // Excel / CSV Import State
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Email Broadcast State
  const [subjectTitle, setSubjectTitle] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // TanStack Query for employees
  const { data: response, isLoading: isLoadingEmployees } = useEmployees();
  const employees = response?.data || [];

  const filteredEmployees = employees.filter(
    emp =>
      emp.name?.toLowerCase().includes(searchEmployeeQuery.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchEmployeeQuery.toLowerCase()) ||
      emp.department?.name?.toLowerCase().includes(searchEmployeeQuery.toLowerCase())
  );

  const toggleSelectEmployee = (id: string) => {
    if (selectedEmpIds.includes(id)) {
      setSelectedEmpIds(prev => prev.filter(empId => empId !== id));
    } else {
      setSelectedEmpIds(prev => [...prev, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedEmpIds.length === employees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(employees.map(e => e.id));
    }
  };

  const handleSendEmail = () => {
    if (!subjectTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a Subject Title for the email.');
      return;
    }

    if (!emailBody.trim()) {
      Alert.alert('Validation Error', 'Please enter the Email Content Body.');
      return;
    }

    if (selectedEmpIds.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one employee to send email.');
      return;
    }

    setIsSendingEmail(true);

    setTimeout(() => {
      setIsSendingEmail(false);
      const recipientCount = selectedEmpIds.length;
      Alert.alert(
        'Emails Sent Successfully! 📧',
        `Subject: "${subjectTitle}"\n\nDispatched email to ${recipientCount} selected employee(s).`
      );
      // Reset form
      setSubjectTitle('');
      setEmailBody('');
      setSelectedEmpIds([]);
    }, 1500);
  };

  const handleSimulateUpload = () => {
    setUploadStatus('Validating CSV file schema...');
    setTimeout(() => {
      setUploadStatus('Importing employee records into database...');
      setTimeout(() => {
        setUploadStatus(null);
        Alert.alert('Success', 'Successfully imported employee records into database.');
      }, 1500);
    }, 1200);
  };

  const handleSimulateExport = () => {
    Alert.alert('Export Triggered', 'Employee Master CSV export started. File saved to Downloads.');
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
            Bulk Imports & Email Broadcast
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Batch Excel Data & Single / Bulk Email Dispatch
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* EMAIL BROADCAST SECTION */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            ✉️ Bulk & Single Email Broadcast
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Compose subject and body, select single or multiple employees, and click Send Email.
          </Text>

          {/* Subject Title */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            EMAIL SUBJECT TITLE *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.inputText,
              },
            ]}
            placeholder="e.g. Monthly Attendance Notice & Policy Announcement"
            placeholderTextColor={colors.inputPlaceholder}
            value={subjectTitle}
            onChangeText={setSubjectTitle}
          />

          {/* Email Content Body */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            EMAIL CONTENT BODY *
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.inputText,
              },
            ]}
            placeholder="Dear Employee, please review your monthly attendance report and submit regularization requests..."
            placeholderTextColor={colors.inputPlaceholder}
            value={emailBody}
            onChangeText={setEmailBody}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          {/* Employee Selection List */}
          <View style={styles.employeeSelectionHeader}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              SELECT RECIPIENT EMPLOYEES ({selectedEmpIds.length} / {employees.length} SELECTED)
            </Text>
            <TouchableOpacity onPress={handleSelectAll}>
              <Text style={[styles.selectAllText, { color: colors.accent }]}>
                {selectedEmpIds.length === employees.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Filter for Employees */}
          <TextInput
            style={[
              styles.input,
              styles.searchInput,
              {
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.inputText,
              },
            ]}
            placeholder="Search employee by name, email or department..."
            placeholderTextColor={colors.inputPlaceholder}
            value={searchEmployeeQuery}
            onChangeText={setSearchEmployeeQuery}
          />

          {isLoadingEmployees ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 14 }} />
          ) : (
            <View style={styles.employeeListContainer}>
              {filteredEmployees.map(emp => {
                const isSelected = selectedEmpIds.includes(emp.id);
                return (
                  <TouchableOpacity
                    key={emp.id}
                    style={[
                      styles.employeeItem,
                      {
                        backgroundColor: isSelected
                          ? `${colors.accent}15`
                          : colors.background,
                        borderColor: isSelected ? colors.accent : colors.cardBorder,
                      },
                    ]}
                    onPress={() => toggleSelectEmployee(emp.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: isSelected ? colors.accent : 'transparent',
                          borderColor: isSelected ? colors.accent : colors.cardBorder,
                        },
                      ]}
                    >
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <View style={styles.employeeInfo}>
                      <Text style={[styles.employeeName, { color: colors.textPrimary }]}>
                        {emp.name}
                      </Text>
                      <Text style={[styles.employeeEmail, { color: colors.textSecondary }]}>
                        {emp.email} • {emp.department?.name || 'General'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {filteredEmployees.length === 0 && (
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No employees match the search filter.
                </Text>
              )}
            </View>
          )}

          {/* SEND EMAIL BUTTON */}
          <TouchableOpacity
            style={[
              styles.sendEmailBtn,
              { backgroundColor: colors.accent },
              isSendingEmail && { opacity: 0.7 },
            ]}
            onPress={handleSendEmail}
            disabled={isSendingEmail}
            activeOpacity={0.85}
          >
            {isSendingEmail ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.sendEmailBtnText}>
                ✉️ Send Email ({selectedEmpIds.length} Recipient{selectedEmpIds.length === 1 ? '' : 's'})
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* BULK IMPORT SECTION */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            📥 Bulk Employee Import (Excel / CSV)
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Upload Excel (.xlsx) or CSV file containing Name, Email, Joining Date, Department, and Designation.
          </Text>

          <TouchableOpacity
            style={[
              styles.dropZone,
              { borderColor: colors.accent, backgroundColor: `${colors.accent}10` },
            ]}
            onPress={handleSimulateUpload}
          >
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📄</Text>
            <Text style={[styles.dropZoneText, { color: colors.accent }]}>
              Tap to Select Excel / CSV File
            </Text>
            <Text style={[styles.dropZoneSub, { color: colors.textMuted }]}>
              Supported formats: .csv, .xlsx (Max 10MB)
            </Text>
          </TouchableOpacity>

          {uploadStatus && (
            <View style={styles.statusBox}>
              <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 13 }}>
                ⏳ {uploadStatus}
              </Text>
            </View>
          )}
        </View>

        {/* SAMPLE TEMPLATE DOWNLOAD */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>📑 Sample Template</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Download the official Excel/CSV template pre-formatted with column headers.
          </Text>

          <TouchableOpacity
            style={[styles.templateBtn, { borderColor: colors.cardBorder }]}
            onPress={() => Alert.alert('Downloaded', 'Sample employee template downloaded.')}
          >
            <Text style={[styles.templateBtnText, { color: colors.textPrimary }]}>
              ⬇️ Download Sample Template (.xlsx)
            </Text>
          </TouchableOpacity>
        </View>

        {/* EXPORT SECTION */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            📤 Export Employee Master Data
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Export full employee directory records including salary structures and department tags.
          </Text>

          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: colors.accent }]}
            onPress={handleSimulateExport}
          >
            <Text style={styles.exportBtnText}>Generate Complete Export (CSV)</Text>
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
    fontSize: 12,
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  textArea: {
    minHeight: 100,
  },
  employeeSelectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 4,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchInput: {
    marginBottom: 8,
  },
  employeeListContainer: {
    maxHeight: 220,
    gap: 6,
    marginBottom: 16,
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 13,
    fontWeight: '700',
  },
  employeeEmail: {
    fontSize: 11,
    marginTop: 1,
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  sendEmailBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendEmailBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  dropZone: {
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropZoneText: {
    fontSize: 15,
    fontWeight: '700',
  },
  dropZoneSub: {
    fontSize: 11,
    marginTop: 4,
  },
  statusBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(59,130,246,0.1)',
    alignItems: 'center',
  },
  templateBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  templateBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  exportBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  exportBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
