import type { ReactElement } from "react";
import ThinkingState from "@/frontend/components/primitives/ThinkingState";
import { useLiveTrace } from "@/frontend/hooks/use-live-trace";
import { type TraceRow, traceHeadline, traceSources, traceSummary } from "@/frontend/utils/trace";
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
  const shown = useLiveTrace(rows, working ? "live" : "settled");
  if (!working && rows.length === 0) return null;
  return (
    <ThinkingState
      variant="Coding"
      rows={shown}
      active={traceHeadline(shown)}
      done={traceSummary(shown)}
      working={working}
      settled={settled}
      trailing={<SourcePills subjects={traceSources(shown)} />}
    />
  );
}
