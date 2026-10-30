import { Dimensions, PixelRatio, useWindowDimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Baseline mobile dimensions (standard mobile reference)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/**
 * Static Responsive Utilities (usable directly in StyleSheet.create)
 */

// Horizontal scale based on screen width
export const scale = (size: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH / BASE_WIDTH) * size);
};

// Vertical scale based on screen height
export const verticalScale = (size: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT / BASE_HEIGHT) * size);
};

// Moderate scale (best for fonts, padding, margins, border radius so they don't blow up on tablets or shrink too much on low-end screens)
export const moderateScale = (size: number, factor = 0.5): number => {
  return PixelRatio.roundToNearestPixel(size + (scale(size) - size) * factor);
};

// Responsive width percentage (e.g. wp(50) = 50% of screen width)
export const wp = (percentage: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * percentage) / 100);
};

// Responsive height percentage (e.g. hp(50) = 50% of screen height)
export const hp = (percentage: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * percentage) / 100);
};

// Alias names
export const responsiveWidth = wp;
export const responsiveHeight = hp;

// Font scaling capped to prevent severe container clipping on Android large display/font sizes
export const normalizeFont = (size: number): number => {
  const newSize = moderateScale(size);
  return Math.round(newSize);
};

// Device classification flags
export const isSmallDevice = SCREEN_WIDTH <= 360;
export const isMediumDevice = SCREEN_WIDTH > 360 && SCREEN_WIDTH < 414;
export const isLargeDevice = SCREEN_WIDTH >= 414;
export const isTablet = SCREEN_WIDTH >= 600 || SCREEN_HEIGHT >= 1100;

export interface ResponsiveInfo {
  width: number;
  height: number;
  isLandscape: boolean;
  isSmallDevice: boolean;
  isMediumDevice: boolean;
  isLargeDevice: boolean;
  isTablet: boolean;
  scale: (size: number) => number;
  verticalScale: (size: number) => number;
  moderateScale: (size: number, factor?: number) => number;
  wp: (percentage: number) => number;
  hp: (percentage: number) => number;
  normalizeFont: (size: number) => number;
}

/**
 * Dynamic Responsive Hook (reactive to screen rotation, foldable unfold, and split screen)
 */
export const useResponsive = (): ResponsiveInfo => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const dynamicScale = (size: number): number => {
    const baseW = isLandscape ? BASE_HEIGHT : BASE_WIDTH;
    return PixelRatio.roundToNearestPixel((width / baseW) * size);
  };

  const dynamicVerticalScale = (size: number): number => {
    const baseH = isLandscape ? BASE_WIDTH : BASE_HEIGHT;
    return PixelRatio.roundToNearestPixel((height / baseH) * size);
  };

  const dynamicModerateScale = (size: number, factor = 0.5): number => {
    return PixelRatio.roundToNearestPixel(size + (dynamicScale(size) - size) * factor);
  };

  const dynamicWp = (percentage: number): number => {
    return PixelRatio.roundToNearestPixel((width * percentage) / 100);
  };

  const dynamicHp = (percentage: number): number => {
    return PixelRatio.roundToNearestPixel((height * percentage) / 100);
  };

  const dynamicNormalizeFont = (size: number): number => {
    return Math.round(dynamicModerateScale(size));
  };

  return {
    width,
    height,
    isLandscape,
    isSmallDevice: width <= 360,
    isMediumDevice: width > 360 && width < 414,
    isLargeDevice: width >= 414,
    isTablet: width >= 600 || height >= 1100,
    scale: dynamicScale,
    verticalScale: dynamicVerticalScale,
    moderateScale: dynamicModerateScale,
    wp: dynamicWp,
    hp: dynamicHp,
    normalizeFont: dynamicNormalizeFont,
  };
};
