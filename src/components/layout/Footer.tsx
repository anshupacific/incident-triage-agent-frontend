import { SITE } from "../../config/site";

export function Footer() {
  return (
    <footer className="footer">
      <p>
        Portfolio project by {SITE.author}. All resources, logs and runbooks are invented;{" "}
        <a href={SITE.dataRepoUrl} target="_blank" rel="noreferrer noopener">
          see the demo data
        </a>
        . {SITE.jiraNote}
      </p>
    </footer>
  );
}
