'use client';
import { useState } from 'react';
import Header from '@/components/Header';
import NavBar from '@/components/NavBar';
import HamburgerMenu from '@/components/HamburgerMenu';
import Footer from '@/components/Footer';
import WordleBuilder from '@/components/wordle/WordleBuilder';
import SettingsPanel from '@/components/SettingsPanel';

type View = 'home' | 'wordle' | 'wordsearch' | 'about' | 'settings';

export default function Home() {
  const [activeView, setActiveView] = useState<View>('home');

  return (
    <div className="mx-auto flex min-h-screen max-w-[1000px] flex-col bg-page-background">
      <div className="sticky top-0 z-10 space-y-2 bg-page-background px-4 pt-2 sm:px-6">
        <Header />
        <div className="flex items-center justify-between rounded-md border border-foreground/10 bg-background px-4 py-2 sm:px-6">
          <NavBar activeView={activeView} onChange={setActiveView} />
          <HamburgerMenu onSelect={setActiveView} />
        </div>
      </div>

      <main className="flex-1 px-4 py-6 sm:px-6">
        {activeView === 'home' && (
          <div className="text-foreground">
            <h2 className="mb-2 text-lg font-semibold">Welcome</h2>
            <p className="text-sm text-foreground/70">
              [Dummy home page — replace with real landing content.]
            </p>
          </div>
        )}
        {activeView === 'wordle' && <WordleBuilder />}
        {activeView === 'wordsearch' && <div>Word Search builder placeholder</div>}
        {activeView === 'about' && <div>About placeholder</div>}
        {activeView === 'settings' && <SettingsPanel />}
      </main>

      <Footer />
    </div>
  );
}
