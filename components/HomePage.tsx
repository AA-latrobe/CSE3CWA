import HomeKeypadDisplay from './HomeKeypadDisplay';

type Props = {
  onNavigateToAbout: () => void;
  onNavigateToWordle: () => void;
  onNavigateToWordSearch: () => void;
};

export default function HomePage({ onNavigateToAbout, onNavigateToWordle, onNavigateToWordSearch }: Props) {
  return (
    <div className="rounded-md border border-foreground/10 bg-background p-4 sm:p-6">
      <h2 className="mb-6 text-lg font-semibold text-foreground">Generate Phoneme Word Games!</h2>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-4 text-sm text-foreground/70">
          <p>
            This application has been designed to allow Speech Pathology teachers to create
            phoneme-based word games for their students. The intention is to make learning phonemes
            fun!
          </p>
          <p>Two different games may be created:</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              A{' '}
              <button
                type="button"
                onClick={onNavigateToWordle}
                className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-sm font-medium text-match-foreground hover:opacity-80"
              >
                Wordle
              </button>{' '}
              style game, where students need to guess a word spelled in phonemes.
            </li>
            <li>
              A classic{' '}
              <button
                type="button"
                onClick={onNavigateToWordSearch}
                className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-sm font-medium text-match-foreground hover:opacity-80"
              >
                Word Search
              </button>{' '}
              game, where students need to find the phonetic equivalent of English words inside a
              puzzle grid of phonemes.
            </li>
          </ol>
          <p>
            Both games use the{' '}
            <strong className="text-foreground">43 core phonemes of Australian English</strong> based on the modern{' '}
            <strong className="text-foreground">Harrington, Cox, and Evans (HCE)</strong> transcription system.
          </p>
          <p>
            The <strong className="text-foreground">Wordle</strong>-style game allows students to practice composing
            whole words use phonemes.
          </p>
          <p>
            The <strong className="text-foreground">Word Search</strong> game allows students to practice converting a
            given English word into phonemes.
          </p>
          <p>
            Visit the{' '}
            <button
              type="button"
              onClick={onNavigateToAbout}
              className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-sm font-medium text-match-foreground hover:opacity-80"
            >
              About
            </button>{' '}
            page to view a video explaining how to generate both games as{' '}
            <strong className="text-foreground">standalone playable .html</strong> files.
          </p>
        </div>
        <div>
          <HomeKeypadDisplay />
        </div>
      </div>
    </div>
  );
}
