'use client';
import { useState } from 'react';
import Header from '@/components/Header';
import NavBar from '@/components/NavBar';
import HamburgerMenu from '@/components/HamburgerMenu';
import Footer from '@/components/Footer';
import SettingsPanel from '@/components/SettingsPanel';
import WordleBuilder from '@/components/wordle/WordleBuilder';

type View = 'wordle' | 'wordsearch' | 'about' | 'settings';

export default function Home() {
  const [activeView, setActiveView] = useState<View>('wordle');

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col">
      <Header />
      <div className="flex items-center justify-between border-b border-foreground/10 px-4 py-2 sm:px-6">
        <NavBar activeView={activeView} onChange={setActiveView} />
        <HamburgerMenu onSelect={setActiveView} />
      </div>
      <main className="flex-1 px-4 py-6 sm:px-6">
        {activeView === 'wordle' && <WordleBuilder />}
        {activeView === 'wordsearch' && <div>Word Search builder placeholder</div>}
        {activeView === 'about' && <div>About placeholder</div>}
        {activeView === 'settings' && <SettingsPanel />}
      </main>
      <Footer />
    </div>
  );
}
