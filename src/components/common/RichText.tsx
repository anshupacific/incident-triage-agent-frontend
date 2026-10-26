/**
 * Agent text as safe React elements, never as HTML.
 * Handles the bits of Markdown agents commonly use: ``` code blocks, `inline code`,
 * **bold**, "## headings", line breaks, and clickable links.
 */

import { Fragment, type ReactNode } from "react";

const INLINE = /(`[^`\n]+`|\*\*[^*\n]+\*\*|https?:\/\/[^\s)\]`]+)/g;

function inline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (!part) return null;
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1) return <code key={i}>{part.slice(1, -1)}</code>;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 3) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noreferrer noopener">
          {part}
        </a>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

function paragraph(lines: string[], key: number): ReactNode {
  const heading = lines.length === 1 && /^#{1,6}\s+/.test(lines[0]);
  if (heading) return <h4 key={key}>{inline(lines[0].replace(/^#{1,6}\s+/, ""))}</h4>;
  return (
    <p key={key}>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {inline(line)}
          {i < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </p>
  );
}

export function RichText({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let para: string[] = [];
  let code: string[] | null = null;

  const flush = () => {
    if (para.length) blocks.push(paragraph(para, blocks.length));
    para = [];
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (code === null) {
        flush();
        code = [];
      } else {
        blocks.push(
          <pre key={blocks.length} className="code">
            <code>{code.join("\n")}</code>
          </pre>,
        );
        code = null;
      }
    } else if (code !== null) {
      code.push(line);
    } else if (!line.trim()) {
      flush();
    } else {
      para.push(line);
    }
  }
  if (code !== null) {
    blocks.push(
      <pre key={blocks.length} className="code">
        <code>{code.join("\n")}</code>
      </pre>,
    );
  }
  flush();

  return <div className="rich-text">{blocks}</div>;
}