import { useEffect, useRef, useState } from "react";

const MIN_CHARS_PER_SECOND = 90;
const MAX_CHARS_PER_SECOND = 2400;
const CATCH_UP = 6;

export type TextPace = "live" | "instant";

export const useSmoothedText = (target: string, pace: TextPace): string => {
  const [shown, setShown] = useState(() => (pace === "live" ? 0 : target.length));
  const shownRef = useRef(shown);

  useEffect(() => {
    if (pace === "instant") {
      shownRef.current = target.length;
      setShown(target.length);
      return;
    }
    if (shownRef.current > target.length) shownRef.current = target.length;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const backlog = target.length - shownRef.current;
      if (backlog > 0) {
        const rate = Math.min(
          MAX_CHARS_PER_SECOND,
          Math.max(MIN_CHARS_PER_SECOND, backlog * CATCH_UP),
        );
        const next = Math.min(target.length, shownRef.current + (rate * (now - last)) / 1000);
        shownRef.current = next;
        setShown(Math.floor(next));
      }
      last = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, pace]);

  return target.slice(0, shown);
};
