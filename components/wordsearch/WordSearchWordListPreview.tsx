type Props = {
  count?: number;
};

export default function WordSearchWordListPreview({ count = 12 }: Props) {
  const boxSize = 26;
  const gap = 4;
  const groupGap = gap * 2; // double the internal row gap, as separation between groups
  const englishWordWidth = 5 * boxSize + 4 * gap;

  return (
    <div className="w-full">
      <p className="mb-2 text-sm font-medium text-foreground">Word List:</p>
      <div className="flex flex-col" style={{ gap: groupGap }}>
        {Array.from({ length: count }).map((_, groupIndex) => (
          <div key={groupIndex}>
            <div className="flex" style={{ gap }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-md border border-foreground/20 bg-background"
                  style={{ width: boxSize, height: boxSize }}
                />
              ))}
            </div>
            <div
              className="rounded-md border border-foreground/20 bg-background"
              style={{
                width: englishWordWidth,
                height: boxSize,
                marginLeft: boxSize + gap,
                marginTop: gap,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
