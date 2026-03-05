import { useState, useEffect, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Search, X, Menu, ChevronLeft, ChevronRight } from "lucide-react";
import { capitalizeTitle } from "@shared/titleUtils";
import { AdBanner } from "@/components/AdBanner";
import { trackArticleClick, trackArticleShare, trackSearch, trackWhatsAppClick, trackNewsletterSignup } from "@/hooks/useAnalytics";

// ===== CATEGORIES =====
const NAV_ITEMS = [
  { label: "Início", category: "home" },
  { label: "Política", category: "POLÍTICA" },
  { label: "Dia a Dia", category: "GERAL" },
  { label: "Global", category: "GLOBAL" },
  { label: "Esportes", category: "ESPORTES" },
];

const BR_STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const TOPIC_TAGS = [
  'economia', 'saúde', 'tecnologia', 'política', 'esportes', 'educação',
  'meio-ambiente', 'cultura', 'internacional', 'ciência', 'segurança', 'justiça',
  'transporte', 'energia', 'agronegócio', 'turismo', 'entretenimento'
];

function timeAgo(date: Date | string) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "Agora";
  if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Há ${Math.floor(diff / 3600)}h`;
  return `Há ${Math.floor(diff / 86400)}d`;
}

function shareOnWhatsApp(title: string, articleId?: number) {
  const url = window.location.href;
  const text = encodeURIComponent(`*${title}*\n\nLeia agora no portal CNN BRA:\n${url}`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  if (articleId) trackArticleShare(articleId, title, 'whatsapp');
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
  const [tagsOpen, setTagsOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [shortsOpen, setShortsOpen] = useState(false);
  const EXIT_POPUP_KEY = "cnnbra_exit_popup_shown";
  const [exitPopupShown, setExitPopupShown] = useState(() => {
    try { return localStorage.getItem(EXIT_POPUP_KEY) === "1"; } catch { return false; }
  });
  const [exitPopupVisible, setExitPopupVisible] = useState(false);
  const [nlName, setNlName] = useState("");
  const [nlEmail, setNlEmail] = useState("");
  const [nlSuccess, setNlSuccess] = useState(false);
  const [exitPhone, setExitPhone] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [heroPaused, setHeroPaused] = useState(false);
  const heroTouchStartX = useRef<number | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("cnnbra_recent_searches") || "[]"); } catch { return []; }
  });

  // Fetch articles
  const { data: articlesData } = trpc.articles.list.useQuery({ status: "online", limit: 20 });
  const articles = articlesData ?? [];

  // Fetch hero articles (admin-selected for the carousel)
  // Uses a dedicated query so hero articles are always loaded regardless of the main list limit.
  const { data: heroArticlesData } = trpc.articles.list.useQuery({ status: "online", isHero: true });

  // Fetch ticker
  const { data: tickerData } = trpc.ticker.list.useQuery();
  const tickerItems = tickerData ?? [];

  // Fetch shorts
  const { data: shortsData } = trpc.shorts.list.useQuery({ limit: 10 });
  const shorts = shortsData ?? [];

  // Fetch trending articles (by view count)
  const { data: trendingData } = trpc.articles.trending.useQuery({ limit: 10 });
  const trending = trendingData ?? [];

  // Fetch Google Trends BR topics
  const { data: googleTrendsData } = trpc.trends.getTopics.useQuery({ limit: 10 });  
  const googleTrends = googleTrendsData ?? [];

  // Newsletter mutation
  const subscribeMutation = trpc.newsletter.subscribe.useMutation();

  // Inline search query (debounced via useMemo)
  const debouncedSearch = useMemo(() => searchQuery.trim(), [searchQuery]);
  const { data: searchResults = [] } = trpc.articles.list.useQuery(
    { status: "online", search: debouncedSearch, limit: 9 },
    { enabled: debouncedSearch.length >= 2 }
  );

  // Mobile search query
  const debouncedMobileSearch = useMemo(() => mobileSearchQuery.trim(), [mobileSearchQuery]);
  const { data: mobileSearchResults = [] } = trpc.articles.list.useQuery(
    { status: "online", search: debouncedMobileSearch, limit: 12 },
    { enabled: debouncedMobileSearch.length >= 2 }
  );

  // Save search to history
  const saveSearch = (q: string) => {
    if (!q.trim()) return;
    const updated = [q.trim(), ...recentSearches.filter(s => s !== q.trim())].slice(0, 5);
    setRecentSearches(updated);
    try { localStorage.setItem("cnnbra_recent_searches", JSON.stringify(updated)); } catch {}
  };

  const openMobileSearch = () => {
    setMobileSearchOpen(true);
    setMobileMenuOpen(false);
    // Prevent body scroll when overlay is open
    document.body.style.overflow = "hidden";
  };

  const closeMobileSearch = () => {
    setMobileSearchOpen(false);
    setMobileSearchQuery("");
    document.body.style.overflow = "";
  };

  // Filter articles by category and tag
  let filteredArticles = currentCategory === "home"
    ? articles
    : articles.filter(a => a.category === currentCategory);
  
  // Apply tag filter if selected
  if (selectedTag) {
    filteredArticles = filteredArticles.filter(a => 
      a.tags?.toLowerCase().includes(selectedTag.toLowerCase())
    );
  }

  // Use admin-selected hero articles for the carousel.
  // When a category filter is active, also filter heroes by that category.
  // Fallback: if no hero articles are configured, use the most recent articles.
  const allHeroArticles = heroArticlesData ?? [];
  const heroArticles = currentCategory === "home"
    ? allHeroArticles
    : allHeroArticles.filter((a: any) => a.category === currentCategory);
  const carouselArticles = heroArticles.length > 0 ? heroArticles : filteredArticles.slice(0, 5);
  const currentHero = carouselArticles.length > 0 ? carouselArticles[heroIndex % carouselArticles.length] : filteredArticles[0];

  // Hero auto-rotation (pauses when heroPaused is true)
  useEffect(() => {
    if (carouselArticles.length <= 1 || heroPaused) return;
    const interval = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % carouselArticles.length);
      setHeroZoomed(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [carouselArticles.length, heroPaused]);

  // Hero navigation helpers
  const goPrevHero = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHeroIndex(prev => (prev - 1 + carouselArticles.length) % carouselArticles.length);
    setHeroZoomed(false);
  };
  const goNextHero = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHeroIndex(prev => (prev + 1) % carouselArticles.length);
    setHeroZoomed(false);
  };
  const handleHeroTouchStart = (e: React.TouchEvent) => {
    heroTouchStartX.current = e.touches[0].clientX;
  };
  const handleHeroTouchEnd = (e: React.TouchEvent) => {
    if (heroTouchStartX.current === null) return;
    const diff = heroTouchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setHeroIndex(prev => (prev + 1) % carouselArticles.length);
      else setHeroIndex(prev => (prev - 1 + carouselArticles.length) % carouselArticles.length);
      setHeroZoomed(false);
    }
    heroTouchStartX.current = null;
  };

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
        try { localStorage.setItem(EXIT_POPUP_KEY, "1"); } catch {}
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
      trackNewsletterSignup();
    } catch {}
  };

  const tickerText = tickerItems.length > 0
    ? tickerItems.map(t => t.text).join(" • ")
    : "Acompanhe as últimas notícias do Brasil e do mundo no CNN BRA • Seu portal de notícias 24 horas";

  return (
    <div className="bg-white text-gray-900 overflow-x-hidden">
      {/* ===== HEADER ===== */}
      <header className="border-b border-gray-200 bg-white z-50 sticky top-0 shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          {/* Mobile: hamburger + search */}
          <div className="flex items-center gap-1 md:hidden">
            <button onClick={() => setMobileMenuOpen(true)} className="p-1.5 text-gray-700 hover:text-red-600 transition-colors">
              <Menu size={22} strokeWidth={2.5} />
            </button>
            <button
              onClick={openMobileSearch}
              className="p-1.5 text-gray-700 hover:text-[#001c56] transition-colors"
              aria-label="Buscar"
            >
              <Search size={20} strokeWidth={2.5} />
            </button>
          </div>

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
            <div className="relative" onMouseEnter={() => setTagsOpen(true)} onMouseLeave={() => setTagsOpen(false)}>
              <button className="flex items-center hover:text-cnn-blue py-3">
                <svg className="mr-1" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 2h10v10H2z"/><path d="M2 6h10M6 2v10"/></svg>
                Tópicos
                <svg className="ml-1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m2 3.5 3 3 3-3" /></svg>
              </button>
              {tagsOpen && (
                <div className="absolute top-full left-0 w-[280px] bg-white shadow-2xl border p-3 grid grid-cols-2 gap-1.5 rounded-b-xl z-[100] animate-slide-up">
                  {TOPIC_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => { setSelectedTag(tag); setTagsOpen(false); }}
                      className={`text-left py-1.5 px-2 rounded-md text-[11px] font-bold transition-all capitalize ${
                        selectedTag === tag ? "bg-cnn-blue text-white" : "hover:bg-gray-100"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                  {selectedTag && (
                    <button
                      onClick={() => { setSelectedTag(null); setTagsOpen(false); }}
                      className="col-span-2 text-center py-1.5 px-2 rounded-md text-[11px] font-bold bg-red-600 text-white hover:bg-red-700"
                    >
                      Limpar Filtro
                    </button>
                  )}
                </div>
              )}
            </div>
          </nav>

          {/* HEADER ACTIONS */}
          <div className="flex items-center space-x-3">
            <button onClick={() => setShortsOpen(true)} className="hidden md:flex items-center text-[11px] font-bold bg-black text-white px-4 py-1.5 rounded-full hover:bg-gray-800 shadow-lg transition-transform hover:scale-105 active:scale-95">
              <span className="text-red-500 mr-1.5">▶</span> Shorts
            </button>
            {/* Inline Search */}
            <div className="relative">
              {searchOpen ? (
                <div className="flex items-center gap-1">
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === "Escape") { setSearchOpen(false); setSearchQuery(""); } }}
                    placeholder="Buscar notícias..."
                    className="border border-gray-300 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:border-[#001c56] w-48 md:w-64"
                  />
                  <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="p-1.5 text-gray-400 hover:text-gray-700">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setSearchOpen(true)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                  <Search size={18} strokeWidth={2.5} />
                </button>
              )}
              {/* Search Results Dropdown */}
              {searchOpen && debouncedSearch.length >= 2 && searchResults.length > 0 && (
                <div className="absolute right-0 top-full mt-2 w-[380px] bg-white shadow-2xl border rounded-2xl z-[200] overflow-hidden">
                  <div className="p-3 border-b bg-gray-50">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{searchResults.length} resultado(s) para "{debouncedSearch}"</p>
                  </div>
                  <div className="max-h-[480px] overflow-y-auto divide-y">
                    {searchResults.map((a: any) => (
                      <button
                        key={a.id}
                        onClick={() => { setLocation(`/artigo/${a.id}`); setSearchOpen(false); setSearchQuery(""); trackSearch(debouncedSearch); }}
                        className="w-full text-left flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors"
                      >
                        {a.imageUrl ? (
                          <img src={a.imageUrl} alt="" className="w-14 h-10 object-cover rounded-lg shrink-0" />
                        ) : (
                          <div className="w-14 h-10 bg-gradient-to-br from-[#001c56] to-[#003080] rounded-lg shrink-0 flex items-center justify-center">
                            <span className="text-white text-[8px] font-black">CNN</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-gray-800 line-clamp-2 leading-tight">{capitalizeTitle(a.title)}</p>
                          <p className="text-[10px] text-red-600 font-bold mt-0.5">{a.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="p-2 border-t bg-gray-50">
                    <Link href={`/busca?q=${encodeURIComponent(debouncedSearch)}`}>
                      <button onClick={() => { setSearchOpen(false); trackSearch(debouncedSearch); }} className="w-full text-center text-xs font-bold text-[#001c56] hover:underline py-1">
                        Ver todos os resultados para "{debouncedSearch}" →
                      </button>
                    </Link>
                  </div>
                </div>
              )}
              {searchOpen && debouncedSearch.length >= 2 && searchResults.length === 0 && (
                <div className="absolute right-0 top-full mt-2 w-[320px] bg-white shadow-2xl border rounded-2xl z-[200] p-6 text-center">
                  <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 font-semibold">Nenhum resultado encontrado</p>
                  <p className="text-xs text-gray-400 mt-1">Tente outros termos de busca</p>
                </div>
              )}
            </div>
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
              <button 
                onClick={() => { setShortsOpen(true); setMobileMenuOpen(false); }} 
                className="flex items-center bg-black text-white px-4 py-2 rounded-full hover:bg-gray-800 transition-all mt-4"
              >
                <span className="text-red-500 mr-2">▶</span> CNN Shorts
              </button>
              <button
                onClick={openMobileSearch}
                className="flex items-center gap-2 bg-gray-100 text-gray-800 px-4 py-2 rounded-full hover:bg-gray-200 transition-all"
              >
                <Search size={16} strokeWidth={2.5} />
                Buscar Notícias
              </button>
              <Link href="/admin" className="mt-8 pt-6 border-t w-full text-red-600 text-sm">
                Painel Admin
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className="container mx-auto px-4 py-6">

        {/* ===== HERO SECTION: 2/3 Banner + 1/3 Sidebar ===== */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Hero Banner (2/3 width on desktop) */}
          {currentHero && (
            <section
              className="relative w-full lg:w-2/3 h-[50vh] md:h-[65vh] rounded-2xl overflow-hidden shadow-xl group cursor-pointer animate-slide-up"
              onClick={() => { setLocation(`/artigo/${currentHero.id}`); trackArticleClick(currentHero.id, currentHero.title, currentHero.category); }}
              onMouseEnter={() => setHeroPaused(true)}
              onMouseLeave={() => setHeroPaused(false)}
              onTouchStart={handleHeroTouchStart}
              onTouchEnd={handleHeroTouchEnd}
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
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-black leading-[1.05] mb-3 line-clamp-3 tracking-tight drop-shadow-xl">
                  {capitalizeTitle(currentHero.title)}
                </h2>
                {currentHero.excerpt && (
                  <p className="text-sm text-gray-200 line-clamp-2 max-w-2xl">{currentHero.excerpt}</p>
                )}
              </div>

              {/* Navigation arrows — visible on hover */}
              {carouselArticles.length > 1 && (
                <>
                  <button
                    onClick={goPrevHero}
                    aria-label="Notícia anterior"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm shadow-lg"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={goNextHero}
                    aria-label="Próxima notícia"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/80 text-white rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm shadow-lg"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Hero dots + progress bar */}
              {carouselArticles.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 px-6">
                  {carouselArticles.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setHeroIndex(i); setHeroZoomed(false); }}
                      aria-label={`Ir para notícia ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === heroIndex % carouselArticles.length
                          ? "bg-white w-8"
                          : "bg-white/40 hover:bg-white/70 w-2"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Slide counter badge */}
              {carouselArticles.length > 1 && (
                <div className="absolute top-4 right-4 bg-black/50 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                  {(heroIndex % carouselArticles.length) + 1} / {carouselArticles.length}
                </div>
              )}
            </section>
          )}

          {/* Sidebar: Recent/Trending Posts (1/3 width on desktop) */}
          <aside className="w-full lg:w-1/3 flex flex-col gap-4">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                📌 Mais Relevantes
              </h3>
              <div className="space-y-4">
                {trending.slice(0, 5).map((article) => (
                  <Link
                    key={article.id}
                    href={`/artigo/${article.id}`}
                    className="block group hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                  >
                    <div className="flex gap-3">
                      {article.imageUrl && (
                        <img
                          src={article.imageUrl}
                          alt={article.title}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
                          {capitalizeTitle(article.title)}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {timeAgo(article.publishedAt || article.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
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
                    onClick={() => { setLocation(`/artigo/${article.id}`); trackArticleClick(article.id, article.title, article.category); }}
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
                    <div onClick={() => { setLocation(`/artigo/${article.id}`); trackArticleClick(article.id, article.title, article.category); }} className="cursor-pointer">
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
                        onClick={() => shareOnWhatsApp(article.title, article.id)}
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
                    <AdBanner placement="middle" fallbackIndex={0} className="w-full max-w-[728px]" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ===== SIDEBAR (RIGHT) ===== */}
          <aside className="w-full lg:w-1/3 space-y-6">

            {/* WhatsApp CTA */}
            <a href="https://chat.whatsapp.com/JkINsZPG80d7YZewPeiGQp" target="_blank" rel="noopener noreferrer" className="block w-full bg-gradient-to-br from-green-500 to-green-700 rounded-xl p-5 shadow-lg group hover:-translate-y-1 transition-all border-b-4 border-green-900">
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

            {/* AD 300x250 — Dynamic from DB */}
            <div className="w-full flex justify-center">
              <AdBanner placement="lateral" fallbackIndex={0} className="w-full max-w-[300px]" />
            </div>

            {/* TRENDING TOPICS — Google Trends BR + Mais Lidas */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {/* Header with tabs */}
              <div className="bg-cnn-blue px-5 py-3 flex items-center justify-between">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                  Em Alta Agora
                </h3>
                <span className="text-[9px] text-blue-200 font-semibold uppercase tracking-wider flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Trends BR
                </span>
              </div>

              {/* Google Trends list */}
              {googleTrends.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {googleTrends.map((trend: any, i: number) => (
                    <div key={trend.id} className="group">
                      {trend.linkedArticleId ? (
                        <Link href={`/artigo/${trend.linkedArticleId}`}>
                          <div className="flex items-start gap-3 p-3.5 hover:bg-gray-50 transition-colors cursor-pointer">
                            {/* Rank */}
                            <span className={`text-xl font-black leading-none mt-0.5 min-w-[28px] text-center ${
                              i < 3 ? "text-red-600" : "text-gray-300"
                            }`}>{String(i + 1).padStart(2, "0")}</span>
                            {/* Thumbnail */}
                            {trend.imageUrl && (
                              <img
                                src={trend.imageUrl}
                                alt={trend.topic}
                                className="w-12 h-12 rounded-md object-cover flex-shrink-0 border border-gray-100"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            )}
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-red-600 transition-colors capitalize">
                                {trend.topic}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                {trend.approxTraffic && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                                    {trend.approxTraffic} buscas
                                  </span>
                                )}
                                {trend.relatedArticleSource && (
                                  <span className="text-[10px] text-gray-400 truncate">{trend.relatedArticleSource}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <a
                          href={trend.relatedArticleUrl || `https://www.google.com/search?q=${encodeURIComponent(trend.topic)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <div className="flex items-start gap-3 p-3.5 hover:bg-gray-50 transition-colors cursor-pointer">
                            <span className={`text-xl font-black leading-none mt-0.5 min-w-[28px] text-center ${
                              i < 3 ? "text-red-600" : "text-gray-300"
                            }`}>{String(i + 1).padStart(2, "0")}</span>
                            {trend.imageUrl && (
                              <img
                                src={trend.imageUrl}
                                alt={trend.topic}
                                className="w-12 h-12 rounded-md object-cover flex-shrink-0 border border-gray-100"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-red-600 transition-colors capitalize">
                                {trend.topic}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                {trend.approxTraffic && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                                    {trend.approxTraffic} buscas
                                  </span>
                                )}
                                {trend.relatedArticleSource && (
                                  <span className="text-[10px] text-gray-400 truncate">{trend.relatedArticleSource}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* Fallback: most-read articles while trends load */
                <div className="divide-y divide-gray-100">
                  {trending.length === 0 && (
                    <div className="p-4 text-center text-gray-400 text-xs">Carregando tendências...</div>
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
                            <span>{(article.viewCount || 0).toLocaleString("pt-BR")} visualizações</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Footer with update time */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-gray-400">Atualizado a cada 2 horas</span>
                <a
                  href="https://trends.google.com/trending?geo=BR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-500 hover:text-blue-700 font-medium"
                >
                  Ver no Google →
                </a>
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

            {/* AD 300x250 (second) — Dynamic from DB */}
            <div className="w-full flex justify-center">
              <AdBanner placement="lateral" fallbackIndex={1} className="w-full max-w-[300px]" />
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

      {/* ===== MOBILE SEARCH OVERLAY (FULLSCREEN) ===== */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-[300] flex flex-col bg-white animate-search-slide-down">
          {/* Header da busca */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white shadow-sm">
            <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2.5">
              <Search size={18} className="text-gray-400 shrink-0" strokeWidth={2.5} />
              <input
                autoFocus
                type="search"
                inputMode="search"
                enterKeyHint="search"
                value={mobileSearchQuery}
                onChange={e => setMobileSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && mobileSearchQuery.trim()) {
                    saveSearch(mobileSearchQuery);
                    trackSearch(mobileSearchQuery);
                  }
                  if (e.key === "Escape") closeMobileSearch();
                }}
                placeholder="Buscar notícias, temas..."
                className="flex-1 bg-transparent text-base text-gray-800 placeholder-gray-400 outline-none"
              />
              {mobileSearchQuery && (
                <button onClick={() => setMobileSearchQuery("")} className="text-gray-400 hover:text-gray-700 p-0.5">
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={closeMobileSearch}
              className="shrink-0 px-3 py-2 text-sm font-semibold text-[#001c56] hover:text-red-600 transition-colors"
            >
              Cancelar
            </button>
          </div>

          {/* Conteúdo da busca */}
          <div className="flex-1 overflow-y-auto">
            {/* Estado: sem query — mostrar histórico + categorias */}
            {debouncedMobileSearch.length < 2 && (
              <div className="p-4">
                {/* Buscas recentes */}
                {recentSearches.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Buscas Recentes</h3>
                      <button
                        onClick={() => { setRecentSearches([]); localStorage.removeItem("cnnbra_recent_searches"); }}
                        className="text-xs text-red-500 font-semibold hover:text-red-700"
                      >
                        Limpar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => setMobileSearchQuery(s)}
                          className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-full transition-colors"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-400">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                          </svg>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categorias populares */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Explorar Categorias</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Política", cat: "POLÍTICA", emoji: "🏛️", color: "bg-blue-50 text-blue-800 border-blue-200" },
                      { label: "Esportes", cat: "ESPORTES", emoji: "⚽", color: "bg-green-50 text-green-800 border-green-200" },
                      { label: "Global", cat: "GLOBAL", emoji: "🌍", color: "bg-purple-50 text-purple-800 border-purple-200" },
                      { label: "Dia a Dia", cat: "GERAL", emoji: "📰", color: "bg-orange-50 text-orange-800 border-orange-200" },
                      { label: "Economia", cat: "economia", emoji: "💰", color: "bg-yellow-50 text-yellow-800 border-yellow-200" },
                      { label: "Saúde", cat: "saúde", emoji: "❤️", color: "bg-red-50 text-red-800 border-red-200" },
                      { label: "Tecnologia", cat: "tecnologia", emoji: "📱", color: "bg-gray-50 text-gray-800 border-gray-200" },
                      { label: "Educação", cat: "educação", emoji: "🎓", color: "bg-indigo-50 text-indigo-800 border-indigo-200" },
                    ].map(({ label, cat, emoji, color }) => (
                      <button
                        key={cat}
                        onClick={() => setMobileSearchQuery(label)}
                        className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all active:scale-95 ${color}`}
                      >
                        <span className="text-base">{emoji}</span>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trending topics */}
                <div className="mt-6">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Em Alta Agora</h3>
                  <div className="flex flex-wrap gap-2">
                    {trending.slice(0, 6).map((a: any) => (
                      <button
                        key={a.id}
                        onClick={() => setMobileSearchQuery(capitalizeTitle(a.title).split(" ").slice(0, 3).join(" "))}
                        className="text-xs bg-[#001c56]/5 text-[#001c56] font-semibold px-3 py-1.5 rounded-full border border-[#001c56]/10 hover:bg-[#001c56]/10 transition-colors"
                      >
                        # {capitalizeTitle(a.title).split(" ").slice(0, 3).join(" ")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Estado: digitando mas menos de 2 chars */}
            {mobileSearchQuery.length === 1 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Search size={40} strokeWidth={1.5} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">Continue digitando para buscar...</p>
              </div>
            )}

            {/* Estado: resultados encontrados */}
            {debouncedMobileSearch.length >= 2 && mobileSearchResults.length > 0 && (
              <div>
                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-500">
                    {mobileSearchResults.length} resultado{mobileSearchResults.length !== 1 ? "s" : ""} para &ldquo;<span className="text-[#001c56]">{debouncedMobileSearch}</span>&rdquo;
                  </p>
                </div>
                <div className="divide-y divide-gray-100">
                  {mobileSearchResults.map((a: any, idx: number) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        saveSearch(debouncedMobileSearch);
                        trackSearch(debouncedMobileSearch);
                        trackArticleClick(a.id, a.title, a.category);
                        closeMobileSearch();
                        setLocation(`/artigo/${a.id}`);
                      }}
                      className="w-full text-left flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors animate-result-fade-in"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      {/* Thumbnail */}
                      {a.imageUrl ? (
                        <img
                          src={a.imageUrl}
                          alt=""
                          className="w-16 h-12 object-cover rounded-xl shrink-0 shadow-sm"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-16 h-12 bg-gradient-to-br from-[#001c56] to-[#003080] rounded-xl shrink-0 flex items-center justify-center shadow-sm">
                          <span className="text-white text-[9px] font-black">CNN</span>
                        </div>
                      )}
                      {/* Texto */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">
                          {capitalizeTitle(a.title)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">{a.category}</span>
                          <span className="text-[10px] text-gray-400">•</span>
                          <span className="text-[10px] text-gray-400">{timeAgo(a.createdAt)}</span>
                        </div>
                      </div>
                      {/* Seta */}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-300 shrink-0">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  ))}
                </div>
                {/* Ver todos */}
                <div className="p-4 border-t border-gray-100">
                  <Link href={`/busca?q=${encodeURIComponent(debouncedMobileSearch)}`}>
                    <button
                      onClick={() => { saveSearch(debouncedMobileSearch); closeMobileSearch(); }}
                      className="w-full py-3 bg-[#001c56] text-white font-bold text-sm rounded-xl shadow-md active:scale-95 transition-all"
                    >
                      Ver todos os resultados →
                    </button>
                  </Link>
                </div>
              </div>
            )}

            {/* Estado: sem resultados */}
            {debouncedMobileSearch.length >= 2 && mobileSearchResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search size={28} strokeWidth={1.5} className="text-gray-300" />
                </div>
                <h3 className="text-base font-bold text-gray-700 mb-1">Nenhum resultado encontrado</h3>
                <p className="text-sm text-gray-400 mb-6">Tente outros termos ou explore as categorias abaixo</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {["Política", "Esportes", "Global", "Economia"].map(s => (
                    <button
                      key={s}
                      onClick={() => setMobileSearchQuery(s)}
                      className="px-4 py-2 bg-[#001c56]/5 text-[#001c56] text-sm font-semibold rounded-full border border-[#001c56]/10 hover:bg-[#001c56]/10 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
