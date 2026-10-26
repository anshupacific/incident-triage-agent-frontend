import type { ReactNode } from "react";

/** Native <details>: keyboard accessible and needs no state. */
export function Collapsible({
  summary,
  children,
  defaultOpen = false,
}: {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details className="collapsible" open={defaultOpen}>
      <summary>{summary}</summary>
      <div className="collapsible__body">{children}</div>
    </details>
  );
}
