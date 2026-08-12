type View = 'wordle' | 'wordsearch' | 'about' | 'settings';

type Props = {
  activeView: View;
  onChange: (view: View) => void;
};

export default function NavBar({ activeView, onChange }: Props) {
  const tabs: { id: View; label: string }[] = [
    { id: 'wordle', label: 'Wordle' },
    { id: 'wordsearch', label: 'Word Search' },
  ];

  return (
    <nav className="flex gap-1" aria-label="Activity type">
      {tabs.map((tab) => {
        const isActive = activeView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-accent text-white'
                : 'text-foreground/70 hover:bg-foreground/5 hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
