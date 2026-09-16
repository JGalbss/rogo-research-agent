import type { ReactElement } from "react";
import { Streamdown } from "streamdown";

export function Prose({ text, streaming }: { text: string; streaming: boolean }): ReactElement {
  return (
    <Streamdown mode={streaming ? "streaming" : "static"} className="text-[14px] leading-relaxed">
      {text}
    </Streamdown>
  );
}
