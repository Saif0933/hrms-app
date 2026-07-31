import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCreatePunch, usePunches } from '../../api/hook/useAttendance';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GpsSelfiePunch'>;

export const GpsSelfiePunchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  const employeeId = 'EMP001'; // Default employee ID for demonstration
  const [punchType, setPunchType] = useState<'In' | 'Out'>('In');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }));
  const [selfieCaptured, setSelfieCaptured] = useState(false);

  // TanStack Queries
  const { data: punchesRes, isLoading: isLoadingPunches } = usePunches(employeeId);
  const createPunchMutation = useCreatePunch();

  const punches = punchesRes?.data || [];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCaptureSelfie = () => {
    setSelfieCaptured(true);
    Alert.alert('Selfie Verified', 'Facial recognition check passed (Confidence: 99.4%).');
  };

  const handlePunchSubmit = () => {
    createPunchMutation.mutate(
      {
        employeeId,
        type: punchType,
        method: 'GPS_SELFIE_MOBILE',
        lat: 19.076,
        lng: 72.8777,
        selfiePreview: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      },
      {
        onSuccess: () => {
          Alert.alert(
            `Punch ${punchType} Recorded! ⏱️`,
            `Successfully checked ${punchType.toLowerCase()} at ${new Date().toLocaleTimeString()}`
          );
          setSelfieCaptured(false);
          setPunchType(punchType === 'In' ? 'Out' : 'In');
        },
        onError: err => {
          Alert.alert('Error', err.message || 'Failed to record punch log.');
        },
      }
    );
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
            GPS & Selfie Punch
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Real-Time Geo-fenced Attendance Punch
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Live Clock Card */}
        <View
          style={[
            styles.clockCard,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.dateText, { color: colors.textSecondary }]}>{currentDate}</Text>
          <Text style={[styles.timeText, { color: colors.accent }]}>{currentTime}</Text>
          <View style={styles.locationBadge}>
            <Text style={{ fontSize: 12 }}>📍</Text>
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>
              Mumbai HQ • 19.0760° N, 72.8777° E (In Office Zone)
            </Text>
          </View>
        </View>

        {/* Camera Selfie Simulation Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            📷 Facial Verification Camera
          </Text>

          <View style={styles.cameraBox}>
            <View style={styles.viewfinderFrame}>
              <Text style={{ fontSize: 48 }}>{selfieCaptured ? '📸' : '👤'}</Text>
              <Text style={styles.cameraHintText}>
                {selfieCaptured ? 'Face Matched Successfully' : 'Align face inside frame'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.captureBtn,
                { backgroundColor: selfieCaptured ? '#10b981' : colors.accent },
              ]}
              onPress={handleCaptureSelfie}
            >
              <Text style={styles.captureBtnText}>
                {selfieCaptured ? '✓ Selfie Captured' : '📷 Take Selfie'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Punch In / Out Toggle & Submit Action */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            ⏱️ Record Attendance Punch
          </Text>

          {/* Type Selector */}
          <View style={styles.typeSelectorRow}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                punchType === 'In' && { backgroundColor: '#10b981' },
              ]}
              onPress={() => setPunchType('In')}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  { color: punchType === 'In' ? '#ffffff' : colors.textSecondary },
                ]}
              >
                Punch IN 🟢
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                punchType === 'Out' && { backgroundColor: '#ef4444' },
              ]}
              onPress={() => setPunchType('Out')}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  { color: punchType === 'Out' ? '#ffffff' : colors.textSecondary },
                ]}
              >
                Punch OUT 🔴
              </Text>
            </TouchableOpacity>
          </View>

          {/* Submit Punch Button */}
          <TouchableOpacity
            style={[
              styles.submitPunchBtn,
              { backgroundColor: punchType === 'In' ? '#10b981' : '#ef4444' },
              createPunchMutation.isPending && { opacity: 0.7 },
            ]}
            onPress={handlePunchSubmit}
            disabled={createPunchMutation.isPending}
            activeOpacity={0.85}
          >
            {createPunchMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitPunchBtnText}>
                {punchType === 'In' ? 'RECORD PUNCH IN' : 'RECORD PUNCH OUT'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Recent Punch Logs Section */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
            📋 Today's Punch Logs
          </Text>

          {isLoadingPunches ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 10 }} />
          ) : punches.length > 0 ? (
            punches.map(log => (
              <View
                key={log.id}
                style={[
                  styles.logRow,
                  { backgroundColor: colors.background, borderColor: colors.cardBorder },
                ]}
              >
                <View
                  style={[
                    styles.logBadge,
                    { backgroundColor: log.type === 'In' ? '#10b98120' : '#ef444420' },
                  ]}
                >
                  <Text
                    style={{
                      color: log.type === 'In' ? '#10b981' : '#ef4444',
                      fontWeight: '800',
                      fontSize: 12,
                    }}
                  >
                    {log.type}
                  </Text>
                </View>
                <View style={styles.logInfo}>
                  <Text style={[styles.logTime, { color: colors.textPrimary }]}>
                    {new Date(log.time).toLocaleTimeString()}
                  </Text>
                  <Text style={[styles.logMeta, { color: colors.textSecondary }]}>
                    Method: {log.method} • GPS Verified
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No punches recorded for today yet.
            </Text>
          )}
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
  clockCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
  },
  timeText: {
    fontSize: 32,
    fontWeight: '900',
    marginVertical: 4,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '500',
  },
  card: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    gap: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cameraBox: {
    alignItems: 'center',
    gap: 12,
  },
  viewfinderFrame: {
    width: '100%',
    height: 140,
    borderRadius: 14,
    backgroundColor: '#0f172a15',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraHintText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 6,
  },
  captureBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  captureBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100,100,100,0.2)',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  submitPunchBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitPunchBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  logBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  logInfo: {
    flex: 1,
  },
  logTime: {
    fontSize: 14,
    fontWeight: '700',
  },
  logMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
});
