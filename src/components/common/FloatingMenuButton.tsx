import React, { useRef } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
// @ts-ignore
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { navigationRef } from '../../navigation/navigationRef';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUTTON_SIZE = 54;

interface FloatingMenuButtonProps {
  currentRoute?: string | null;
}

export const FloatingMenuButton: React.FC<FloatingMenuButtonProps> = ({ currentRoute }) => {
  const activeRoute = currentRoute || (navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : null);

  const isHidden =
    !activeRoute ||
    ['Splash', 'Login', 'Register', 'Menu'].includes(activeRoute);

  // Position animated value (Initial position: bottom right)
  const pan = useRef(
    new Animated.ValueXY({
      x: SCREEN_WIDTH - BUTTON_SIZE - 20,
      y: SCREEN_HEIGHT - BUTTON_SIZE - 110,
    })
  ).current;

  // Ref to track if user is dragging vs tapping
  const isDragging = useRef(false);

  const handleOpenMenu = () => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Menu');
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      // Do not capture on initial touch so tap events trigger instantly on Press
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4;
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();

        // Clamp position within screen boundaries
        const currentX = (pan.x as any)._value;
        const currentY = (pan.y as any)._value;

        const minX = 10;
        const maxX = SCREEN_WIDTH - BUTTON_SIZE - 10;
        const minY = 40;
        const maxY = SCREEN_HEIGHT - BUTTON_SIZE - 40;

        const clampedX = Math.min(Math.max(currentX, minX), maxX);
        const clampedY = Math.min(Math.max(currentY, minY), maxY);

        Animated.spring(pan, {
          toValue: { x: clampedX, y: clampedY },
          useNativeDriver: false,
          friction: 7,
          tension: 50,
        }).start();

        // If distance moved is minimal (< 4px), treat as tap/click to open Menu
        if (Math.abs(gestureState.dx) < 4 && Math.abs(gestureState.dy) < 4) {
          handleOpenMenu();
        }

        setTimeout(() => {
          isDragging.current = false;
        }, 100);
      },
    })
  ).current;

  if (isHidden) {
    return null;
  }

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          transform: pan.getTranslateTransform(),
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          if (!isDragging.current) {
            handleOpenMenu();
          }
        }}
        style={styles.button}
      >
        <MaterialCommunityIcons name="menu" size={26} color="rgba(255, 255, 255, 0.95)" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 99999,
    elevation: 10,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: 'rgba(186, 225, 215, 0.35)', // Transparent floating background
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(218, 219, 217, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    // elevation: 4,
  },
});
