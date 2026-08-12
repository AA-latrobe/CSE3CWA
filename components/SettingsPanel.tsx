'use client';
import { useTheme } from '@/context/ThemeContext';

export default function SettingsPanel() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="max-w-md">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Settings</h2>

      <div className="flex items-center justify-between rounded-md border border-foreground/10 p-4">
        <span className="text-foreground">Dark Theme</span>

        <button
          role="switch"
          aria-checked={isDark}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`relative h-8 w-14 rounded-full transition-colors ${
            isDark ? 'bg-accent' : 'bg-foreground/20'
          }`}
        >
          <span
            className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition-transform ${
              isDark ? 'translate-x-6' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
