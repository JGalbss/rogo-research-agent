import { motion } from "motion/react";
import type { ReactElement, ReactNode } from "react";

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

export function AnimatedMessage({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}): ReactElement {
  const delay = Math.min(index * 0.06, 0.36);
  return (
    <motion.div
      layout
      className="relative"
      initial={{ opacity: 0, y: 14, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: EASE, delay }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg, transparent 30%, var(--accent-tint) 50%, transparent 70%)",
        }}
        initial={{ opacity: 0.9, x: "-60%" }}
        animate={{ opacity: 0, x: "60%" }}
        transition={{ duration: 0.9, ease: EASE, delay }}
      />
      </div>
      {children}
    </motion.div>
  );
}
