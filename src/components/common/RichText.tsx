import { Fragment } from "react";

const URL_PATTERN = /(https?:\/\/[^\s)\]]+)/g;

/** Agent text with line breaks kept and links made clickable. Never renders HTML from the agent. */
export function RichText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="rich-text">
      {lines.map((line, i) => (
        <Fragment key={i}>
          {line.split(URL_PATTERN).map((part, j) =>
            /^https?:\/\//.test(part) ? (
              <a key={j} href={part} target="_blank" rel="noreferrer noopener">
                {part}
              </a>
            ) : (
              <Fragment key={j}>{part.replace(/\*\*/g, "")}</Fragment>
            ),
          )}
          {i < lines.length - 1 && <br />}
        </Fragment>
      ))}
    </div>
  );
}
