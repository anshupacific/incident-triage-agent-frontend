import type { Scenario } from "../../api/types";
import { ScenarioCard } from "./ScenarioCard";

interface Props {
  scenarios: Scenario[];
  activeId?: string;
  busy: boolean;
  onRun: (scenario: Scenario) => void;
}

export function ScenarioList({ scenarios, activeId, busy, onRun }: Props) {
  return (
    <section className="scenarios" aria-labelledby="scenarios-title">
      <h2 id="scenarios-title">Pick an alert</h2>
      <p className="muted">Each one is an invented Azure alert that shows a different part of the flow.</p>
      <ul>
        {scenarios.map((s) => (
          <ScenarioCard key={s.id} scenario={s} active={s.id === activeId} disabled={busy} onRun={onRun} />
        ))}
      </ul>
    </section>
  );
}
