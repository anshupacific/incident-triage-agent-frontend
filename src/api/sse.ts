/**
 * Reads a server-sent event stream from a fetch() response.
 * EventSource only supports GET, and the backend streams from POST requests, so this parses by hand.
 */

export interface SseMessage {
  event: string;
  data: string;
}

/** Split complete messages off the buffer. Returns the messages and the unfinished remainder. */
export function parseSseChunk(buffer: string): { messages: SseMessage[]; rest: string } {
  const normalized = buffer.replace(/\r\n/g, "\n");
  const blocks = normalized.split("\n\n");
  const rest = blocks.pop() ?? "";
  const messages: SseMessage[] = [];

  for (const block of blocks) {
    let event = "message";
    const data: string[] = [];
    for (const line of block.split("\n")) {
      if (!line || line.startsWith(":")) continue; // comment lines are keepalives
      const colon = line.indexOf(":");
      const field = colon === -1 ? line : line.slice(0, colon);
      const value = colon === -1 ? "" : line.slice(colon + 1).replace(/^ /, "");
      if (field === "event") event = value;
      else if (field === "data") data.push(value);
    }
    if (data.length) messages.push({ event, data: data.join("\n") });
  }
  return { messages, rest };
}

/** Call onMessage for each message until the stream ends. */
export async function readSse(response: Response, onMessage: (message: SseMessage) => void): Promise<void> {
  if (!response.body) throw new Error("The server returned no stream.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const { messages, rest } = parseSseChunk(buffer);
    buffer = rest;
    messages.forEach(onMessage);
  }
  const { messages } = parseSseChunk(buffer + decoder.decode() + "\n\n");
  messages.forEach(onMessage);
}
