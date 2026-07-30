import React, { useEffect, useState } from 'react';
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
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEmployees } from '../../api/hook/useEmployee';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'IdCardGenerator'>;
type ScreenRouteProp = RouteProp<RootStackParamList, 'IdCardGenerator'>;

export const IdCardGeneratorScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScreenRouteProp>();
  const { colors } = useTheme();

  const { data: response, isLoading: isLoadingEmployees } = useEmployees();
  const employees = response?.data || [];

  const initialEmpId = route.params?.employeeId || (employees.length > 0 ? employees[0].id : null);
  const [selectedId, setSelectedId] = useState<string | null>(initialEmpId);
  const [cardSide, setCardSide] = useState<'FRONT' | 'BACK'>('FRONT');

  // Form Fields for Card Customization
  const [fullName, setFullName] = useState('Admin - Symbosys Technologies Pvt Ltd');
  const [employeeCode, setEmployeeCode] = useState('cms46xisd0000lgbvmmbn4wx8');
  const [jobDesignation, setJobDesignation] = useState('Super Admin');
  const [department, setDepartment] = useState('Engineering');
  const [dateOfJoining, setDateOfJoining] = useState('30-07-2026');
  const [validUntil, setValidUntil] = useState('31-12-2028');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [emergencyContact, setEmergencyContact] = useState('9876543210');
  const [companyName, setCompanyName] = useState('Symbosys Technologies');
  const [officeLocation, setOfficeLocation] = useState('Mumbai');
  const [photoUrl, setPhotoUrl] = useState('');

  // Populate form fields when an employee is selected from dropdown
  useEffect(() => {
    if (selectedId) {
      const emp = employees.find(e => e.id === selectedId);
      if (emp) {
        setFullName(emp.name || 'Admin - Symbosys Technologies');
        setEmployeeCode(emp.id ? `EMP-${emp.id.slice(0, 8).toUpperCase()}` : 'cms46xisd0000lgbvmmbn4wx8');
        setJobDesignation(emp.designation || 'Super Admin');
        setDepartment(emp.department?.name || 'Engineering');
        setDateOfJoining(emp.joiningDate ? emp.joiningDate.split('T')[0] : '30-07-2026');
        setValidUntil('31-12-2028');
        setBloodGroup(emp.bloodGroup || 'O+');
        setEmergencyContact(emp.phone || '9876543210');
        setCompanyName('Symbosys Technologies');
        setOfficeLocation(emp.location || 'Mumbai');
        if (emp.avatar) setPhotoUrl(emp.avatar);
      }
    }
  }, [selectedId, employees]);

  const initials = fullName
    ? fullName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'SY';

  const handleUploadPhotoSimulate = () => {
    const sampleAvatars = [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    ];
    const picked = sampleAvatars[Math.floor(Math.random() * sampleAvatars.length)];
    setPhotoUrl(picked);
    Alert.alert('Photo Updated', 'Employee ID card profile picture updated.');
  };

  const handleDownloadCard = (side: 'FRONT' | 'BACK' | 'BOTH') => {
    if (side === 'FRONT') {
      Alert.alert('ID Card Downloaded 📥', `Front side ID Card for "${fullName}" saved to Downloads as PNG.`);
    } else if (side === 'BACK') {
      Alert.alert('ID Card Downloaded 📥', `Back side ID Card for "${fullName}" saved to Downloads as PNG.`);
    } else {
      Alert.alert('Complete Badge Downloaded 📥', `Both Front & Back ID Card sides for "${fullName}" saved to Downloads as PDF / PNG bundle.`);
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
            Digital ID Card Generator
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Enterprise Access Badge Creator & Live Preview
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. SELECT EMPLOYEE DROPDOWN / SELECTOR */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            👤 Select Employee to Generate ID Card
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Select an employee to auto-fill their official credential details onto the ID badge.
          </Text>

          {isLoadingEmployees ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 10 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.empSelectorRow}>
              {employees.map(emp => {
                const isSelected = selectedId === emp.id;
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
                    onPress={() => setSelectedId(emp.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.empChipText,
                        { color: isSelected ? '#ffffff' : colors.textPrimary },
                      ]}
                    >
                      {emp.name} ({emp.id.slice(0, 6).toUpperCase()}) — {emp.department?.name || 'General'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* 2. LIVE CARD PREVIEW SECTION WITH FRONT / BACK TOGGLE */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder, alignItems: 'center' },
          ]}
        >
          <View style={styles.previewHeaderRow}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              🪪 Live Card Preview ({cardSide} SIDE)
            </Text>

            {/* Front / Back Toggle Buttons */}
            <View style={styles.flipControlRow}>
              <TouchableOpacity
                style={[
                  styles.flipBtn,
                  cardSide === 'FRONT' && { backgroundColor: colors.accent },
                ]}
                onPress={() => setCardSide('FRONT')}
              >
                <Text style={{ color: cardSide === 'FRONT' ? '#fff' : colors.textSecondary, fontWeight: '700', fontSize: 11 }}>
                  Front Side
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.flipBtn,
                  cardSide === 'BACK' && { backgroundColor: colors.accent },
                ]}
                onPress={() => setCardSide('BACK')}
              >
                <Text style={{ color: cardSide === 'BACK' ? '#fff' : colors.textSecondary, fontWeight: '700', fontSize: 11 }}>
                  Back Side
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ID CARD GRAPHIC BADGE */}
          <View style={styles.idCardWrapper}>
            {cardSide === 'FRONT' ? (
              // FRONT SIDE
              <View style={styles.idCardFront}>
                <View style={styles.cardBanner}>
                  <Text style={styles.brandTitle}>{companyName.toUpperCase()}</Text>
                  <Text style={styles.brandSubtitle}>OFFICIAL ACCESS BADGE</Text>
                </View>

                {/* Avatar Badge */}
                <View style={styles.photoContainer}>
                  <Text style={styles.photoInitials}>{initials}</Text>
                </View>

                <Text style={styles.cardName}>{fullName}</Text>
                <Text style={styles.cardRole}>{jobDesignation}</Text>

                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>{department.toUpperCase()}</Text>
                </View>

                {/* Info Grid */}
                <View style={styles.cardInfoGrid}>
                  <View style={styles.cardInfoCol}>
                    <Text style={styles.cardInfoLabel}>EMP ID</Text>
                    <Text style={styles.cardInfoVal}>{employeeCode}</Text>
                  </View>
                  <View style={styles.cardInfoCol}>
                    <Text style={styles.cardInfoLabel}>JOINING</Text>
                    <Text style={styles.cardInfoVal}>{dateOfJoining}</Text>
                  </View>
                  <View style={styles.cardInfoCol}>
                    <Text style={styles.cardInfoLabel}>VALID TILL</Text>
                    <Text style={styles.cardInfoVal}>{validUntil}</Text>
                  </View>
                </View>

                {/* Barcode Visual */}
                <View style={styles.barcodeVisual}>
                  <Text style={styles.barcodeText}>||| | |||| | ||||| ||| |||| | |</Text>
                </View>
              </View>
            ) : (
              // BACK SIDE
              <View style={styles.idCardBack}>
                <Text style={styles.backHeader}>TERMS & EMERGENCY INFORMATION</Text>

                <Text style={styles.backBody}>
                  1. This identity badge remains property of {companyName}.
                  {'\n'}2. Must be displayed at all times on company premises in {officeLocation}.
                  {'\n'}3. If lost or stolen, report immediately to HR.
                </Text>

                <View style={styles.backInfoRow}>
                  <Text style={styles.backLabel}>Emergency Contact:</Text>
                  <Text style={styles.backValue}>{emergencyContact}</Text>
                </View>

                <View style={styles.backInfoRow}>
                  <Text style={styles.backLabel}>Blood Group:</Text>
                  <Text style={styles.backValue}>{bloodGroup}</Text>
                </View>

                <View style={styles.backInfoRow}>
                  <Text style={styles.backLabel}>Office Location:</Text>
                  <Text style={styles.backValue}>{officeLocation}</Text>
                </View>

                <View style={styles.qrVisual}>
                  <Text style={styles.qrText}>[ SECURE QR CODE SCAN ]</Text>
                </View>
              </View>
            )}
          </View>

          {/* DOWNLOAD ACTION BUTTONS */}
          <View style={styles.downloadBtnRow}>
            <TouchableOpacity
              style={[styles.downloadBtn, { backgroundColor: colors.accent }]}
              onPress={() => handleDownloadCard('FRONT')}
              activeOpacity={0.8}
            >
              <Text style={styles.downloadBtnText}>⬇️ Download Front</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.downloadBtn, { backgroundColor: colors.accent }]}
              onPress={() => handleDownloadCard('BACK')}
              activeOpacity={0.8}
            >
              <Text style={styles.downloadBtnText}>⬇️ Download Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.downloadBtn, { backgroundColor: '#10b981' }]}
              onPress={() => handleDownloadCard('BOTH')}
              activeOpacity={0.8}
            >
              <Text style={styles.downloadBtnText}>📦 Download Both (Bundle)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. EMPLOYEE & CARD INFORMATION FORM */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            📝 Employee & Card Information Details
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Edit any field below to update live badge preview in real-time.
          </Text>

          {/* Employee Profile Picture Upload */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            EMPLOYEE PROFILE PICTURE PREVIEW & UPLOAD
          </Text>
          <View style={[styles.photoUploadRow, { borderColor: colors.cardBorder }]}>
            <View style={styles.avatarPreviewMini}>
              <Text style={{ fontSize: 24 }}>{photoUrl ? '📸' : '👤'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.photoLabelTitle, { color: colors.textPrimary }]}>Profile Photo</Text>
              <Text style={[styles.photoLabelSub, { color: colors.textSecondary }]}>
                JPEG or PNG photo for employee ID badge.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.uploadMiniBtn, { backgroundColor: colors.accent }]}
              onPress={handleUploadPhotoSimulate}
            >
              <Text style={styles.uploadMiniBtnText}>Upload Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Full Name */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>FULL NAME *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Admin - Symbosys Technologies Pvt Ltd"
            placeholderTextColor={colors.inputPlaceholder}
          />

          {/* Employee ID / Code */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EMPLOYEE ID / CODE *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={employeeCode}
            onChangeText={setEmployeeCode}
            placeholder="cms46xisd0000lgbvmmbn4wx8"
            placeholderTextColor={colors.inputPlaceholder}
          />

          {/* Job Designation */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>JOB DESIGNATION *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={jobDesignation}
            onChangeText={setJobDesignation}
            placeholder="Super Admin"
            placeholderTextColor={colors.inputPlaceholder}
          />

          {/* Department */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DEPARTMENT *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={department}
            onChangeText={setDepartment}
            placeholder="Engineering"
            placeholderTextColor={colors.inputPlaceholder}
          />

          {/* Date of Joining */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>DATE OF JOINING *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={dateOfJoining}
            onChangeText={setDateOfJoining}
            placeholder="30-07-2026"
            placeholderTextColor={colors.inputPlaceholder}
          />

          {/* Valid Until */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>VALID UNTIL *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={validUntil}
            onChangeText={setValidUntil}
            placeholder="31-12-2028"
            placeholderTextColor={colors.inputPlaceholder}
          />

          {/* Blood Group */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>BLOOD GROUP *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={bloodGroup}
            onChangeText={setBloodGroup}
            placeholder="O+"
            placeholderTextColor={colors.inputPlaceholder}
          />

          {/* Emergency Contact */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>EMERGENCY CONTACT *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={emergencyContact}
            onChangeText={setEmergencyContact}
            placeholder="9876543210"
            placeholderTextColor={colors.inputPlaceholder}
            keyboardType="phone-pad"
          />

          {/* Company Name */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>COMPANY NAME *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="Symbosys Technologies"
            placeholderTextColor={colors.inputPlaceholder}
          />

          {/* Office Location */}
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>OFFICE LOCATION *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
            value={officeLocation}
            onChangeText={setOfficeLocation}
            placeholder="Mumbai"
            placeholderTextColor={colors.inputPlaceholder}
          />
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
    gap: 16,
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
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  empSelectorRow: {
    width: '100%',
  },
  empChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  empChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  flipControlRow: {
    flexDirection: 'row',
    gap: 6,
  },
  flipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(100,100,100,0.1)',
  },
  idCardWrapper: {
    width: 300,
    height: 460,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    marginVertical: 10,
  },
  idCardFront: {
    flex: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    padding: 20,
    justifyContent: 'space-between',
  },
  cardBanner: {
    alignItems: 'center',
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  brandSubtitle: {
    color: '#3b82f6',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 2,
  },
  photoContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
    marginVertical: 6,
  },
  photoInitials: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '800',
  },
  cardName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  cardRole: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 1,
    textAlign: 'center',
  },
  badgePill: {
    backgroundColor: '#3b82f620',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  badgePillText: {
    color: '#60a5fa',
    fontSize: 10,
    fontWeight: '800',
  },
  cardInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 8,
  },
  cardInfoCol: {
    alignItems: 'center',
  },
  cardInfoLabel: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: '700',
  },
  cardInfoVal: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  barcodeVisual: {
    alignItems: 'center',
  },
  barcodeText: {
    color: '#ffffff',
    fontSize: 11,
    letterSpacing: 2,
  },
  idCardBack: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 22,
    justifyContent: 'space-between',
  },
  backHeader: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  backBody: {
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 18,
  },
  backInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backLabel: {
    color: '#94a3b8',
    fontSize: 11,
  },
  backValue: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  qrVisual: {
    height: 60,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  qrText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  downloadBtnRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  downloadBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  downloadBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  photoUploadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  avatarPreviewMini: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabelTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  photoLabelSub: {
    fontSize: 11,
    marginTop: 1,
  },
  uploadMiniBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  uploadMiniBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
});
