'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme, setTheme: setNextTheme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Set the theme type to our custom type
  const currentTheme = (theme as Theme) || 'system';
  
  // Update isDarkMode based on the current theme
  useEffect(() => {
    const updateDarkMode = () => {
      if (theme === 'dark' ||
         (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setIsDarkMode(true);
      } else {
        setIsDarkMode(false);
      }
    };

    // Only run on client side
    updateDarkMode();
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

      const handleChange = (e: MediaQueryListEvent) => {
        setIsDarkMode(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, [theme]);
  
  const setTheme = (newTheme: Theme) => {
    setNextTheme(newTheme);
  };
  
  return (
    <ThemeContext.Provider value={{ theme: currentTheme, setTheme, isDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};