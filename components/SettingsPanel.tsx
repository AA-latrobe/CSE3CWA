'use client';
import { useTheme } from '@/context/ThemeContext';
import ToggleSwitch from './shared/ToggleSwitch';

export default function SettingsPanel() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="max-w-md">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Settings</h2>

      <div className="flex items-center justify-between rounded-md border border-foreground/10 p-4">
        <span className="text-foreground">Dark Theme</span>
        <ToggleSwitch checked={isDark} onChange={(checked) => setTheme(checked ? 'dark' : 'light')} />
      </div>
    </div>
  );
}
