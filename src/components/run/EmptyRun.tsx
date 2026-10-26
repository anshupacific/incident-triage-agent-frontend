import { AGENTS } from "../../lib/agents";

export function EmptyRun() {
  return (
    <section className="run run--empty">
      <h2>What happens when you run an alert</h2>
      <ol className="intro-steps">
        {AGENTS.slice(0, 4).map((agent) => (
          <li key={agent.key}>
            <strong>{agent.label}.</strong> {agent.role}
          </li>
        ))}
        <li>
          <strong>You.</strong> The workflow pauses and shows you the draft. Approve it or reject it.
        </li>
        <li>
          <strong>{AGENTS[4].label}.</strong> {AGENTS[4].role}
        </li>
      </ol>
      <p className="muted">Every agent call, tool call and result streams in live as it happens.</p>
    </section>
  );
}
