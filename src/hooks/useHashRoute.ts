import { useEffect, useState } from "react";

export type Route = "demo" | "how";

function read(): Route {
  return window.location.hash === "#/how-it-works" ? "how" : "demo";
}

/** Two pages, switched by the URL hash so links and the back button work on any static host. */
export function useHashRoute(): [Route, (route: Route) => void] {
  const [route, setRoute] = useState<Route>(read);
  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  const go = (next: Route) => {
    window.location.hash = next === "how" ? "#/how-it-works" : "#/";
    window.scrollTo({ top: 0 });
  };
  return [route, go];
}
