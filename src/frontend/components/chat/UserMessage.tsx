import type { ReactElement } from "react";

export function UserMessage({ text }: { text: string }): ReactElement {
  return (
    <div className="flex justify-end pl-14">
      <div className="rounded-xl bg-field px-3 py-1.5 text-[13px] leading-[1.4] text-ink">{text}</div>
    </div>
  );
}
