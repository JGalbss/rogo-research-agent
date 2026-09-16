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
      controls={false}
      className="text-[14.5px] leading-[1.65] text-ink [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border-t [&_td]:border-line [&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-[13px] [&_th]:font-medium [&_th]:text-ink-2"
    >
      {text}
    </Streamdown>
  );
}
