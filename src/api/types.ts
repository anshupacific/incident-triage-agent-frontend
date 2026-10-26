/** Shapes returned by the backend. Kept in one place so a backend change is easy to follow. */

export type AgentKey = "triage" | "diagnostics" | "runbook" | "writer" | "filer";

export type Outcome = "ticket_created" | "rejected" | "no_ticket" | "stopped" | "blocked" | "failed";

export type Decision = "approve" | "reject";

export interface Scenario {
  id: string;
  title: string;
  alert: string;
  demonstrates: string;
  expected_outcome: Outcome;
  data_url: string;
}

export interface Limits {
  daily_ticket_cap: number;
  tickets_created_today: number;
}

export interface ToolCall {
  kind: string;
  name: string;
  server: string;
  arguments: unknown;
  output: string;
  error: string;
}

export interface TicketDraft {
  decision: "file_ticket" | "no_ticket";
  reason?: string;
  summary?: string;
  description?: string;
  labels?: string[];
  runbook_id?: string;
  runbook_url?: string;
}

export interface Ticket {
  key: string;
  url: string;
  summary: string;
  labels: string[];
  filer_answer?: string;
}

export interface Usage {
  input_tokens?: number;
  output_tokens?: number;
  total_tokens?: number;
}

/** GET /api/runs/{run_id} */
export interface RunRecord {
  run_id: string;
  scenario_id: string;
  status: "running" | "awaiting_approval" | "resuming" | "completed";
  created_at: string;
  draft: TicketDraft | Record<string, never>;
  outcome: Outcome | "";
  message: string;
  ticket: Ticket | Record<string, never>;
}

interface Base {
  run_id: string;
  ts: number;
}

/** Every event the run stream can send. `type` matches the SSE event name. */
export type RunEvent =
  | (Base & { type: "run_started"; scenario: Scenario })
  | (Base & { type: "agent_started"; agent: AgentKey; input: string })
  | (Base & { type: "tool_call"; agent: AgentKey } & ToolCall)
  | (Base & {
      type: "agent_completed";
      agent: AgentKey;
      agent_name: string;
      response_id: string;
      output: unknown;
      usage: Usage;
      duration_ms: number;
    })
  | (Base & { type: "security_flag"; agent: AgentKey; text: string })
  | (Base & { type: "guardrail_blocked"; agent: AgentKey; details: unknown })
  | (Base & { type: "approval_required"; draft: TicketDraft })
  | (Base & { type: "run_resumed"; decision: Decision })
  | (Base & { type: "approval_recorded"; decision: Decision })
  | (Base & { type: "ticket_created" } & Ticket)
  | (Base & { type: "run_completed"; outcome: Outcome; message: string; ticket: Ticket | Record<string, never> })
  | (Base & { type: "error"; agent: AgentKey | ""; message: string; raw_text?: string });
