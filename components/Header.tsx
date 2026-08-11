// components/Header.tsx
export default function Header() {
  return (
    <header className="w-full border-b border-foreground/10 bg-background px-4 py-4 sm:px-6">
      <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
        Phoneme Activity Builder — Assessment 1
      </h1>
      <p className="text-sm text-foreground/60">
        Build and preview Wordle and Word Search activities
      </p>
    </header>
  );
}
