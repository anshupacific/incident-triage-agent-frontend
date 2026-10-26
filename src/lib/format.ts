export function formatDuration(ms: number | undefined): string {
  if (ms === undefined || Number.isNaN(ms)) return "";
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`;
}

export function formatJson(value: unknown): string {
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2) ?? "";
}

/** One-line preview of tool arguments, e.g. resource_name=vm-shop-api-01, minutes=60 */
export function argsPreview(value: unknown): string {
  let args = value;
  if (typeof args === "string") {
    try {
      args = JSON.parse(args);
    } catch {
      return args as string;
    }
  }
  if (args && typeof args === "object" && !Array.isArray(args)) {
    return Object.entries(args as Record<string, unknown>)
      .map(([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`)
      .join(", ");
  }
  return args === undefined || args === null ? "" : JSON.stringify(args);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asText(value: unknown): string {
  if (value === undefined || value === null) return "";
  return typeof value === "string" ? value : JSON.stringify(value);
}

export function asList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(asText).filter(Boolean) : [];
}

/** Total tokens if the backend reported them. */
export function totalTokens(usage: { total_tokens?: number; input_tokens?: number; output_tokens?: number } | undefined) {
  if (!usage) return undefined;
  if (typeof usage.total_tokens === "number") return usage.total_tokens;
  if (typeof usage.input_tokens === "number" || typeof usage.output_tokens === "number") {
    return (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0);
  }
  return undefined;
}
