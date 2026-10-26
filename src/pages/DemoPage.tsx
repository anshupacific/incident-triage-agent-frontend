import type { Limits, Scenario } from "../api/types";
import { EmptyRun } from "../components/run/EmptyRun";
import { RunPanel } from "../components/run/RunPanel";
import { ScenarioList } from "../components/scenarios/ScenarioList";
import { useRun } from "../hooks/useRun";

interface Props {
  scenarios: Scenario[];
  limits: Limits | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onRunFinished: () => void;
}

export function DemoPage({ scenarios, limits, loading, error, onRetry, onRunFinished }: Props) {
  const { view, start, decide, reopen, reset } = useRun(scenarios, onRunFinished);
  const busy = ["starting", "running", "deciding", "resuming"].includes(view.phase);

  if (loading && !scenarios.length) {
    return <p className="page-status">Loading the demo… The backend can take a few seconds to wake up.</p>;
  }
  if (error && !scenarios.length) {
    return (
      <div className="page-status">
        <p className="error-text">{error}</p>
        <button className="btn" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="demo">
      <ScenarioList scenarios={scenarios} activeId={view.scenario?.id} busy={busy} onRun={start} />
      {view.phase === "idle" && !view.requestError ? (
        <EmptyRun />
      ) : (
        <RunPanel view={view} limits={limits} onDecide={decide} onReset={reset} onCheckStatus={reopen} />
      )}
    </div>
  );
}
