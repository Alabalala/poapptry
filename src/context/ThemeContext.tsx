import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

type ThemeType = 'light' | 'dark';

interface ThemeColors {
  background: string;
  surface: string;
  surfaceHighlight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryLight: string;
  error: string;
  overlay: string;
  backdrop: string;
}

interface ThemeContextType {
  theme: ThemeType;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

const LightColors: ThemeColors = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceHighlight: '#F3F4F6',
  text: '#1F2937',
  textSecondary: '#374151',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  primary: '#3B82F6',
  primaryLight: '#EFF6FF',
  error: '#EF4444',
  overlay: 'rgba(0, 0, 0, 0.4)',
  backdrop: '#F3F4F6',
};

const DarkColors: ThemeColors = {
  background: '#111827',
  surface: '#1F2937',
  surfaceHighlight: '#374151',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  border: '#374151',
  primary: '#60A5FA',
  primaryLight: 'rgba(59, 130, 246, 0.2)',
  error: '#F87171',
  overlay: 'rgba(0, 0, 0, 0.7)',
  backdrop: '#111827',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('light');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app-theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setThemeState(savedTheme);
      } else if (systemScheme) {
        // Default to system if no preference saved
        setThemeState(systemScheme as ThemeType);
      }
    } catch (error) {
      console.error('Failed to load theme', error);
    }
  };

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('app-theme', newTheme);
    } catch (error) {
      console.error('Failed to save theme', error);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const colors = theme === 'light' ? LightColors : DarkColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
