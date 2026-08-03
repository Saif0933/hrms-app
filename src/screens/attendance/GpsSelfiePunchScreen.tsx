import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCreatePunch, usePunches } from '../../api/hook/useAttendance';
import { useProfile } from '../../api/hook/useAuth';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GpsSelfiePunch'>;

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

export const GpsSelfiePunchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  // Dynamic Auth User Profile
  const { data: profileResponse, refetch: refetchProfile } = useProfile();
  const user = profileResponse?.data?.user;
  const employeeId = user?.id || 'EMP001';
  const userName = user?.name || 'Alex';
  const greetingName = userName.split(' ')[0] || 'Alex';

  const [punchType, setPunchType] = useState<'In' | 'Out'>('In');
  const [biometryType, setBiometryType] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Dynamic TanStack Attendance Queries
  const { data: punchesRes, refetch: refetchPunches, isRefetching } = usePunches(employeeId);
  const createPunchMutation = useCreatePunch();

  const punches = punchesRes?.data || [];

  // Automatically determine Punch IN or Punch OUT based on latest punch log today
  useEffect(() => {
    if (punches && punches.length > 0) {
      const lastPunch = punches[punches.length - 1];
      if (lastPunch?.type === 'In') {
        setPunchType('Out');
      } else if (lastPunch?.type === 'Out') {
        setPunchType('In');
      }
    }
  }, [punches]);

  useEffect(() => {
    rnBiometrics
      .isSensorAvailable()
      .then(result => {
        if (result.available && result.biometryType) {
          setBiometryType(result.biometryType);
        }
      })
      .catch(() => {
        setBiometryType(null);
      });
  }, []);

  const handleRefresh = async () => {
    await Promise.all([refetchPunches(), refetchProfile()]);
  };

  const handlePunchWithBiometrics = async () => {
    setIsAuthenticating(true);
    try {
      const result = await rnBiometrics.simplePrompt({
        promptMessage: `Scan Fingerprint or enter PIN to Punch ${punchType}`,
        cancelButtonText: 'Cancel',
        fallbackPromptMessage: 'Use PIN / Password',
      });

      if (result.success) {
        handlePunchSubmit();
      } else {
        Alert.alert(
          'Authentication Required 🔒',
          'Fingerprint or mobile screen password verification is mandatory to record attendance.'
        );
      }
    } catch (err) {
      Alert.alert(
        'Fingerprint Authentication 🔐',
        `Confirm biometric or PIN authorization to record Punch ${punchType}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Authenticate & Punch', onPress: () => handlePunchSubmit() },
        ]
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handlePunchSubmit = () => {
    createPunchMutation.mutate(
      {
        employeeId,
        type: punchType,
        method: 'FINGERPRINT_PASSWORD_GPS',
        lat: 19.076,
        lng: 72.8777,
        selfiePreview: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      },
      {
        onSuccess: () => {
          Alert.alert(
            `Punch ${punchType} Successful! ⏱️`,
            `Successfully checked ${punchType.toLowerCase()} at ${new Date().toLocaleTimeString()}`
          );
          setPunchType(punchType === 'In' ? 'Out' : 'In');
          handleRefresh();
        },
        onError: err => {
          Alert.alert('Punch Error', err.message || 'Failed to record attendance punch.');
        },
      }
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&h=120&fit=crop&crop=faces',
            }}
            style={styles.avatar}
          />
          <Text style={styles.headerTitle}>Attendance</Text>
        </View>
        <TouchableOpacity
          onPress={handleRefresh}
          activeOpacity={0.7}
          style={styles.refreshBtn}
        >
          {isRefetching ? (
            <ActivityIndicator size="small" color="#064e3b" />
          ) : (
            <MaterialCommunityIcons name="refresh" size={24} color="#064e3b" />
          )}
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {/* Greeting Section */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingTitle}>Hello, {greetingName}</Text>
          <Text style={styles.greetingSubtitle}>Mark your attendance</Text>
        </View>

        {/* Center Fingerprint Circle Visual Target */}
        <View style={styles.centerContainer}>
          <TouchableOpacity
            style={styles.dashedCircleTarget}
            onPress={handlePunchWithBiometrics}
            activeOpacity={0.8}
            disabled={isAuthenticating || createPunchMutation.isPending}
          >
            <View style={styles.innerMintCircle}>
              {/* Laser Scanning Line */}
              <View style={styles.laserScanLine} />
              <MaterialCommunityIcons name="fingerprint" size={76} color="#10b981" />
            </View>
          </TouchableOpacity>

          {/* Status Label Below Circle */}
          <Text style={styles.sensorTitle}>Touch Sensor</Text>
          <Text style={styles.sensorSubtitle}>Use Fingerprint or Enter PIN</Text>

          {/* IN / OUT Pill Selector */}
          <View style={styles.pillContainer}>
            <TouchableOpacity
              style={[
                styles.pillTab,
                punchType === 'In' && styles.activePillTab,
              ]}
              onPress={() => setPunchType('In')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.pillText,
                  punchType === 'In' ? styles.activePillText : styles.inactivePillText,
                ]}
              >
                IN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pillTab,
                punchType === 'Out' && styles.activePillTab,
              ]}
              onPress={() => setPunchType('Out')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.pillText,
                  punchType === 'Out' ? styles.activePillText : styles.inactivePillText,
                ]}
              >
                OUT
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Full-width PUNCH IN / OUT Button */}
        <TouchableOpacity
          style={[
            styles.punchButton,
            { backgroundColor: punchType === 'In' ? '#10b981' : '#ef4444' },
            (createPunchMutation.isPending || isAuthenticating) && { opacity: 0.7 },
          ]}
          onPress={handlePunchWithBiometrics}
          disabled={createPunchMutation.isPending || isAuthenticating}
          activeOpacity={0.85}
        >
          {createPunchMutation.isPending || isAuthenticating ? (
            <ActivityIndicator color="#0f172a" />
          ) : (
            <View style={styles.punchBtnContent}>
              <MaterialCommunityIcons name="fingerprint" size={26} color="#0f172a" />
              <Text style={styles.punchBtnText}>
                PUNCH {punchType.toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* View Attendance History Button */}
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => navigation.navigate('AttendanceHistory')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="history" size={22} color="#064e3b" />
          <Text style={styles.historyBtnText}>View Attendance History</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#064e3b',
    letterSpacing: 0.2,
  },
  refreshBtn: {
    padding: 6,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 16,
  },
  greetingContainer: {
    marginTop: 8,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  greetingSubtitle: {
    fontSize: 16,
    color: '#475569',
    marginTop: 4,
    fontWeight: '500',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  dashedCircleTarget: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: '#10b981',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  innerMintCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 120,
    backgroundColor: '#e6f7f3',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  laserScanLine: {
    position: 'absolute',
    width: '80%',
    height: 2,
    backgroundColor: '#a7f3d0',
    top: '50%',
    zIndex: 1,
  },
  sensorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 24,
  },
  sensorSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 6,
    fontWeight: '500',
  },
  pillContainer: {
    flexDirection: 'row',
    width: 200,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    padding: 4,
    marginTop: 22,
  },
  pillTab: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePillTab: {
    backgroundColor: '#10b981',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  activePillText: {
    color: '#ffffff',
  },
  inactivePillText: {
    color: '#334155',
  },
  punchButton: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  punchBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  punchBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.8,
  },
  historyBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#10b981',
    backgroundColor: '#e6f7f3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  historyBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#064e3b',
    letterSpacing: 0.3,
  },
});
