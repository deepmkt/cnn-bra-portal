/**
 * Google Analytics 4 — rastreamento de pageviews e eventos
 * ID: G-DCKDKHYWY9
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

const GA_ID = "G-DCKDKHYWY9";

/** Envia um pageview manual para o GA4 (necessário em SPAs) */
export function trackPageView(path: string, title?: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("config", GA_ID, {
    page_path: path,
    page_title: title || document.title,
  });
}

/** Envia um evento customizado para o GA4 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", eventName, params);
}

// ===== Eventos pré-definidos para o CNN BRA =====

/** Usuário clicou em um artigo */
export function trackArticleClick(articleId: number, title: string, category: string) {
  trackEvent("article_click", {
    article_id: articleId,
    article_title: title.slice(0, 100),
    category,
  });
}

/** Usuário leu um artigo (ficou mais de 10s na página) */
export function trackArticleRead(articleId: number, title: string, category: string) {
  trackEvent("article_read", {
    article_id: articleId,
    article_title: title.slice(0, 100),
    category,
  });
}

/** Usuário curtiu um artigo */
export function trackArticleLike(articleId: number, title: string) {
  trackEvent("article_like", {
    article_id: articleId,
    article_title: title.slice(0, 100),
  });
}

/** Usuário compartilhou um artigo (WhatsApp, etc.) */
export function trackArticleShare(articleId: number, title: string, method: string) {
  trackEvent("share", {
    content_type: "article",
    item_id: String(articleId),
    article_title: title.slice(0, 100),
    method,
  });
}

/** Usuário realizou uma busca */
export function trackSearch(searchTerm: string) {
  trackEvent("search", {
    search_term: searchTerm.slice(0, 100),
  });
}

/** Usuário visualizou um short */
export function trackShortView(shortId: number, title: string, sourceType: string) {
  trackEvent("short_view", {
    short_id: shortId,
    short_title: title.slice(0, 100),
    source_type: sourceType,
  });
}

/** Usuário curtiu um short */
export function trackShortLike(shortId: number) {
  trackEvent("short_like", { short_id: shortId });
}

/** Usuário compartilhou um short */
export function trackShortShare(shortId: number) {
  trackEvent("short_share", { short_id: shortId });
}

/** Usuário clicou em um anúncio */
export function trackAdClick(adId: number, adTitle: string, position: string) {
  trackEvent("ad_click", {
    ad_id: adId,
    ad_title: adTitle.slice(0, 100),
    position,
  });
}

/** Usuário se inscreveu na newsletter */
export function trackNewsletterSignup() {
  trackEvent("newsletter_signup");
}

/** Usuário clicou no botão WhatsApp */
export function trackWhatsAppClick(context: string) {
  trackEvent("whatsapp_click", { context });
}

/** Usuário fez login */
export function trackLogin(method: string = "oauth") {
  trackEvent("login", { method });
}

/** Usuário se registrou */
export function trackSignUp(method: string = "oauth") {
  trackEvent("sign_up", { method });
}

/** Hook para rastrear pageview automaticamente ao montar um componente de página */
export { usePageView } from "./usePageViewHook";
