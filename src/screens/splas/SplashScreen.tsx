import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import {
  Dimensions,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation/stack';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f6fafe" />

      {/* Decorative Ambient Background Shapes */}
      <View style={styles.topCircleShape} />
      <View style={styles.rightCircleShape} />

      {/* Main Content Body */}
      <TouchableOpacity
        style={styles.touchableContainer}
        activeOpacity={0.98}
        onPress={handleSkip}
      >
        <View style={styles.centerSection}>
          {/* Circular Dotted Orbit Line */}
          <View style={styles.orbitCircle}>
            {/* Top Orbit Badge */}
            <View style={[styles.badgePill, styles.topBadge]}>
              <MaterialCommunityIcons name="account-group-outline" size={18} color="#2563eb" />
            </View>

            {/* Right Orbit Badge */}
            <View style={[styles.badgePill, styles.rightBadge]}>
              <MaterialCommunityIcons name="briefcase-outline" size={18} color="#2563eb" />
            </View>

            {/* Bottom Right Orbit Badge */}
            <View style={[styles.badgePill, styles.bottomRightBadge]}>
              <MaterialCommunityIcons name="chart-line" size={18} color="#2563eb" />
            </View>

            {/* Bottom Left Orbit Badge */}
            <View style={[styles.badgePill, styles.bottomLeftBadge]}>
              <MaterialCommunityIcons name="calendar-plus" size={18} color="#2563eb" />
            </View>

            {/* Left Orbit Badge */}
            <View style={[styles.badgePill, styles.leftBadge]}>
              <MaterialCommunityIcons name="account-outline" size={18} color="#2563eb" />
            </View>
          </View>

          {/* Central Logo & Brand Header */}
          <View style={styles.brandCenterBlock}>
            <MaterialCommunityIcons name="account-group" size={58} color="#1d4ed8" />
            <Text style={styles.brandTitle}>HRMS</Text>
            <View style={styles.brandPillLine} />
            <Text style={styles.brandSubtitle}>Human Resource</Text>
            <Text style={styles.brandSubtitle}>Management System</Text>
          </View>
        </View>

        {/* Faint City Skyline & Illustration Layer */}
        <View style={styles.skylineLayer}>
          <View style={styles.cloudRow}>
            <MaterialCommunityIcons name="cloud-outline" size={26} color="#dbeafe" />
            <MaterialCommunityIcons name="cloud-outline" size={18} color="#eff6ff" style={{ marginLeft: 60 }} />
            <MaterialCommunityIcons name="cloud-outline" size={22} color="#dbeafe" style={{ marginLeft: 80 }} />
          </View>

          <View style={styles.cityBuildingsRow}>
            <MaterialCommunityIcons name="office-building" size={90} color="#bfdbfe" style={{ opacity: 0.5 }} />
            <MaterialCommunityIcons name="city-variant-outline" size={130} color="#93c5fd" style={{ opacity: 0.6, marginLeft: -20 }} />
            <MaterialCommunityIcons name="office-building-marker-outline" size={100} color="#bfdbfe" style={{ opacity: 0.5, marginLeft: -30 }} />
          </View>
        </View>

        {/* Bottom Vibrant Blue Wave & Tagline Area */}
        <View style={styles.bottomWaveSection}>
          <View style={styles.waveCurveFill} />
          
          <View style={styles.taglineBlock}>
            <Text style={styles.taglineText}>Streamline HR Processes,</Text>
            <Text style={styles.taglineText}>Empower People, Grow Together.</Text>

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
    backgroundColor: '#f6fafe',
  },
  touchableContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  // Ambient Soft Blur Circles
  topCircleShape: {
    position: 'absolute',
    top: -height * 0.1,
    left: -width * 0.2,
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: (width * 0.7) / 2,
    backgroundColor: '#dbeafe',
    opacity: 0.6,
  },
  rightCircleShape: {
    position: 'absolute',
    top: height * 0.15,
    right: -width * 0.3,
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: (width * 0.6) / 2,
    backgroundColor: '#e0f2fe',
    opacity: 0.5,
  },
  // Center Section & Orbit Ring
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.12,
  },
  orbitCircle: {
    width: 270,
    height: 270,
    borderRadius: 135,
    borderWidth: 1.5,
    borderColor: '#93c5fd',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  // Circular Icon Badges
  badgePill: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#1e40af',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#eff6ff',
  },
  topBadge: {
    top: -21,
    alignSelf: 'center',
  },
  rightBadge: {
    right: -12,
    top: '38%',
  },
  bottomRightBadge: {
    right: 25,
    bottom: -5,
  },
  bottomLeftBadge: {
    left: 25,
    bottom: -5,
  },
  leftBadge: {
    left: -12,
    top: '38%',
  },
  // Brand Content in Orbit Center
  brandCenterBlock: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#1d4ed8',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  brandPillLine: {
    width: 34,
    height: 3.5,
    backgroundColor: '#3b82f6',
    borderRadius: 2,
    marginVertical: 10,
  },
  brandSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Skyline & Illustration Layer
  skylineLayer: {
    position: 'absolute',
    bottom: height * 0.22,
    width: '100%',
    alignItems: 'center',
  },
  cloudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: -20,
  },
  cityBuildingsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: '100%',
  },
  // Bottom Wave & Tagline Section
  bottomWaveSection: {
    height: height * 0.28,
    width: '100%',
    backgroundColor: '#2563eb',
    borderTopLeftRadius: width * 0.45,
    borderTopRightRadius: width * 0.15,
    justifyContent: 'flex-end',
    paddingBottom: 36,
    paddingHorizontal: 24,
    elevation: 8,
    shadowColor: '#1d4ed8',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  waveCurveFill: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#2563eb',
    borderTopLeftRadius: width * 0.5,
  },
  taglineBlock: {
    alignItems: 'center',
  },
  taglineText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  indicatorDot: {
    width: 12,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  indicatorActive: {
    width: 26,
    backgroundColor: '#ffffff',
  },
});
