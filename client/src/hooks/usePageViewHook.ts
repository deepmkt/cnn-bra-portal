import { useEffect } from "react";
import { trackPageView } from "./useAnalytics";

/** Hook React para rastrear pageview automaticamente ao montar um componente de página */
export function usePageView(path: string, title?: string) {
  useEffect(() => {
    trackPageView(path, title);
  }, [path, title]);
}
