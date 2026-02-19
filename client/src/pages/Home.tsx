import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  Menu, Search, X, TrendingUp, Globe,
  Home as HomeIcon, Film, Heart, Share2, ArrowLeft,
  PlayCircle, Clock, ChevronRight, Facebook, Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const XIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
  </svg>
);

const TikTokIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 2.23-1.15 4.38-2.9 5.84-1.74 1.45-4.1 2.1-6.33 1.83-2.22-.27-4.24-1.42-5.59-3.21-1.34-1.78-1.84-4.14-1.37-6.33.47-2.18 1.9-4.04 3.82-5.1 1.93-1.07 4.32-1.35 6.44-.75v4.06c-1.04-.39-2.23-.42-3.3-.08-1.06.33-1.99 1.09-2.52 2.06-.52.97-.66 2.17-.38 3.22.28 1.05 1.01 1.94 1.96 2.45.95.51 2.11.63 3.16.32 1.05-.3 1.96-1.04 2.46-1.99.49-.95.64-2.1.41-3.14-.02-.09-.03-.18-.05-.27V.02z"/>
  </svg>
);

const WhatsAppIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>
);

type Article = {
  id: number;
  title: string;
  excerpt: string | null;
  content: string | null;
  category: string;
  imageUrl: string | null;
  status: string;
  isHero: boolean;
  viewCount: number;
  createdAt: Date;
};

const CATEGORIES = [
  { key: "home", label: "Início" },
  { key: "POLÍTICA", label: "Política" },
  { key: "ESPORTES", label: "Esportes" },
  { key: "ECONOMIA", label: "Economia" },
  { key: "DIA A DIA", label: "Dia a Dia" },
  { key: "GLOBAL", label: "Global", icon: Globe },
];

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80";

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Há ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Há ${diffDays}d`;
}

export default function HomePage() {
  const [currentCategory, setCurrentCategory] = useState("home");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { data: allArticles = [] } = trpc.articles.list.useQuery({ status: "online" });
  const { data: tickerData = [] } = trpc.ticker.list.useQuery();
  const { data: horizontalAds = [] } = trpc.ads.list.useQuery({ placement: "horizontal" });
  const { data: lateralAds = [] } = trpc.ads.list.useQuery({ placement: "lateral" });
  const incrementView = trpc.articles.incrementView.useMutation();

  const heroArticles = useMemo(() => {
    let filtered = allArticles.filter((a: Article) => a.isHero);
    if (currentCategory !== "home") {
      filtered = filtered.filter((a: Article) => a.category === currentCategory);
    }
    return filtered;
  }, [allArticles, currentCategory]);

  const feedArticles = useMemo(() => {
    let filtered = allArticles.filter((a: Article) => !a.isHero);
    if (currentCategory !== "home") {
      filtered = filtered.filter((a: Article) => a.category === currentCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((a: Article) =>
        a.title.toLowerCase().includes(q) || (a.excerpt?.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [allArticles, currentCategory, searchQuery]);

  const tickerText = useMemo(() => {
    if (!tickerData.length) return "Acompanhe as últimas notícias do Brasil e do mundo na CNN BRA";
    return tickerData.map((t: any) => t.text).join(" • ");
  }, [tickerData]);

  useEffect(() => {
    setCurrentSlide(0);
  }, [currentCategory]);

  useEffect(() => {
    if (heroArticles.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroArticles.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroArticles.length]);

  useEffect(() => {
    const titles: Record<string, string> = {
      home: "CNN BRA | O Principal Portal de Notícias do Brasil",
      "POLÍTICA": "Política - Últimas Notícias | CNN BRA",
      "ESPORTES": "Esportes | CNN BRA",
      "ECONOMIA": "Economia | CNN BRA",
      "DIA A DIA": "Cotidiano e Variedades | CNN BRA",
      "GLOBAL": "Giro Internacional | CNN BRA",
    };
    document.title = titles[currentCategory] || "CNN BRA";
  }, [currentCategory]);

  const handleArticleClick = (article: Article) => {
    setSelectedArticle(article);
    incrementView.mutate({ id: article.id });
    window.scrollTo(0, 0);
  };

  const handleShareWhatsApp = (title: string) => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${title} - CNN BRA`);
    window.open(`https://wa.me/?text=${text}%20${url}`, "_blank");
  };

  const handleCategoryChange = (cat: string) => {
    setCurrentCategory(cat);
    setSelectedArticle(null);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-gray-900 pb-16 md:pb-0 relative overflow-x-hidden">
      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[80] animate-fade-in">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-white shadow-2xl animate-slide-up">
            <div className="bg-[#001c56] p-6 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white text-[#001c56] px-2.5 py-0.5 rounded-2xl font-black text-xl">CNN</div>
                <div className="w-2 h-2 bg-red-600 ml-1 rounded-sm" />
                <span className="text-white font-black text-xl ml-1">BRA</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/70 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => { handleCategoryChange(cat.key); setIsMobileMenuOpen(false); }}
                  className={`w-full text-left px-4 py-3 rounded-lg font-bold text-sm uppercase tracking-wide transition-colors ${
                    currentCategory === cat.key ? "bg-[#001c56] text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* TICKER */}
      <div className="bg-[#001c56] text-white text-sm h-10 flex items-center w-full overflow-hidden">
        <div className="font-bold uppercase px-4 h-full flex items-center bg-[#001c56] z-20 relative shadow-[10px_0_15px_-5px_rgba(0,28,86,1)] border-r border-white/20 shrink-0">
          <TrendingUp className="w-4 h-4 mr-2 text-red-500" /> De Última Hora
        </div>
        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          <div className="animate-marquee whitespace-nowrap inline-block pl-4">
            <span>{tickerText}</span>
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header className="border-b border-gray-200 sticky top-0 bg-white z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <button className="md:hidden p-2 -ml-2 text-gray-700 hover:text-[#001c56]" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 md:flex-none flex justify-center md:justify-start">
            <button onClick={() => handleCategoryChange("home")} className="flex items-end group">
              <div className="bg-[#001c56] text-white px-3 py-1 rounded-3xl font-black text-3xl md:text-4xl tracking-tighter transition-transform group-hover:scale-105">CNN</div>
              <div className="w-3 h-3 md:w-4 md:h-4 bg-red-600 ml-1 mb-1.5 md:mb-2 rounded-sm" />
              <span className="text-[#001c56] font-black text-3xl md:text-4xl ml-1 tracking-tighter">BRA</span>
            </button>
          </div>
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 font-bold text-[15px] uppercase tracking-wide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                className={`transition-colors py-4 flex items-center gap-1 ${
                  currentCategory === cat.key ? "text-[#001c56] border-b-2 border-[#001c56]" : "text-gray-600 hover:text-[#001c56]"
                }`}
              >
                {cat.icon && <cat.icon className="w-4 h-4" />}
                {cat.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {isSearchOpen ? (
              <div className="flex items-center gap-2 animate-fade-in">
                <input
                  type="text"
                  placeholder="Buscar notícias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-[#001c56]"
                  autoFocus
                />
                <button onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button onClick={() => setIsSearchOpen(true)} className="p-2 text-gray-600 hover:text-[#001c56]">
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="container mx-auto px-4 mt-8">
        {selectedArticle ? (
          /* ARTICLE DETAIL */
          <article className="max-w-4xl mx-auto animate-fade-in">
            <button onClick={() => setSelectedArticle(null)} className="flex items-center text-[#001c56] font-bold mb-6 hover:underline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar às notícias
            </button>
            <span className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-sm uppercase tracking-wider">
              {selectedArticle.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-black leading-tight mt-4 mb-4 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              {selectedArticle.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 border-b border-gray-200 pb-4">
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {formatTimeAgo(selectedArticle.createdAt)}</span>
              <span>{selectedArticle.viewCount} visualizações</span>
              <button onClick={() => handleShareWhatsApp(selectedArticle.title)} className="flex items-center gap-1 text-green-600 hover:text-green-700 font-bold ml-auto">
                <WhatsAppIcon className="w-4 h-4" /> Compartilhar
              </button>
            </div>
            {selectedArticle.imageUrl && (
              <img src={selectedArticle.imageUrl} alt={selectedArticle.title} className="w-full aspect-video object-cover rounded-2xl mb-8 shadow-lg" />
            )}
            <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
              {selectedArticle.content ? (
                selectedArticle.content.split("\n").map((p, i) => <p key={i} className="mb-4">{p}</p>)
              ) : (
                <p>{selectedArticle.excerpt}</p>
              )}
            </div>
          </article>
        ) : (
          /* MAIN FEED */
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="flex-1">
              {/* HERO SLIDER */}
              {heroArticles.length > 0 && (
                <div className="relative rounded-2xl overflow-hidden mb-10 shadow-2xl group">
                  <div className="aspect-[16/9] md:aspect-[21/9] relative">
                    <img
                      src={heroArticles[currentSlide]?.imageUrl || DEFAULT_IMAGE}
                      alt={heroArticles[currentSlide]?.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                      <span className="bg-red-600 text-white text-[10px] md:text-xs font-black px-2.5 py-1 rounded-sm uppercase tracking-wider">
                        {heroArticles[currentSlide]?.category}
                      </span>
                      <h2
                        className="text-white text-2xl md:text-4xl font-black leading-tight mt-3 cursor-pointer hover:underline decoration-2 underline-offset-4 tracking-tight"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                        onClick={() => handleArticleClick(heroArticles[currentSlide])}
                      >
                        {heroArticles[currentSlide]?.title}
                      </h2>
                      <p className="text-gray-300 mt-2 text-sm md:text-base line-clamp-2">
                        {heroArticles[currentSlide]?.excerpt}
                      </p>
                      <div className="flex items-center gap-3 mt-4">
                        <span className="text-gray-400 text-xs flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatTimeAgo(heroArticles[currentSlide]?.createdAt)}
                        </span>
                      </div>
                    </div>
                    {/* Slide indicators */}
                    {heroArticles.length > 1 && (
                      <div className="absolute bottom-3 right-6 flex gap-1.5">
                        {heroArticles.map((_: any, i: number) => (
                          <button
                            key={i}
                            onClick={() => setCurrentSlide(i)}
                            className={`h-1 rounded-full transition-all ${i === currentSlide ? "w-8 bg-red-600" : "w-3 bg-white/50 hover:bg-white/80"}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* EMPTY STATE */}
              {allArticles.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                  <div className="text-6xl mb-4">📰</div>
                  <h3 className="text-2xl font-black text-gray-800 mb-2">Nenhuma notícia publicada ainda</h3>
                  <p className="text-gray-500">As notícias aparecerão aqui assim que forem publicadas pelo painel administrativo.</p>
                </div>
              )}

              {/* AD BANNER */}
              {horizontalAds.length > 0 && (
                <AdBanner ads={horizontalAds} type="horizontal" />
              )}

              {/* FEED */}
              {feedArticles.length > 0 && (
                <>
                  <div className="flex items-center justify-between border-b-4 border-[#001c56] pb-3 mb-8">
                    <h3 className="text-2xl font-black uppercase tracking-tighter text-[#001c56]">Recentes</h3>
                  </div>
                  <div className="space-y-8">
                    {feedArticles.map((news: Article) => (
                      <article key={news.id} className="flex flex-col md:flex-row gap-5 group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                        <div
                          onClick={() => handleArticleClick(news)}
                          className="w-full md:w-[320px] aspect-[4/3] md:aspect-auto overflow-hidden relative cursor-pointer shrink-0"
                        >
                          <img src={news.imageUrl || DEFAULT_IMAGE} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" alt={news.title} />
                          <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-sm uppercase">{news.category}</div>
                        </div>
                        <div className="flex-1 flex flex-col justify-between p-5">
                          <div onClick={() => handleArticleClick(news)} className="cursor-pointer">
                            <h4 className="text-xl md:text-2xl font-black leading-tight mb-2 group-hover:text-red-600 transition-colors tracking-tight">
                              {news.title}
                            </h4>
                            <p className="text-gray-500 line-clamp-2 text-sm leading-relaxed">{news.excerpt}</p>
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {formatTimeAgo(news.createdAt)}
                            </span>
                            <button onClick={() => handleShareWhatsApp(news.title)} className="flex items-center text-gray-400 hover:text-green-600 font-bold uppercase text-[10px] tracking-widest transition-colors gap-1">
                              <WhatsAppIcon className="w-4 h-4" /> Compartilhar
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* SIDEBAR */}
            <aside className="w-full lg:w-80 space-y-6 shrink-0">
              {/* WhatsApp CTA */}
              <a href="#" className="block w-full bg-green-600 rounded-2xl p-5 shadow-lg group hover:-translate-y-1 transition-transform border-b-4 border-green-800">
                <div className="flex items-center text-white">
                  <div className="bg-white p-3 rounded-full mr-4 shadow-lg">
                    <WhatsAppIcon className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg leading-tight uppercase tracking-tighter">Receba Notícias</h3>
                    <p className="text-xs text-green-100 font-bold uppercase mt-0.5">Canal VIP WhatsApp</p>
                  </div>
                </div>
              </a>

              {/* Lateral Ad */}
              {lateralAds.length > 0 && (
                <AdBanner ads={lateralAds} type="lateral" />
              )}

              {/* Social Links */}
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h3 className="font-black text-sm uppercase tracking-wider text-[#001c56] mb-4 border-b border-gray-100 pb-3">Siga a CNN BRA</h3>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { icon: Facebook, label: "Facebook", color: "hover:bg-blue-600 hover:text-white" },
                    { icon: Instagram, label: "Instagram", color: "hover:bg-pink-600 hover:text-white" },
                    { icon: XIcon, label: "X", color: "hover:bg-black hover:text-white" },
                    { icon: TikTokIcon, label: "TikTok", color: "hover:bg-black hover:text-white" },
                  ].map((social) => (
                    <button key={social.label} className={`flex flex-col items-center gap-1 p-3 rounded-xl bg-gray-50 text-gray-600 transition-all ${social.color}`}>
                      <social.icon className="w-5 h-5" />
                      <span className="text-[9px] font-bold uppercase">{social.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-[#001c56] text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            <button onClick={() => handleCategoryChange("home")} className="flex items-center mb-6">
              <div className="bg-white text-[#001c56] px-3 py-1 rounded-3xl font-black text-2xl">CNN</div>
              <div className="w-2.5 h-2.5 bg-red-600 ml-1 rounded-sm" />
              <span className="text-white font-black text-2xl ml-1">BRA</span>
            </button>
            <div className="flex flex-wrap justify-center gap-6 mb-6 font-bold uppercase text-xs tracking-widest text-blue-200">
              {CATEGORIES.filter(c => c.key !== "home").map((cat) => (
                <button key={cat.key} onClick={() => handleCategoryChange(cat.key)} className="hover:text-white transition-colors">
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="flex gap-4 mb-6">
              <a href="#" className="text-blue-300 hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="text-blue-300 hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="text-blue-300 hover:text-white transition-colors"><XIcon className="w-5 h-5" /></a>
              <a href="#" className="text-blue-300 hover:text-white transition-colors"><TikTokIcon className="w-5 h-5" /></a>
            </div>
            <div className="text-blue-300/60 text-[10px] font-bold uppercase tracking-[0.3em]">
              © {new Date().getFullYear()} CNN BRA. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>

      {/* MOBILE NAV */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center h-16 z-[60] shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <button onClick={() => { handleCategoryChange("home"); }} className="flex flex-col items-center p-2 text-[#001c56]">
          <HomeIcon className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase mt-0.5">Início</span>
        </button>
        <button onClick={() => setIsSearchOpen(true)} className="flex flex-col items-center p-2 text-gray-400 hover:text-[#001c56]">
          <Search className="w-6 h-6" />
          <span className="text-[9px] font-black uppercase mt-0.5">Buscar</span>
        </button>
      </nav>
    </div>
  );
}

/* AD BANNER COMPONENT */
function AdBanner({ ads, type }: { ads: any[]; type: "horizontal" | "lateral" }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeAds = ads.filter((a: any) => a.isActive);

  useEffect(() => {
    if (activeAds.length <= 1) return;
    const currentAd = activeAds[currentIndex];
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAds.length);
    }, currentAd?.duration || 5000);
    return () => clearTimeout(timer);
  }, [activeAds, currentIndex]);

  if (!activeAds.length) return null;
  const currentAd = activeAds[currentIndex];
  const typeClasses = type === "horizontal" ? "w-full h-24 md:h-32 my-6" : "w-full h-[400px] mb-6";

  return (
    <div className={`bg-gray-100 flex items-center justify-center relative overflow-hidden group border border-gray-200 rounded-xl ${typeClasses}`}>
      <span className="text-[10px] uppercase font-bold absolute top-1 right-2 text-gray-400 bg-white/80 px-1 rounded z-10">
        {currentAd.type === "google" ? "Publicidade" : "Patrocinado"}
      </span>
      {currentAd.type === "google" ? (
        <div className="w-full h-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50">
          <span className="font-black text-gray-300 text-lg uppercase tracking-tighter">Google AdSense</span>
          <span className="text-xs text-gray-300">{type === "horizontal" ? "728x90" : "300x600"}</span>
        </div>
      ) : (
        <a href={currentAd.link || "#"} target="_blank" rel="noreferrer" className="w-full h-full block">
          <img src={currentAd.imageUrl} alt={`Anúncio ${currentAd.sponsor}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        </a>
      )}
    </div>
  );
}
