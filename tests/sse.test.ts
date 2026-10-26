import { describe, expect, it } from "vitest";
import { parseSseChunk, readSse } from "../src/api/sse";

describe("parseSseChunk", () => {
  it("parses complete messages and keeps the remainder", () => {
    const { messages, rest } = parseSseChunk('event: agent_started\ndata: {"a":1}\n\n: keepalive\n\nevent: x\ndata: {"b"');
    expect(messages).toEqual([{ event: "agent_started", data: '{"a":1}' }]);
    expect(rest).toBe('event: x\ndata: {"b"');
  });

  it("handles CRLF line endings", () => {
    const { messages } = parseSseChunk('event: e\r\ndata: {"c":3}\r\n\r\n');
    expect(messages).toEqual([{ event: "e", data: '{"c":3}' }]);
  });
});

describe("readSse", () => {
  it("joins messages split across network chunks", async () => {
    const chunks = ['event: a\ndata: {"n"', ':1}\n\nevent: b\ndata: {"n":2}\n', "\n"];
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const enc = new TextEncoder();
        chunks.forEach((c) => controller.enqueue(enc.encode(c)));
        controller.close();
      },
    });
    const seen: string[] = [];
    await readSse(new Response(stream), (m) => seen.push(m.data));
    expect(seen).toEqual(['{"n":1}', '{"n":2}']);
  });
});
