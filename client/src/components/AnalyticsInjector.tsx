import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

/**
 * AnalyticsInjector — Reads GA4, GTM, VLibras, and TTS settings from the DB
 * and injects the corresponding scripts into the document <head> / <body>.
 *
 * Mount this component once at the root of the app (e.g. in App.tsx).
 * It is invisible and has no rendered output.
 */
export function AnalyticsInjector() {
  const { data: settings } = trpc.settings.getAll.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!settings) return;

    const get = (key: string) =>
      settings.find((s: any) => s.settingKey === key)?.settingValue ?? "";

    const ga4Id = get("ga4_id");
    const gtmId = get("gtm_id");
    const vlibrasEnabled = get("vlibras_enabled") === "true";
    const ttsEnabled = get("tts_enabled") === "true";

    // ── GA4 ──────────────────────────────────────────────────────────────────
    if (ga4Id && !document.getElementById("cnn-ga4-script")) {
      const s1 = document.createElement("script");
      s1.id = "cnn-ga4-script";
      s1.async = true;
      s1.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
      document.head.appendChild(s1);

      const s2 = document.createElement("script");
      s2.id = "cnn-ga4-init";
      s2.textContent = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${ga4Id}');
      `;
      document.head.appendChild(s2);
    }

    // ── GTM ──────────────────────────────────────────────────────────────────
    if (gtmId && !document.getElementById("cnn-gtm-script")) {
      const s = document.createElement("script");
      s.id = "cnn-gtm-script";
      s.textContent = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${gtmId}');
      `;
      document.head.appendChild(s);

      // GTM noscript fallback in body
      if (!document.getElementById("cnn-gtm-noscript")) {
        const ns = document.createElement("noscript");
        ns.id = "cnn-gtm-noscript";
        ns.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
        document.body.insertBefore(ns, document.body.firstChild);
      }
    }

    // ── VLibras ───────────────────────────────────────────────────────────────
    // URL atualizada: o vlibras.gov.br redireciona para o CDN jsDelivr
    // O Widget agora usa o endpoint https://www.vlibras.gov.br/app/
    if (vlibrasEnabled && !document.getElementById("cnn-vlibras-script")) {
      // Inject VLibras container div BEFORE loading the script
      if (!document.querySelector("[vw]")) {
        const div = document.createElement("div");
        div.setAttribute("vw", "");
        div.className = "enabled";
        div.innerHTML = `<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>`;
        document.body.appendChild(div);
      }

      const s = document.createElement("script");
      s.id = "cnn-vlibras-script";
      // Use the CDN URL directly (vlibras.gov.br 302-redirects here)
      s.src = "https://cdn.jsdelivr.net/gh/spbgovbr-vlibras/vlibras-portal@dev/app/vlibras-plugin.js";
      s.async = true;
      s.onload = () => {
        try {
          // @ts-ignore
          new window.VLibras.Widget("https://www.vlibras.gov.br/app/");
        } catch (e) {
          console.warn("[VLibras] Widget init failed:", e);
        }
      };
      s.onerror = () => {
        // Fallback: try the original gov.br URL
        const fallback = document.createElement("script");
        fallback.id = "cnn-vlibras-script-fallback";
        fallback.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
        fallback.async = true;
        fallback.onload = () => {
          try {
            // @ts-ignore
            new window.VLibras.Widget("https://www.vlibras.gov.br/app/");
          } catch {}
        };
        document.head.appendChild(fallback);
      };
      document.head.appendChild(s);
    }

    // ── TTS (Text-to-Speech) ──────────────────────────────────────────────────
    // TTS is handled by the ArticlePage component using the Web Speech API.
    // We just store the setting here so ArticlePage can read it.
    if (ttsEnabled) {
      document.documentElement.setAttribute("data-tts-enabled", "true");
    } else {
      document.documentElement.removeAttribute("data-tts-enabled");
    }
  }, [settings]);

  return null;
}

export default AnalyticsInjector;
