'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
// Use a more generic type since we're having issues with next-themes types
type ThemeProviderProps = {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
  themes?: string[];
  forcedTheme?: string;
};

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
