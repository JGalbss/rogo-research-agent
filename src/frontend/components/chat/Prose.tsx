import type { ReactElement } from "react";
import { Streamdown } from "streamdown";

const animated = {
  animation: "blurIn",
  duration: 420,
  easing: "cubic-bezier(0.23, 1, 0.32, 1)",
  sep: "word",
  stagger: 14,
} as const;

export function Prose({ text, streaming }: { text: string; streaming: boolean }): ReactElement {
  return (
    <Streamdown
      mode={streaming ? "streaming" : "static"}
      animated={streaming ? animated : false}
      className="text-[14.5px] leading-[1.65] text-ink"
    >
      {text}
    </Streamdown>
  );
}
