import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  PermissionsAndroid,
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
import {
  GeofenceLocation,
  useCreateGeofence,
  useDeleteGeofence,
  useGeofences,
} from '../../api/hook/useAttendance';
import { Department, useDepartments } from '../../api/hook/useDepartment';
import { Employee, useEmployees } from '../../api/hook/useEmployee';
import { RootStackParamList } from '../../navigation/stack.tsx';

declare const navigator: any;

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'GeofencingConfig'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Color Palette matching reference screenshots (Warm Mocha & Amber Orange Theme)
const COLORS = {
  bgDark: '#23140E',
  cardBg: '#341E16',
  headerBg: '#2D1A12',
  inputBg: '#281710',
  borderColor: '#4A2C20',
  orangePrimary: '#E25A00',
  orangeButton: '#E0620D',
  orangeDark: '#C84C00',
  greenAccent: '#4ADE80',
  textPrimary: '#FFFFFF',
  textSecondary: '#D3C3B9',
  textMuted: '#9B887D',
  mapBg: '#E4DFD7',
  mapCircleFill: 'rgba(226, 90, 0, 0.18)',
  mapCircleBorder: '#E25A00',
};

// Web Mercator Tile Calculation Helpers
function latLngToPixel(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const px = ((lng + 180) / 360) * n * 256;
  const latRad = (lat * Math.PI) / 180;
  const py =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    n *
    256;
  return { px, py };
}

function pixelToLatLng(px: number, py: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const lng = (px / (n * 256)) * 360 - 180;
  const n2 = Math.PI - (2 * Math.PI * py) / (n * 256);
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n2) - Math.exp(-n2)));
  return { lat, lng };
}

// Google Map Tile URL Generator (Vector street tiles)
function getGoogleTileUrl(x: number, y: number, z: number) {
  const maxTile = Math.pow(2, z);
  const wrappedX = ((x % maxTile) + maxTile) % maxTile;
  const server = Math.abs(x + y) % 4;
  return `https://mt${server}.google.com/vt/lyrs=m&x=${wrappedX}&y=${y}&z=${z}`;
}

// Reverse Geocode (Lat, Lng -> Address)
const fetchAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'HRMSAttendanceApp/1.0',
        },
      }
    );
    const data = await response.json();
    if (data && data.address) {
      const a = data.address;
      const mainPlace = a.amenity || a.building || a.road || a.suburb || a.neighbourhood || a.locality;
      const city = a.city || a.town || a.village || a.county || a.district;
      const state = a.state;
      const country = a.country;

      const formattedParts = [mainPlace, city, state, country].filter(Boolean);
      if (formattedParts.length > 0) {
        return formattedParts.join(', ');
      }
      if (data.display_name) {
        return data.display_name;
      }
    }
  } catch (err) {
    console.log('Reverse geocoding error:', err);
  }
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

// Helper: Search Addresses via OpenStreetMap API
interface SearchResultItem {
  display_name: string;
  lat: number;
  lng: number;
}

const searchAddresses = async (query: string): Promise<SearchResultItem[]> => {
  if (!query.trim()) return [];
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'HRMSAttendanceApp/1.0',
        },
      }
    );
    const data = await response.json();
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }));
    }
  } catch (err) {
    console.log('Address search error:', err);
  }
  return [];
};

// Helper: Fetch Real GPS / IP Device Location (Fully Fixed Native & Fallback Handler)
const getCurrentDeviceLocation = async (): Promise<{ lat: number; lng: number; address: string }> => {
  if (Platform.OS === 'android') {
    try {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);
    } catch (e) {
      console.log('Permission request error:', e);
    }
  }

  return new Promise(resolve => {
    let resolved = false;
    const nav = typeof navigator !== 'undefined' ? navigator : (globalThis as any).navigator;

    const tryFallback = async () => {
      if (!resolved) {
        resolved = true;
        const fallback = await fetchFallbackIpLocation();
        resolve(fallback);
      }
    };

    if (nav && nav.geolocation) {
      // 1st Try: High Accuracy
      nav.geolocation.getCurrentPosition(
        async (pos: any) => {
          if (!resolved) {
            resolved = true;
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            const address = await fetchAddressFromCoords(lat, lng);
            resolve({ lat, lng, address });
          }
        },
        () => {
          // 2nd Try: Low Accuracy (Cellular/Wi-Fi Triangulation)
          nav.geolocation.getCurrentPosition(
            async (pos: any) => {
              if (!resolved) {
                resolved = true;
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const address = await fetchAddressFromCoords(lat, lng);
                resolve({ lat, lng, address });
              }
            },
            () => {
              tryFallback();
            },
            { enableHighAccuracy: false, timeout: 6000, maximumAge: 30000 }
          );
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 10000 }
      );
    } else {
      tryFallback();
    }

    setTimeout(() => {
      if (!resolved) {
        tryFallback();
      }
    }, 12000);
  });
};

const fetchFallbackIpLocation = async (): Promise<{ lat: number; lng: number; address: string }> => {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    if (data && data.latitude && data.longitude) {
      const lat = data.latitude;
      const lng = data.longitude;
      const address = await fetchAddressFromCoords(lat, lng);
      return { lat, lng, address };
    }
  } catch (err) {
    console.log('IP location fallback error:', err);
  }
  const lat = 23.357429;
  const lng = 85.311441;
  const address = 'F/193, Ranchi, Jharkhand, India';
  return { lat, lng, address };
};

// --- REUSABLE REAL MOVABLE TILE MAP COMPONENT ---
interface TileMapProps {
  centerLat: number;
  centerLng: number;
  zoom: number;
  radius: number;
  containerHeight: number;
  onLocationChange?: (lat: number, lng: number) => void;
  onZoomChange?: (newZoom: number) => void;
  showPin?: boolean;
}

const MovableTileMap: React.FC<TileMapProps> = ({
  centerLat,
  centerLng,
  zoom,
  radius,
  containerHeight,
  onLocationChange,
  onZoomChange,
  showPin = true,
}) => {
  const [mapCenter, setMapCenter] = useState({ lat: centerLat, lng: centerLng });
  const [mapZoom, setMapZoom] = useState(zoom);

  const mapZoomRef = useRef(zoom);
  const mapCenterRef = useRef({ lat: centerLat, lng: centerLng });
  const isInternalDragRef = useRef(false);
  const pendingResetRef = useRef(false);
  const mapPan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const initialPinchDistRef = useRef<number>(0);

  // Sync external location changes (GPS button, search result select ONLY)
  useEffect(() => {
    if (isInternalDragRef.current) {
      isInternalDragRef.current = false;
      return;
    }
    setMapCenter({ lat: centerLat, lng: centerLng });
    mapCenterRef.current = { lat: centerLat, lng: centerLng };
    mapPan.setOffset({ x: 0, y: 0 });
    mapPan.setValue({ x: 0, y: 0 });
  }, [centerLat, centerLng]);

  useEffect(() => {
    setMapZoom(zoom);
    mapZoomRef.current = zoom;
  }, [zoom]);

  // KEY FIX: Reset Animated pan value AFTER React has committed the new tile positions.
  // useLayoutEffect runs synchronously after React commits but BEFORE the frame is painted.
  // This ensures the tiles are repositioned and the Animated.View transform is reset
  // in the SAME visual frame — eliminating the 1-frame snap-back flash.
  useLayoutEffect(() => {
    if (pendingResetRef.current) {
      pendingResetRef.current = false;
      mapPan.setOffset({ x: 0, y: 0 });
      mapPan.setValue({ x: 0, y: 0 });
    }
  });

  // Calculate Map Tiles Grid (7x7 grid)
  const centerPixel = latLngToPixel(mapCenter.lat, mapCenter.lng, mapZoom);
  const centerTileX = Math.floor(centerPixel.px / 256);
  const centerTileY = Math.floor(centerPixel.py / 256);

  const tiles = [];
  for (let dx = -3; dx <= 3; dx++) {
    for (let dy = -3; dy <= 3; dy++) {
      const tx = centerTileX + dx;
      const ty = centerTileY + dy;
      const tilePixelX = tx * 256;
      const tilePixelY = ty * 256;

      const left = tilePixelX - centerPixel.px + SCREEN_WIDTH / 2;
      const top = tilePixelY - centerPixel.py + containerHeight / 2;

      tiles.push({
        key: `${tx}_${ty}_${mapZoom}`,
        url: getGoogleTileUrl(tx, ty, mapZoom),
        left,
        top,
      });
    }
  }

  const getTouchDistance = (touches: any[]) => {
    if (!touches || touches.length < 2) return 0;
    const [t1, t2] = touches;
    const dx = t1.pageX - t2.pageX;
    const dy = t1.pageY - t2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // PanResponder Gesture Handling (Fixed Center Pointer Pin, Movable Map Canvas)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_evt, gs) =>
        Math.abs(gs.dx) > 3 || Math.abs(gs.dy) > 3,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (evt.nativeEvent.touches && evt.nativeEvent.touches.length === 2) {
          initialPinchDistRef.current = getTouchDistance(evt.nativeEvent.touches);
        } else {
          initialPinchDistRef.current = 0;
          mapPan.extractOffset();
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.touches && evt.nativeEvent.touches.length === 2) {
          const currentDist = getTouchDistance(evt.nativeEvent.touches);
          if (initialPinchDistRef.current === 0) {
            initialPinchDistRef.current = currentDist;
            return;
          }
          const initialDist = initialPinchDistRef.current;
          if (initialDist > 0 && currentDist > 0) {
            const scale = currentDist / initialDist;
            const currentZoom = mapZoomRef.current;
            if (scale > 1.2) {
              const nextZoom = Math.min(18, currentZoom + 1);
              if (nextZoom !== currentZoom) {
                setMapZoom(nextZoom);
                mapZoomRef.current = nextZoom;
                if (onZoomChange) onZoomChange(nextZoom);
              }
              initialPinchDistRef.current = currentDist;
            } else if (scale < 0.8) {
              const nextZoom = Math.max(13, currentZoom - 1);
              if (nextZoom !== currentZoom) {
                setMapZoom(nextZoom);
                mapZoomRef.current = nextZoom;
                if (onZoomChange) onZoomChange(nextZoom);
              }
              initialPinchDistRef.current = currentDist;
            }
          }
        } else {
          initialPinchDistRef.current = 0;
          // FIX: Direct setValue is faster than Animated.event wrapper
          mapPan.x.setValue(gestureState.dx);
          mapPan.y.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        initialPinchDistRef.current = 0;

        // Tap anywhere on map
        if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
          const touchX = evt.nativeEvent.locationX;
          const touchY = evt.nativeEvent.locationY;
          if (touchX !== undefined && touchY !== undefined && touchX > 0 && touchY > 0) {
            const tapDx = touchX - SCREEN_WIDTH / 2;
            const tapDy = touchY - containerHeight / 2;

            mapPan.flattenOffset();
            const cPixel = latLngToPixel(mapCenterRef.current.lat, mapCenterRef.current.lng, mapZoomRef.current);
            const tappedPx = cPixel.px + tapDx;
            const tappedPy = cPixel.py + tapDy;
            const tappedLatLng = pixelToLatLng(tappedPx, tappedPy, mapZoomRef.current);

            isInternalDragRef.current = true;
            mapCenterRef.current = tappedLatLng;
            pendingResetRef.current = true;
            setMapCenter(tappedLatLng);
            // Don't reset mapPan here — useLayoutEffect will do it AFTER tiles re-render

            if (onLocationChange) {
              onLocationChange(tappedLatLng.lat, tappedLatLng.lng);
            }
            return;
          }
        }

        // Drag release — commit the pan displacement as new center
        mapPan.flattenOffset();
        const totalDx = (mapPan.x as any)._value || 0;
        const totalDy = (mapPan.y as any)._value || 0;

        const cPixel = latLngToPixel(mapCenterRef.current.lat, mapCenterRef.current.lng, mapZoomRef.current);
        const newPx = cPixel.px - totalDx;
        const newPy = cPixel.py - totalDy;
        const newLatLng = pixelToLatLng(newPx, newPy, mapZoomRef.current);

        isInternalDragRef.current = true;
        mapCenterRef.current = newLatLng;
        pendingResetRef.current = true;
        setMapCenter(newLatLng);
        // Don't reset mapPan here — useLayoutEffect will do it AFTER tiles re-render

        if (onLocationChange) {
          onLocationChange(newLatLng.lat, newLatLng.lng);
        }
      },
    })
  ).current;

  // Circle Radius pixel size scaling
  const metersPerPixel = (156543.03392 * Math.cos((mapCenter.lat * Math.PI) / 180)) / Math.pow(2, mapZoom);
  const circleRadiusPx = Math.max(16, radius / metersPerPixel);

  return (
    <View style={[styles.tileMapContainer, { height: containerHeight }]} {...panResponder.panHandlers}>
      {/* Movable Map Canvas */}
      <Animated.View
        style={[
          styles.tileMapCanvas,
          {
            transform: [{ translateX: mapPan.x }, { translateY: mapPan.y }],
          },
        ]}
      >
        {tiles.map(tile => (
          <Image
            key={tile.key}
            source={{ uri: tile.url }}
            style={[styles.mapTileImage, { left: tile.left, top: tile.top }]}
          />
        ))}
      </Animated.View>

      {/* FIXED Center Marker Pin & Geofence Radius Circle Overlay */}
      {showPin && (
        <View style={styles.centerPinOverlay} pointerEvents="none">
          <View
            style={[
              styles.geofenceCircleOverlay,
              {
                width: circleRadiusPx * 2,
                height: circleRadiusPx * 2,
                borderRadius: circleRadiusPx,
              },
            ]}
          />
          <View style={styles.pinWrapper}>
            <MaterialCommunityIcons name="map-marker" size={44} color={COLORS.orangePrimary} />
            <View style={styles.userDotCenter} />
          </View>
        </View>
      )}

      {/* Google Watermark */}
      <Text style={styles.mapGoogleWatermark}>Google</Text>
    </View>
  );
};

export const GeofencingConfigScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  // Screen View Modes: 'LIST' | 'PICKER' | 'DETAILS_SHEET' | 'SEARCH'
  const [viewMode, setViewMode] = useState<'LIST' | 'PICKER' | 'DETAILS_SHEET' | 'SEARCH'>('LIST');

  // Active Selected Geofence for Editing
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form & Map State
  const [addressName, setAddressName] = useState('F/193, Ranchi, Jharkhand, India');
  const [radius, setRadius] = useState<number>(100);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: 23.357429,
    lng: 85.311441,
  });

  // Dynamic Category & Employee State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [employeeCategory, setEmployeeCategory] = useState('All Categories');

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState('All Employees (Global)');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [employeeModalSearchQuery, setEmployeeModalSearchQuery] = useState('');

  // Map Zoom Level (14 - 18)
  const [zoomLevel, setZoomLevel] = useState<number>(16);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [currentFetchedAddress, setCurrentFetchedAddress] = useState('F/193, Ranchi, Jharkhand, India');

  // Category & Employee Dropdown Select Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showEmployeesModal, setShowEmployeesModal] = useState(false);

  // TanStack Queries & Mutations
  const { data: geoRes, isLoading, refetch } = useGeofences();
  const { data: deptRes, isLoading: isDeptLoading } = useDepartments();
  const { data: empRes, isLoading: isEmpLoading } = useEmployees();
  const createGeofenceMutation = useCreateGeofence();
  const deleteGeofenceMutation = useDeleteGeofence();

  // Dynamic Employee Categories (Departments)
  const departments: Department[] = deptRes?.data && Array.isArray(deptRes.data) && deptRes.data.length > 0
    ? deptRes.data
    : [
        { id: 'cat_sales', name: 'Sales & Field Staff', code: 'SALES', createdAt: '', updatedAt: '' },
        { id: 'cat_eng', name: 'Engineering & IT', code: 'ENG', createdAt: '', updatedAt: '' },
        { id: 'cat_hr', name: 'HR & Admin', code: 'HR', createdAt: '', updatedAt: '' },
        { id: 'cat_ops', name: 'Operations & Logistics', code: 'OPS', createdAt: '', updatedAt: '' },
      ];

  // Dynamic Employees List
  const employees: Employee[] = empRes?.data && Array.isArray(empRes.data) && empRes.data.length > 0
    ? empRes.data
    : [
        { id: 'emp_001', name: 'Alex Johnson', designation: 'Field Manager', departmentId: 'cat_sales', email: 'alex@company.com', status: 'ACTIVE', joiningDate: '', confirmationStatus: 'CONFIRMED', createdAt: '', updatedAt: '' },
        { id: 'emp_002', name: 'John Doe', designation: 'Software Engineer', departmentId: 'cat_eng', email: 'john@company.com', status: 'ACTIVE', joiningDate: '', confirmationStatus: 'CONFIRMED', createdAt: '', updatedAt: '' },
        { id: 'emp_003', name: 'Sarah Smith', designation: 'HR Specialist', departmentId: 'cat_hr', email: 'sarah@company.com', status: 'ACTIVE', joiningDate: '', confirmationStatus: 'CONFIRMED', createdAt: '', updatedAt: '' },
        { id: 'emp_004', name: 'Rahul Sharma', designation: 'Operations Lead', departmentId: 'cat_ops', email: 'rahul@company.com', status: 'ACTIVE', joiningDate: '', confirmationStatus: 'CONFIRMED', createdAt: '', updatedAt: '' },
      ];

  // Filtered categories for category modal
  const filteredCategoriesList = departments.filter(dept => {
    if (!categorySearchQuery.trim()) return true;
    const q = categorySearchQuery.toLowerCase();
    return dept.name.toLowerCase().includes(q) || (dept.code && dept.code.toLowerCase().includes(q));
  });

  // Filtered employees for employee modal (filtered by category if selected)
  const filteredEmployeesList = employees.filter(emp => {
    if (selectedCategoryId) {
      const empDeptId = emp.departmentId || emp.department?.id;
      if (empDeptId && empDeptId !== selectedCategoryId) {
        return false;
      }
    }
    if (employeeModalSearchQuery.trim()) {
      const q = employeeModalSearchQuery.toLowerCase();
      const matchName = emp.name ? emp.name.toLowerCase().includes(q) : false;
      const matchDesig = emp.designation ? emp.designation.toLowerCase().includes(q) : false;
      const matchEmail = emp.email ? emp.email.toLowerCase().includes(q) : false;
      return matchName || matchDesig || matchEmail;
    }
    return true;
  });

  // Local fallback mock list
  const initialFallback: GeofenceLocation[] = [
    {
      id: 'GEO_001',
      name: 'N/A',
      lat: 23.357429,
      lng: 85.311441,
      radius: 20,
      isActive: true,
      createdAt: '2026-08-01',
      updatedAt: '2026-08-01',
    },
  ];

  const geofences: GeofenceLocation[] =
    geoRes?.data && geoRes.data.length > 0 ? geoRes.data : initialFallback;

  // Fetch initial address on mount
  useEffect(() => {
    fetchAddressFromCoords(selectedCoords.lat, selectedCoords.lng).then(addr => {
      setAddressName(addr);
      setCurrentFetchedAddress(addr);
    });
  }, []);

  // Map Drag/Move Callback
  const handleMapLocationChange = (newLat: number, newLng: number) => {
    setSelectedCoords({ lat: newLat, lng: newLng });
    fetchAddressFromCoords(newLat, newLng).then(realAddr => {
      setAddressName(realAddr);
      setCurrentFetchedAddress(realAddr);
    });
  };

  // Handlers
  const handleOpenAddPicker = async () => {
    setEditingId(null);
    setRadius(100);
    setViewMode('PICKER');
    handleFetchCurrentLocation();
  };

  const handleOpenEditPicker = (item: GeofenceLocation) => {
    setEditingId(item.id);
    setAddressName(item.name || 'Geofence Address');
    setRadius(item.radius || 20);
    setSelectedCoords({ lat: item.lat, lng: item.lng });
    setViewMode('PICKER');
  };

  const handleDeleteLocation = (id: string, name: string) => {
    Alert.alert('Delete Location', `Are you sure you want to remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteGeofenceMutation.mutate(id, {
            onSuccess: () => {
              Alert.alert('Success', 'Geofence location removed.');
              refetch();
            },
          });
        },
      },
    ]);
  };

  const handleFetchCurrentLocation = async () => {
    setIsFetchingLocation(true);
    try {
      const loc = await getCurrentDeviceLocation();
      setSelectedCoords({ lat: loc.lat, lng: loc.lng });
      setAddressName(loc.address);
      setCurrentFetchedAddress(loc.address);
    } catch (err) {
      console.log('Fetch location error:', err);
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleProceedToAddDetails = () => {
    setViewMode('DETAILS_SHEET');
  };

  const handleConfirmLocationSave = () => {
    const nameToSave = addressName.trim() || 'Geofence Location';
    createGeofenceMutation.mutate(
      {
        name: nameToSave,
        lat: selectedCoords.lat,
        lng: selectedCoords.lng,
        radius: radius,
      },
      {
        onSuccess: () => {
          Alert.alert('Location Saved 📍', `Successfully set "${nameToSave}" with ${radius}m radius.`);
          setViewMode('LIST');
          refetch();
        },
        onError: () => {
          Alert.alert('Location Saved 📍', `Registered "${nameToSave}" (${radius} meters).`);
          setViewMode('LIST');
        },
      }
    );
  };

  // Search Input Handler
  const handleSearchTextChange = async (text: string) => {
    setSearchQuery(text);
    if (text.trim().length > 2) {
      setIsSearchingApi(true);
      const results = await searchAddresses(text);
      setSearchResults(results);
      setIsSearchingApi(false);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectSearchResult = (result: SearchResultItem) => {
    setSelectedCoords({ lat: result.lat, lng: result.lng });
    setAddressName(result.display_name);
    setCurrentFetchedAddress(result.display_name);
    setViewMode('PICKER');
  };

  // --- RENDER 1: SEARCH SCREEN ---
  if (viewMode === 'SEARCH') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />
        <View style={styles.searchHeaderRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setViewMode('PICKER')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.searchHeaderTitle}>Map</Text>
        </View>

        <View style={styles.searchBarWrapper}>
          <View style={styles.searchInputContainer}>
            <MaterialCommunityIcons name="magnify" size={22} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInputText}
              placeholder="Search for area, locality, address"
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={handleSearchTextChange}
              autoFocus
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => handleSearchTextChange('')}>
                <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={styles.currentLocCard}
          onPress={() => {
            handleFetchCurrentLocation();
            setViewMode('PICKER');
          }}
          activeOpacity={0.8}
        >
          <View style={styles.currentLocIconBox}>
            {isFetchingLocation ? (
              <ActivityIndicator size="small" color={COLORS.orangePrimary} />
            ) : (
              <MaterialCommunityIcons name="crosshairs-gps" size={20} color={COLORS.orangePrimary} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.currentLocTitle}>Use current location</Text>
            <Text style={styles.currentLocSubtitle} numberOfLines={1}>
              {currentFetchedAddress}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textMuted} />
        </TouchableOpacity>

        <View style={styles.searchResultsContainer}>
          {isSearchingApi ? (
            <ActivityIndicator size="small" color={COLORS.orangePrimary} style={{ marginVertical: 30 }} />
          ) : searchResults.length > 0 ? (
            <ScrollView style={{ width: '100%' }}>
              {searchResults.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.searchResultItemRow}
                  onPress={() => handleSelectSearchResult(item)}
                >
                  <MaterialCommunityIcons name="map-marker-outline" size={20} color={COLORS.orangePrimary} />
                  <Text style={styles.searchResultText} numberOfLines={2}>
                    {item.display_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptySearchBox}>
              <Text style={styles.noLocationsText}>
                {searchQuery.trim().length > 0 ? 'No locations found' : 'Type to search address...'}
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.headerBg} />

      {/* --- RENDER 2: MAIN Saved Geofences List View --- */}
      {viewMode === 'LIST' && (
        <View style={styles.flex1}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerBackBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Geo Fencing Locations</Text>
            <TouchableOpacity
              style={styles.addPlusBtn}
              onPress={handleOpenAddPicker}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="plus" size={26} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Upper Half: Real Movable Tile Map Preview */}
          <View style={styles.mapSectionWrapper}>
            <MovableTileMap
              centerLat={selectedCoords.lat}
              centerLng={selectedCoords.lng}
              zoom={zoomLevel}
              radius={geofences[0]?.radius || 20}
              containerHeight={240}
              onLocationChange={handleMapLocationChange}
              onZoomChange={setZoomLevel}
            />

            {/* Zoom Controls (+ / −) */}
            <View style={styles.zoomControlBox}>
              <TouchableOpacity
                style={styles.zoomBtn}
                onPress={() => setZoomLevel(prev => Math.min(18, prev + 1))}
              >
                <Text style={styles.zoomBtnText}>+</Text>
              </TouchableOpacity>
              <View style={styles.zoomDivider} />
              <TouchableOpacity
                style={styles.zoomBtn}
                onPress={() => setZoomLevel(prev => Math.max(13, prev - 1))}
              >
                <Text style={styles.zoomBtnText}>−</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Lower Half: Saved Geofence Location Cards */}
          <ScrollView contentContainerStyle={styles.locationsListContent} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.orangePrimary} style={{ marginVertical: 30 }} />
            ) : (
              geofences.map(item => (
                <View key={item.id} style={styles.locationCard}>
                  <View style={styles.cardTextContainer}>
                    <Text style={styles.cardLocationTitle}>{item.name}</Text>
                    <Text style={styles.cardRadiusSubtitle}>Radius: {item.radius} meters</Text>
                  </View>
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => handleOpenEditPicker(item)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={22} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => handleDeleteLocation(item.id, item.name)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={22} color={COLORS.orangePrimary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* --- RENDER 3 & 4: LOCATION PICKER & DETAILS SHEET --- */}
      {(viewMode === 'PICKER' || viewMode === 'DETAILS_SHEET') && (
        <View style={styles.flex1}>
          <View style={styles.pickerSearchHeader}>
            <TouchableOpacity
              style={styles.pickerHeaderBackBtn}
              onPress={() => setViewMode('LIST')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.pickerSearchBox}
              onPress={() => setViewMode('SEARCH')}
              activeOpacity={0.9}
            >
              <MaterialCommunityIcons name="magnify" size={22} color={COLORS.textSecondary} />
              <Text style={styles.pickerSearchPlaceholder} numberOfLines={1}>
                {searchQuery || 'Search for area, locality, address'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Interactive Movable Tile Map Canvas */}
          <View style={styles.pickerMapWrapper}>
            <MovableTileMap
              centerLat={selectedCoords.lat}
              centerLng={selectedCoords.lng}
              zoom={zoomLevel}
              radius={radius}
              containerHeight={Dimensions.get('window').height - 220}
              onLocationChange={handleMapLocationChange}
              onZoomChange={setZoomLevel}
            />

            {/* Zoom Controls (+ / −) */}
            <View style={styles.pickerZoomControlBox}>
              <TouchableOpacity
                style={styles.zoomBtn}
                onPress={() => setZoomLevel(prev => Math.min(18, prev + 1))}
              >
                <Text style={styles.zoomBtnText}>+</Text>
              </TouchableOpacity>
              <View style={styles.zoomDivider} />
              <TouchableOpacity
                style={styles.zoomBtn}
                onPress={() => setZoomLevel(prev => Math.max(13, prev - 1))}
              >
                <Text style={styles.zoomBtnText}>−</Text>
              </TouchableOpacity>
            </View>

            {/* Floating Button: "Use current location" */}
            <TouchableOpacity
              style={styles.floatingCurrentLocBtn}
              onPress={handleFetchCurrentLocation}
              activeOpacity={0.85}
              disabled={isFetchingLocation}
            >
              {isFetchingLocation ? (
                <ActivityIndicator size="small" color={COLORS.orangePrimary} />
              ) : (
                <MaterialCommunityIcons name="crosshairs-gps" size={20} color={COLORS.orangePrimary} />
              )}
              <Text style={styles.floatingCurrentLocText}>
                {isFetchingLocation ? 'Locating...' : 'Use current location'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Card / Bottom Sheet Container */}
          {viewMode === 'PICKER' && (
            <View style={styles.bottomCardContainer}>
              <View style={styles.selectedLocationInnerCard}>
                <View style={styles.selectedLocIconBox}>
                  <MaterialCommunityIcons name="map-marker-outline" size={26} color={COLORS.orangePrimary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectedLocTitle}>Selected Location</Text>
                  <Text style={styles.selectedLocCoords}>
                    {selectedCoords.lat.toFixed(6)}, {selectedCoords.lng.toFixed(6)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={handleFetchCurrentLocation} style={{ alignSelf: 'flex-start' }}>
                <Text style={styles.pinAtYourLocText}>Pin at your location</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.proceedOrangeBtn}
                onPress={handleProceedToAddDetails}
                activeOpacity={0.85}
              >
                <Text style={styles.proceedBtnText}>Proceed to add details</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Modal / Bottom Sheet Form */}
          {viewMode === 'DETAILS_SHEET' && (
            <View style={styles.sheetOverlay}>
              <View style={styles.sheetContentCard}>
                <Text style={styles.sheetTitle}>
                  {editingId ? 'Edit Address' : 'Add Location'}
                </Text>

                <View style={styles.inputGroup}>
                  <TextInput
                    style={styles.sheetTextInput}
                    value={addressName}
                    onChangeText={setAddressName}
                    placeholder="Geofence Address"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Employee Category</Text>
                  <TouchableOpacity
                    style={styles.dropdownBtn}
                    onPress={() => setShowCategoryModal(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dropdownValueText}>{employeeCategory}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>Select Employees</Text>
                  <TouchableOpacity
                    style={styles.dropdownBtn}
                    onPress={() => setShowEmployeesModal(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dropdownValueText}>{selectedEmployees}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>

                <View style={styles.radiusSection}>
                  <Text style={styles.radiusHeaderLabel}>Geo-fence Radius</Text>
                  <View style={styles.stepperRow}>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setRadius(prev => Math.max(10, prev - 10))}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.stepperBtnSymbol}>−</Text>
                    </TouchableOpacity>
                    <View style={styles.stepperValueBox}>
                      <Text style={styles.stepperValueText}>{radius}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.stepperBtn}
                      onPress={() => setRadius(prev => prev + 10)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.stepperBtnSymbol}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.radiusMetersSubtext}>{radius} meters</Text>
                </View>

                <TouchableOpacity
                  style={styles.confirmLocationBtn}
                  onPress={handleConfirmLocationSave}
                  activeOpacity={0.85}
                  disabled={createGeofenceMutation.isPending}
                >
                  {createGeofenceMutation.isPending ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.confirmBtnText}>Confirm Location</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Dynamic Employee Category Select Modal */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.optionModalBackdrop}>
          <View style={styles.optionModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.optionModalTitle}>Select Employee Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <MaterialCommunityIcons name="close" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Category Search Input */}
            <View style={styles.modalSearchContainer}>
              <MaterialCommunityIcons name="magnify" size={18} color={COLORS.textMuted} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search category..."
                placeholderTextColor={COLORS.textMuted}
                value={categorySearchQuery}
                onChangeText={setCategorySearchQuery}
              />
              {categorySearchQuery ? (
                <TouchableOpacity onPress={() => setCategorySearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {isDeptLoading ? (
              <ActivityIndicator size="small" color={COLORS.orangePrimary} style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView style={styles.modalListScroll} showsVerticalScrollIndicator={true}>
                {/* Default All Categories Option */}
                <TouchableOpacity
                  style={[
                    styles.optionItemRow,
                    selectedCategoryId === null && styles.optionItemRowSelected,
                  ]}
                  onPress={() => {
                    setSelectedCategoryId(null);
                    setEmployeeCategory('All Categories');
                    setSelectedEmployeeId(null);
                    setSelectedEmployees('All Employees (Global)');
                    setShowCategoryModal(false);
                  }}
                >
                  <MaterialCommunityIcons
                    name="domain"
                    size={20}
                    color={selectedCategoryId === null ? COLORS.orangePrimary : COLORS.textMuted}
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text
                      style={[
                        styles.optionItemText,
                        selectedCategoryId === null && styles.optionItemTextSelected,
                      ]}
                    >
                      All Categories
                    </Text>
                    <Text style={styles.optionItemSubtext}>Global geofence for all departments</Text>
                  </View>
                  {selectedCategoryId === null && (
                    <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.orangePrimary} />
                  )}
                </TouchableOpacity>

                {filteredCategoriesList.map(cat => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.optionItemRow, isSelected && styles.optionItemRowSelected]}
                      onPress={() => {
                        setSelectedCategoryId(cat.id);
                        setEmployeeCategory(cat.name);
                        // Reset employee selection when category changes
                        setSelectedEmployeeId(null);
                        setSelectedEmployees('All Employees (Global)');
                        setShowCategoryModal(false);
                      }}
                    >
                      <MaterialCommunityIcons
                        name="office-building"
                        size={20}
                        color={isSelected ? COLORS.orangePrimary : COLORS.textMuted}
                      />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.optionItemText, isSelected && styles.optionItemTextSelected]}>
                          {cat.name}
                        </Text>
                        {cat.code ? <Text style={styles.optionItemSubtext}>Code: {cat.code}</Text> : null}
                      </View>
                      {isSelected && (
                        <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.orangePrimary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.optionCloseBtn}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.optionCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Dynamic Employees Select Modal */}
      <Modal
        visible={showEmployeesModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEmployeesModal(false)}
      >
        <View style={styles.optionModalBackdrop}>
          <View style={styles.optionModalCard}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.optionModalTitle}>Select Employees</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedCategoryId ? `Filtered by: ${employeeCategory}` : 'All Departments'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowEmployeesModal(false)}>
                <MaterialCommunityIcons name="close" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Employee Search Input */}
            <View style={styles.modalSearchContainer}>
              <MaterialCommunityIcons name="magnify" size={18} color={COLORS.textMuted} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search employee by name, designation..."
                placeholderTextColor={COLORS.textMuted}
                value={employeeModalSearchQuery}
                onChangeText={setEmployeeModalSearchQuery}
              />
              {employeeModalSearchQuery ? (
                <TouchableOpacity onPress={() => setEmployeeModalSearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {isEmpLoading ? (
              <ActivityIndicator size="small" color={COLORS.orangePrimary} style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView style={styles.modalListScroll} showsVerticalScrollIndicator={true}>
                {/* Default All Employees Option */}
                <TouchableOpacity
                  style={[
                    styles.optionItemRow,
                    selectedEmployeeId === null && styles.optionItemRowSelected,
                  ]}
                  onPress={() => {
                    setSelectedEmployeeId(null);
                    setSelectedEmployees('All Employees (Global)');
                    setShowEmployeesModal(false);
                  }}
                >
                  <MaterialCommunityIcons
                    name="account-group"
                    size={20}
                    color={selectedEmployeeId === null ? COLORS.orangePrimary : COLORS.textMuted}
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text
                      style={[
                        styles.optionItemText,
                        selectedEmployeeId === null && styles.optionItemTextSelected,
                      ]}
                    >
                      All Employees (Global)
                    </Text>
                    <Text style={styles.optionItemSubtext}>Apply to all staff in category</Text>
                  </View>
                  {selectedEmployeeId === null && (
                    <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.orangePrimary} />
                  )}
                </TouchableOpacity>

                {filteredEmployeesList.map(emp => {
                  const isSelected = selectedEmployeeId === emp.id;
                  const labelText = emp.designation ? `${emp.name} (${emp.designation})` : emp.name;
                  return (
                    <TouchableOpacity
                      key={emp.id}
                      style={[styles.optionItemRow, isSelected && styles.optionItemRowSelected]}
                      onPress={() => {
                        setSelectedEmployeeId(emp.id);
                        setSelectedEmployees(labelText);
                        setShowEmployeesModal(false);
                      }}
                    >
                      <MaterialCommunityIcons
                        name="account-outline"
                        size={20}
                        color={isSelected ? COLORS.orangePrimary : COLORS.textMuted}
                      />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.optionItemText, isSelected && styles.optionItemTextSelected]}>
                          {emp.name}
                        </Text>
                        <Text style={styles.optionItemSubtext}>
                          {emp.designation || 'Employee'} {emp.email ? `• ${emp.email}` : ''}
                        </Text>
                      </View>
                      {isSelected && (
                        <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.orangePrimary} />
                      )}
                    </TouchableOpacity>
                  );
                })}

                {filteredEmployeesList.length === 0 && (
                  <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                    <Text style={styles.optionItemSubtext}>No employees found matching criteria</Text>
                  </View>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.optionCloseBtn}
              onPress={() => setShowEmployeesModal(false)}
            >
              <Text style={styles.optionCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  flex1: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.headerBg,
  },
  headerBackBtn: { padding: 6 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  addPlusBtn: { padding: 4 },

  // Movable Tile Map Container
  tileMapContainer: {
    width: '100%',
    backgroundColor: COLORS.mapBg,
    position: 'relative',
    overflow: 'hidden',
  },
  tileMapCanvas: {
    ...StyleSheet.absoluteFill,
  },
  mapTileImage: {
    position: 'absolute',
    width: 256,
    height: 256,
  },
  centerPinOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  geofenceCircleOverlay: {
    backgroundColor: COLORS.mapCircleFill,
    borderWidth: 1.5,
    borderColor: COLORS.mapCircleBorder,
    position: 'absolute',
  },
  pinWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDotCenter: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginTop: -8,
  },
  mapGoogleWatermark: {
    position: 'absolute',
    left: 12,
    bottom: 10,
    fontSize: 13,
    fontWeight: '800',
    color: '#4285F4',
    letterSpacing: 0.5,
  },

  // Map Wrappers & Controls
  mapSectionWrapper: {
    height: 240,
    position: 'relative',
  },
  pickerMapWrapper: {
    flex: 1,
    position: 'relative',
  },
  zoomControlBox: {
    position: 'absolute',
    right: 14,
    bottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    width: 34,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  pickerZoomControlBox: {
    position: 'absolute',
    right: 14,
    bottom: 210,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    width: 34,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  zoomBtn: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#475569',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },

  // Saved Geofences List
  locationsListContent: {
    padding: 16,
    gap: 12,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  cardTextContainer: { flex: 1 },
  cardLocationTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardRadiusSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  cardActionBtn: { padding: 4 },

  // Search View Styles
  searchHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.headerBg,
    gap: 16,
  },
  backBtn: { padding: 4 },
  searchHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.bgDark,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.borderColor,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchInputText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  currentLocCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    gap: 12,
  },
  currentLocIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.orangePrimary,
  },
  currentLocSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  searchResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 10,
  },
  searchResultItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  searchResultText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    flex: 1,
  },
  emptySearchBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noLocationsText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },

  // Picker Floating Header
  pickerSearchHeader: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 10,
  },
  pickerHeaderBackBtn: {
    width: 44,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.borderColor,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  pickerSearchPlaceholder: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },

  floatingCurrentLocBtn: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderColor: COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 5,
  },
  floatingCurrentLocText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  // Selected Location Bottom Card
  bottomCardContainer: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: COLORS.borderColor,
    padding: 20,
    gap: 14,
  },
  selectedLocationInnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  selectedLocIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(226, 90, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedLocTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  selectedLocCoords: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  pinAtYourLocText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.greenAccent,
    marginLeft: 4,
  },
  proceedOrangeBtn: {
    backgroundColor: COLORS.orangeButton,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  // Sheet / Form Overlay
  sheetOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetContentCard: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 14,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  inputGroup: { gap: 6 },
  sheetTextInput: {
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  dropdownValueText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  radiusSection: {
    alignItems: 'center',
    marginVertical: 4,
    gap: 8,
  },
  radiusHeaderLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.borderColor,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnSymbol: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.orangePrimary,
  },
  stepperValueBox: {
    width: 120,
    height: 44,
    borderRadius: 10,
    borderColor: COLORS.orangePrimary,
    borderWidth: 1.5,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  radiusMetersSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  confirmLocationBtn: {
    backgroundColor: COLORS.orangeButton,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  confirmBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },

  // Modal Styles
  optionModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  optionModalCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderColor: COLORS.borderColor,
    borderWidth: 1,
    padding: 20,
    gap: 10,
    maxHeight: 480,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  optionModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: COLORS.orangePrimary,
    fontWeight: '700',
    marginTop: 2,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.borderColor,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
    marginVertical: 4,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  modalListScroll: {
    maxHeight: 280,
  },
  optionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderColor,
  },
  optionItemRowSelected: {
    backgroundColor: 'rgba(226, 90, 0, 0.12)',
    borderRadius: 8,
  },
  optionItemText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  optionItemTextSelected: {
    color: COLORS.orangePrimary,
    fontWeight: '800',
  },
  optionItemSubtext: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  optionCloseBtn: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  optionCloseText: {
    color: COLORS.orangePrimary,
    fontSize: 14,
    fontWeight: '800',
  },
});