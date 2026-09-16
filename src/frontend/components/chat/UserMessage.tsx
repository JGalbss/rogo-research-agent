import type { ReactElement } from "react";

export function UserMessage({ text }: { text: string }): ReactElement {
  return (
    <div className="flex justify-end pl-16">
      <div className="max-w-[80%] rounded-2xl bg-field px-4 py-2.5 text-[14px] leading-[1.5] text-ink">
        {text}
      </div>
    </div>
  );
}
