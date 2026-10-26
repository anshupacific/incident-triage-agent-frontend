/** Loads the scenario list and the daily ticket limit. */

import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import type { Limits, Scenario } from "../api/types";

export function useBackendData() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [limits, setLimits] = useState<Limits | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [list, caps] = await Promise.all([api.scenarios(signal), api.limits(signal)]);
      setScenarios(list);
      setLimits(caps);
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError((err as Error).message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  const refreshLimits = useCallback(() => {
    api.limits().then(setLimits).catch(() => undefined);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return { scenarios, limits, error, loading, retry: () => void load(), refreshLimits };
}
