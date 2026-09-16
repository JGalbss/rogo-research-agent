import type { ReactElement } from "react";
import { type Components, Streamdown } from "streamdown";

const components: Components = {
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-[13.5px] leading-snug">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="text-left text-ink-2">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-line px-3 py-2 text-[12.5px] font-medium">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-b border-line-soft px-3 py-2 align-top tabular-nums">{children}</td>
  ),
};

export function Prose({ text, streaming }: { text: string; streaming: boolean }): ReactElement {
  return (
    <Streamdown
      mode={streaming ? "streaming" : "static"}
      controls={false}
      components={components}
      className="text-[14.5px] leading-[1.65] text-ink"
    >
      {text}
    </Streamdown>
  );
}
