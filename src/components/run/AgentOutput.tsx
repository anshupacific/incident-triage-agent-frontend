/** A readable view of each agent's answer. The raw JSON is one click away in StepCard. */

import type { ReactNode } from "react";
import type { AgentKey } from "../../api/types";
import type { Tone } from "../../lib/agents";
import { asList, asText, isRecord } from "../../lib/format";
import { Badge } from "../common/Badge";
import { RichText } from "../common/RichText";

const SEVERITY_TONE: Record<string, Tone> = { sev1: "danger", sev2: "warn", sev3: "info" };
const STATUS_TONE: Record<string, Tone> = { ongoing: "warn", recovered: "ok", unknown_resource: "neutral" };

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Triage({ data }: { data: Record<string, unknown> }) {
  const severity = asText(data.severity);
  return (
    <>
      <dl className="fields">
        <Field label="Resource">
          <code>{asText(data.resource_name)}</code>
        </Field>
        <Field label="Type">{asText(data.resource_type)}</Field>
        <Field label="Category">{asText(data.category)}</Field>
        <Field label="Severity">
          <Badge tone={SEVERITY_TONE[severity] ?? "neutral"}>{severity || "?"}</Badge>
        </Field>
      </dl>
      <p>{asText(data.summary)}</p>
      {data.signal ? <p className="muted">Signal: {asText(data.signal)}</p> : null}
    </>
  );
}

function Diagnosis({ data }: { data: Record<string, unknown> }) {
  const status = asText(data.status);
  const evidence = asList(data.evidence);
  const tools = asList(data.tools_used);
  return (
    <>
      <dl className="fields">
        <Field label="Status">
          <Badge tone={STATUS_TONE[status] ?? "neutral"}>{status.replace(/_/g, " ") || "?"}</Badge>
        </Field>
        {tools.length > 0 && (
          <Field label="Tools used">
            {tools.map((t) => (
              <code key={t} className="chip">
                {t}
              </code>
            ))}
          </Field>
        )}
      </dl>
      <p>
        <strong>Cause:</strong> {asText(data.cause)}
      </p>
      {evidence.length > 0 && (
        <ul className="evidence">
          {evidence.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </>
  );
}

function Writer({ data }: { data: Record<string, unknown> }) {
  const fileTicket = data.decision === "file_ticket";
  return (
    <>
      <dl className="fields">
        <Field label="Decision">
          <Badge tone={fileTicket ? "warn" : "info"}>{fileTicket ? "File a ticket" : "No ticket"}</Badge>
        </Field>
        {data.runbook_id ? <Field label="Runbook">{asText(data.runbook_id)}</Field> : null}
      </dl>
      {data.reason ? <p>{asText(data.reason)}</p> : null}
      {fileTicket && data.summary ? <p className="muted">Draft: {asText(data.summary)}</p> : null}
    </>
  );
}

export function AgentOutput({ agent, output }: { agent: AgentKey; output: unknown }) {
  if (output === undefined || output === null || output === "") return null;
  if (typeof output === "string") return <RichText text={output} />;
  if (!isRecord(output)) return null;
  if (agent === "triage") return <Triage data={output} />;
  if (agent === "diagnostics") return <Diagnosis data={output} />;
  if (agent === "writer") return <Writer data={output} />;
  return <RichText text={JSON.stringify(output, null, 2)} />;
}
