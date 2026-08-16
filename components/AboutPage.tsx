type Props = {
  onNavigateToWordle: () => void;
  onNavigateToWordSearch: () => void;
};

export default function AboutPage({ onNavigateToWordle, onNavigateToWordSearch }: Props) {
  return (
    <div className="rounded-md border border-foreground/10 bg-background p-4 sm:p-6">
      <h2 className="mb-6 text-lg font-semibold text-foreground">About</h2>
      <div className="space-y-4 text-sm text-foreground/70">
        <p>This application is a phoneme word game generator, designed by me:</p>
        <p>
          <strong className="text-foreground">Adam Ashmore</strong> — Student Number:{' '}
          <strong className="text-foreground">22670379</strong>
        </p>
        <p>
          This represents my submission for{' '}
          <strong className="text-foreground">2026-CSE3CWA — Assessment 1</strong>
        </p>
        <p>
          The brief was to build the frontend only for a webpage app to allow Speech Pathology
          teachers to create phoneme-based word games for their students. Subsequent assessments
          will wire up the application to a word/phoneme database backend and will run in the
          cloud. For now, the application utilises a supplied list of 90 English word/phoneme
          pairs.
        </p>
        <p>Two different games needed to be created:</p>
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
            game, which I implemented so that students need to find the phonetic equivalent of
            English words inside a puzzle grid of phonemes.
          </li>
        </ol>
        <p>
          The idea was to give students practice at learning phonemes in two different ways:
          converting phoneme-to-word and converting word-to-phoneme.
        </p>
        <p>Both game generators have been designed to be intuitive to use, so have a go!</p>
        <p>
          You can also view the accompanying <strong className="text-foreground">video</strong> for a
          brief tutorial.
        </p>
      </div>

      <div className="mt-6">
        <div className="relative w-full overflow-hidden rounded-md" style={{ paddingTop: '56.25%' }}>
          <iframe
            className="absolute inset-0 h-full w-full"
            src="/videos/about-video.html"
            title="About this project"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
