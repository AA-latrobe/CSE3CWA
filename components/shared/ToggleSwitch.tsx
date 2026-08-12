'use client';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export default function ToggleSwitch({ checked, onChange, disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-14 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? 'bg-accent' : 'bg-foreground/20'
      }`}
    >
      <span
        className={`absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
