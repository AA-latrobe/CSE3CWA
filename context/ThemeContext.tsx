'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCookie, setCookie } from '@/lib/cookies';

type Theme = 'light' | 'dark';
const THEME_COOKIE = 'theme_settings';

function loadThemeSettings(): { theme: Theme; highContrast: boolean } {
  const raw = getCookie(THEME_COOKIE);
  if (!raw) return { theme: 'light', highContrast: false };
  try {
    const parsed = JSON.parse(raw);
    return {
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
      highContrast: Boolean(parsed.highContrast),
    };
  } catch {
    return { theme: 'light', highContrast: false };
  }
}

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [highContrast, setHighContrast] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Loaded post-mount (not via a lazy initializer) since this Provider
  // wraps the whole app and IS server-rendered — reading the cookie
  // synchronously during render would mismatch the server's HTML.
  useEffect(() => {
    const saved = loadThemeSettings();
    setTheme(saved.theme);
    setHighContrast(saved.highContrast);
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  // Skip saving until the initial load has actually happened, so this
  // doesn't immediately overwrite a saved cookie with the light-theme
  // default the instant the app starts.
  useEffect(() => {
    if (!hasLoaded) return;
    setCookie(THEME_COOKIE, JSON.stringify({ theme, highContrast }));
  }, [theme, highContrast, hasLoaded]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, highContrast, setHighContrast }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
