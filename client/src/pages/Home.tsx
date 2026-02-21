import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Search, X, Menu } from "lucide-react";
import { capitalizeTitle } from "@shared/titleUtils";

// ===== CATEGORIES =====
const NAV_ITEMS = [
  { label: "Início", category: "home" },
  { label: "Política", category: "POLÍTICA" },
  { label: "Dia a Dia", category: "GERAL" },
  { label: "Global", category: "GLOBAL" },
  { label: "Esportes", category: "ESPORTES" },
];

const BR_STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

function timeAgo(date: Date | string) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "Agora";
  if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Há ${Math.floor(diff / 3600)}h`;
  return `Há ${Math.floor(diff / 86400)}d`;
}

function shareOnWhatsApp(title: string) {
  const url = window.location.href;
  const text = encodeURIComponent(`*${title}*\n\nLeia agora no portal CNN BRA:\n${url}`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [currentCategory, setCurrentCategory] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroZoomed, setHeroZoomed] = useState(false);
  const [statesOpen, setStatesOpen] = useState(false);
  const [shortsOpen, setShortsOpen] = useState(false);
  const [exitPopupShown, setExitPopupShown] = useState(false);
  const [exitPopupVisible, setExitPopupVisible] = useState(false);
  const [nlName, setNlName] = useState("");
  const [nlEmail, setNlEmail] = useState("");
  const [nlSuccess, setNlSuccess] = useState(false);
  const [exitPhone, setExitPhone] = useState("");

  // Fetch articles
  const { data: articlesData } = trpc.articles.list.useQuery({ status: "online", limit: 20 });
  const articles = articlesData ?? [];

  // Fetch ticker
  const { data: tickerData } = trpc.ticker.list.useQuery();
  const tickerItems = tickerData ?? [];

  // Fetch shorts
  const { data: shortsData } = trpc.shorts.list.useQuery({ limit: 10 });
  const shorts = shortsData ?? [];

  // Fetch trending articles
  const { data: trendingData } = trpc.articles.trending.useQuery({ limit: 10 });
  const trending = trendingData ?? [];

  // Newsletter mutation
  const subscribeMutation = trpc.newsletter.subscribe.useMutation();

  // Filter articles
  const filteredArticles = currentCategory === "home"
    ? articles
    : articles.filter(a => a.category === currentCategory);

  const heroArticles = filteredArticles.filter(a => a.isHero);
  const currentHero = heroArticles.length > 0 ? heroArticles[heroIndex % heroArticles.length] : filteredArticles[0];

  // Hero auto-rotation
  useEffect(() => {
    if (heroArticles.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroArticles.length);
      setHeroZoomed(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [heroArticles.length]);

  useEffect(() => {
    setHeroZoomed(false);
    const timer = setTimeout(() => setHeroZoomed(true), 100);
    return () => clearTimeout(timer);
  }, [heroIndex, currentCategory]);

  // Exit intent
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitPopupShown) {
        setExitPopupVisible(true);
        setExitPopupShown(true);
      }
    };
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [exitPopupShown]);

  const changeCategory = (cat: string) => {
    setCurrentCategory(cat);
    setHeroIndex(0);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await subscribeMutation.mutateAsync({ name: nlName, email: nlEmail });
      setNlSuccess(true);
      setNlName("");
      setNlEmail("");
    } catch {}
  };

  const tickerText = tickerItems.length > 0
    ? tickerItems.map(t => t.text).join(" • ")
    : "Acompanhe as últimas notícias do Brasil e do mundo no CNN BRA • Seu portal de notícias 24 horas";

  return (
    <div className="bg-white text-gray-900 overflow-x-hidden">
      {/* ===== TICKER BAR ===== */}
      <div className="bg-cnn-blue text-white text-xs h-8 flex items-center w-full overflow-hidden sticky top-0 z-[60]">
        <div className="font-bold uppercase px-3 h-full flex items-center bg-cnn-blue z-20 relative border-r border-white/20 shadow-lg whitespace-nowrap text-[11px]">
          <span className="text-red-500 mr-1.5 animate-pulse">●</span> Última Hora
        </div>
        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          <div className="animate-marquee whitespace-nowrap inline-block pl-3 font-medium text-[11px]">
            {tickerText}
          </div>
        </div>
      </div>

      {/* ===== HEADER ===== */}
      <header className="border-b border-gray-200 bg-white z-50 sticky top-8 shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-1.5 text-gray-700 hover:text-red-600 transition-colors">
            <Menu size={22} strokeWidth={2.5} />
          </button>

          {/* LOGO */}
          <div className="flex-1 md:flex-none flex justify-center md:justify-start">
            <button onClick={() => changeCategory("home")} className="flex items-end group transition-transform active:scale-95">
              <div className="bg-[#001c56] text-white px-2.5 py-0.5 rounded-2xl font-black text-2xl tracking-tighter shadow-md">CNN</div>
              <div className="w-2.5 h-2.5 bg-red-600 ml-0.5 mb-1 rounded-sm"></div>
              <span className="text-cnn-blue font-black text-2xl ml-0.5 tracking-tighter uppercase">BRA</span>
            </button>
          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center space-x-6 font-semibold text-[13px] uppercase tracking-wider">
            {NAV_ITEMS.map(item => (
              <button
                key={item.category}
                onClick={() => changeCategory(item.category)}
                className={`py-3 border-b-2 transition-all ${
                  currentCategory === item.category
                    ? "border-[#001c56] text-cnn-blue"
                    : "border-transparent hover:text-cnn-blue"
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="relative" onMouseEnter={() => setStatesOpen(true)} onMouseLeave={() => setStatesOpen(false)}>
              <button className="flex items-center hover:text-cnn-blue py-3">
                <svg className="mr-1" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="7" cy="7" r="5" /><path d="M7 2v10M2 7h10" /></svg>
                Estados
                <svg className="ml-1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m2 3.5 3 3 3-3" /></svg>
              </button>
              {statesOpen && (
                <div className="absolute top-full left-0 w-[380px] bg-white shadow-2xl border p-3 grid grid-cols-5 gap-1.5 rounded-b-xl z-[100] animate-slide-up">
                  {BR_STATES.map(s => (
                    <a key={s} href={`https://${s.toLowerCase()}.cnnbra.com.br`} target="_blank" rel="noopener noreferrer"
                      className="text-center py-1.5 hover:bg-cnn-blue hover:text-white rounded-md text-[11px] font-bold transition-all uppercase">
                      {s}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* HEADER ACTIONS */}
          <div className="flex items-center space-x-3">
            <button onClick={() => setShortsOpen(true)} className="hidden md:flex items-center text-[11px] font-bold bg-black text-white px-4 py-1.5 rounded-full hover:bg-gray-800 shadow-lg transition-transform hover:scale-105 active:scale-95">
              <span className="text-red-500 mr-1.5">▶</span> Shorts
            </button>
            <Link href="/busca">
              <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <Search size={18} strokeWidth={2.5} />
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ===== MOBILE MENU ===== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100]">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-4/5 max-w-sm bg-white h-full flex flex-col shadow-2xl animate-slide-right p-6">
            <div className="flex items-center justify-between mb-8 pb-3 border-b">
              <span className="font-bold text-lg text-cnn-blue tracking-tight uppercase">CNN BRA</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-5 font-bold uppercase text-base flex flex-col items-start text-gray-800 tracking-tight">
              {NAV_ITEMS.map(item => (
                <button key={item.category} onClick={() => changeCategory(item.category)} className="hover:text-red-600 transition-colors">
                  {item.label}
                </button>
              ))}
              <Link href="/admin" className="mt-8 pt-6 border-t w-full text-red-600 text-sm">
                Painel Admin
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className="container mx-auto px-4 py-6">

        {/* ===== HERO BANNER ===== */}
        {currentHero && (
          <section
            className="relative w-full h-[50vh] md:h-[65vh] rounded-2xl overflow-hidden mb-8 shadow-xl group cursor-pointer animate-slide-up"
            onClick={() => setLocation(`/artigo/${currentHero.id}`)}
          >
            <div
              className={`absolute inset-0 bg-cover bg-center hero-zoom ${heroZoomed ? "hero-active-zoom" : ""}`}
              style={{ backgroundImage: `url('${currentHero.imageUrl || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80"}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 text-white pointer-events-none">
              <span className="bg-red-600 px-3 py-1 rounded-md text-[10px] font-bold uppercase mb-4 inline-block tracking-wider shadow-lg">
                {currentHero.category}
              </span>
              <h2 className="text-2xl md:text-5xl font-black leading-[1.05] mb-3 line-clamp-3 tracking-tight drop-shadow-xl">
                {capitalizeTitle(currentHero.title)}
              </h2>
              {currentHero.excerpt && (
                <p className="text-sm text-gray-200 line-clamp-2 max-w-2xl">{currentHero.excerpt}</p>
              )}
            </div>
            {/* Hero dots */}
            {heroArticles.length > 1 && (
              <div className="absolute bottom-4 right-6 flex gap-1.5">
                {heroArticles.map((_, i) => (
                  <button key={i} onClick={(e) => { e.stopPropagation(); setHeroIndex(i); }}
                    className={`w-2 h-2 rounded-full transition-all ${i === heroIndex % heroArticles.length ? "bg-white w-6" : "bg-white/40"}`} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ===== AD BANNER (below hero) — Responsive ===== */}
        <div className="w-full flex justify-center mb-8 px-4">
          <div className="w-full max-w-[728px] aspect-[728/90] bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs font-medium">
            <span className="hidden sm:inline">PUBLICIDADE — 728×90</span>
            <span className="sm:hidden">PUBLICIDADE — BANNER</span>
          </div>
        </div>

        {/* ===== SECTION TITLE ===== */}
        <div className="flex items-center border-b-2 border-cnn-blue pb-3 mb-8">
          <h3 className="text-lg font-bold uppercase tracking-tight text-cnn-blue">
            Últimas Notícias — {currentCategory === "home" ? "Brasil" : currentCategory}
          </h3>
        </div>

        {/* ===== GRID: NEWS + SIDEBAR ===== */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ===== NEWS FEED (LEFT) ===== */}
          <div className="w-full lg:w-2/3">
            {filteredArticles.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <p className="text-base font-semibold">Nenhuma notícia disponível</p>
                <p className="text-xs mt-1">Adicione notícias pelo painel admin.</p>
              </div>
            )}

            {filteredArticles.map((article, index) => (
              <div key={article.id}>
                <article className="flex flex-col md:flex-row gap-5 group mb-8 pb-8 border-b border-gray-100 last:border-0 animate-slide-up hover:bg-gray-50 rounded-xl transition-colors p-3 -mx-3">
                  <div
                    onClick={() => setLocation(`/artigo/${article.id}`)}
                    className="w-full md:w-[280px] aspect-[4/3] overflow-hidden rounded-xl relative cursor-pointer shadow-md flex-shrink-0"
                  >
                    <img
                      src={article.imageUrl || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80"}
                      alt={article.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase shadow-md">
                      {article.category}
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div onClick={() => setLocation(`/artigo/${article.id}`)} className="cursor-pointer">
                      <h4 className="text-lg md:text-xl font-bold leading-snug mb-2 group-hover:text-red-600 transition-colors tracking-tight">
                        {capitalizeTitle(article.title)}
                      </h4>
                      <p className="text-gray-500 line-clamp-2 text-sm leading-relaxed mb-4">
                        {article.excerpt}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                        {article.publishedAt ? timeAgo(article.publishedAt) : "Recente"}
                      </span>
                      <button
                        onClick={() => shareOnWhatsApp(article.title)}
                        className="flex items-center text-gray-400 hover:text-green-600 text-[10px] font-semibold tracking-wider transition-all"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5 mr-1" />
                        Enviar
                      </button>
                    </div>
                  </div>
                </article>

                {/* Intercalated Ad Banner — appears after every 4th article */}
                {(index + 1) % 4 === 0 && index < filteredArticles.length - 1 && (
                  <div className="w-full flex justify-center my-6 px-2">
                    <div className="w-full max-w-full aspect-[728/90] bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs font-medium shadow-sm">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-gray-300 font-bold">Publicidade</span>
                        <span className="hidden sm:inline text-gray-400">ESPAÇO PUBLICITÁRIO — BANNER RESPONSIVO</span>
                        <span className="sm:hidden text-gray-400">PUBLICIDADE</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ===== SIDEBAR (RIGHT) ===== */}
          <aside className="w-full lg:w-1/3 space-y-6">

            {/* WhatsApp CTA */}
            <a href="#" className="block w-full bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-5 shadow-lg group hover:-translate-y-1 transition-all border-b-4 border-green-900">
              <div className="flex items-center text-white">
                <div className="bg-white p-3 rounded-full mr-4 shadow-lg group-hover:rotate-12 transition-transform">
                  <WhatsAppIcon className="w-6 h-6 text-green-600 animate-whatsapp-bounce" />
                </div>
                <div>
                  <span className="bg-green-400 text-green-900 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full mb-1 inline-block">Comunidade VIP</span>
                  <h3 className="font-bold text-lg leading-none">Canal no WhatsApp</h3>
                  <p className="text-[11px] text-green-100 mt-0.5 opacity-80">Toque para entrar no grupo oficial.</p>
                </div>
              </div>
            </a>

            {/* AD 300x250 — Responsive */}
            <div className="w-full flex justify-center">
              <div className="w-full max-w-[300px] aspect-[300/250] bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs font-medium">
                <span>PUBLICIDADE — 300×250</span>
              </div>
            </div>

            {/* TRENDING TOPICS */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-cnn-blue px-5 py-3">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                  Mais Lidas
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {trending.length === 0 && (
                  <div className="p-4 text-center text-gray-400 text-xs">Nenhuma matéria ranqueada ainda.</div>
                )}
                {trending.map((article, i) => (
                  <Link key={article.id} href={`/artigo/${article.id}`}>
                    <div className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                      <span className={`text-2xl font-black leading-none ${i < 3 ? "text-red-600" : "text-gray-300"}`}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
                          {capitalizeTitle(article.title)}
                        </h4>
                        <div className="flex items-center mt-1.5 text-[10px] text-gray-400">
                          <span className="uppercase font-semibold text-red-600 mr-2">{article.category}</span>
                          <span>{article.viewCount?.toLocaleString("pt-BR") || 0} visualizações</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* CNN Shorts Vitrine */}
            <div className="bg-gray-900 rounded-xl p-5 shadow-lg border border-gray-800">
              <div className="flex items-center justify-between mb-5 border-b border-gray-800 pb-3">
                <h3 className="text-white font-bold text-sm flex items-center tracking-tight uppercase">
                  <span className="text-red-500 mr-1.5">▶</span> CNN Shorts
                </h3>
                <button onClick={() => setShortsOpen(true)} className="text-[10px] uppercase font-semibold text-gray-500 hover:text-white transition-colors border border-gray-700 px-2.5 py-1 rounded-full">
                  Ver Tudo
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(shorts.length > 0 ? shorts.slice(0, 4) : [
                  { id: 1, title: "Operação policial na madrugada", thumbnailUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=400&q=80" },
                  { id: 2, title: "Protestos em Paris", thumbnailUrl: "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=400&q=80" },
                ]).map((s: any) => (
                  <div key={s.id} onClick={() => setShortsOpen(true)} className="relative aspect-[9/16] rounded-lg overflow-hidden group cursor-pointer border border-gray-800 shadow-lg">
                    <img src={s.thumbnailUrl || s.videoUrl} alt={s.title} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-all duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-2xl opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all">▶</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter "Fique Atualizado" */}
            <div className="bg-cnn-blue rounded-xl p-6 text-white relative overflow-hidden shadow-lg border border-blue-900">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-28 h-28 bg-red-600 rounded-full opacity-15" />
              <div className="flex items-center mb-1 relative z-10">
                <svg className="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                <h3 className="text-lg font-bold uppercase leading-none tracking-tight">Fique Atualizado</h3>
              </div>
              <p className="text-[11px] text-blue-200 mb-6 relative z-10 opacity-80">
                Fuja dos algoritmos. Receba os alertas mais importantes por E-mail.
              </p>
              {nlSuccess ? (
                <div className="relative z-10 text-center py-4">
                  <p className="text-lg font-bold">✓ Inscrito!</p>
                  <p className="text-blue-200 text-xs mt-1">Você receberá nossas manchetes diárias.</p>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="space-y-3 relative z-10">
                  <input
                    placeholder="Seu Nome"
                    value={nlName}
                    onChange={e => setNlName(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white text-gray-900 text-sm outline-none border-2 border-blue-300 focus:border-red-500 shadow-sm placeholder:text-gray-500 font-medium"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Seu E-mail"
                    value={nlEmail}
                    onChange={e => setNlEmail(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white text-gray-900 text-sm outline-none border-2 border-blue-300 focus:border-red-500 shadow-sm placeholder:text-gray-500 font-medium"
                    required
                  />
                  <button
                    type="submit"
                    disabled={subscribeMutation.isPending}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-lg transition-all uppercase tracking-wider text-xs disabled:opacity-50"
                  >
                    {subscribeMutation.isPending ? "Enviando..." : "Assinar Grátis"}
                  </button>
                </form>
              )}
            </div>

            {/* AD 300x250 (second) */}
            <div className="w-full flex justify-center">
              <div className="w-[300px] h-[250px] bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs font-medium">
                <span>PUBLICIDADE — 300×250</span>
              </div>
            </div>

          </aside>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="bg-black text-white py-16 mt-16 border-t-4 border-cnn-blue">
        <div className="container mx-auto px-4 text-center">
          <button onClick={() => changeCategory("home")} className="mb-8 transition-transform hover:scale-105">
            <div className="bg-cnn-blue text-white px-6 py-2.5 rounded-2xl font-black text-3xl shadow-xl tracking-tighter inline-block">CNN BRA</div>
          </button>
          <div className="flex flex-wrap justify-center gap-8 mb-10 font-semibold uppercase text-[11px] tracking-wider text-gray-500">
            <button onClick={() => changeCategory("POLÍTICA")} className="hover:text-white transition-colors">Política</button>
            <button onClick={() => changeCategory("GERAL")} className="hover:text-white transition-colors">Cotidiano</button>
            <button onClick={() => changeCategory("GLOBAL")} className="hover:text-white transition-colors">Giro Global</button>
            <Link href="/leaderboard" className="hover:text-white transition-colors">Ranking</Link>
            <Link href="/enviar-conteudo" className="hover:text-white transition-colors">Enviar Conteúdo</Link>
          </div>
          <div className="flex justify-center space-x-6 mb-10">
            <a href="#" className="bg-gray-900 p-3 rounded-full hover:bg-blue-600 hover:scale-110 transition-all shadow-lg text-xs font-bold">FB</a>
            <a href="#" className="bg-gray-900 p-3 rounded-full hover:bg-gray-800 hover:scale-110 transition-all shadow-lg border border-gray-800 text-xs font-bold">X</a>
            <a href="#" className="bg-gray-900 p-3 rounded-full hover:bg-pink-600 hover:scale-110 transition-all shadow-lg text-xs font-bold">IG</a>
          </div>
          <Link href="/admin">
            <button className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 hover:text-white bg-gray-950 px-5 py-2.5 rounded-lg border border-gray-900 mb-6 transition-all">
              Painel Administrativo
            </button>
          </Link>
          <div className="flex justify-center gap-4 text-[10px] text-gray-600 mb-4">
            <Link href="/privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link>
            <span>•</span>
            <span>LGPD</span>
          </div>
          <p className="text-[10px] text-gray-700 mt-2">© {new Date().getFullYear()} CNN BRA — Portal de Notícias. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* ===== SHORTS OVERLAY ===== */}
      {shortsOpen && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col animate-slide-up">
          <div className="p-6 flex justify-between items-center text-white bg-gradient-to-b from-black/90 to-transparent absolute top-0 w-full z-20">
            <button onClick={() => setShortsOpen(false)} className="text-2xl font-light">✕</button>
            <span className="font-bold tracking-wider uppercase text-sm">CNN SHORTS</span>
            <div className="w-8" />
          </div>
          <div className="flex-1 overflow-y-scroll snap-y hide-scrollbar">
            {(shorts.length > 0 ? shorts : [
              { id: 1, title: "Operação Lei Seca na orla flagra motoristas", category: "POLÍCIA", thumbnailUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80", likes: 12000 },
              { id: 2, title: "Protestos tomam as ruas de Paris contra nova lei", category: "GLOBAL", thumbnailUrl: "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=800&q=80", likes: 45000 },
            ]).map((s: any) => (
              <div key={s.id} className="w-full h-screen snap-start relative flex items-center justify-center bg-gray-950 border-b border-gray-900">
                <img src={s.thumbnailUrl || s.videoUrl} alt={s.title} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-24 left-6 right-20 text-white z-10 animate-slide-up">
                  <span className="bg-red-600 px-3 py-0.5 rounded text-[10px] font-bold uppercase mb-3 inline-block tracking-wider shadow-lg">
                    {s.category || "CNN SHORTS"}
                  </span>
                  <h2 className="text-2xl md:text-4xl font-bold leading-tight drop-shadow-xl tracking-tight">{s.title}</h2>
                </div>
                <div className="absolute bottom-24 right-6 flex flex-col space-y-6 items-center text-white z-20">
                  <div className="flex flex-col items-center">
                    <div className="p-3 bg-white/10 backdrop-blur-xl rounded-full mb-1 shadow-lg border border-white/20">❤️</div>
                    <span className="text-[10px] font-semibold">{s.likes ? `${Math.round(s.likes / 1000)}K` : "0"}</span>
                  </div>
                  <div onClick={() => shareOnWhatsApp(s.title)} className="flex flex-col items-center cursor-pointer group">
                    <div className="p-3 bg-white/10 backdrop-blur-xl rounded-full mb-1 group-hover:bg-green-600 transition-colors border border-white/20">↗️</div>
                    <span className="text-[10px] font-semibold uppercase">Enviar</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== EXIT INTENT POPUP ===== */}
      {exitPopupVisible && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-slide-up">
            <div className="bg-cnn-blue p-8 text-center text-white relative">
              <div className="absolute -top-8 -left-8 w-24 h-24 bg-red-600 rounded-full opacity-20 blur-xl" />
              <h2 className="text-2xl font-bold uppercase leading-none tracking-tight mb-2">Espere!</h2>
              <p className="text-blue-200 text-xs">
                Receba as manchetes exclusivas no seu WhatsApp.
              </p>
            </div>
            <div className="p-8">
              <form onSubmit={(e) => { e.preventDefault(); setExitPopupVisible(false); }} className="space-y-4">
                <input
                  placeholder="Seu WhatsApp (com DDD)"
                  value={exitPhone}
                  onChange={e => setExitPhone(e.target.value)}
                  className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-red-600 text-sm text-center"
                  required
                />
                <button className="w-full bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg text-sm uppercase tracking-wider hover:bg-red-700 active:scale-95 transition-all">
                  Quero Receber Agora
                </button>
                <button type="button" onClick={() => setExitPopupVisible(false)} className="w-full text-gray-400 text-[11px] uppercase mt-2 hover:text-gray-800 transition-colors tracking-wider">
                  Não, obrigado
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
