import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
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
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLogin } from '../../api/hook/useAuth';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const { width, height } = Dimensions.get('window');

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  // Password Login State
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Hooks
  const loginMutation = useLogin();

  const handlePasswordLogin = () => {
    setErrorMessage('');
    if (!emailOrPhone.trim() || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    const payload = emailOrPhone.includes('@')
      ? { email: emailOrPhone.trim(), password }
      : { phone: emailOrPhone.trim(), password };

    loginMutation.mutate(payload, {
      onSuccess: () => {
        navigation.replace('Dashboard');
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message || err.message || 'Invalid credentials. Please try again.';
        setErrorMessage(msg);
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ebf3fe" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Decorative Header Area */}
          <View style={styles.topHeaderSection}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.canGoBack() && navigation.goBack()}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#1e293b" />
            </TouchableOpacity>

            {/* Top Right Building Graphic Circle */}
            <View style={styles.buildingCircleBg}>
              <MaterialCommunityIcons name="cloud-outline" size={32} color="#ffffff" style={styles.cloudIcon1} />
              <MaterialCommunityIcons name="office-building" size={135} color="#3b82f6" style={styles.buildingIcon} />
              <MaterialCommunityIcons name="city-variant-outline" size={110} color="#93c5fd" style={styles.buildingIconBack} />
              <View style={styles.companyBadge}>
                <Text style={styles.companyBadgeText}>COMPANY</Text>
              </View>
              <View style={styles.treeRow}>
                <MaterialCommunityIcons name="tree" size={24} color="#2563eb" />
                <MaterialCommunityIcons name="tree" size={30} color="#1d4ed8" style={{ marginLeft: -8 }} />
              </View>
            </View>

            {/* Left Brand Content */}
            <View style={styles.brandTextBlock}>
              <Text style={styles.brandTitle}>HRMS</Text>
              <Text style={styles.brandSubtitle}>Human Resource</Text>
              <Text style={styles.brandSubtitle}>Management System</Text>

              <View style={styles.bluePillLine} />

              <Text style={styles.taglineText}>Streamline HR Processes,</Text>
              <Text style={styles.taglineText}>Empower People, Grow Together.</Text>
            </View>
          </View>

          {/* Main White Rounded Form Sheet */}
          <View style={styles.whiteCardSheet}>
            {/* Welcome Back Header */}
            <Text style={styles.welcomeTitle}>Welcome Back! 👋</Text>
            <Text style={styles.welcomeSubtitle}>Sign in to continue to your account</Text>

            {/* Error Message Box */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#ef4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* PASSWORD LOGIN FORM */}
            <View style={styles.formSection}>
              {/* Email Address Field */}
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <View style={styles.inputBoxWrapper}>
                  <MaterialCommunityIcons name="email-outline" size={20} color="#94a3b8" style={styles.inputLeftIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your email address"
                    placeholderTextColor="#94a3b8"
                    value={emailOrPhone}
                    onChangeText={setEmailOrPhone}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Password Field */}
              <View style={styles.fieldBlock}>
                <View style={styles.labelWithLinkRow}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <TouchableOpacity onPress={() => Alert.alert('Reset Password', 'Please contact your system administrator to reset your password.')}>
                    <Text style={styles.forgotPasswordLink}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputBoxWrapper}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color="#94a3b8" style={styles.inputLeftIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    style={styles.inputRightIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Remember Me Checkbox */}
              <TouchableOpacity
                style={styles.rememberRow}
                activeOpacity={0.8}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <MaterialCommunityIcons
                  name={rememberMe ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={22}
                  color={rememberMe ? '#2563eb' : '#94a3b8'}
                />
                <Text style={styles.rememberText}>Remember Me</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={handlePasswordLogin}
                disabled={loginMutation.isPending}
                activeOpacity={0.85}
              >
                {loginMutation.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.loginBtnText}>Login</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Contact Administrator Footer Link */}
            <View style={styles.adminFooterRow}>
              <Text style={styles.adminFooterText}>Don’t have an account? </Text>
              <TouchableOpacity onPress={() => Alert.alert('Contact Admin', 'Please reach out to your HR administrator or supervisor to get an enterprise employee account.')}>
                <Text style={styles.adminFooterLink}>Contact your administrator</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Wave Background Accent */}
      <View style={styles.bottomWaveDecoration} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ebf3fe',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  // Top Header Area
  topHeaderSection: {
    paddingHorizontal: 22,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 28,
    position: 'relative',
    minHeight: 250,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  brandTextBlock: {
    maxWidth: width * 0.55,
    marginTop: 4,
  },
  brandTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#1d4ed8',
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 20,
  },
  bluePillLine: {
    width: 32,
    height: 3.5,
    backgroundColor: '#2563eb',
    borderRadius: 2,
    marginVertical: 12,
  },
  taglineText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    lineHeight: 18,
  },
  // Building Illustration Circle Graphic
  buildingCircleBg: {
    position: 'absolute',
    right: -width * 0.1,
    top: -20,
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: (width * 0.75) / 2,
    backgroundColor: 'rgba(219, 234, 254, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buildingIcon: {
    position: 'absolute',
    bottom: 20,
    right: 50,
    opacity: 0.95,
  },
  buildingIconBack: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    opacity: 0.5,
  },
  cloudIcon1: {
    position: 'absolute',
    top: 40,
    left: 40,
    opacity: 0.8,
  },
  companyBadge: {
    position: 'absolute',
    bottom: 58,
    right: 85,
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  companyBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  treeRow: {
    position: 'absolute',
    bottom: 12,
    right: 25,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  // Main White Rounded Form Sheet
  whiteCardSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
    minHeight: height * 0.65,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  welcomeSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 4,
    marginBottom: 20,
  },
  // Error Box
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  // Form Fields
  formSection: {
    gap: 16,
  },
  fieldBlock: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  labelWithLinkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotPasswordLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  inputBoxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  inputLeftIcon: {
    marginRight: 10,
  },
  inputRightIcon: {
    padding: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    height: '100%',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  rememberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  loginBtn: {
    backgroundColor: '#1d4ed8',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  // Google Sign In
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 52,
    borderRadius: 12,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  // Footer Link
  adminFooterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
  adminFooterText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  adminFooterLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
  bottomWaveDecoration: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#eff6ff',
    borderTopLeftRadius: width * 0.5,
    borderTopRightRadius: width * 0.5,
    zIndex: -1,
  },
});
