import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CookieConsent } from "./components/CookieConsent";
import Home from "./pages/Home";
import { lazy, Suspense, useEffect } from "react";

const Admin = lazy(() => import("./pages/Admin"));
const ArticlePage = lazy(() => import("./pages/ArticlePage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const SubmitContent = lazy(() => import("./pages/SubmitContent"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Shorts = lazy(() => import("./pages/Shorts"));

const LazyFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin w-8 h-8 border-4 border-[#001c56] border-t-transparent rounded-full" />
  </div>
);

// VLibras Widget for accessibility
function VLibrasWidget() {
  useEffect(() => {
    // Add VLibras widget div
    const widgetDiv = document.createElement("div");
    widgetDiv.setAttribute("vw", "");
    widgetDiv.className = "enabled";
    widgetDiv.innerHTML = `
      <div vw-access-button class="active"></div>
      <div vw-plugin-wrapper>
        <div class="vw-plugin-top-wrapper"></div>
      </div>
    `;
    document.body.appendChild(widgetDiv);

    // Load VLibras script
    const script = document.createElement("script");
    script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      if (window.VLibras) {
        // @ts-ignore
        new window.VLibras.Widget("https://vlibras.gov.br/app");
      }
    };
    document.head.appendChild(script);

    return () => {
      if (widgetDiv.parentNode) widgetDiv.parentNode.removeChild(widgetDiv);
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/admin"}>
        <Suspense fallback={<LazyFallback />}><Admin /></Suspense>
      </Route>
      <Route path={"/artigo/:id"}>
        {(params) => <Suspense fallback={<LazyFallback />}><ArticlePage id={Number(params.id)} /></Suspense>}
      </Route>
      <Route path={"/busca"}>
        <Suspense fallback={<LazyFallback />}><SearchPage /></Suspense>
      </Route>
      <Route path={"/enviar-conteudo"}>
        <Suspense fallback={<LazyFallback />}><SubmitContent /></Suspense>
      </Route>
      <Route path={"/ranking"}>
        <Suspense fallback={<LazyFallback />}><Leaderboard /></Suspense>
      </Route>
      <Route path={"/privacidade"}>
        <Suspense fallback={<LazyFallback />}><PrivacyPolicy /></Suspense>
      </Route>
      <Route path={"/shorts"}>
        <Suspense fallback={<LazyFallback />}><Shorts /></Suspense>
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
          <CookieConsent />
          <VLibrasWidget />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
