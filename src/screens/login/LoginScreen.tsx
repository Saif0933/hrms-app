import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLogin } from '../../api/hook/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';
import { useResponsive } from '../../utils/responsive';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const { width, height, wp, hp, moderateScale, isSmallDevice } = useResponsive();

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

  const topHeaderBg = isDark ? '#0b1329' : '#ebf3fe';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: topHeaderBg }]}>
      <StatusBar
        barStyle={colors.statusBar}
        backgroundColor={topHeaderBg}
        translucent={false}
      />

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
          <View style={[styles.topHeaderSection, { minHeight: isSmallDevice ? 210 : 240 }]}>
            {/* Back Button */}
            <TouchableOpacity
              style={[
                styles.backBtn,
                {
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.7)',
                },
              ]}
              onPress={() => navigation.canGoBack() && navigation.goBack()}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            {/* Top Right Building Graphic Circle */}
            <View
              style={[
                styles.buildingCircleBg,
                {
                  right: -wp(10),
                  width: wp(72),
                  height: wp(72),
                  borderRadius: wp(72) / 2,
                  backgroundColor: isDark ? 'rgba(30, 58, 138, 0.35)' : 'rgba(219, 234, 254, 0.6)',
                },
              ]}
            >
              <MaterialCommunityIcons
                name="cloud-outline"
                size={isSmallDevice ? 26 : 32}
                color={isDark ? '#1e3a8a' : '#ffffff'}
                style={styles.cloudIcon1}
              />
              <MaterialCommunityIcons
                name="office-building"
                size={isSmallDevice ? 110 : 130}
                color={isDark ? '#2563eb' : '#3b82f6'}
                style={styles.buildingIcon}
              />
              <MaterialCommunityIcons
                name="city-variant-outline"
                size={isSmallDevice ? 90 : 105}
                color={isDark ? '#1e3a8a' : '#93c5fd'}
                style={styles.buildingIconBack}
              />
              <View style={[styles.companyBadge, { backgroundColor: isDark ? '#2563eb' : '#1d4ed8' }]}>
                <Text style={styles.companyBadgeText}>COMPANY</Text>
              </View>
              <View style={styles.treeRow}>
                <MaterialCommunityIcons name="tree" size={22} color={isDark ? '#3b82f6' : '#2563eb'} />
                <MaterialCommunityIcons name="tree" size={28} color={isDark ? '#2563eb' : '#1d4ed8'} style={{ marginLeft: -8 }} />
              </View>
            </View>

            {/* Left Brand Content */}
            <View style={[styles.brandTextBlock, { maxWidth: wp(56) }]}>
              <Text style={[styles.brandTitle, { color: isDark ? '#60a5fa' : '#1d4ed8', fontSize: moderateScale(isSmallDevice ? 32 : 38) }]}>
                HRMS
              </Text>
              <Text style={[styles.brandSubtitle, { color: colors.textPrimary, fontSize: moderateScale(isSmallDevice ? 13 : 15) }]}>
                Human Resource
              </Text>
              <Text style={[styles.brandSubtitle, { color: colors.textSecondary, fontSize: moderateScale(isSmallDevice ? 13 : 15) }]}>
                Management System
              </Text>

              <View style={styles.bluePillLine} />

              <Text style={[styles.taglineText, { color: colors.textSecondary, fontSize: moderateScale(isSmallDevice ? 11 : 12) }]}>
                Streamline HR Processes, Empower People, Grow Together.
              </Text>
            </View>
          </View>

          {/* Main Rounded Form Sheet */}
          <View
            style={[
              styles.whiteCardSheet,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.cardBorder,
                minHeight: hp(65),
              },
            ]}
          >
            {/* Welcome Back Header */}
            <Text style={[styles.welcomeTitle, { color: colors.textPrimary, fontSize: moderateScale(isSmallDevice ? 20 : 24) }]}>
              Welcome Back! 👋
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary, fontSize: moderateScale(isSmallDevice ? 12 : 14) }]}>
              Sign in to continue to your account
            </Text>

            {/* Error Message Box */}
            {errorMessage ? (
              <View style={[styles.errorBox, { backgroundColor: isDark ? '#450a0a' : '#fef2f2', borderColor: isDark ? '#991b1b' : '#fca5a5' }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#ef4444" />
                <Text style={[styles.errorText, { color: isDark ? '#fca5a5' : '#dc2626' }]}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* PASSWORD LOGIN FORM */}
            <View style={styles.formSection}>
              {/* Email Address Field */}
              <View style={styles.fieldBlock}>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Email Address</Text>
                <View
                  style={[
                    styles.inputBoxWrapper,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={20}
                    color={colors.inputPlaceholder}
                    style={styles.inputLeftIcon}
                  />
                  <TextInput
                    style={[styles.textInput, { color: colors.inputText }]}
                    placeholder="Enter your email address"
                    placeholderTextColor={colors.inputPlaceholder}
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
                  <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Password</Text>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        'Reset Password',
                        'Please contact your system administrator to reset your password.'
                      )
                    }
                  >
                    <Text style={styles.forgotPasswordLink}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    styles.inputBoxWrapper,
                    {
                      backgroundColor: colors.inputBackground,
                      borderColor: colors.inputBorder,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={20}
                    color={colors.inputPlaceholder}
                    style={styles.inputLeftIcon}
                  />
                  <TextInput
                    style={[styles.textInput, { color: colors.inputText }]}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.inputPlaceholder}
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
                      color={colors.inputPlaceholder}
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
                  color={rememberMe ? colors.accent : colors.inputPlaceholder}
                />
                <Text style={[styles.rememberText, { color: colors.textPrimary }]}>Remember Me</Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginBtn, { backgroundColor: colors.accent }]}
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
              <Text style={[styles.adminFooterText, { color: colors.textSecondary }]}>
                Don’t have an account?{' '}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    'Contact Admin',
                    'Please reach out to your HR administrator or supervisor to get an enterprise employee account.'
                  )
                }
              >
                <Text style={styles.adminFooterLink}>Contact your administrator</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Wave Background Accent */}
      <View
        style={[
          styles.bottomWaveDecoration,
          {
            backgroundColor: isDark ? '#1e293b' : '#eff6ff',
            borderTopLeftRadius: wp(50),
            borderTopRightRadius: wp(50),
          },
        ]}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  // Top Header Area
  topHeaderSection: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 24,
    position: 'relative',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTextBlock: {
    marginTop: 4,
  },
  brandTitle: {
    fontWeight: '900',
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontWeight: '600',
    lineHeight: 19,
  },
  bluePillLine: {
    width: 30,
    height: 3.5,
    backgroundColor: '#2563eb',
    borderRadius: 2,
    marginVertical: 10,
  },
  taglineText: {
    fontWeight: '500',
    lineHeight: 17,
  },
  // Building Illustration Circle Graphic
  buildingCircleBg: {
    position: 'absolute',
    top: -20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buildingIcon: {
    position: 'absolute',
    bottom: 18,
    right: 44,
    opacity: 0.95,
  },
  buildingIconBack: {
    position: 'absolute',
    bottom: 26,
    right: 18,
    opacity: 0.5,
  },
  cloudIcon1: {
    position: 'absolute',
    top: 36,
    left: 36,
    opacity: 0.8,
  },
  companyBadge: {
    position: 'absolute',
    bottom: 54,
    right: 76,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  companyBadgeText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  treeRow: {
    position: 'absolute',
    bottom: 10,
    right: 22,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  // Main Rounded Form Sheet
  whiteCardSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 32,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  welcomeTitle: {
    fontWeight: '800',
  },
  welcomeSubtitle: {
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 18,
  },
  // Error Box
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  // Form Fields
  formSection: {
    gap: 15,
  },
  fieldBlock: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  labelWithLinkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotPasswordLink: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#2563eb',
  },
  inputBoxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputLeftIcon: {
    marginRight: 8,
  },
  inputRightIcon: {
    padding: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 14.5,
    height: '100%',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  rememberText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  loginBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  loginBtnText: {
    color: '#ffffff',
    fontSize: 15.5,
    fontWeight: '700',
  },
  // Footer Link
  adminFooterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  adminFooterText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  adminFooterLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2563eb',
  },
  bottomWaveDecoration: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 34,
    zIndex: -1,
  },
});
