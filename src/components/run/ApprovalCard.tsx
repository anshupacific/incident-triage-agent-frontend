import type { Decision, Limits, TicketDraft } from "../../api/types";
import type { RunView } from "../../state/runReducer";
import { Badge } from "../common/Badge";
import { RichText } from "../common/RichText";
import { Spinner } from "../common/Spinner";

interface Props {
  view: RunView;
  limits: Limits | null;
  onDecide: (decision: Decision) => void;
}

function Draft({ draft }: { draft: TicketDraft }) {
  return (
    <div className="draft">
      <h4 className="draft__summary">{draft.summary}</h4>
      {draft.labels && draft.labels.length > 0 && (
        <div className="draft__labels">
          {draft.labels.map((label) => (
            <code key={label} className="chip">
              {label}
            </code>
          ))}
        </div>
      )}
      {draft.description && <RichText text={draft.description} />}
      {draft.runbook_url && (
        <p className="muted">
          Runbook:{" "}
          <a href={draft.runbook_url} target="_blank" rel="noreferrer noopener">
            {draft.runbook_id || draft.runbook_url}
          </a>
        </p>
      )}
    </div>
  );
}

/** The human step: nothing is filed in Jira until the visitor approves this draft. */
export function ApprovalCard({ view, limits, onDecide }: Props) {
  const { draft, approval, phase } = view;
  if (!draft || draft.decision !== "file_ticket") return null;

  const waiting = phase === "awaiting_approval";
  const deciding = phase === "deciding";
  const capReached = !!limits && limits.tickets_created_today >= limits.daily_ticket_cap;

  return (
    <article className={`approval approval--${approval}`} aria-live="polite">
      <header className="approval__head">
        <span className="step__num step__num--human">✋</span>
        <div className="step__title">
          <h3>Your approval</h3>
          <span className="muted">
            {approval === "approved"
              ? "You approved this draft, so the Ticket filer ran."
              : approval === "rejected"
                ? "You rejected this draft. Nothing was filed."
                : "The workflow is paused and saved. It continues only after you decide."}
          </span>
        </div>
        {approval === "approved" && <Badge tone="ok">Approved</Badge>}
        {approval === "rejected" && <Badge tone="neutral">Rejected</Badge>}
        {(waiting || deciding) && <Badge tone="warn">Waiting for you</Badge>}
      </header>

      <Draft draft={draft} />

      {(waiting || deciding) && (
        <div className="approval__actions">
          <button
            className="btn btn--primary"
            disabled={deciding || capReached}
            onClick={() => onDecide("approve")}
            title={capReached ? "The demo's daily ticket limit has been reached" : undefined}
          >
            {deciding && view.decision === "approve" ? <Spinner label="Sending" /> : null} Approve and file in Jira
          </button>
          <button className="btn" disabled={deciding} onClick={() => onDecide("reject")}>
            {deciding && view.decision === "reject" ? <Spinner label="Sending" /> : null} Reject
          </button>
          {capReached && <span className="muted">Today's ticket limit is reached. You can still reject.</span>}
        </div>
      )}
      {view.requestError && waiting && <p className="error-text">{view.requestError}</p>}
    </article>
  );
}
