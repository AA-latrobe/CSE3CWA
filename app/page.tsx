'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import NavBar from '@/components/NavBar';
import HamburgerMenu from '@/components/HamburgerMenu';
import Footer from '@/components/Footer';
import WordleBuilder from '@/components/wordle/WordleBuilder';
import SettingsPanel from '@/components/SettingsPanel';
import { getCookie, setCookie } from '@/lib/cookies';

type View = 'home' | 'wordle' | 'wordsearch' | 'about' | 'settings';
const ACTIVE_VIEW_COOKIE = 'active_view';
const VALID_VIEWS: View[] = ['home', 'wordle', 'wordsearch', 'about', 'settings'];

export default function Home() {
  const [activeView, setActiveView] = useState<View>('home');
  // State, not a ref — this is the fix. A ref's value can be mutated
  // synchronously mid-batch, so a later effect reading it that same tick
  // sees "already true" while the sibling state update (setActiveView)
  // it's meant to guard against hasn't actually applied yet. State
  // updates in the same batch are guaranteed to land together, so by the
  // time hasHydrated flips, activeView has ALREADY been corrected too.
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const saved = getCookie(ACTIVE_VIEW_COOKIE);
    if (saved && VALID_VIEWS.includes(saved as View)) {
      setActiveView(saved as View);
    }
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    setCookie(ACTIVE_VIEW_COOKIE, activeView);
  }, [activeView, hasHydrated]);

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
