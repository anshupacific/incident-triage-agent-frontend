import { AGENTS } from "../../lib/agents";
import type { ApprovalStatus, RunView, StepStatus } from "../../state/runReducer";

type NodeState = StepStatus | "pending" | "approved" | "rejected";

const APPROVAL_STATE: Record<ApprovalStatus, NodeState> = {
  not_reached: "waiting",
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  skipped: "skipped",
};

function Node({ label, state, human = false }: { label: string; state: NodeState; human?: boolean }) {
  return (
    <li className={`pipe__node pipe__node--${state}${human ? " pipe__node--human" : ""}`}>
      <span className="pipe__dot" aria-hidden="true" />
      <span className="pipe__label">{label}</span>
      <span className="visually-hidden"> ({state})</span>
    </li>
  );
}

/** The flow at a glance: which agent is working, which finished, and where it stopped. */
export function Pipeline({ view }: { view: RunView }) {
  const agents = AGENTS.filter((a) => a.key !== "filer");
  const filer = AGENTS[AGENTS.length - 1];
  return (
    <ol className="pipe" aria-label="Agent flow">
      {agents.map((agent) => (
        <Node key={agent.key} label={agent.short} state={view.steps[agent.key].status} />
      ))}
      <Node label="You approve" state={APPROVAL_STATE[view.approval]} human />
      <Node label={filer.short} state={view.steps[filer.key].status} />
    </ol>
  );
}
