'use client';
import { useTheme } from '@/context/ThemeContext';
import ToggleSwitch from './shared/ToggleSwitch';

export default function SettingsPanel() {
  const { theme, setTheme, highContrast, setHighContrast } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="rounded-md border border-foreground/10 bg-background p-4 sm:p-6">
      <h2 className="mb-6 text-lg font-semibold text-foreground">Settings</h2>

      <div className="w-fit space-y-3">
        <div className="flex w-full items-center justify-between gap-6 rounded-md border border-foreground/10 px-3 py-2">
          <span className="whitespace-nowrap text-foreground">Dark Theme</span>
          <div className="flex-shrink-0">
            <ToggleSwitch checked={isDark} onChange={(checked) => setTheme(checked ? 'dark' : 'light')} />
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-6 rounded-md border border-foreground/10 px-3 py-2">
          <div>
            <p className="whitespace-nowrap text-foreground">High Contrast Mode</p>
            <p className="whitespace-nowrap text-xs text-foreground/60">Contrast and colourblindness improvements</p>
          </div>
          <div className="flex-shrink-0">
            <ToggleSwitch checked={highContrast} onChange={setHighContrast} />
          </div>
        </div>
      </div>
    </div>
  );
}
