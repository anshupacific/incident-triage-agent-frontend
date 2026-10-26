import { describe, expect, it } from "vitest";
import type { RunEvent, Scenario } from "../src/api/types";
import { initialRunView, runReducer, type RunView } from "../src/state/runReducer";

const scenario: Scenario = {
  id: "vm-shop-api-01",
  title: "High CPU after a deployment",
  alert: "Alert: CpuHigh fired.",
  demonstrates: "The full flow.",
  expected_outcome: "ticket_created",
  data_url: "https://example.test",
};

let ts = 1000;
const ev = (e: Record<string, unknown>) => ({ run_id: "abcdef123456", ts: ts++, ...e }) as RunEvent;

function play(events: RunEvent[], from: RunView = runReducer(initialRunView, { kind: "start", scenario })) {
  return events.reduce((view, event) => runReducer(view, { kind: "event", event }), from);
}

const firstHalf = [
  ev({ type: "run_started", scenario }),
  ev({ type: "agent_started", agent: "triage", input: "alert" }),
  ev({ type: "agent_completed", agent: "triage", agent_name: "triage-classifier", response_id: "r1", output: { severity: "sev2" }, usage: {}, duration_ms: 900 }),
  ev({ type: "agent_started", agent: "diagnostics", input: "x" }),
  ev({ type: "tool_call", agent: "diagnostics", kind: "mcp_call", name: "get_resource_state", server: "s", arguments: "{}", output: "{}", error: "" }),
  ev({ type: "agent_completed", agent: "diagnostics", agent_name: "triage-diag-agent", response_id: "r2", output: { status: "ongoing" }, usage: {}, duration_ms: 5000 }),
  ev({ type: "agent_started", agent: "runbook", input: "x" }),
  ev({ type: "agent_completed", agent: "runbook", agent_name: "rb", response_id: "r3", output: "RB-001", usage: {}, duration_ms: 3000 }),
  ev({ type: "agent_started", agent: "writer", input: "x" }),
  ev({ type: "agent_completed", agent: "writer", agent_name: "w", response_id: "r4", output: { decision: "file_ticket" }, usage: {}, duration_ms: 2000 }),
  ev({ type: "approval_required", draft: { decision: "file_ticket", summary: "CPU high", labels: ["triage-demo"] } }),
];

describe("runReducer", () => {
  it("pauses for approval after the writer", () => {
    const view = play(firstHalf);
    expect(view.phase).toBe("awaiting_approval");
    expect(view.approval).toBe("pending");
    expect(view.steps.diagnostics.toolCalls).toHaveLength(1);
    expect(view.steps.filer.status).toBe("waiting");
    expect(runReducer(view, { kind: "stream_closed" }).connectionLost).toBe(false);
  });

  it("completes with a ticket after approval", () => {
    let view = play(firstHalf);
    view = runReducer(view, { kind: "deciding", decision: "approve" });
    view = play(
      [
        ev({ type: "run_resumed", decision: "approve" }),
        ev({ type: "approval_recorded", decision: "approve" }),
        ev({ type: "agent_started", agent: "filer", input: "x" }),
        ev({ type: "agent_completed", agent: "filer", agent_name: "f", response_id: "r5", output: "Created KAN-7", usage: {}, duration_ms: 4000 }),
        ev({ type: "ticket_created", key: "KAN-7", url: "https://x/browse/KAN-7", summary: "CPU high", labels: [] }),
        ev({ type: "run_completed", outcome: "ticket_created", message: "Created KAN-7 in Jira.", ticket: { key: "KAN-7", url: "u", summary: "s", labels: [] } }),
      ],
      view,
    );
    expect(view.phase).toBe("completed");
    expect(view.approval).toBe("approved");
    expect(view.ticket?.key).toBe("KAN-7");
    expect(view.steps.filer.status).toBe("done");
  });

  it("marks later steps skipped when the guardrail blocks", () => {
    const view = play([
      ev({ type: "run_started", scenario }),
      ev({ type: "agent_started", agent: "triage", input: "alert" }),
      ev({ type: "guardrail_blocked", agent: "triage", details: { code: "content_filter" } }),
      ev({ type: "run_completed", outcome: "blocked", message: "Blocked.", ticket: {} }),
    ]);
    expect(view.steps.triage.status).toBe("blocked");
    expect(view.steps.writer.status).toBe("skipped");
    expect(view.approval).toBe("skipped");
    expect(view.ticket).toBeUndefined();
  });

  it("flags a lost connection mid-run", () => {
    const view = play([ev({ type: "run_started", scenario }), ev({ type: "agent_started", agent: "triage", input: "a" })]);
    expect(runReducer(view, { kind: "stream_closed" }).connectionLost).toBe(true);
  });

  it("keeps the run waiting if the approval request fails", () => {
    let view = runReducer(play(firstHalf), { kind: "deciding", decision: "approve" });
    view = runReducer(view, { kind: "request_failed", message: "limit reached", duringDecision: true });
    expect(view.phase).toBe("awaiting_approval");
    expect(view.requestError).toBe("limit reached");
  });
});
