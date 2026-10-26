/** How each agent is described in the UI. Order here is the order of the flow. */

import type { AgentKey, Outcome } from "../api/types";

export interface AgentInfo {
  key: AgentKey;
  label: string;
  short: string;
  role: string;
  uses: string;
}

export const AGENTS: AgentInfo[] = [
  {
    key: "triage",
    label: "Triage classifier",
    short: "Triage",
    role: "Reads the alert and returns the resource, category, severity and signal as structured JSON.",
    uses: "Structured output (JSON schema), no tools",
  },
  {
    key: "diagnostics",
    label: "Diagnostics",
    short: "Diagnose",
    role: "Checks the resource's state, logs, metrics and recent deployments, then names the likely cause.",
    uses: "Custom MCP server on Azure Functions (4 tools)",
  },
  {
    key: "runbook",
    label: "Runbook finder",
    short: "Runbook",
    role: "Finds the documented fix in the team's runbooks, or says plainly that none exists.",
    uses: "Foundry IQ knowledge base over Azure AI Search",
  },
  {
    key: "writer",
    label: "Ticket writer",
    short: "Draft",
    role: "Decides whether a ticket is needed and drafts it from what the other agents found.",
    uses: "Structured output (JSON schema), no tools",
  },
  {
    key: "filer",
    label: "Ticket filer",
    short: "File",
    role: "Files the approved draft in Jira. It only runs after a person approves.",
    uses: "OpenAPI tool for the Jira REST API",
  },
];

export const AGENT_BY_KEY = Object.fromEntries(AGENTS.map((a) => [a.key, a])) as Record<AgentKey, AgentInfo>;

export const OUTCOME_LABELS: Record<Outcome, string> = {
  ticket_created: "Ticket created",
  rejected: "Rejected by you",
  no_ticket: "No ticket needed",
  stopped: "Stopped early",
  blocked: "Blocked by guardrail",
  failed: "Failed",
};

export type Tone = "ok" | "warn" | "danger" | "info" | "neutral";

export const OUTCOME_TONE: Record<Outcome, Tone> = {
  ticket_created: "ok",
  rejected: "neutral",
  no_ticket: "info",
  stopped: "warn",
  blocked: "danger",
  failed: "danger",
};
