export default function AboutPage() {
  return (
    <div className="rounded-md border border-foreground/10 bg-background p-4 sm:p-6">
      <h2 className="mb-6 text-lg font-semibold text-foreground">About</h2>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="space-y-4 text-sm text-foreground/70 md:col-span-1">
          <p>
            [Placeholder paragraph one — replace with real about copy. Lorem ipsum dolor sit amet,
            consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna
            aliqua.]
          </p>
          <p>
            [Placeholder paragraph two — Ut enim ad minim veniam, quis nostrud exercitation ullamco
            laboris nisi ut aliquip ex ea commodo consequat.]
          </p>
          <p>
            [Placeholder paragraph three — Duis aute irure dolor in reprehenderit in voluptate
            velit esse cillum dolore eu fugiat nulla pariatur.]
          </p>
          <p>
            [Placeholder paragraph four — Excepteur sint occaecat cupidatat non proident, sunt in
            culpa qui officia deserunt mollit anim id est laborum.]
          </p>
        </div>
        <div className="md:col-span-2">
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
    </div>
  );
}
