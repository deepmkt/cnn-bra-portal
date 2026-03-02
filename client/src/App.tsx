import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CookieConsent } from "./components/CookieConsent";
import { AnalyticsInjector } from "./components/AnalyticsInjector";
import Home from "./pages/Home";
import { lazy, Suspense, useEffect } from "react";

const Admin = lazy(() => import("./pages/Admin"));
const ArticlePage = lazy(() => import("./pages/ArticlePage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const SubmitContent = lazy(() => import("./pages/SubmitContent"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Shorts = lazy(() => import("./pages/Shorts"));

const ADMIN_SUBDOMAIN = "admin.cnnbra.com.br";

const LazyFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin w-8 h-8 border-4 border-[#001c56] border-t-transparent rounded-full" />
  </div>
);

/**
 * AdminGuard — wraps the /admin route.
 * In production, if the current hostname is NOT admin.cnnbra.com.br,
 * it immediately redirects the browser there.
 * In development all hosts are allowed so local testing works normally.
 */
function AdminGuard({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (import.meta.env.PROD) {
      const hostname = window.location.hostname.toLowerCase();
      if (hostname !== ADMIN_SUBDOMAIN) {
        window.location.replace(
          `https://${ADMIN_SUBDOMAIN}/admin${window.location.search}${window.location.hash}`
        );
      }
    }
  }, []);

  // In production, only render children when on the correct subdomain
  if (import.meta.env.PROD && window.location.hostname.toLowerCase() !== ADMIN_SUBDOMAIN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#001c56]">
        <div className="text-center text-white">
          <div className="animate-spin w-10 h-10 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm opacity-75">Redirecionando para o painel administrativo…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/admin"}>
        <AdminGuard>
          <Suspense fallback={<LazyFallback />}><Admin /></Suspense>
        </AdminGuard>
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
          <AnalyticsInjector />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
