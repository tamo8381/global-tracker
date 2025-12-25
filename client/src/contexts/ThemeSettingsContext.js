import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const DEFAULT_SETTINGS = {
  mode: 'light',
  primaryColor: '#1976d2',
  secondaryColor: '#9c27b0',
};

const ThemeSettingsContext = createContext(null);

const getSystemMode = () => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const ThemeSettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('theme-settings');
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (err) {
      console.warn('Failed to read theme settings, using defaults', err);
    }
    return DEFAULT_SETTINGS;
  });

  const [systemMode, setSystemMode] = useState(getSystemMode());

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setSystemMode(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme-settings', JSON.stringify(settings));
  }, [settings]);

  const effectiveMode = settings.mode === 'system' ? systemMode : settings.mode;

  const value = useMemo(() => ({
    ...settings,
    effectiveMode,
    setMode: (mode) => setSettings((prev) => ({ ...prev, mode })),
    setPrimaryColor: (primaryColor) => setSettings((prev) => ({ ...prev, primaryColor })),
    setSecondaryColor: (secondaryColor) => setSettings((prev) => ({ ...prev, secondaryColor })),
  }), [settings, effectiveMode]);

  return (
    <ThemeSettingsContext.Provider value={value}>
      {children}
    </ThemeSettingsContext.Provider>
  );
};

export const useThemeSettings = () => {
  const ctx = useContext(ThemeSettingsContext);
  if (!ctx) {
    throw new Error('useThemeSettings must be used within ThemeSettingsProvider');
  }
  return ctx;
};


