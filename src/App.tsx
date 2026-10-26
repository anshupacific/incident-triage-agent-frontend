import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { useBackendData } from "./hooks/useBackendData";
import { useHashRoute } from "./hooks/useHashRoute";
import { DemoPage } from "./pages/DemoPage";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { SITE } from "./config/site";

export default function App() {
  const [route, navigate] = useHashRoute();
  const data = useBackendData();

  return (
    <div className="app">
      <Header route={route} onNavigate={navigate} limits={data.limits} />
      <main className="main">
        {route === "demo" && (
          <>
            <p className="tagline">{SITE.tagline}</p>
            <DemoPage
              scenarios={data.scenarios}
              limits={data.limits}
              loading={data.loading}
              error={data.error}
              onRetry={data.retry}
              onRunFinished={data.refreshLimits}
            />
          </>
        )}
        {route === "how" && <HowItWorksPage />}
      </main>
      <Footer />
    </div>
  );
}
