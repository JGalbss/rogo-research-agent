import type { ReactElement } from "react";
import ThinkingState from "@/frontend/components/primitives/ThinkingState";
import { type TraceRow, traceHeadline, traceSubjects, traceSummary } from "./message-parts.ts";
import { SourcePills } from "./SourcePills.tsx";

export function TraceView({
  rows,
  working,
  settled,
}: {
  rows: TraceRow[];
  working: boolean;
  settled: boolean;
}): ReactElement | null {
  if (rows.length === 0 && !working) return null;
  return (
    <ThinkingState
      variant="Coding"
      rows={rows}
      active={traceHeadline(rows)}
      done={traceSummary(rows)}
      working={working}
      settled={settled}
      trailing={<SourcePills subjects={traceSubjects(rows)} />}
    />
  );
}
