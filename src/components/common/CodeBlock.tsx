import { formatJson } from "../../lib/format";

export function CodeBlock({ value, json = true }: { value: unknown; json?: boolean }) {
  const text = json ? formatJson(value) : String(value ?? "");
  return <pre className="code">{text || "(empty)"}</pre>;
}
