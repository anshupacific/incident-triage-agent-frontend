import { useElapsed } from "../../hooks/useElapsed";
import type { Tone } from "../../lib/agents";
import { AGENT_BY_KEY } from "../../lib/agents";
import { formatDuration, totalTokens } from "../../lib/format";
import type { AgentStep, StepStatus } from "../../state/runReducer";
import { Badge } from "../common/Badge";
import { CodeBlock } from "../common/CodeBlock";
import { Collapsible } from "../common/Collapsible";
import { Spinner } from "../common/Spinner";
import { AgentOutput } from "./AgentOutput";
import { ToolCallList } from "./ToolCallList";

const STATUS: Record<StepStatus, { label: string; tone: Tone }> = {
  waiting: { label: "Waiting", tone: "neutral" },
  running: { label: "Working", tone: "info" },
  done: { label: "Done", tone: "ok" },
  blocked: { label: "Blocked", tone: "danger" },
  failed: { label: "Failed", tone: "danger" },
  skipped: { label: "Skipped", tone: "neutral" },
};

export function StepCard({ step, index }: { step: AgentStep; index: number }) {
  const info = AGENT_BY_KEY[step.agent];
  const running = step.status === "running";
  const elapsed = useElapsed(step.startedAt, running);
  const tokens = totalTokens(step.usage);
  const status = STATUS[step.status];

  return (
    <article className={`step step--${step.status}`} aria-busy={running}>
      <header className="step__head">
        <span className="step__num">{index}</span>
        <div className="step__title">
          <h3>{info.label}</h3>
          {step.agentName && <code className="muted">{step.agentName}</code>}
        </div>
        <div className="step__meta">
          {running ? (
            <span className="step__elapsed">
              <Spinner label={`${info.label} is working`} /> {elapsed.toFixed(0)} s
            </span>
          ) : (
            <>
              {step.durationMs !== undefined && <span>{formatDuration(step.durationMs)}</span>}
              {tokens !== undefined && <span>{tokens.toLocaleString()} tokens</span>}
            </>
          )}
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
      </header>

      <p className="step__role">
        {info.role} <span className="muted">Uses: {info.uses}.</span>
      </p>

      {step.input && (
        <Collapsible summary="Input sent to the agent">
          <CodeBlock value={step.input} json={false} />
        </Collapsible>
      )}

      <ToolCallList calls={step.toolCalls} />

      {step.status === "done" && (
        <div className="step__output">
          <h4 className="label">Answer</h4>
          <AgentOutput agent={step.agent} output={step.output} />
          <Collapsible summary="Raw output">
            <CodeBlock value={step.output} />
          </Collapsible>
        </div>
      )}

      {step.status === "blocked" && (
        <div className="notice notice--danger">
          <strong>Blocked by a Foundry guardrail.</strong> The agent's answer was stopped by the content filter, so the
          workflow ended here and nothing was passed on.
          {step.guardrail !== undefined && step.guardrail !== null && (
            <Collapsible summary="Filter details">
              <CodeBlock value={step.guardrail} />
            </Collapsible>
          )}
        </div>
      )}

      {step.status === "failed" && step.error && (
        <div className="notice notice--danger">
          <strong>This step failed.</strong> {step.error}
          {step.rawText && (
            <Collapsible summary="What the agent returned">
              <CodeBlock value={step.rawText} json={false} />
            </Collapsible>
          )}
        </div>
      )}
    </article>
  );
}
