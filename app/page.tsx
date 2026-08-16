'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import NavBar from '@/components/NavBar';
import HamburgerMenu from '@/components/HamburgerMenu';
import Footer from '@/components/Footer';
import HomePage from '@/components/HomePage';
import AboutPage from '@/components/AboutPage';
import WordleBuilder from '@/components/wordle/WordleBuilder';
import WordSearchBuilder from '@/components/wordsearch/WordSearchBuilder';
import SettingsPanel from '@/components/SettingsPanel';
import { getCookie, setCookie } from '@/lib/cookies';

type View = 'home' | 'wordle' | 'wordsearch' | 'about' | 'settings';
const ACTIVE_VIEW_COOKIE = 'active_view';
const VALID_VIEWS: View[] = ['home', 'wordle', 'wordsearch', 'about', 'settings'];

export default function Home() {
  const [activeView, setActiveView] = useState<View>('home');
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

  // Always reset to top on every tab switch. Wordle and Word Search each
  // independently restore their own saved scroll position afterward, via
  // their own cookie-backed effect (which waits on document.fonts.ready,
  // so it reliably runs after this synchronous reset).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeView]);

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
          <HomePage
            onNavigateToAbout={() => setActiveView('about')}
            onNavigateToWordle={() => setActiveView('wordle')}
            onNavigateToWordSearch={() => setActiveView('wordsearch')}
          />
        )}
        {activeView === 'wordle' && <WordleBuilder />}
        {activeView === 'wordsearch' && <WordSearchBuilder />}
        {activeView === 'about' && <AboutPage />}
        {activeView === 'settings' && <SettingsPanel />}
      </main>

      <Footer />
    </div>
  );
}
