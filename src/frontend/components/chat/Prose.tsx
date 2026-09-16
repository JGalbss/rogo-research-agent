import type { ReactElement } from "react";
import { type Components, Streamdown } from "streamdown";
import { useSmoothedText } from "@/frontend/hooks/use-smoothed-text";

const edgeFade = {
  animation: "fadeIn",
  duration: 320,
  easing: "cubic-bezier(0.23, 1, 0.32, 1)",
  sep: "word",
  stagger: 0,
} as const;

const components: Components = {
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-[13.5px] leading-snug">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="text-left text-ink-2">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-line px-3 py-2 text-[12.5px] font-medium">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-line-soft px-3 py-2 align-top tabular-nums">
      {children}
    </td>
  ),
};

export function Prose({
  text,
  streaming,
}: {
  text: string;
  streaming: boolean;
}): ReactElement {
  const shown = useSmoothedText(text, streaming ? "live" : "instant");

  return (
    <Streamdown
      mode={streaming ? "streaming" : "static"}
      animated={streaming ? edgeFade : false}
      controls={false}
      components={components}
      className="text-[14.5px] leading-[1.65] text-ink"
    >
      {shown}
    </Streamdown>
  );
}
