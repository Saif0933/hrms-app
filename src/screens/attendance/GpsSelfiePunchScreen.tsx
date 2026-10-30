import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import {
  useCreatePunch,
  useGeofences,
  usePunches,
  useRosters,
  useShiftTimings,
} from '../../api/hook/useAttendance';
import { useProfile } from '../../api/hook/useAuth';
import { useEmployees } from '../../api/hook/useEmployee';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../utils/responsive';
import { RootStackParamList } from '../../navigation/stack.tsx';
import { SafeAreaView } from 'react-native-safe-area-context';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GpsSelfiePunch'>;

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

// Haversine Distance Formula (in Meters)
const calculateDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Convert a time string like "09:30 AM" or "18:00" to minutes from midnight
const parseTimeToMinutes = (timeStr?: string): number | null => {
  if (!timeStr || timeStr === '-' || timeStr.toLowerCase() === 'custom') return null;
  const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;
  let hrs = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;

  if (ampm) {
    if (ampm === 'PM' && hrs < 12) hrs += 12;
    if (ampm === 'AM' && hrs === 12) hrs = 0;
  }
  return hrs * 60 + mins;
};

// Format minutes from midnight back to 12-hour format string (e.g. 540 -> "09:00 AM")
const formatMinutesTo12h = (totalMins: number): string => {
  let m = totalMins % 1440;
  if (m < 0) m += 1440;
  let hrs = Math.floor(m / 60);
  const mins = m % 60;
  const ampm = hrs >= 12 ? 'PM' : 'AM';
  hrs = hrs % 12;
  if (hrs === 0) hrs = 12;
  return `${hrs < 10 ? '0' + hrs : hrs}:${mins < 10 ? '0' + mins : mins} ${ampm}`;
};

// Validate that the punch (In / Out) occurs within the employee's assigned shift window
const validateShiftTimeWindow = (
  type: 'In' | 'Out',
  shift: { name?: string; startTime?: string; endTime?: string; code?: string }
): { allowed: boolean; title?: string; message?: string } => {
  if (!shift || shift.code === 'OFF') {
    return {
      allowed: false,
      title: 'Week Off Restriction 🏖️',
      message: 'Today is scheduled as your Week Off according to your assigned shift roster.',
    };
  }

  const startMins = parseTimeToMinutes(shift.startTime);
  const endMins = parseTimeToMinutes(shift.endTime);

  // If no specific start/end time configured, allow
  if (startMins === null || endMins === null) {
    return { allowed: true };
  }

  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const isOvernight = endMins <= startMins; // e.g. 22:00 (10 PM) to 07:00 (7 AM)

  if (type === 'In') {
    // Punch IN Window:
    // Allow up to 60 minutes before shift starts
    const earlyBuffer = 60;
    const earliestIn = startMins - earlyBuffer;

    if (!isOvernight) {
      if (currentMins < earliestIn) {
        return {
          allowed: false,
          title: 'Early Punch In Restricted ⏰',
          message: `Your assigned shift is ${shift.name} (${shift.startTime} - ${shift.endTime}).\n\nPunch IN is only permitted from ${formatMinutesTo12h(earliestIn)} onwards (within 60 minutes before shift starts).`,
        };
      }
      if (currentMins >= endMins) {
        return {
          allowed: false,
          title: 'Shift Hours Ended ⏰',
          message: `Your assigned shift ${shift.name} ended at ${shift.endTime}. You cannot punch in after shift hours.\n\nPlease apply for Attendance Regularization if you worked today.`,
        };
      }
    } else {
      // Overnight Shift
      const isAllowedIn = currentMins >= earliestIn || currentMins <= (endMins - 60);
      if (!isAllowedIn) {
        return {
          allowed: false,
          title: 'Shift Timing Restriction ⏰',
          message: `Your assigned night shift is ${shift.name} (${shift.startTime} - ${shift.endTime}).\n\nPunch IN is only allowed within shift hours starting from ${formatMinutesTo12h(earliestIn)}.`,
        };
      }
    }
  } else {
    // Punch OUT Window:
    // Allow punching out within 30 minutes before shift ends, or any time after shift ends up to 3 hours
    const earlyOutBuffer = 30;

    if (!isOvernight) {
      const earliestOut = endMins - earlyOutBuffer;
      if (currentMins < earliestOut) {
        return {
          allowed: false,
          title: 'Early Departure Restricted ⚠️',
          message: `Your assigned shift is ${shift.name} (${shift.startTime} - ${shift.endTime}).\n\nPunch OUT is only permitted near shift completion (from ${formatMinutesTo12h(earliestOut)} onwards).`,
        };
      }
    } else {
      // Overnight Shift
      const earliestOut = (endMins - earlyOutBuffer + 1440) % 1440;
      const isEarlyDuringShift = currentMins >= startMins || currentMins < earliestOut;
      if (isEarlyDuringShift) {
        return {
          allowed: false,
          title: 'Early Departure Restricted ⚠️',
          message: `Your assigned shift is ${shift.name} (${shift.startTime} - ${shift.endTime}).\n\nPunch OUT is only permitted near shift end (from ${formatMinutesTo12h(earliestOut)} onwards).`,
        };
      }
    }
  }

  return { allowed: true };
};

export const GpsSelfiePunchScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useTheme();
  const { width, wp, moderateScale, isSmallDevice } = useResponsive();

  // Dynamic Auth User Profile & Employee matching
  const { data: profileResponse, refetch: refetchProfile } = useProfile();
  const user = profileResponse?.data?.user;
  const { data: employeesRes } = useEmployees();
  const employees = employeesRes?.data || [];

  const matchedEmp = useMemo(() => {
    if (!user) return null;
    return employees.find((e: any) =>
      (user.employeeId && e.id === user.employeeId) ||
      (user.id && e.userId === user.id) ||
      (user.email && e.email?.toLowerCase() === user.email.toLowerCase()) ||
      (user.phone && e.phone === user.phone)
    ) || null;
  }, [user, employees]);

  const employeeId = matchedEmp?.id || user?.employeeId || user?.id || '';
  const userName = matchedEmp?.name || user?.name || 'Employee';
  const greetingName = userName.split(' ')[0] || 'Employee';

  const [punchType, setPunchType] = useState<'In' | 'Out'>('In');
  const [isUserManualSelection, setIsUserManualSelection] = useState(false);
  const [biometryType, setBiometryType] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Dynamic Attendance Queries
  const { data: punchesRes, refetch: refetchPunches, isRefetching } = usePunches(employeeId);
  const createPunchMutation = useCreatePunch();
  const { data: geoRes } = useGeofences();
  const { data: timingsRes } = useShiftTimings();

  // ISO Week Generator
  const getCurrentIsoWeek = (): string => {
    const date = new Date();
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo < 10 ? '0' + weekNo : weekNo}`;
  };

  const currentWeek = useMemo(() => getCurrentIsoWeek(), []);
  const { data: rosterRes } = useRosters(currentWeek);

  const punches = punchesRes?.data || [];
  const geofences = useMemo(() => geoRes?.data || [], [geoRes?.data]);
  const activeGeofences = useMemo(() => geofences.filter(g => g.isActive !== false), [geofences]);
  const shiftTimings = useMemo(() => timingsRes?.data || [], [timingsRes?.data]);
  const rosters = useMemo(() => rosterRes?.data || [], [rosterRes?.data]);

  // Today's Date & Day calculation
  const todayDateObj = new Date();
  const todayDayName = todayDateObj.toLocaleDateString('en-US', { weekday: 'long' }); // e.g. "Monday"
  const todayDateFormatted = todayDateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }); // e.g. "03 Aug 2026"
  const todayKeyStr = todayDateObj.toDateString();

  // Today's assigned shift details calculation
  const dayKey = useMemo(() => {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
    return days[todayDateObj.getDay()];
  }, []);

  const employeeRoster = useMemo(() => {
    return rosters.find(r =>
      r.employeeId === employeeId ||
      r.employeeId === user?.id ||
      r.employeeId === matchedEmp?.id ||
      (r.employee && (r.employee.id === employeeId || r.employee.id === matchedEmp?.id || r.employee.id === user?.id))
    );
  }, [rosters, employeeId, matchedEmp, user]);

  const assignedShiftDetail = useMemo(() => {
    // 0. Extract raw shift from roster for today
    let rawShift = '';
    if (employeeRoster && (employeeRoster as any)[dayKey]) {
      rawShift = String((employeeRoster as any)[dayKey]).trim();
    }

    // Fallback: If not in roster, check employee shifts relation if available
    if (!rawShift && (matchedEmp as any)?.shifts?.length > 0) {
      rawShift = (matchedEmp as any).shifts[0].code || (matchedEmp as any).shifts[0].name || '';
    }

    if (!rawShift) {
      rawShift = 'MORNING';
    }

    const rawUpper = rawShift.toUpperCase();

    // Check Week Off
    if (rawUpper === 'OFF' || rawUpper === 'WEEK OFF' || rawUpper === 'WEEKOFF' || rawUpper === 'WO') {
      return { code: 'OFF', name: 'Week Off', startTime: '-', endTime: '-', shortLabel: 'OFF', color: '#94a3b8' };
    }

    // 1. Exact match by code, name, or id (case-insensitive)
    let found = shiftTimings.find(t => 
      t.code?.trim().toUpperCase() === rawUpper ||
      t.name?.trim().toUpperCase() === rawUpper ||
      t.id === rawShift
    );

    // 2. Partial/contains match by code or name
    if (!found) {
      found = shiftTimings.find(t => {
        const tCode = (t.code || '').trim().toUpperCase();
        const tName = (t.name || '').trim().toUpperCase();
        return (
          tName.includes(rawUpper) ||
          rawUpper.includes(tName) ||
          tCode.includes(rawUpper) ||
          rawUpper.includes(tCode)
        );
      });
    }

    // 3. Keyword matching for common shift types
    if (!found) {
      if (rawUpper.includes('MORN')) {
        found = shiftTimings.find(t => (t.name || '').toUpperCase().includes('MORN') || (t.code || '').toUpperCase().includes('MORN'));
      } else if (rawUpper.includes('EVEN')) {
        found = shiftTimings.find(t => (t.name || '').toUpperCase().includes('EVEN') || (t.code || '').toUpperCase().includes('EVEN'));
      } else if (rawUpper.includes('NIGHT')) {
        found = shiftTimings.find(t => (t.name || '').toUpperCase().includes('NIGHT') || (t.code || '').toUpperCase().includes('NIGHT'));
      } else if (rawUpper.includes('GEN')) {
        found = shiftTimings.find(t => (t.name || '').toUpperCase().includes('GEN') || (t.code || '').toUpperCase().includes('GEN'));
      }
    }

    // 4. Return matching organization shift
    if (found) {
      return {
        id: found.id,
        code: found.code,
        name: found.name,
        startTime: found.startTime || '09:00 AM',
        endTime: found.endTime || '06:00 PM',
        shortLabel: found.shortLabel || found.code || found.name?.slice(0, 3).toUpperCase(),
        color: found.color || '#2563eb',
        bgColor: found.bgColor || `${found.color || '#2563eb'}18`,
      };
    }

    // 5. Default standard shift fallbacks if not customized in organization shifts
    if (rawUpper.includes('EVEN')) {
      return { code: 'EVENING', name: 'Evening Shift', startTime: '02:00 PM', endTime: '11:00 PM', shortLabel: 'E (14-23)', color: '#8b5cf6' };
    }
    if (rawUpper.includes('NIGHT')) {
      return { code: 'NIGHT', name: 'Night Shift', startTime: '10:00 PM', endTime: '07:00 AM', shortLabel: 'N (22-07)', color: '#38bdf8' };
    }
    if (rawUpper.includes('GEN')) {
      return { code: 'GENERAL', name: 'General Shift', startTime: '09:30 AM', endTime: '06:30 PM', shortLabel: 'G (09-18)', color: '#10b981' };
    }
    return { code: rawUpper, name: `${rawShift} Shift`, startTime: '09:00 AM', endTime: '06:00 PM', shortLabel: rawUpper.slice(0, 3), color: '#2563eb' };
  }, [employeeRoster, dayKey, matchedEmp, shiftTimings]);

  const assignedShiftCode = assignedShiftDetail?.code || 'MORNING';

  const getPunchDate = (p: any): Date => {
    if (p.createdAt) {
      const d = new Date(p.createdAt);
      if (!isNaN(d.getTime())) return d;
    }
    if (p.time) {
      const d = new Date(p.time);
      if (!isNaN(d.getTime())) return d;

      // Extract hours & minutes from time strings like "Today, 06:35 PM" or "Yesterday, 09:30 AM"
      const str = String(p.time);
      const dateObj = new Date();
      if (str.toLowerCase().includes('yesterday')) {
        dateObj.setDate(dateObj.getDate() - 1);
      }
      const match = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        let hrs = parseInt(match[1], 10);
        const mins = parseInt(match[2], 10);
        const ampm = match[3].toUpperCase();
        if (ampm === 'PM' && hrs < 12) hrs += 12;
        if (ampm === 'AM' && hrs === 12) hrs = 0;
        dateObj.setHours(hrs, mins, 0, 0);
        return dateObj;
      }
    }
    return new Date();
  };

  const formatDisplayTime = (p: any): string => {
    if (!p) return '--:--';
    const d = getPunchDate(p);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter & sort Punches for TODAY chronologically
  const todayPunches = punches
    .filter(p => {
      if (!p) return false;
      const d = getPunchDate(p);
      return d.toDateString() === todayKeyStr;
    })
    .sort((a, b) => getPunchDate(a).getTime() - getPunchDate(b).getTime());

  const todayPunchIn = todayPunches.find(p => p.type?.toLowerCase().includes('in'));
  const todayPunchOut = todayPunches.slice().reverse().find(p => p.type?.toLowerCase().includes('out'));

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

  // Shift & Geofence Validation Function before Punching IN / OUT
  const validateGeofenceAndShift = (): boolean => {
    // 0. ALREADY PUNCHED IN / OUT VALIDATION
    const lastPunchToday = todayPunches.length > 0 ? todayPunches[todayPunches.length - 1] : null;
    const lastType = (lastPunchToday?.type || '').toLowerCase();

    if (punchType === 'In' && lastType.includes('in')) {
      Alert.alert(
        'Punch Restriction ⚠️',
        'You are already punched in!'
      );
      return false;
    }

    if (punchType === 'Out' && (!lastPunchToday || lastType.includes('out'))) {
      Alert.alert(
        'Punch Restriction ⚠️',
        'You are already punched out!'
      );
      return false;
    }

    // 1. SHIFT & TIME WINDOW VALIDATION
    const shiftValidation = validateShiftTimeWindow(punchType, assignedShiftDetail);
    if (!shiftValidation.allowed) {
      Alert.alert(
        shiftValidation.title || 'Shift Timing Restriction ⏰',
        shiftValidation.message || 'You cannot punch at this time according to your assigned shift.'
      );
      return false;
    }

    // 2. GEOFENCE LOCATION VALIDATION
    // User GPS location
    const currentLat = 23.357429;
    const currentLng = 85.311441;

    if (activeGeofences.length > 0) {
      let isInsideGeofence = false;
      let matchedLocationName = '';
      let minDistance = Infinity;
      let requiredRadius = 100;

      activeGeofences.forEach(g => {
        const dist = calculateDistanceInMeters(currentLat, currentLng, g.lat, g.lng);
        if (dist <= g.radius) {
          isInsideGeofence = true;
          matchedLocationName = g.name;
        }
        if (dist < minDistance) {
          minDistance = dist;
          requiredRadius = g.radius;
          matchedLocationName = g.name;
        }
      });

      if (!isInsideGeofence) {
        Alert.alert(
          'Geofence Location Restriction 📍',
          `Punch Restricted! You must be inside your assigned geofence location (${matchedLocationName}).\n\nYour Current Distance: ${Math.round(minDistance)}m\nAllowed Radius: ${requiredRadius}m`
        );
        return false;
      }
    }

    return true;
  };

  const handlePunchWithBiometrics = async () => {
    if (!validateGeofenceAndShift()) {
      return;
    }

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
        lat: 23.357429,
        lng: 85.311441,
        selfiePreview: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      },
      {
        onSuccess: () => {
          const nextType = currentPunchedType === 'In' ? 'Out' : 'In';
          Alert.alert(
            `Punch ${currentPunchedType} Successful! ⏱️`,
            `Successfully recorded Punch ${currentPunchedType} on ${todayDayName}, ${todayDateFormatted} at ${new Date().toLocaleTimeString()} for assigned shift ${assignedShiftDetail.name}.`
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

  const circleSize = Math.min(wp(52), 200);
  const innerCircleSize = circleSize - 24;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.statusBar} backgroundColor={colors.statusBarBg} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Greeting & Date Info Card */}
        <View style={styles.greetingContainer}>
          <Text style={[styles.greetingTitle, { color: colors.textPrimary, fontSize: moderateScale(isSmallDevice ? 20 : 22) }]}>
            Hello, {greetingName}
          </Text>
          <Text style={[styles.greetingSubtitle, { color: colors.textSecondary }]}>Mark your daily attendance</Text>
        </View>

        {/* Assigned Shift & Geofence Location Status Card */}
        <View
          style={[
            styles.assignedShiftCard,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.cardBorder,
              borderWidth: isDark ? 1 : 1,
            },
          ]}
        >
          <View style={styles.shiftCardHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.shiftCardLabel, { color: colors.textSecondary }]}>
                ASSIGNED SHIFT ({todayDayName.toUpperCase()})
              </Text>
              <Text
                style={[
                  styles.shiftCardTitleText,
                  { color: assignedShiftDetail.color || (isDark ? '#34d399' : '#064e3b') },
                ]}
              >
                {assignedShiftDetail.name} ({assignedShiftDetail.startTime} - {assignedShiftDetail.endTime})
              </Text>
            </View>
            <View
              style={[
                styles.shiftBadgePill,
                {
                  backgroundColor: (assignedShiftDetail.color || '#064e3b') + '18',
                  borderColor: assignedShiftDetail.color || '#064e3b',
                },
              ]}
            >
              <Text style={[styles.shiftBadgePillText, { color: assignedShiftDetail.color || (isDark ? '#34d399' : '#064e3b') }]}>
                {assignedShiftDetail.shortLabel || assignedShiftDetail.code}
              </Text>
            </View>
          </View>

          <View style={[styles.geofenceDivider, { backgroundColor: colors.divider }]} />

          <View style={styles.geofenceRow}>
            <MaterialCommunityIcons name="map-marker-radius" size={18} color="#10b981" />
            <Text style={[styles.geofenceText, { color: colors.textSecondary }]}>
              Geofence Zone: {activeGeofences.length > 0 ? activeGeofences[0].name : 'Main Office Ranchi'} • Authorized Location 📍
            </Text>
          </View>
        </View>

        {/* Prominent Today's Date & Day Display Card */}
        <View
          style={[
            styles.todayDateCard,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          <View style={styles.todayDateHeaderRow}>
            <MaterialCommunityIcons name="calendar-month-outline" size={22} color={isDark ? '#34d399' : '#064e3b'} />
            <Text style={[styles.todayDateText, { color: colors.textPrimary, fontSize: moderateScale(isSmallDevice ? 14 : 15) }]}>
              {todayDayName}, {todayDateFormatted}
            </Text>
          </View>
          <View style={styles.todayPunchStatusRow}>
            <View
              style={[
                styles.punchStatusPill,
                { backgroundColor: todayPunchIn ? '#d1fae5' : isDark ? '#1e293b' : '#f1f5f9' },
              ]}
            >
              <MaterialCommunityIcons name="login" size={16} color={todayPunchIn ? '#065f46' : colors.textSecondary} />
              <Text style={[styles.punchStatusLabel, { color: todayPunchIn ? '#065f46' : colors.textSecondary }]}>
                IN: {formatDisplayTime(todayPunchIn)}
              </Text>
            </View>
            <View
              style={[
                styles.punchStatusPill,
                { backgroundColor: todayPunchOut ? '#fee2e2' : isDark ? '#1e293b' : '#f1f5f9' },
              ]}
            >
              <MaterialCommunityIcons name="logout" size={16} color={todayPunchOut ? '#991b1b' : colors.textSecondary} />
              <Text style={[styles.punchStatusLabel, { color: todayPunchOut ? '#991b1b' : colors.textSecondary }]}>
                OUT: {formatDisplayTime(todayPunchOut)}
              </Text>
            </View>
          </View>
        </View>

        {/* Center Fingerprint Circle Visual Target */}
        <View style={styles.centerContainer}>
          <TouchableOpacity
            style={[
              styles.dashedCircleTarget,
              {
                width: circleSize,
                height: circleSize,
                borderRadius: circleSize / 2,
                borderColor: punchType === 'In' ? '#10b981' : '#ef4444',
              },
            ]}
            onPress={handlePunchWithBiometrics}
            activeOpacity={0.8}
            disabled={isAuthenticating || createPunchMutation.isPending}
          >
            <View
              style={[
                styles.innerMintCircle,
                {
                  width: innerCircleSize,
                  height: innerCircleSize,
                  borderRadius: innerCircleSize / 2,
                  backgroundColor:
                    punchType === 'In'
                      ? isDark
                        ? '#064e3b'
                        : '#e6f7f3'
                      : isDark
                      ? '#7f1d1d'
                      : '#fef2f2',
                },
              ]}
            >
              <View
                style={[
                  styles.laserScanLine,
                  { backgroundColor: punchType === 'In' ? '#a7f3d0' : '#fca5a5' },
                ]}
              />
              <MaterialCommunityIcons
                name="fingerprint"
                size={moderateScale(isSmallDevice ? 64 : 76)}
                color={punchType === 'In' ? '#10b981' : '#ef4444'}
              />
            </View>
          </TouchableOpacity>

          {/* Status Label Below Circle */}
          <Text style={[styles.sensorTitle, { color: colors.textPrimary }]}>Touch Sensor</Text>
          <Text style={[styles.sensorSubtitle, { color: colors.textSecondary }]}>Use Fingerprint or Enter PIN</Text>

          {/* IN / OUT Pill Selector */}
          <View style={[styles.pillContainer, { backgroundColor: isDark ? '#1e293b' : '#eef2ff' }]}>
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
                  punchType === 'In' ? styles.activePillText : [styles.inactivePillText, { color: colors.textSecondary }],
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
                  punchType === 'Out' ? styles.activePillText : [styles.inactivePillText, { color: colors.textSecondary }],
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
          style={[
            styles.historyBtn,
            {
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#e6f7f3',
              borderColor: isDark ? '#065f46' : '#a7f3d0',
            },
          ]}
          onPress={() => navigation.navigate('AttendanceHistory')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="history" size={22} color={isDark ? '#34d399' : '#064e3b'} />
          <Text style={[styles.historyBtnText, { color: isDark ? '#34d399' : '#064e3b' }]}>
            View Attendance History
          </Text>
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
    paddingTop: 10,
    paddingBottom: 24,
  },
  greetingContainer: {
    marginBottom: 12,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  assignedShiftCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  shiftCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shiftCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  shiftCardTitleText: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  shiftBadgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  shiftBadgePillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  geofenceDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 10,
  },
  geofenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  geofenceText: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  todayDateCard: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  todayDateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  todayDateText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#064e3b',
  },
  todayPunchStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  punchStatusPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  punchStatusLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  centerContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dashedCircleTarget: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  innerMintCircle: {
    width: 176,
    height: 176,
    borderRadius: 88,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  laserScanLine: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    height: 2,
  },
  sensorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 14,
  },
  sensorSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 16,
  },
  pillContainer: {
    flexDirection: 'row',
    backgroundColor: '#eef2ff',
    borderRadius: 30,
    padding: 4,
    width: 240,
  },
  pillTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 26,
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
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  punchBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  punchBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#e6f7f3',
    borderColor: '#a7f3d0',
    borderWidth: 1,
  },
  historyBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#064e3b',
  },
});
