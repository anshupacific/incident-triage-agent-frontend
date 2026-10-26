import type { Scenario } from "../../api/types";
import { OUTCOME_LABELS, OUTCOME_TONE } from "../../lib/agents";
import { Badge } from "../common/Badge";

interface Props {
  scenario: Scenario;
  active: boolean;
  disabled: boolean;
  onRun: (scenario: Scenario) => void;
}

export function ScenarioCard({ scenario, active, disabled, onRun }: Props) {
  return (
    <li className={active ? "scenario is-active" : "scenario"}>
      <div className="scenario__top">
        <h3>{scenario.title}</h3>
        <Badge tone={OUTCOME_TONE[scenario.expected_outcome]}>{OUTCOME_LABELS[scenario.expected_outcome]}</Badge>
      </div>
      <code className="scenario__resource">{scenario.id}</code>
      <p className="scenario__text">{scenario.demonstrates}</p>
      <div className="scenario__actions">
        <a href={scenario.data_url} target="_blank" rel="noreferrer noopener">
          View data
        </a>
        <button className="btn btn--primary btn--sm" disabled={disabled} onClick={() => onRun(scenario)}>
          Run
        </button>
      </div>
    </li>
  );
}
