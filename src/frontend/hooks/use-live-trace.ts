import { Array as Arr, Option } from "effect";
import type { TurnPhase } from "@/frontend/utils/reply";
import type { TraceRow } from "@/frontend/utils/trace";
import { useSmoothedText } from "./use-smoothed-text.ts";

export const useLiveTrace = (rows: TraceRow[], phase: TurnPhase): TraceRow[] => {
  const live = phase === "live"
    ? Option.filter(Arr.last(rows), (row) => row.kind === "thought")
    : Option.none<TraceRow>();
  const shown = useSmoothedText(
    Option.match(live, { onNone: () => "", onSome: (row) => row.primary }),
    Option.isSome(live) ? "live" : "instant",
  );
  return Option.match(live, {
    onNone: () => rows,
    onSome: (row) => [...rows.slice(0, -1), { ...row, primary: shown, streaming: true }],
  });
};
