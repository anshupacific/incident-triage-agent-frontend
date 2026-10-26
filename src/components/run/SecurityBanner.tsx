import { AGENT_BY_KEY } from "../../lib/agents";
import type { RunView } from "../../state/runReducer";

/** Shown when an agent found instruction-like text in tool results (a prompt injection attempt). */
export function SecurityBanner({ flags }: { flags: RunView["securityFlags"] }) {
  if (!flags.length) return null;
  return (
    <div className="notice notice--warn" role="alert">
      <strong>Flagged for security review.</strong> Text in the tool results tried to give the AI instructions. The
      agents did not act on it, and only a short note (not the text itself) was passed to later agents.
      <ul className="flags">
        {flags.map((flag, i) => (
          <li key={i}>
            <span className="muted">Found by {AGENT_BY_KEY[flag.agent]?.label ?? flag.agent}:</span>{" "}
            <q className="flags__text">{flag.text}</q>
          </li>
        ))}
      </ul>
    </div>
  );
}
