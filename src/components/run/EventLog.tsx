import type { RunEvent } from "../../api/types";
import { Collapsible } from "../common/Collapsible";

/** Every event exactly as the backend streamed it. Useful for showing how the UI is driven. */
export function EventLog({ events }: { events: RunEvent[] }) {
  if (!events.length) return null;
  const start = events[0].ts;
  return (
    <Collapsible summary={`Event stream (${events.length} events)`}>
      <ol className="event-log">
        {events.map((event, i) => {
          const { type, run_id: _runId, ts, ...rest } = event;
          void _runId;
          return (
            <li key={i}>
              <span className="event-log__time">+{(ts - start).toFixed(1)}s</span>
              <code className="event-log__type">{type}</code>
              <code className="event-log__data">{JSON.stringify(rest)}</code>
            </li>
          );
        })}
      </ol>
    </Collapsible>
  );
}
