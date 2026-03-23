import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CookieConsent } from "./components/CookieConsent";
import { AnalyticsInjector } from "./components/AnalyticsInjector";
import { AdBanner } from "@/components/AdBanner";
import { trpc } from "@/lib/trpc";
import Home from "./pages/Home";
import { lazy, Suspense, useEffect, useState } from "react";
import { trackPageView } from "./hooks/useAnalytics";

const Admin = lazy(() => import("./pages/Admin"));
const ArticlePage = lazy(() => import("./pages/ArticlePage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const SubmitContent = lazy(() => import("./pages/SubmitContent"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Shorts = lazy(() => import("./pages/Shorts"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const StatePage = lazy(() => import("./pages/StatePage"));

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

/**
 * HomeOrAdminRedirect — renders the Home page normally on the public domain,
 * but redirects to /admin when visited on the admin subdomain.
 */
function HomeOrAdminRedirect() {
  useEffect(() => {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname === ADMIN_SUBDOMAIN) {
      window.location.replace("/admin");
    }
  }, []);

  // Show redirect screen on admin subdomain
  if (window.location.hostname.toLowerCase() === ADMIN_SUBDOMAIN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#001c56]">
        <div className="text-center text-white">
          <div className="animate-spin w-10 h-10 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm opacity-75">Redirecionando para o painel administrativo…</p>
        </div>
      </div>
    );
  }

  return <Home />;
}

/** RouteTracker — dispara pageview no GA4 a cada mudança de rota */
function RouteTracker() {
  const [location] = useLocation();
  useEffect(() => {
    trackPageView(location, document.title);
  }, [location]);
  return null;
}

/**
 * GlobalTicker — barra "De Última Hora" exibida no topo absoluto do site,
 * acima do banner de publicidade, em todas as páginas públicas.
 * Oculta no painel admin e na página Shorts.
 */
function GlobalTicker() {
  const [location] = useLocation();
  const { data: tickerData } = trpc.ticker.list.useQuery();
  const tickerItems = tickerData ?? [];

  // Hide on admin and shorts pages
  const isAdminPage = location.startsWith("/admin");
  const isShortsPage = location === "/shorts";
  if (isAdminPage || isShortsPage) return null;

  const tickerText = tickerItems.length > 0
    ? tickerItems.map((t: any) => t.text).join(" • ")
    : "Acompanhe as últimas notícias do Brasil e do mundo no CNN BRA • Seu portal de notícias 24 horas";

  return (
    <div className="bg-[#001c56] text-white text-xs h-8 flex items-center w-full overflow-hidden sticky top-0 z-[70]">
      <div className="font-bold uppercase px-3 h-full flex items-center bg-[#001c56] z-20 relative border-r border-white/20 shadow-lg whitespace-nowrap text-[11px] shrink-0">
        <span className="text-red-500 mr-1.5 animate-pulse">●</span> Última Hora
      </div>
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <div className="animate-marquee whitespace-nowrap inline-block pl-3 font-medium text-[11px]">
          {tickerText}
        </div>
      </div>
    </div>
  );
}

/**
 * GlobalAdBanner — banner de anúncio fixo exibido em todas as páginas públicas.
 * Não aparece no painel admin nem na página de Shorts (fullscreen).
 * Fica posicionado logo abaixo do conteúdo de cada página, de forma sticky no topo
 * após o scroll inicial, garantindo visibilidade máxima sem bloquear conteúdo.
 */
function GlobalAdBanner() {
  const [location] = useLocation();
  const [adIndex, setAdIndex] = useState(0);

  // Rotate ad every 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setAdIndex(prev => (prev + 1) % 3);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // Hide on admin and shorts pages (fullscreen experiences)
  const isAdminPage = location.startsWith("/admin");
  const isShortsPage = location === "/shorts";
  if (isAdminPage || isShortsPage) return null;

  return (
    <div
      className="w-full bg-gray-50 border-b border-gray-200 py-1.5 flex justify-center items-center"
      style={{ minHeight: 0 }}
    >
      <div className="flex flex-col items-center gap-0.5 w-full max-w-[730px] px-2">
        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-medium self-start">Publicidade</span>
        <AdBanner
          placement="horizontal"
          fallbackIndex={adIndex}
          className="w-full max-w-[728px]"
        />
      </div>
    </div>
  );
}

function Router() {
  return (
    <>
      <RouteTracker />
      <GlobalTicker />
      <GlobalAdBanner />
      <Switch>
      <Route path={"/"} component={HomeOrAdminRedirect} />
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
      <Route path={"/sobre"}>
        <Suspense fallback={<LazyFallback />}><About /></Suspense>
      </Route>
      <Route path={"/contato"}>
        <Suspense fallback={<LazyFallback />}><Contact /></Suspense>
      </Route>
      <Route path={"/:uf"}>
        {(params) => {
          const uf = (params.uf || "").toUpperCase();
          const validUFs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
          if (validUFs.includes(uf)) {
            return <Suspense fallback={<LazyFallback />}><StatePage /></Suspense>;
          }
          return <NotFound />;
        }}
      </Route>
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
    </>
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
