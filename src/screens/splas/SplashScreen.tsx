import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack';
import { useResponsive } from '../../utils/responsive';
import { SafeAreaView } from 'react-native-safe-area-context';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const { width, height, wp, hp, moderateScale, isSmallDevice } = useResponsive();

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          navigation.replace('Dashboard');
        } else {
          navigation.replace('Login');
        }
      } catch {
        navigation.replace('Login');
      }
    }, 2800);

    return () => clearTimeout(timer);
  }, [navigation]);

  const handleSkip = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        navigation.replace('Dashboard');
      } else {
        navigation.replace('Login');
      }
    } catch {
      navigation.replace('Login');
    }
  };

  // Dynamic responsive orbit dimension
  const orbitSize = Math.min(wp(68), 260);
  const badgeSize = isSmallDevice ? 36 : 42;
  const badgeRadius = badgeSize / 2;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={colors.statusBar}
        backgroundColor={colors.statusBarBg}
        translucent={false}
      />

      {/* Decorative Ambient Background Shapes */}
      <View
        style={[
          styles.topCircleShape,
          {
            top: -height * 0.1,
            left: -width * 0.2,
            width: width * 0.7,
            height: width * 0.7,
            borderRadius: (width * 0.7) / 2,
            backgroundColor: isDark ? '#1e3a8a' : '#dbeafe',
            opacity: isDark ? 0.35 : 0.6,
          },
        ]}
      />
      <View
        style={[
          styles.rightCircleShape,
          {
            top: height * 0.15,
            right: -width * 0.3,
            width: width * 0.6,
            height: width * 0.6,
            borderRadius: (width * 0.6) / 2,
            backgroundColor: isDark ? '#1e293b' : '#e0f2fe',
            opacity: isDark ? 0.4 : 0.5,
          },
        ]}
      />

      {/* Main Content Body */}
      <TouchableOpacity
        style={styles.touchableContainer}
        activeOpacity={0.98}
        onPress={handleSkip}
      >
        <View style={[styles.centerSection, { marginTop: isSmallDevice ? hp(6) : hp(10) }]}>
          {/* Circular Dotted Orbit Line */}
          <View
            style={[
              styles.orbitCircle,
              {
                width: orbitSize,
                height: orbitSize,
                borderRadius: orbitSize / 2,
                borderColor: isDark ? '#3b82f6' : '#93c5fd',
              },
            ]}
          >
            {/* Top Orbit Badge */}
            <View
              style={[
                styles.badgePill,
                styles.topBadge,
                {
                  width: badgeSize,
                  height: badgeSize,
                  borderRadius: badgeRadius,
                  top: -badgeRadius,
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <MaterialCommunityIcons name="account-group-outline" size={isSmallDevice ? 15 : 18} color="#2563eb" />
            </View>

            {/* Right Orbit Badge */}
            <View
              style={[
                styles.badgePill,
                styles.rightBadge,
                {
                  width: badgeSize,
                  height: badgeSize,
                  borderRadius: badgeRadius,
                  right: -badgeRadius / 2,
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <MaterialCommunityIcons name="briefcase-outline" size={isSmallDevice ? 15 : 18} color="#2563eb" />
            </View>

            {/* Bottom Right Orbit Badge */}
            <View
              style={[
                styles.badgePill,
                styles.bottomRightBadge,
                {
                  width: badgeSize,
                  height: badgeSize,
                  borderRadius: badgeRadius,
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <MaterialCommunityIcons name="chart-line" size={isSmallDevice ? 15 : 18} color="#2563eb" />
            </View>

            {/* Bottom Left Orbit Badge */}
            <View
              style={[
                styles.badgePill,
                styles.bottomLeftBadge,
                {
                  width: badgeSize,
                  height: badgeSize,
                  borderRadius: badgeRadius,
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <MaterialCommunityIcons name="calendar-plus" size={isSmallDevice ? 15 : 18} color="#2563eb" />
            </View>

            {/* Left Orbit Badge */}
            <View
              style={[
                styles.badgePill,
                styles.leftBadge,
                {
                  width: badgeSize,
                  height: badgeSize,
                  borderRadius: badgeRadius,
                  left: -badgeRadius / 2,
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <MaterialCommunityIcons name="account-outline" size={isSmallDevice ? 15 : 18} color="#2563eb" />
            </View>
          </View>

          {/* Central Logo & Brand Header */}
          <View style={styles.brandCenterBlock}>
            <MaterialCommunityIcons
              name="account-group"
              size={isSmallDevice ? 46 : 56}
              color={isDark ? '#60a5fa' : '#1d4ed8'}
            />
            <Text style={[styles.brandTitle, { color: isDark ? '#60a5fa' : '#1d4ed8', fontSize: moderateScale(isSmallDevice ? 34 : 40) }]}>
              HRMS
            </Text>
            <View style={styles.brandPillLine} />
            <Text style={[styles.brandSubtitle, { color: colors.textPrimary, fontSize: moderateScale(isSmallDevice ? 13 : 15) }]}>
              Human Resource
            </Text>
            <Text style={[styles.brandSubtitle, { color: colors.textSecondary, fontSize: moderateScale(isSmallDevice ? 13 : 15) }]}>
              Management System
            </Text>
          </View>
        </View>

        {/* Faint City Skyline & Illustration Layer */}
        <View style={[styles.skylineLayer, { bottom: hp(24) }]}>
          <View style={styles.cloudRow}>
            <MaterialCommunityIcons name="cloud-outline" size={24} color={isDark ? '#1e3a8a' : '#dbeafe'} />
            <MaterialCommunityIcons name="cloud-outline" size={16} color={isDark ? '#1e293b' : '#eff6ff'} style={{ marginLeft: wp(16) }} />
            <MaterialCommunityIcons name="cloud-outline" size={20} color={isDark ? '#1e3a8a' : '#dbeafe'} style={{ marginLeft: wp(20) }} />
          </View>

          <View style={styles.cityBuildingsRow}>
            <MaterialCommunityIcons
              name="office-building"
              size={isSmallDevice ? 70 : 85}
              color={isDark ? '#1e3a8a' : '#bfdbfe'}
              style={{ opacity: isDark ? 0.35 : 0.5 }}
            />
            <MaterialCommunityIcons
              name="city-variant-outline"
              size={isSmallDevice ? 100 : 120}
              color={isDark ? '#2563eb' : '#93c5fd'}
              style={{ opacity: isDark ? 0.45 : 0.6, marginLeft: -16 }}
            />
            <MaterialCommunityIcons
              name="office-building-marker-outline"
              size={isSmallDevice ? 80 : 95}
              color={isDark ? '#1e3a8a' : '#bfdbfe'}
              style={{ opacity: isDark ? 0.35 : 0.5, marginLeft: -24 }}
            />
          </View>
        </View>

        {/* Bottom Vibrant Blue Wave & Tagline Area */}
        <View
          style={[
            styles.bottomWaveSection,
            {
              height: isSmallDevice ? hp(28) : hp(26),
              borderTopLeftRadius: wp(40),
              borderTopRightRadius: wp(15),
              backgroundColor: isDark ? '#1d4ed8' : '#2563eb',
            },
          ]}
        >
          <View
            style={[
              styles.waveCurveFill,
              {
                borderTopLeftRadius: wp(45),
                backgroundColor: isDark ? '#1d4ed8' : '#2563eb',
              },
            ]}
          />

          <View style={styles.taglineBlock}>
            <Text style={[styles.taglineText, { fontSize: moderateScale(isSmallDevice ? 13 : 15) }]}>
              Streamline HR Processes,
            </Text>
            <Text style={[styles.taglineText, { fontSize: moderateScale(isSmallDevice ? 13 : 15) }]}>
              Empower People, Grow Together.
            </Text>

            {/* Carousel Page Indicator Dots */}
            <View style={styles.indicatorContainer}>
              <View style={[styles.indicatorDot, styles.indicatorActive]} />
              <View style={styles.indicatorDot} />
              <View style={styles.indicatorDot} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  touchableContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  // Ambient Soft Blur Circles
  topCircleShape: {
    position: 'absolute',
  },
  rightCircleShape: {
    position: 'absolute',
  },
  // Center Section & Orbit Ring
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitCircle: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  // Circular Icon Badges
  badgePill: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    borderWidth: 1,
  },
  topBadge: {
    alignSelf: 'center',
  },
  rightBadge: {
    top: '38%',
  },
  bottomRightBadge: {
    right: 20,
    bottom: -6,
  },
  bottomLeftBadge: {
    left: 20,
    bottom: -6,
  },
  leftBadge: {
    top: '38%',
  },
  // Brand Content in Orbit Center
  brandCenterBlock: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  brandPillLine: {
    width: 32,
    height: 3.5,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    marginVertical: 8,
  },
  brandSubtitle: {
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Skyline & Illustration Layer
  skylineLayer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
  },
  cloudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: -16,
  },
  cityBuildingsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '100%',
  },
  // Bottom Wave & Tagline Section
  bottomWaveSection: {
    width: '100%',
    justifyContent: 'flex-end',
    paddingBottom: 28,
    paddingHorizontal: 20,
    elevation: 8,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  waveCurveFill: {
    position: 'absolute',
    top: -36,
    left: 0,
    right: 0,
    height: 50,
  },
  taglineBlock: {
    alignItems: 'center',
  },
  taglineText: {
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  indicatorDot: {
    width: 10,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 3,
  },
  indicatorActive: {
    width: 22,
    backgroundColor: '#ffffff',
  },
});
