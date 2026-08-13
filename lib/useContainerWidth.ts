'use client';
import { useEffect, useRef, useState } from 'react';

// Measures an element's own rendered width. Reports both the raw pixel
// width (for components that need to compute sizing, like the word search
// grid) and a boolean threshold crossing (for components that just need
// to pick between two layouts, like the keypad).
export function useContainerWidth<T extends HTMLElement>(threshold: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  const [isWide, setIsWide] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setWidth(w);
      setIsWide(w >= threshold);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, width, isWide };
}
