import { MutableRef } from "effect";
import { type RefObject, useEffect } from "react";

const AT_BOTTOM_PX = 8;

export const useFollowBottom = (
  scroller: RefObject<HTMLElement | null>,
  content: RefObject<HTMLElement | null>,
): void => {
  useEffect(() => {
    const node = scroller.current;
    const inner = content.current;
    if (node === null || inner === null) return;
    const seen = MutableRef.make({ pinned: true, top: node.scrollTop, height: node.scrollHeight });

    const onScroll = (): void => {
      const { top, height } = MutableRef.get(seen);
      const atBottom = node.scrollHeight - node.scrollTop - node.clientHeight < AT_BOTTOM_PX;
      const scrolledUp = node.scrollTop < top && node.scrollHeight >= height;
      MutableRef.update(seen, (state) => ({
        pinned: atBottom || (state.pinned && !scrolledUp),
        top: node.scrollTop,
        height: node.scrollHeight,
      }));
    };
    const observer = new ResizeObserver(() => {
      if (MutableRef.get(seen).pinned) node.scrollTop = node.scrollHeight;
    });

    observer.observe(inner);
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      node.removeEventListener("scroll", onScroll);
    };
  }, [scroller, content]);
};
