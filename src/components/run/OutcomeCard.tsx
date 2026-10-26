import { OUTCOME_LABELS, OUTCOME_TONE } from "../../lib/agents";
import type { RunView } from "../../state/runReducer";
import { Badge } from "../common/Badge";

const ICON: Record<string, string> = { ok: "✓", info: "i", warn: "!", danger: "×", neutral: "–" };

export function OutcomeCard({ view, onNewRun }: { view: RunView; onNewRun: () => void }) {
  if (view.phase !== "completed" || !view.outcome) return null;
  const tone = OUTCOME_TONE[view.outcome];
  const ticket = view.ticket;

  return (
    <article className={`outcome outcome--${tone}`} aria-live="polite">
      <span className="outcome__icon" aria-hidden="true">
        {ICON[tone]}
      </span>
      <div className="outcome__body">
        <div className="outcome__title">
          <h3>{OUTCOME_LABELS[view.outcome]}</h3>
          <Badge tone={tone}>{view.outcome}</Badge>
        </div>
        {view.message && <p>{view.message}</p>}
        {ticket?.key && (
          <div className="ticket">
            {ticket.url ? (
              <a className="ticket__key" href={ticket.url} target="_blank" rel="noreferrer noopener">
                {ticket.key} ↗
              </a>
            ) : (
              <span className="ticket__key">{ticket.key}</span>
            )}
            <span>{ticket.summary}</span>
          </div>
        )}
        {view.outcome === "no_ticket" && view.draft?.reason && <p className="muted">{view.draft.reason}</p>}
        <button className="btn btn--sm" onClick={onNewRun}>
          Run another alert
        </button>
      </div>
    </article>
  );
}
