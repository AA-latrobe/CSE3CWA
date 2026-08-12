'use client';
import { useEffect, useRef, useState } from 'react';

// Measures an element's own rendered width and reports whether it's
// crossed a threshold. Used where CSS container queries are ambiguous
// about which box in a flex chain "counts" as the query container.
export function useContainerWidth<T extends HTMLElement>(threshold: number) {
  const ref = useRef<T>(null);
  const [isWide, setIsWide] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setIsWide(width >= threshold);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isWide };
}
