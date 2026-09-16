import type { ReactElement } from "react";
import { Button } from "@/frontend/components/atoms/Button";

const EXAMPLES = [
  "Compare Acme and Globex and tell me which one appears to be growing faster.",
  "What are the biggest risks Umbrella Health flags in its filings?",
  "How is Initech's subscription transition going?",
  "Which company in the universe is growing fastest?",
];

export function ExamplePrompts({ onPick }: { onPick: (text: string) => void }): ReactElement {
  return (
    <div className="flex max-w-[560px] flex-wrap justify-center gap-2">
      {EXAMPLES.map((example) => (
        <Button key={example} size="sm" variant="secondary" onClick={() => onPick(example)}>
          {example}
        </Button>
      ))}
    </div>
  );
}
