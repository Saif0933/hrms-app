import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, ColorSchemeName, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, ThemeColors } from '../constants/theme';

export type { ThemeColors };
export type ThemeMode = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = '@app_theme_mode';

interface ThemeContextType {
  themeMode: ThemeMode;
  systemScheme: ColorSchemeName;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Device system theme hook
  const deviceColorScheme = useColorScheme();
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme() ?? deviceColorScheme ?? 'light'
  );
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  // Load saved theme mode preference on startup
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved === 'system' || saved === 'light' || saved === 'dark') {
          setThemeModeState(saved as ThemeMode);
        }
      } catch {
        // Fallback to system default if storage read fails
      }
    };
    loadSavedTheme();
  }, []);

  // Real-time system appearance listener (handles low & high Android versions seamlessly)
  useEffect(() => {
    const listener = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme ?? 'light');
    });

    return () => listener.remove();
  }, []);

  // Update when hook emits change
  useEffect(() => {
    if (deviceColorScheme) {
      setSystemScheme(deviceColorScheme);
    }
  }, [deviceColorScheme]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
  };

  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  // When themeMode is 'system', follow device settings in real-time
  const activeColorScheme =
    themeMode === 'system' ? (systemScheme ?? 'light') : themeMode;

  const isDark = activeColorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        systemScheme,
        isDark,
        colors,
        setThemeMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
