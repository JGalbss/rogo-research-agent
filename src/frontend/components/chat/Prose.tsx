import type { ReactElement } from "react";
import { Streamdown } from "streamdown";

export function Prose({ text, streaming }: { text: string; streaming: boolean }): ReactElement {
  return (
    <Streamdown
      mode={streaming ? "streaming" : "static"}
      className="prose-chat text-[14.5px] leading-[1.65] text-ink"
    >
      {text}
    </Streamdown>
  );
}
