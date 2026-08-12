'use client';
import { useState } from 'react';

type MenuView = 'about' | 'settings';

type Props = {
  onSelect: (view: MenuView) => void;
};

export default function HamburgerMenu({ onSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (view: MenuView) => {
    onSelect(view);
    setIsOpen(false); // close menu after picking an item
  };

  return (
    <div className="relative">
      <button
        aria-label="Toggle menu"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 flex-col items-center justify-around"
      >
        <span
          className={`h-0.5 w-full bg-foreground transition-transform ${
            isOpen ? 'translate-y-[9px] rotate-45' : ''
          }`}
        />
        <span
          className={`h-0.5 w-full bg-foreground transition-opacity ${
            isOpen ? 'opacity-0' : ''
          }`}
        />
        <span
          className={`h-0.5 w-full bg-foreground transition-transform ${
            isOpen ? '-translate-y-[9px] -rotate-45' : ''
          }`}
        />
      </button>

      {isOpen && (
        <nav className="absolute right-0 top-10 w-48 rounded-md border border-foreground/10 bg-background shadow-lg">
          <ul className="divide-y divide-foreground/10">
            <li>
              <button
                onClick={() => handleSelect('about')}
                className="w-full px-4 py-2 text-left text-foreground hover:bg-foreground/5"
              >
                About
              </button>
            </li>
            <li>
              <button
                onClick={() => handleSelect('settings')}
                className="w-full px-4 py-2 text-left text-foreground hover:bg-foreground/5"
              >
                Settings
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}
