import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeName = 'light' | 'dark';

interface Theme {
  name: ThemeName;
  displayName: string;
  isDark: boolean;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    glow: string;
  };
}

const themes: Record<ThemeName, Theme> = {
  light: {
    name: 'light',
    displayName: 'روشن',
    isDark: false,
    colors: {
      primary: '#4f46e5',
      secondary: '#6366f1',
      background: '#ffffff',
      surface: '#f8fafc',
      surfaceAlt: '#f1f5f9',
      text: '#0f172a',
      textSecondary: '#475569',
      border: '#e2e8f0',
      accent: '#10b981',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      glow: 'rgba(99, 102, 241, 0.2)',
    },
  },
  dark: {
    name: 'dark',
    displayName: 'تیره',
    isDark: true,
    colors: {
      primary: '#818cf8',
      secondary: '#a5b4fc',
      background: '#0b1020',
      surface: '#111a32',
      surfaceAlt: '#1c2746',
      text: '#f1f5f9',
      textSecondary: '#cbd5e1',
      border: '#2a3556',
      accent: '#22d3ee',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      glow: 'rgba(129, 140, 248, 0.35)',
    },
  },
};

interface ThemeContextType {
  currentTheme: ThemeName;
  theme: Theme;
  setTheme: (theme: ThemeName) => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('claimmanager_theme') : null;
    if (stored === 'light' || stored === 'dark') return stored;
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('claimmanager_theme', currentTheme);
    const theme = themes[currentTheme];

    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    if (theme.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    document.body.className = `theme-${currentTheme}`;
  }, [currentTheme]);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        theme: themes[currentTheme],
        setTheme: setCurrentTheme,
        availableThemes: Object.values(themes),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
