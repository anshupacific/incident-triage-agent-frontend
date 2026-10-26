/**
 * Turns the event stream into what the run view shows.
 * Pure function: easy to test with a list of events (see tests/runReducer.test.ts).
 */

import type {
  AgentKey,
  Decision,
  Outcome,
  RunEvent,
  RunRecord,
  Scenario,
  Ticket,
  TicketDraft,
  ToolCall,
  Usage,
} from "../api/types";
import { AGENTS } from "../lib/agents";

export type StepStatus = "waiting" | "running" | "done" | "blocked" | "failed" | "skipped";

export type Phase = "idle" | "starting" | "running" | "awaiting_approval" | "deciding" | "resuming" | "completed";

export type ApprovalStatus = "not_reached" | "pending" | "approved" | "rejected" | "skipped";

export interface AgentStep {
  agent: AgentKey;
  status: StepStatus;
  input?: string;
  output?: unknown;
  agentName?: string;
  responseId?: string;
  usage?: Usage;
  durationMs?: number;
  startedAt?: number;
  toolCalls: ToolCall[];
  error?: string;
  rawText?: string;
  guardrail?: unknown;
}

export interface RunView {
  phase: Phase;
  runId?: string;
  scenario?: Scenario;
  steps: Record<AgentKey, AgentStep>;
  securityFlags: { agent: AgentKey; text: string }[];
  draft?: TicketDraft;
  approval: ApprovalStatus;
  decision?: Decision;
  ticket?: Ticket;
  outcome?: Outcome;
  message?: string;
  requestError?: string;
  connectionLost: boolean;
  /** True when the run was reopened from its saved record, so there is no timeline. */
  reopened: boolean;
  events: RunEvent[];
}

export type RunAction =
  | { kind: "reset" }
  | { kind: "start"; scenario: Scenario }
  | { kind: "event"; event: RunEvent }
  | { kind: "deciding"; decision: Decision }
  | { kind: "request_failed"; message: string; duringDecision: boolean }
  | { kind: "stream_closed" }
  | { kind: "reopened"; record: RunRecord; scenario?: Scenario };

function emptySteps(): Record<AgentKey, AgentStep> {
  const steps = {} as Record<AgentKey, AgentStep>;
  for (const agent of AGENTS) steps[agent.key] = { agent: agent.key, status: "waiting", toolCalls: [] };
  return steps;
}

export const initialRunView: RunView = {
  phase: "idle",
  steps: emptySteps(),
  securityFlags: [],
  approval: "not_reached",
  connectionLost: false,
  reopened: false,
  events: [],
};

function hasKey(value: object | undefined): value is Ticket {
  return !!value && "key" in value && !!(value as Ticket).key;
}

function updateStep(view: RunView, agent: AgentKey | "", change: Partial<AgentStep>): RunView {
  if (!agent || !(agent in view.steps)) return view;
  return { ...view, steps: { ...view.steps, [agent]: { ...view.steps[agent], ...change } } };
}

function applyEvent(view: RunView, event: RunEvent): RunView {
  const next: RunView = { ...view, events: [...view.events, event], runId: event.run_id || view.runId };

  switch (event.type) {
    case "run_started":
      return { ...next, phase: "running", scenario: event.scenario };

    case "agent_started":
      return updateStep({ ...next, phase: next.phase === "deciding" ? "resuming" : next.phase }, event.agent, {
        status: "running",
        input: event.input,
        startedAt: event.ts,
      });

    case "tool_call": {
      const { agent, kind, name, server, arguments: args, output, error } = event;
      const call: ToolCall = { kind, name, server, arguments: args, output, error };
      return updateStep(next, agent, { toolCalls: [...(next.steps[agent]?.toolCalls ?? []), call] });
    }

    case "agent_completed":
      return updateStep(next, event.agent, {
        status: "done",
        output: event.output,
        agentName: event.agent_name,
        responseId: event.response_id,
        usage: event.usage,
        durationMs: event.duration_ms,
      });

    case "security_flag":
      return { ...next, securityFlags: [...next.securityFlags, { agent: event.agent, text: event.text }] };

    case "guardrail_blocked":
      return updateStep(next, event.agent, { status: "blocked", guardrail: event.details });

    case "error":
      return updateStep(next, event.agent, { status: "failed", error: event.message, rawText: event.raw_text });

    case "approval_required":
      return { ...next, phase: "awaiting_approval", draft: event.draft, approval: "pending" };

    case "run_resumed":
      return { ...next, phase: "resuming", decision: event.decision };

    case "approval_recorded":
      return {
        ...next,
        decision: event.decision,
        approval: event.decision === "approve" ? "approved" : "rejected",
      };

    case "ticket_created": {
      const { key, url, summary, labels, filer_answer } = event;
      return { ...next, ticket: { key, url, summary, labels, filer_answer } };
    }

    case "run_completed": {
      const steps = { ...next.steps };
      for (const key of Object.keys(steps) as AgentKey[]) {
        const step = steps[key];
        if (step.status === "waiting") steps[key] = { ...step, status: "skipped" };
        if (step.status === "running") steps[key] = { ...step, status: "failed" };
      }
      return {
        ...next,
        steps,
        phase: "completed",
        outcome: event.outcome,
        message: event.message,
        ticket: hasKey(event.ticket) ? event.ticket : next.ticket,
        approval: next.approval === "not_reached" ? "skipped" : next.approval,
      };
    }

    default:
      return next;
  }
}

export function runReducer(view: RunView, action: RunAction): RunView {
  switch (action.kind) {
    case "reset":
      return { ...initialRunView, steps: emptySteps() };

    case "start":
      return { ...initialRunView, steps: emptySteps(), phase: "starting", scenario: action.scenario };

    case "event":
      return applyEvent(view, action.event);

    case "deciding":
      return { ...view, phase: "deciding", decision: action.decision, requestError: undefined };

    case "request_failed":
      // A failed approval call leaves the run waiting, so the visitor can try again.
      if (action.duringDecision) return { ...view, phase: "awaiting_approval", requestError: action.message };
      return { ...view, phase: view.events.length ? "completed" : "idle", requestError: action.message };

    case "stream_closed": {
      const unfinished = ["starting", "running", "resuming", "deciding"].includes(view.phase);
      return unfinished && view.runId ? { ...view, connectionLost: true } : view;
    }

    case "reopened": {
      const { record } = action;
      const base: RunView = {
        ...initialRunView,
        steps: emptySteps(),
        reopened: true,
        runId: record.run_id,
        scenario: action.scenario,
      };
      const draft = "decision" in record.draft ? (record.draft as TicketDraft) : undefined;
      if (record.status === "awaiting_approval") {
        return { ...base, phase: "awaiting_approval", draft, approval: "pending" };
      }
      if (record.status === "completed" && record.outcome) {
        return {
          ...base,
          phase: "completed",
          draft,
          outcome: record.outcome,
          message: record.message,
          ticket: hasKey(record.ticket) ? record.ticket : undefined,
          approval:
            record.outcome === "ticket_created" ? "approved" : record.outcome === "rejected" ? "rejected" : "skipped",
        };
      }
      return { ...base, phase: "running", connectionLost: true };
    }
  }
}
