import { useState, useEffect } from "react";
import { Cookie, Shield, ChevronDown, ChevronUp } from "lucide-react";

const COOKIE_CONSENT_KEY = "cnn-bra-cookie-consent";

interface CookiePreferences {
  necessary: boolean; // always true
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  timestamp: number;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    personalization: false,
    timestamp: 0,
  });

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      // Show banner after a small delay for better UX
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
    // Check if consent is older than 6 months
    try {
      const parsed = JSON.parse(stored);
      const sixMonths = 180 * 24 * 60 * 60 * 1000;
      if (Date.now() - parsed.timestamp > sixMonths) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    const data = { ...prefs, timestamp: Date.now() };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(data));
    setVisible(false);
  };

  const handleAcceptAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    saveConsent({ necessary: true, analytics: true, marketing: true, personalization: true, timestamp: 0 });
  };

  const handleRejectOptional = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    saveConsent({ necessary: true, analytics: false, marketing: false, personalization: false, timestamp: 0 });
  };

  const handleSaveCustom = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    saveConsent(preferences);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Banner */}
      <div
        className="relative w-full max-w-4xl mx-4 mb-4 bg-white rounded-2xl shadow-2xl z-[10000] animate-in slide-in-from-bottom-10 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-[#001c56] rounded-xl flex items-center justify-center flex-shrink-0">
              <Cookie className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black text-gray-800 mb-1">Sua privacidade importa para nós</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                O <strong>CNN BRA</strong> utiliza cookies e tecnologias semelhantes para melhorar sua experiência de navegação,
                personalizar conteúdo e anúncios, e analisar nosso tráfego. Em conformidade com a{" "}
                <strong>Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018)</strong>, solicitamos seu consentimento
                para o uso de cookies não essenciais.
              </p>
            </div>
          </div>

          {/* Expandable Details */}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDetails(!showDetails); }}
            className="flex items-center gap-2 text-sm font-bold text-[#001c56] hover:text-[#002a7a] mb-4 transition-colors"
          >
            <Shield className="w-4 h-4" />
            Personalizar preferências
            {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDetails && (
            <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded-xl">
              {/* Necessary - always on */}
              <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div>
                  <p className="text-sm font-bold text-gray-800">Cookies Essenciais</p>
                  <p className="text-xs text-gray-500">Necessários para o funcionamento básico do site. Não podem ser desativados.</p>
                </div>
                <div className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">Sempre ativo</div>
              </div>

              {/* Analytics */}
              <label className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-gray-800">Cookies de Análise</p>
                  <p className="text-xs text-gray-500">Nos ajudam a entender como os visitantes interagem com o site (Google Analytics, etc.).</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences(p => ({ ...p, analytics: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${preferences.analytics ? "bg-[#001c56]" : "bg-gray-300"}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform mt-0.5 ${preferences.analytics ? "translate-x-5.5 ml-[22px]" : "translate-x-0.5 ml-[2px]"}`} />
                  </div>
                </div>
              </label>

              {/* Marketing */}
              <label className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-gray-800">Cookies de Marketing</p>
                  <p className="text-xs text-gray-500">Utilizados para exibir anúncios relevantes e medir a eficácia das campanhas.</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences(p => ({ ...p, marketing: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${preferences.marketing ? "bg-[#001c56]" : "bg-gray-300"}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform mt-0.5 ${preferences.marketing ? "translate-x-5.5 ml-[22px]" : "translate-x-0.5 ml-[2px]"}`} />
                  </div>
                </div>
              </label>

              {/* Personalization */}
              <label className="flex items-center justify-between p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-gray-800">Cookies de Personalização</p>
                  <p className="text-xs text-gray-500">Permitem personalizar o conteúdo e as recomendações com base no seu perfil de leitura.</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={preferences.personalization}
                    onChange={(e) => setPreferences(p => ({ ...p, personalization: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${preferences.personalization ? "bg-[#001c56]" : "bg-gray-300"}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform mt-0.5 ${preferences.personalization ? "translate-x-5.5 ml-[22px]" : "translate-x-0.5 ml-[2px]"}`} />
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleAcceptAll}
              className="flex-1 bg-[#001c56] hover:bg-[#002a7a] text-white font-bold rounded-xl py-3 px-6 text-sm transition-colors cursor-pointer"
            >
              Aceitar Todos
            </button>
            {showDetails ? (
              <button
                type="button"
                onClick={handleSaveCustom}
                className="flex-1 border-2 border-[#001c56] text-[#001c56] font-bold rounded-xl py-3 px-6 text-sm hover:bg-[#001c56] hover:text-white transition-colors cursor-pointer bg-white"
              >
                Salvar Preferências
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRejectOptional}
                className="flex-1 border-2 border-gray-300 text-gray-600 font-bold rounded-xl py-3 px-6 text-sm hover:bg-gray-100 transition-colors cursor-pointer bg-white"
              >
                Rejeitar Opcionais
              </button>
            )}
          </div>

          {/* Legal Link */}
          <p className="text-xs text-gray-400 text-center mt-3">
            Ao continuar navegando, você concorda com nossa{" "}
            <span
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = "/privacidade";
              }}
              className="text-[#001c56] underline hover:text-[#002a7a] cursor-pointer"
            >
              Política de Privacidade
            </span>.
            Você pode alterar suas preferências a qualquer momento.
          </p>
        </div>
      </div>
    </div>
  );
}
