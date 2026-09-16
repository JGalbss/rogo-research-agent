import { type RefObject, useEffect, useRef } from "react";

const FOLLOW_WITHIN_PX = 120;

export const useFollowBottom = (
  ref: RefObject<HTMLElement | null>,
  signal: ReadonlyArray<unknown>,
): void => {
  const followed = useRef(false);
  useEffect(() => {
    const node = ref.current;
    if (node === null) return;
    const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
    if (followed.current && distance > FOLLOW_WITHIN_PX) return;
    node.scrollTop = node.scrollHeight;
    followed.current = true;
  }, signal);
};
