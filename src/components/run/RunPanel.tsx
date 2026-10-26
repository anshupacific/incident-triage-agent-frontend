import type { Decision, Limits } from "../../api/types";
import { AGENTS } from "../../lib/agents";
import type { RunView } from "../../state/runReducer";
import { Badge } from "../common/Badge";
import { Spinner } from "../common/Spinner";
import { ApprovalCard } from "./ApprovalCard";
import { EventLog } from "./EventLog";
import { OutcomeCard } from "./OutcomeCard";
import { Pipeline } from "./Pipeline";
import { SecurityBanner } from "./SecurityBanner";
import { StepCard } from "./StepCard";

interface Props {
  view: RunView;
  limits: Limits | null;
  onDecide: (decision: Decision) => void;
  onReset: () => void;
  onCheckStatus: (runId: string) => void;
}

const PHASE_LABEL: Record<RunView["phase"], string> = {
  idle: "",
  starting: "Starting",
  running: "Agents working",
  awaiting_approval: "Waiting for your approval",
  deciding: "Sending your decision",
  resuming: "Resuming",
  completed: "Finished",
};

export function RunPanel({ view, limits, onDecide, onReset, onCheckStatus }: Props) {
  const active = ["starting", "running", "deciding", "resuming"].includes(view.phase);
  const visibleSteps = AGENTS.filter((a) => !["waiting", "skipped"].includes(view.steps[a.key].status));

  return (
    <section className="run" aria-labelledby="run-title">
      <header className="run__head">
        <div>
          <h2 id="run-title">{view.scenario?.title ?? "Run"}</h2>
          {view.runId && <code className="muted">run {view.runId}</code>}
        </div>
        <div className="run__status">
          {active && <Spinner />}
          <Badge tone={view.phase === "awaiting_approval" ? "warn" : active ? "info" : "neutral"}>
            {PHASE_LABEL[view.phase]}
          </Badge>
          {!active && (
            <button className="btn btn--sm" onClick={onReset}>
              New run
            </button>
          )}
        </div>
      </header>

      {view.scenario && (
        <div className="alert-box">
          <span className="label">Incoming alert</span>
          <p>{view.scenario.alert}</p>
        </div>
      )}

      <Pipeline view={view} />

      {view.requestError && view.phase !== "awaiting_approval" && (
        <div className="notice notice--danger" role="alert">
          {view.requestError}
        </div>
      )}

      {view.connectionLost && view.runId && (
        <div className="notice notice--warn">
          The live connection closed before the run finished. The run may still be going on the server.{" "}
          <button className="btn btn--sm" onClick={() => onCheckStatus(view.runId!)}>
            Check status
          </button>
        </div>
      )}

      {view.reopened && (
        <p className="muted">
          This run was reopened from its saved record, so the step-by-step timeline is not shown.
        </p>
      )}

      <SecurityBanner flags={view.securityFlags} />

      <div className="timeline">
        {visibleSteps
          .filter((agent) => agent.key !== "filer")
          .map((agent) => (
            <StepCard key={agent.key} step={view.steps[agent.key]} index={AGENTS.indexOf(agent) + 1} />
          ))}
        {/* The human step sits between the Ticket writer and the Ticket filer. */}
        <ApprovalCard view={view} limits={limits} onDecide={onDecide} />
        {view.steps.filer.status !== "waiting" && view.steps.filer.status !== "skipped" && (
          <StepCard step={view.steps.filer} index={AGENTS.length} />
        )}
        {view.phase === "starting" && (
          <p className="muted">
            <Spinner /> Starting the run…
          </p>
        )}
      </div>

      <OutcomeCard view={view} onNewRun={onReset} />
      <EventLog events={view.events} />
    </section>
  );
}
