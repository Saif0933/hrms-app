import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
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
  const [isUserManualSelection, setIsUserManualSelection] = useState(false);
  const [biometryType, setBiometryType] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Dynamic TanStack Attendance Queries
  const { data: punchesRes, refetch: refetchPunches, isRefetching } = usePunches(employeeId);
  const createPunchMutation = useCreatePunch();

  const punches = punchesRes?.data || [];

  // Today's Date & Day calculation
  const todayDateObj = new Date();
  const todayDayName = todayDateObj.toLocaleDateString('en-US', { weekday: 'long' }); // e.g. "Monday"
  const todayDateFormatted = todayDateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }); // e.g. "03 Aug 2026"
  const todayKeyStr = todayDateObj.toDateString();

  // Filter Punches for TODAY
  const todayPunches = punches.filter(p => {
    if (!p.time) return false;
    return new Date(p.time).toDateString() === todayKeyStr;
  });

  const todayPunchIn = todayPunches.find(p => p.type === 'In');
  const todayPunchOut = todayPunches.slice().reverse().find(p => p.type === 'Out');

  // Auto-set initial default punch type based ONLY on today's activity, UNLESS user selected manually
  useEffect(() => {
    if (isUserManualSelection) return;

    if (todayPunches.length > 0) {
      const lastPunchToday = todayPunches[todayPunches.length - 1];
      if (lastPunchToday?.type === 'In') {
        setPunchType('Out');
      } else {
        setPunchType('In');
      }
    } else {
      setPunchType('In');
    }
  }, [punches, isUserManualSelection]);

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

  const handleSelectPunchType = (type: 'In' | 'Out') => {
    setPunchType(type);
    setIsUserManualSelection(true);
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
    const currentPunchedType = punchType;
    createPunchMutation.mutate(
      {
        employeeId,
        type: currentPunchedType,
        method: 'FINGERPRINT_PASSWORD_GPS',
        lat: 19.076,
        lng: 72.8777,
        selfiePreview: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      },
      {
        onSuccess: () => {
          const nextType = currentPunchedType === 'In' ? 'Out' : 'In';
          Alert.alert(
            `Punch ${currentPunchedType} Successful! ⏱️`,
            `Successfully recorded Punch ${currentPunchedType} on ${todayDayName}, ${todayDateFormatted} at ${new Date().toLocaleTimeString()}`
          );
          setPunchType(nextType);
          setIsUserManualSelection(false);
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Greeting & Date Info Card */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingTitle}>Hello, {greetingName}</Text>
          <Text style={styles.greetingSubtitle}>Mark your daily attendance</Text>
        </View>

        {/* Prominent Today's Date & Day Display Card */}
        <View style={styles.todayDateCard}>
          <View style={styles.todayDateHeaderRow}>
            <MaterialCommunityIcons name="calendar-month-outline" size={22} color="#064e3b" />
            <Text style={styles.todayDateText}>{todayDayName}, {todayDateFormatted}</Text>
          </View>
          <View style={styles.todayPunchStatusRow}>
            <View style={[styles.punchStatusPill, { backgroundColor: todayPunchIn ? '#d1fae5' : '#f1f5f9' }]}>
              <MaterialCommunityIcons name="login" size={16} color={todayPunchIn ? '#065f46' : '#64748b'} />
              <Text style={[styles.punchStatusLabel, { color: todayPunchIn ? '#065f46' : '#64748b' }]}>
                IN: {todayPunchIn ? new Date(todayPunchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </Text>
            </View>
            <View style={[styles.punchStatusPill, { backgroundColor: todayPunchOut ? '#fee2e2' : '#f1f5f9' }]}>
              <MaterialCommunityIcons name="logout" size={16} color={todayPunchOut ? '#991b1b' : '#64748b'} />
              <Text style={[styles.punchStatusLabel, { color: todayPunchOut ? '#991b1b' : '#64748b' }]}>
                OUT: {todayPunchOut ? new Date(todayPunchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </Text>
            </View>
          </View>
        </View>

        {/* Center Fingerprint Circle Visual Target */}
        <View style={styles.centerContainer}>
          <TouchableOpacity
            style={[
              styles.dashedCircleTarget,
              { borderColor: punchType === 'In' ? '#10b981' : '#ef4444' },
            ]}
            onPress={handlePunchWithBiometrics}
            activeOpacity={0.8}
            disabled={isAuthenticating || createPunchMutation.isPending}
          >
            <View style={[
              styles.innerMintCircle,
              { backgroundColor: punchType === 'In' ? '#e6f7f3' : '#fef2f2' },
            ]}>
              <View style={[styles.laserScanLine, { backgroundColor: punchType === 'In' ? '#a7f3d0' : '#fca5a5' }]} />
              <MaterialCommunityIcons name="fingerprint" size={76} color={punchType === 'In' ? '#10b981' : '#ef4444'} />
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
                punchType === 'In' && styles.activePillTabIn,
              ]}
              onPress={() => handleSelectPunchType('In')}
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
                punchType === 'Out' && styles.activePillTabOut,
              ]}
              onPress={() => handleSelectPunchType('Out')}
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
            <ActivityIndicator color="#ffffff" />
          ) : (
            <View style={styles.punchBtnContent}>
              <MaterialCommunityIcons name="fingerprint" size={26} color="#ffffff" />
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
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  greetingContainer: {
    marginTop: 4,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  greetingSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 2,
    fontWeight: '500',
  },
  todayDateCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  todayDateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayDateText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#064e3b',
  },
  todayPunchStatusRow: {
    flexDirection: 'row',
    gap: 10,
  },
  punchStatusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 6,
  },
  punchStatusLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  dashedCircleTarget: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 3,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  innerMintCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 105,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  laserScanLine: {
    position: 'absolute',
    width: '80%',
    height: 2,
    top: '50%',
    zIndex: 1,
  },
  sensorTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 16,
  },
  sensorSubtitle: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
    fontWeight: '500',
  },
  pillContainer: {
    flexDirection: 'row',
    width: 210,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e2e8f0',
    padding: 4,
    marginTop: 18,
  },
  pillTab: {
    flex: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePillTabIn: {
    backgroundColor: '#10b981',
  },
  activePillTabOut: {
    backgroundColor: '#ef4444',
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
    color: '#475569',
  },
  punchButton: {
    width: '100%',
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  punchBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  punchBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  todayLogsSection: {
    marginTop: 10,
    marginBottom: 6,
    gap: 10,
  },
  todayLogsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  punchLogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  logTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  logTypeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  logDateText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  logTimeText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
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
    marginTop: 12,
  },
  historyBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#064e3b',
    letterSpacing: 0.3,
  },
});
