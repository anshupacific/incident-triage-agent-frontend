import { useEffect, useState } from "react";

/** Seconds since `startedAt` (unix seconds), ticking while `active`. */
export function useElapsed(startedAt: number | undefined, active: boolean): number {
  const [now, setNow] = useState(() => Date.now() / 1000);
  useEffect(() => {
    if (!active) return;
    setNow(Date.now() / 1000);
    const id = window.setInterval(() => setNow(Date.now() / 1000), 250);
    return () => window.clearInterval(id);
  }, [active]);
  if (!startedAt) return 0;
  return Math.max(0, now - startedAt);
}
