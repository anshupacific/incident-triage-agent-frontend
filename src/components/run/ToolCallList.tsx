import type { ToolCall } from "../../api/types";
import { argsPreview } from "../../lib/format";
import { CodeBlock } from "../common/CodeBlock";

const KIND_LABEL: Record<string, string> = {
  mcp_call: "MCP",
  openapi_call: "OpenAPI",
  function_call: "Function",
  file_search_call: "Search",
  azure_ai_search_call: "AI Search",
};

function kindLabel(kind: string): string {
  return KIND_LABEL[kind] ?? kind.replace(/_call$/, "").replace(/_/g, " ");
}

export function ToolCallList({ calls }: { calls: ToolCall[] }) {
  if (!calls.length) return null;
  return (
    <div className="tools">
      <h4 className="label">Tool calls ({calls.length})</h4>
      <ol>
        {calls.map((call, i) => (
          <li key={i} className={call.error ? "tool is-error" : "tool"}>
            <details>
              <summary>
                <span className="tool__kind">{kindLabel(call.kind)}</span>
                <code className="tool__name">{call.name || "(unnamed)"}</code>
                {call.server && <span className="tool__server">{call.server}</span>}
                <span className="tool__args">{argsPreview(call.arguments)}</span>
              </summary>
              <div className="tool__body">
                <h5 className="label">Arguments</h5>
                <CodeBlock value={call.arguments} />
                {call.error ? (
                  <>
                    <h5 className="label">Error</h5>
                    <CodeBlock value={call.error} json={false} />
                  </>
                ) : (
                  <>
                    <h5 className="label">Result</h5>
                    <CodeBlock value={call.output} />
                  </>
                )}
              </div>
            </details>
          </li>
        ))}
      </ol>
    </div>
  );
}
