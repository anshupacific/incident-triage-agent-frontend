/** All backend calls. Components never call fetch directly. */

import { API_BASE_URL } from "../config/site";
import { readSse } from "./sse";
import type { Decision, Limits, RunEvent, RunRecord, Scenario } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") return body.detail;
    if (Array.isArray(body?.detail)) return "The request was not valid.";
  } catch {
    /* not JSON */
  }
  return `The server returned ${response.status}.`;
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ApiError("Could not reach the backend. It may be starting up; try again in a moment.", 0);
  }
  if (!response.ok) throw new ApiError(await errorMessage(response), response.status);
  return response;
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await request(path, { signal });
  return (await response.json()) as T;
}

async function postStream(path: string, body: unknown, onEvent: (event: RunEvent) => void, signal?: AbortSignal) {
  const response = await request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(body),
    signal,
  });
  await readSse(response, (message) => {
    try {
      onEvent(JSON.parse(message.data) as RunEvent);
    } catch {
      console.warn("Skipped an event that was not JSON", message);
    }
  });
}

export const api = {
  async scenarios(signal?: AbortSignal): Promise<Scenario[]> {
    const body = await getJson<{ scenarios: Scenario[] }>("/api/scenarios", signal);
    return body.scenarios;
  },

  limits(signal?: AbortSignal): Promise<Limits> {
    return getJson<Limits>("/api/limits", signal);
  },

  run(runId: string, signal?: AbortSignal): Promise<RunRecord> {
    return getJson<RunRecord>(`/api/runs/${encodeURIComponent(runId)}`, signal);
  },

  /** Starts a run and streams its events until it finishes or pauses for approval. */
  startRun(scenarioId: string, onEvent: (event: RunEvent) => void, signal?: AbortSignal): Promise<void> {
    return postStream("/api/runs", { scenario_id: scenarioId }, onEvent, signal);
  },

  /** Sends the human decision and streams the rest of the run. */
  decide(runId: string, decision: Decision, onEvent: (event: RunEvent) => void, signal?: AbortSignal): Promise<void> {
    return postStream(`/api/runs/${encodeURIComponent(runId)}/approval`, { decision }, onEvent, signal);
  },
};
