import { SITE } from "../config/site";
import { AGENTS } from "../lib/agents";

const SAFETY = [
  ["Human approval", "The workflow pauses before the Ticket filer and saves a checkpoint. Only an approval resumes it, so no ticket is ever filed without a person."],
  ["Foundry guardrails", "Every agent runs behind a Foundry guardrail. A blocked answer ends the run and is shown as its own outcome; partial output is never used."],
  ["Prompt injection", "One demo log line tells the AI to close all tickets. The agents flag it instead of following it, and later agents only receive a short note, never the text."],
  ["No secrets in the app", "The backend reaches Foundry with a managed identity. The Jira token lives only in the Foundry project connection."],
  ["Limits", "Visitors pick from fixed alerts (no free text), runs are rate limited per visitor, and the demo files at most a set number of tickets per day."],
];

const STACK = [
  ["Agents", "Five prompt agents in Microsoft Foundry, each called through the Responses API"],
  ["Orchestration", "Microsoft Agent Framework workflow in a FastAPI backend on Azure App Service, with checkpointed pause and resume"],
  ["Diagnostics tools", "Custom MCP server on Azure Functions (Flex Consumption)"],
  ["Runbooks", "Foundry IQ knowledge base over an Azure AI Search index of Markdown runbooks"],
  ["Jira", "OpenAPI tool built from a six-operation spec of the Jira REST API"],
  ["Frontend", "React and TypeScript on Azure Static Web Apps, streaming events over SSE"],
];

export function HowItWorksPage() {
  return (
    <div className="how">
      <section>
        <h2>How it works</h2>
        <p className="lead">
          An alert comes in. Four agents classify it, diagnose it, look up the fix and draft a ticket. You review the
          draft. A fifth agent files it in Jira only if you approve.
        </p>

        <div className="arch" role="img" aria-label="Architecture: browser to backend to five Foundry agents and their tools">
          <div className="arch__col">
            <div className="arch__box">
              Browser
              <small>React on Static Web Apps</small>
            </div>
          </div>
          <div className="arch__arrow" aria-hidden="true">
            ⇄<small>SSE</small>
          </div>
          <div className="arch__col">
            <div className="arch__box arch__box--accent">
              Backend
              <small>FastAPI + Agent Framework workflow</small>
            </div>
          </div>
          <div className="arch__arrow" aria-hidden="true">
            →<small>Responses API</small>
          </div>
          <div className="arch__col arch__col--agents">
            {AGENTS.map((agent, i) => (
              <div key={agent.key} className="arch__agent">
                <span className="arch__agent-name">
                  {i + 1}. {agent.label}
                </span>
                <small>{agent.uses}</small>
                {agent.key === "writer" && <span className="arch__human">✋ You approve</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <h2>The agents</h2>
        <div className="cards">
          {AGENTS.map((agent, i) => (
            <article key={agent.key} className="card">
              <h3>
                {i + 1}. {agent.label}
              </h3>
              <p>{agent.role}</p>
              <p className="muted">{agent.uses}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Safety built in</h2>
        <dl className="defs">
          {SAFETY.map(([term, text]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2>Built with</h2>
        <dl className="defs">
          {STACK.map(([term, text]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{text}</dd>
            </div>
          ))}
        </dl>
        <p>
          All resources, logs, metrics and runbooks are invented and public in the{" "}
          <a href={SITE.dataRepoUrl} target="_blank" rel="noreferrer noopener">
            demo data repository
          </a>
          .
        </p>
      </section>
    </div>
  );
}
