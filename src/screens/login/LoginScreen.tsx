import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { useLogin, useSendOtp, useVerifyOtp } from '../../api/hook/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark, toggleTheme } = useTheme();

  const [authMethod, setAuthMethod] = useState<'PASSWORD' | 'OTP'>('PASSWORD');

  // Password Login State
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // OTP Login State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Hooks
  const loginMutation = useLogin();
  const sendOtpMutation = useSendOtp();
  const verifyOtpMutation = useVerifyOtp();

  // Demo Accounts matching hrms/src/modules/Login.tsx
  const demoUsers = [
    {
      id: 'EMP005',
      name: 'Vikram Malhotra',
      role: 'CEO (Super Admin)',
      email: 'ceo@symbosys.com',
      password: '12345678',
    },
    {
      id: 'EMP006',
      name: 'Karan Johar',
      role: 'HR Admin',
      email: 'hr@symbosys.com',
      password: '12345678',
    },
    {
      id: 'EMP002',
      name: 'Neha Patel',
      role: 'Engineering Manager',
      email: 'manager@symbosys.com',
      password: '12345678',
    },
    {
      id: 'EMP001',
      name: 'Aarav Sharma',
      role: 'Senior UI Developer',
      email: 'employee@symbosys.com',
      password: '12345678',
    },
  ];

  const handlePasswordLogin = () => {
    setErrorMessage('');
    if (!emailOrPhone.trim() || !password) {
      setErrorMessage('Please fill in all fields.');
      return;
    }

    const payload = emailOrPhone.includes('@')
      ? { email: emailOrPhone.trim(), password }
      : { phone: emailOrPhone.trim(), password };

    loginMutation.mutate(payload, {
      onSuccess: res => {
        navigation.replace('Dashboard');
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.message || 'Invalid credentials. Please try again.';
        setErrorMessage(msg);
      },
    });
  };

  const handleSelectDemoUser = (user: typeof demoUsers[0]) => {
    setEmailOrPhone(user.email);
    setPassword(user.password);
    setErrorMessage('');
    setAuthMethod('PASSWORD');

    loginMutation.mutate(
      { email: user.email, password: user.password },
      {
        onSuccess: () => {
          navigation.replace('Dashboard');
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || 'Failed to login with demo user.';
          setErrorMessage(msg);
        },
      }
    );
  };

  const handleSendOtp = () => {
    setErrorMessage('');
    if (!phone.trim()) {
      setErrorMessage('Please enter a valid phone number.');
      return;
    }

    sendOtpMutation.mutate(
      { phone: phone.trim() },
      {
        onSuccess: res => {
          setOtpSent(true);
          const devOtp = res.data?.otp ? ` (Dev OTP: ${res.data.otp})` : '';
          Alert.alert('OTP Sent', `Verification code sent to ${phone}${devOtp}`);
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || 'Failed to send OTP.';
          setErrorMessage(msg);
        },
      }
    );
  };

  const handleVerifyOtp = () => {
    setErrorMessage('');
    if (!otp.trim()) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }

    verifyOtpMutation.mutate(
      { phone: phone.trim(), otp: otp.trim() },
      {
        onSuccess: () => {
          navigation.replace('Dashboard');
        },
        onError: (err: any) => {
          const msg = err.response?.data?.message || err.message || 'Invalid OTP code.';
          setErrorMessage(msg);
        },
      }
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Header */}
          <View style={styles.brandHeader}>
            <TouchableOpacity
              style={[
                styles.themeToggle,
                { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
              ]}
              onPress={toggleTheme}
            >
              <Text style={{ fontSize: 18 }}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>

            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>🏛️</Text>
            </View>
            <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>Symbosys HRMS</Text>
            <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
              Enterprise Workforce Portal
            </Text>
          </View>

          {/* Auth Method Switcher Tabs */}
          <View
            style={[
              styles.tabContainer,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.tabBtn,
                authMethod === 'PASSWORD' && { backgroundColor: colors.accent },
              ]}
              onPress={() => {
                setAuthMethod('PASSWORD');
                setOtpSent(false);
                setErrorMessage('');
              }}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: authMethod === 'PASSWORD' ? '#ffffff' : colors.textSecondary },
                ]}
              >
                Password Login
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, authMethod === 'OTP' && { backgroundColor: colors.accent }]}
              onPress={() => {
                setAuthMethod('OTP');
                setErrorMessage('');
              }}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: authMethod === 'OTP' ? '#ffffff' : colors.textSecondary },
                ]}
              >
                Phone OTP
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Message Alert */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
            </View>
          ) : null}

          {/* Main Form Card */}
          <View
            style={[
              styles.card,
              { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
            ]}
          >
            {authMethod === 'PASSWORD' ? (
              // PASSWORD LOGIN FORM
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  EMAIL ADDRESS OR PHONE
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
                  placeholder="you@company.com"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={emailOrPhone}
                  onChangeText={setEmailOrPhone}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>PASSWORD</Text>
                <View style={styles.passwordInputWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        flex: 1,
                        backgroundColor: colors.inputBackground,
                        borderColor: colors.inputBorder,
                        color: colors.inputText,
                      },
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.inputPlaceholder}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
                  onPress={handlePasswordLogin}
                  disabled={loginMutation.isPending}
                  activeOpacity={0.85}
                >
                  {loginMutation.isPending ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Sign In to HRMS →</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              // OTP LOGIN FORM
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  MOBILE PHONE NUMBER
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
                  placeholder="+1 234 567 8900"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!otpSent}
                />

                {!otpSent ? (
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
                    onPress={handleSendOtp}
                    disabled={sendOtpMutation.isPending}
                    activeOpacity={0.85}
                  >
                    {sendOtpMutation.isPending ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Send Verification OTP →</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                      ENTER 6-DIGIT OTP
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
                      placeholder="123456"
                      placeholderTextColor={colors.inputPlaceholder}
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                    />

                    <TouchableOpacity
                      style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
                      onPress={handleVerifyOtp}
                      disabled={verifyOtpMutation.isPending}
                      activeOpacity={0.85}
                    >
                      {verifyOtpMutation.isPending ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text style={styles.primaryBtnText}>Verify OTP & Login →</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.resendBtn}
                      onPress={() => setOtpSent(false)}
                    >
                      <Text style={[styles.resendText, { color: colors.accent }]}>
                        Change phone number / Resend OTP
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>

          {/* Quick Demo Workspace Accounts */}
          <View style={styles.demoSection}>
            <View style={styles.demoDividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
              <Text style={[styles.demoSectionTitle, { color: colors.textMuted }]}>
                Quick Demo Workspace Accounts
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.divider }]} />
            </View>

            <View style={styles.demoList}>
              {demoUsers.map(user => (
                <TouchableOpacity
                  key={user.id}
                  style={[
                    styles.demoUserCard,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                  onPress={() => handleSelectDemoUser(user)}
                  activeOpacity={0.8}
                >
                  <View style={styles.demoAvatar}>
                    <Text style={styles.demoAvatarText}>
                      {user.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </Text>
                  </View>
                  <View style={styles.demoInfo}>
                    <Text style={[styles.demoName, { color: colors.textPrimary }]}>
                      {user.name}
                    </Text>
                    <Text style={[styles.demoRole, { color: colors.textSecondary }]}>
                      {user.role}
                    </Text>
                  </View>
                  <Text style={[styles.demoArrow, { color: colors.accent }]}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Footer Register Link */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Don't have an employee account?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.registerLink, { color: colors.accent }]}>Register Here</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    marginTop: 10,
  },
  themeToggle: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 3,
  },
  logoIcon: {
    fontSize: 30,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  brandSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#ef444415',
    borderColor: '#ef444440',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
  },
  formGroup: {
    gap: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    borderWidth: 1,
  },
  passwordInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  primaryBtn: {
    marginTop: 6,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  resendBtn: {
    alignItems: 'center',
    marginTop: 6,
  },
  resendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  demoSection: {
    marginTop: 24,
  },
  demoDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  demoSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    paddingHorizontal: 10,
  },
  demoList: {
    gap: 8,
  },
  demoUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  demoAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  demoAvatarText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  demoInfo: {
    flex: 1,
  },
  demoName: {
    fontSize: 14,
    fontWeight: '700',
  },
  demoRole: {
    fontSize: 11,
    marginTop: 1,
  },
  demoArrow: {
    fontSize: 16,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '700',
  },
});
