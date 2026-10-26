import type { Limits } from "../../api/types";
import { SITE } from "../../config/site";
import type { Route } from "../../hooks/useHashRoute";

interface Props {
  route: Route;
  onNavigate: (route: Route) => void;
  limits: Limits | null;
}

export function Header({ route, onNavigate, limits }: Props) {
  return (
    <header className="header">
      <div className="header__inner">
        <a
          className="brand"
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("demo");
          }}
        >
          <img src="/favicon.svg" alt="" width={28} height={28} />
          <span>{SITE.title}</span>
        </a>
        <nav className="nav" aria-label="Main">
          <button className={route === "demo" ? "nav__link is-active" : "nav__link"} onClick={() => onNavigate("demo")}>
            Demo
          </button>
          <button className={route === "how" ? "nav__link is-active" : "nav__link"} onClick={() => onNavigate("how")}>
            How it works
          </button>
        </nav>
        {limits && (
          <div className="header__limit" title="Tickets the demo has created in Jira today">
            Tickets today{" "}
            <strong>
              {limits.tickets_created_today}/{limits.daily_ticket_cap}
            </strong>
          </div>
        )}
      </div>
    </header>
  );
}
