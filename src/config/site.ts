/** Text and links shown around the demo. Edit here, not in components. */
export const SITE = {
  title: "Incident Triage Agents",
  tagline: "Five Microsoft Foundry agents triage an Azure alert. You approve before anything is filed in Jira.",
  author: "Anshu Singh",
  dataRepoUrl: "https://github.com/anshupacific/incident-triage-demo-data",
  jiraNote: "Tickets go to a demo Jira project and are cleaned up regularly.",
};

/** Backend base URL, set at build time. Empty means same origin (the Vite proxy in local dev). */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
