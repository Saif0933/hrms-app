import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  useCreateGeofence,
  useDeleteGeofence,
  useGeofences,
} from '../../api/hook/useAttendance';
import { useTheme } from '../../context/ThemeContext';
import { RootStackParamList } from '../../navigation/stack.tsx';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GeofencingConfig'>;

export const GeofencingConfigScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();

  // Create Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [lat, setLat] = useState('19.0760');
  const [lng, setLng] = useState('72.8777');
  const [radius, setRadius] = useState('200');

  // TanStack Queries & Mutations
  const { data: geoRes, isLoading } = useGeofences();
  const createGeofenceMutation = useCreateGeofence();
  const deleteGeofenceMutation = useDeleteGeofence();

  const geofences = geoRes?.data || [
    {
      id: 'GEO001',
      name: 'Mumbai HQ Office',
      lat: 19.076,
      lng: 72.8777,
      radius: 250,
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'GEO002',
      name: 'Bengaluru R&D Center',
      lat: 12.9716,
      lng: 77.5946,
      radius: 300,
      isActive: true,
      createdAt: '2026-01-15',
      updatedAt: '2026-01-15',
    },
  ];

  const handleCreateGeofence = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter a location name.');
      return;
    }

    createGeofenceMutation.mutate(
      {
        name: name.trim(),
        lat: parseFloat(lat) || 19.076,
        lng: parseFloat(lng) || 72.8777,
        radius: parseInt(radius, 10) || 200,
      },
      {
        onSuccess: () => {
          setModalOpen(false);
          setName('');
          Alert.alert('Geofence Created 📍', `Registered office geofence boundary "${name}".`);
        },
        onError: err => Alert.alert('Error', err.message),
      }
    );
  };

  const handleDeleteGeofence = (id: string, geoName: string) => {
    Alert.alert('Confirm Delete', `Remove geofence location "${geoName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteGeofenceMutation.mutate(id, {
            onSuccess: () => Alert.alert('Deleted', 'Geofence location removed.'),
          });
        },
      },
    ]);
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
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Geofencing Config</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Office Location GPS Boundaries & Radius Settings
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.addTopBtn, { backgroundColor: colors.accent }]}
          onPress={() => setModalOpen(true)}
        >
          <Text style={styles.addTopBtnText}>+ Add Zone</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Registered Office Geofences ({geofences.length})
        </Text>

        {isLoading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 20 }} />
        ) : (
          geofences.map(geo => (
            <View
              key={geo.id}
              style={[
                styles.card,
                { backgroundColor: colors.cardBackground, borderColor: colors.cardBorder },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.geoName, { color: colors.textPrimary }]}>📍 {geo.name}</Text>
                  <Text style={[styles.geoCoords, { color: colors.textSecondary }]}>
                    Coordinates: {geo.lat}° N, {geo.lng}° E
                  </Text>
                </View>

                <Switch value={geo.isActive} thumbColor={geo.isActive ? colors.accent : '#94a3b8'} />
              </View>

              <View style={[styles.radiusBox, { backgroundColor: colors.background }]}>
                <Text style={[styles.radiusText, { color: colors.textPrimary }]}>
                  Allowed Punch Radius: <Text style={{ color: colors.accent, fontWeight: '800' }}>{geo.radius} meters</Text>
                </Text>
              </View>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteGeofence(geo.id, geo.name)}
              >
                <Text style={styles.deleteBtnText}>🗑️ Remove Location</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Geofence Modal */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Add Geofence Office Boundary
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>LOCATION NAME *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Pune Branch Office"
              placeholderTextColor={colors.inputPlaceholder}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>LATITUDE (N) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={lat}
              onChangeText={setLat}
              keyboardType="numeric"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>LONGITUDE (E) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={lng}
              onChangeText={setLng}
              keyboardType="numeric"
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>RADIUS (Meters) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.inputText }]}
              value={radius}
              onChangeText={setRadius}
              keyboardType="numeric"
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setModalOpen(false)}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.accent }]}
                onPress={handleCreateGeofence}
              >
                <Text style={{ color: '#fff', fontWeight: '700' }}>Save Geofence</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addTopBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addTopBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  geoName: {
    fontSize: 15,
    fontWeight: '700',
  },
  geoCoords: {
    fontSize: 11,
    marginTop: 2,
  },
  radiusBox: {
    padding: 10,
    borderRadius: 8,
  },
  radiusText: {
    fontSize: 12,
  },
  deleteBtn: {
    alignSelf: 'flex-end',
  },
  deleteBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});
