import type { ReactElement } from "react";
import { ValuePill } from "@/frontend/components/atoms/ValuePill";

const SHOWN = 3;

export function SourcePills({ subjects }: { subjects: ReadonlyArray<string> }): ReactElement | null {
  if (subjects.length === 0) return null;
  return (
    <>
      {subjects.slice(0, SHOWN).map((subject) => (
        <ValuePill key={subject}>{subject}</ValuePill>
      ))}
      {subjects.length > SHOWN ? <ValuePill>+{subjects.length - SHOWN}</ValuePill> : null}
    </>
  );
}
