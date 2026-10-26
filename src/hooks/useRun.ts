/** Starts runs, sends decisions and keeps the run view up to date. */

import { useCallback, useEffect, useReducer, useRef } from "react";
import { api, ApiError } from "../api/client";
import type { Decision, Scenario } from "../api/types";
import { initialRunView, runReducer } from "../state/runReducer";

const RUN_PARAM = "run";

function setRunInUrl(runId: string | undefined) {
  const url = new URL(window.location.href);
  if (runId) url.searchParams.set(RUN_PARAM, runId);
  else url.searchParams.delete(RUN_PARAM);
  window.history.replaceState(null, "", url);
}

function messageOf(error: unknown): string {
  return error instanceof ApiError || error instanceof Error ? error.message : "Something went wrong.";
}

export function useRun(scenarios: Scenario[], onRunFinished: () => void) {
  const [view, dispatch] = useReducer(runReducer, initialRunView);
  const abortRef = useRef<AbortController | null>(null);
  const reopenedRef = useRef(false);

  const stream = useCallback(
    async (call: (signal: AbortSignal) => Promise<void>, duringDecision: boolean) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        await call(controller.signal);
        dispatch({ kind: "stream_closed" });
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        dispatch({ kind: "request_failed", message: messageOf(error), duringDecision });
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        onRunFinished();
      }
    },
    [onRunFinished],
  );

  const start = useCallback(
    (scenario: Scenario) => {
      dispatch({ kind: "start", scenario });
      void stream(
        (signal) =>
          api.startRun(
            scenario.id,
            (event) => {
              if (event.type === "run_started") setRunInUrl(event.run_id);
              dispatch({ kind: "event", event });
            },
            signal,
          ),
        false,
      );
    },
    [stream],
  );

  const decide = useCallback(
    (decision: Decision) => {
      const runId = view.runId;
      if (!runId) return;
      dispatch({ kind: "deciding", decision });
      void stream((signal) => api.decide(runId, decision, (event) => dispatch({ kind: "event", event }), signal), true);
    },
    [stream, view.runId],
  );

  const reopen = useCallback(
    async (runId: string) => {
      try {
        const record = await api.run(runId);
        dispatch({ kind: "reopened", record, scenario: scenarios.find((s) => s.id === record.scenario_id) });
      } catch (error) {
        setRunInUrl(undefined);
        dispatch({ kind: "request_failed", message: messageOf(error), duringDecision: false });
      }
    },
    [scenarios],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setRunInUrl(undefined);
    dispatch({ kind: "reset" });
  }, []);

  // Reopen a run from ?run=<id>, e.g. after a page refresh while waiting for approval.
  useEffect(() => {
    if (reopenedRef.current || !scenarios.length) return;
    reopenedRef.current = true;
    const runId = new URL(window.location.href).searchParams.get(RUN_PARAM);
    if (runId && /^[a-f0-9]{12}$/.test(runId)) void reopen(runId);
  }, [scenarios, reopen]);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { view, start, decide, reopen, reset };
}
