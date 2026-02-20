import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Search, Menu, X, ChevronLeft, ChevronRight, Clock, Share2, Globe, PlayCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ===== CATEGORIES =====
const NAV_ITEMS = [
  { label: "Início", href: "/", category: undefined },
  { label: "Política", href: "/?cat=POLÍTICA", category: "POLÍTICA" },
  { label: "Dia a Dia", href: "/?cat=GERAL", category: "GERAL" },
  { label: "Global", href: "/?cat=GLOBAL", category: "GLOBAL" },
  { label: "Economia", href: "/?cat=ECONOMIA", category: "ECONOMIA" },
  { label: "Esportes", href: "/?cat=ESPORTES", category: "ESPORTES" },
  { label: "Tecnologia", href: "/?cat=TECNOLOGIA", category: "TECNOLOGIA" },
];

// ===== TIME AGO HELPER =====
function timeAgo(date: Date | string) {
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "Agora";
  if (diff < 3600) return `Há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Há ${Math.floor(diff / 3600)}h`;
  return `Há ${Math.floor(diff / 86400)}d`;
}

// ===== WHATSAPP ICON SVG =====
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);

  // Parse URL category
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    setActiveCategory(cat || undefined);
  }, []);

  // Fetch articles
  const { data: articlesData } = trpc.articles.list.useQuery({ category: activeCategory, limit: 30 });
  const { data: tickerData } = trpc.ticker.list.useQuery();
  const { data: globalNewsData } = trpc.globalNews.list.useQuery({ limit: 20 });

  const articles = articlesData || [];
  const tickerItems = tickerData || [];
  const globalNews = globalNewsData || [];

  // Hero articles (isHero or first 5)
  const heroArticles = articles.filter((a: any) => a.isHero).length > 0
    ? articles.filter((a: any) => a.isHero)
    : articles.slice(0, 5);

  // Regular articles (non-hero)
  const regularArticles = articles.filter((a: any) => !a.isHero);

  // Auto-rotate hero
  useEffect(() => {
    if (heroArticles.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroArticles.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroArticles.length]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setLocation(`/busca?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleCategoryClick = (cat: string | undefined) => {
    setActiveCategory(cat);
    setMobileMenuOpen(false);
    if (cat) {
      window.history.pushState({}, "", `/?cat=${cat}`);
    } else {
      window.history.pushState({}, "", "/");
    }
  };

  const isGlobal = activeCategory === "GLOBAL";

  return (
    <div className="min-h-screen bg-white">
      {/* ===== HEADER ===== */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-[1320px] mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-0 shrink-0">
              <span className="bg-[#001c56] text-white px-2.5 py-1 rounded font-black text-2xl tracking-tight">CNN</span>
              <span className="text-[#cc0000] text-3xl font-black mx-0.5">.</span>
              <span className="text-[#001c56] font-black text-2xl tracking-tight">BRA</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.label}
                  onClick={() => handleCategoryClick(item.category)}
                  className={`px-3 py-2 text-sm font-semibold transition-all relative ${
                    activeCategory === item.category
                      ? "text-[#001c56]"
                      : "text-gray-600 hover:text-[#001c56]"
                  }`}
                >
                  {item.label === "Global" && <Globe className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                  {item.label}
                  {activeCategory === item.category && (
                    <motion.div layoutId="navUnderline" className="absolute bottom-0 left-3 right-3 h-[3px] bg-[#001c56] rounded-full" />
                  )}
                </button>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <Link href="/shorts" className="hidden sm:flex items-center gap-1.5 bg-[#001c56] text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-[#002a7a] transition-colors">
                <PlayCircle className="w-4 h-4" />
                Shorts
              </Link>
              <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 text-gray-600 hover:text-[#001c56] transition-colors">
                <Search className="w-5 h-5" />
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2 text-gray-600">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="py-3 flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSearch()}
                    placeholder="Buscar notícias..."
                    className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#001c56]"
                    autoFocus
                  />
                  <button onClick={handleSearch} className="bg-[#001c56] text-white px-6 py-2.5 rounded-lg text-sm font-bold">
                    Buscar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="lg:hidden overflow-hidden bg-white border-t"
            >
              <div className="px-4 py-3 space-y-1">
                {NAV_ITEMS.map(item => (
                  <button
                    key={item.label}
                    onClick={() => handleCategoryClick(item.category)}
                    className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold ${
                      activeCategory === item.category ? "bg-[#001c56] text-white" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
                <Link href="/shorts" className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg">
                  <PlayCircle className="w-4 h-4" /> CNN Shorts
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ===== TICKER ===== */}
      {tickerItems.length > 0 && (
        <div className="bg-[#cc0000] text-white overflow-hidden">
          <div className="flex items-center">
            <span className="bg-[#990000] px-4 py-2 text-xs font-black uppercase shrink-0">Urgente</span>
            <div className="overflow-hidden flex-1">
              <div className="animate-marquee whitespace-nowrap py-2 text-sm font-medium">
                {tickerItems.map((t: any, i: number) => (
                  <span key={t.id}>
                    {t.text}
                    {i < tickerItems.length - 1 && <span className="mx-6 text-white/50">•</span>}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== HERO CAROUSEL ===== */}
      {!isGlobal && heroArticles.length > 0 && (
        <section className="max-w-[1320px] mx-auto px-4 mt-6">
          <div className="relative rounded-xl overflow-hidden aspect-[16/7] bg-gray-900">
            <AnimatePresence mode="wait">
              <motion.div
                key={heroIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                {heroArticles[heroIndex]?.imageUrl ? (
                  <img
                    src={heroArticles[heroIndex].imageUrl}
                    alt={heroArticles[heroIndex].title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#001c56] to-[#003399]" />
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                  <span className="inline-block bg-[#cc0000] text-white text-xs font-black uppercase px-3 py-1 rounded mb-3">
                    {heroArticles[heroIndex]?.category || "DESTAQUE"}
                  </span>
                  <Link href={`/artigo/${heroArticles[heroIndex]?.id}`}>
                    <h1 className="text-white text-2xl md:text-4xl lg:text-5xl font-black leading-tight hover:underline decoration-2 underline-offset-4 cursor-pointer max-w-4xl">
                      {heroArticles[heroIndex]?.title}
                    </h1>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Carousel arrows */}
            {heroArticles.length > 1 && (
              <>
                <button
                  onClick={() => setHeroIndex(prev => (prev - 1 + heroArticles.length) % heroArticles.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setHeroIndex(prev => (prev + 1) % heroArticles.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-2 rounded-full transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                {/* Dots */}
                <div className="absolute bottom-3 right-6 flex gap-1.5">
                  {heroArticles.map((_: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => setHeroIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === heroIndex ? "bg-white w-6" : "bg-white/50"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className="max-w-[1320px] mx-auto px-4 mt-8 pb-16">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: News Feed */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-[#001c56] uppercase tracking-tight mb-1">
              {isGlobal ? "Notícias Globais" : `Últimas Notícias${activeCategory ? ` - ${activeCategory}` : " - Brasil"}`}
            </h2>
            <div className="w-16 h-[3px] bg-[#001c56] mb-6" />

            {/* Global News Feed */}
            {isGlobal ? (
              <div className="space-y-4">
                {globalNews.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-semibold">Nenhuma notícia global disponível</p>
                    <p className="text-sm mt-1">As notícias serão atualizadas pelo painel admin.</p>
                  </div>
                ) : (
                  globalNews.map((news: any) => (
                    <a
                      key={news.id}
                      href={news.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <div className="flex flex-col sm:flex-row">
                        {news.imageUrl && (
                          <div className="sm:w-72 h-48 sm:h-auto shrink-0 overflow-hidden relative">
                            <img src={news.imageUrl} alt={news.rewrittenTitle} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <span className="absolute top-3 left-3 bg-[#cc0000] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                              GLOBAL
                            </span>
                          </div>
                        )}
                        <div className="p-5 flex flex-col justify-between flex-1">
                          <div>
                            <h3 className="text-lg font-black text-gray-900 leading-snug group-hover:text-[#001c56] transition-colors">
                              {news.rewrittenTitle || news.originalTitle}
                            </h3>
                            {news.rewrittenExcerpt && (
                              <p className="text-gray-500 text-sm mt-2 line-clamp-2">{news.rewrittenExcerpt}</p>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(news.fetchedAt)}</span>
                              <span className="text-gray-300">|</span>
                              <span className="font-semibold text-gray-500">Fonte: {news.originalSource}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))
                )}
              </div>
            ) : (
              /* Regular News Feed */
              <div className="space-y-4">
                {regularArticles.length === 0 && heroArticles.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p className="font-semibold">Nenhuma notícia disponível</p>
                    <p className="text-sm mt-1">Adicione notícias pelo painel admin.</p>
                  </div>
                ) : (
                  regularArticles.map((article: any) => (
                    <Link
                      key={article.id}
                      href={`/artigo/${article.id}`}
                      className="group block bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <div className="flex flex-col sm:flex-row">
                        {article.imageUrl && (
                          <div className="sm:w-72 h-48 sm:h-auto shrink-0 overflow-hidden relative">
                            <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <span className="absolute top-3 left-3 bg-[#cc0000] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                              {article.category}
                            </span>
                          </div>
                        )}
                        {!article.imageUrl && (
                          <div className="sm:w-72 h-48 sm:h-auto shrink-0 bg-gradient-to-br from-[#001c56] to-[#003399] flex items-center justify-center relative">
                            <span className="text-white/20 text-6xl font-black">CNN</span>
                            <span className="absolute top-3 left-3 bg-[#cc0000] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                              {article.category}
                            </span>
                          </div>
                        )}
                        <div className="p-5 flex flex-col justify-between flex-1">
                          <div>
                            <h3 className="text-lg font-black text-gray-900 leading-snug group-hover:text-[#001c56] transition-colors">
                              {article.title}
                            </h3>
                            {article.excerpt && (
                              <p className="text-gray-500 text-sm mt-2 line-clamp-2">{article.excerpt}</p>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeAgo(article.publishedAt || article.createdAt)}</span>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const url = `${window.location.origin}/artigo/${article.id}`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(article.title + " " + url)}`, "_blank");
                              }}
                              className="flex items-center gap-1 text-gray-400 hover:text-green-600 transition-colors"
                            >
                              <WhatsAppIcon className="w-4 h-4" /> Enviar
                            </button>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right: Sidebar */}
          <aside className="w-full lg:w-[340px] shrink-0 space-y-6">
            {/* WhatsApp CTA */}
            <WhatsAppCTA />

            {/* Newsletter */}
            <NewsletterWidget />

            {/* Gamification CTA */}
            <Link href="/ranking" className="block bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-5 text-white hover:shadow-lg transition-shadow">
              <h3 className="font-black text-lg">🏆 Ranking de Leitores</h3>
              <p className="text-white/80 text-sm mt-1">Ganhe pontos lendo notícias e suba no ranking!</p>
            </Link>

            {/* UGC CTA */}
            <Link href="/enviar-conteudo" className="block bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-5 text-white hover:shadow-lg transition-shadow">
              <h3 className="font-black text-lg">📱 Envie sua Notícia</h3>
              <p className="text-white/80 text-sm mt-1">Tem uma história? Envie fotos e vídeos para nossa redação.</p>
            </Link>
          </aside>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#001c56] text-white">
        <div className="max-w-[1320px] mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-0 mb-4">
                <span className="bg-white text-[#001c56] px-2 py-0.5 rounded font-black text-xl">CNN</span>
                <span className="text-[#cc0000] text-2xl font-black mx-0.5">.</span>
                <span className="text-white font-black text-xl">BRA</span>
              </div>
              <p className="text-blue-200 text-sm leading-relaxed">
                Seu portal de notícias com informação de qualidade, 24 horas por dia.
              </p>
            </div>
            <div>
              <h4 className="font-black text-sm uppercase mb-3">Editorias</h4>
              <div className="space-y-2 text-sm text-blue-200">
                {["Política", "Economia", "Esportes", "Tecnologia", "Saúde", "Entretenimento"].map(cat => (
                  <button key={cat} onClick={() => handleCategoryClick(cat.toUpperCase())} className="block hover:text-white transition-colors">
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-black text-sm uppercase mb-3">Institucional</h4>
              <div className="space-y-2 text-sm text-blue-200">
                <Link href="/privacidade" className="block hover:text-white transition-colors">Política de Privacidade</Link>
                <Link href="/enviar-conteudo" className="block hover:text-white transition-colors">Envie sua Notícia</Link>
                <Link href="/ranking" className="block hover:text-white transition-colors">Ranking de Leitores</Link>
                <Link href="/admin" className="block hover:text-white transition-colors">Painel Admin</Link>
              </div>
            </div>
            <div>
              <h4 className="font-black text-sm uppercase mb-3">Redes Sociais</h4>
              <div className="space-y-2 text-sm text-blue-200">
                <a href="#" className="block hover:text-white transition-colors">Instagram</a>
                <a href="#" className="block hover:text-white transition-colors">Twitter / X</a>
                <a href="#" className="block hover:text-white transition-colors">YouTube</a>
                <a href="#" className="block hover:text-white transition-colors">TikTok</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-6 text-center text-xs text-blue-300">
            © {new Date().getFullYear()} CNN BRA — Todos os direitos reservados.
          </div>
        </div>
      </footer>

      {/* Marquee CSS */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}

// ===== WHATSAPP CTA WITH ANIMATION =====
function WhatsAppCTA() {
  return (
    <a
      href="https://wa.me/"
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-[#25D366] rounded-xl p-5 text-white hover:shadow-lg hover:shadow-green-200 transition-all overflow-hidden relative"
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <motion.div
            animate={{
              y: [0, -6, 0],
              rotate: [0, -5, 5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <WhatsAppIcon className="w-10 h-10 text-white" />
          </motion.div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">Comunidade VIP</p>
          <h3 className="font-black text-lg leading-tight">Canal no WhatsApp</h3>
          <p className="text-white/80 text-xs mt-0.5">Toque para entrar no grupo oficial.</p>
        </div>
      </div>
    </a>
  );
}

// ===== NEWSLETTER WIDGET =====
function NewsletterWidget() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const subscribe = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setName("");
      setEmail("");
    },
  });

  return (
    <div className="bg-[#001c56] rounded-xl p-6 text-white relative overflow-hidden">
      {/* Decorative circle */}
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-purple-800/50 rounded-full" />

      {submitted ? (
        <div className="text-center py-4 relative z-10">
          <p className="text-2xl mb-2">✉️</p>
          <h3 className="font-black text-lg">Inscrição Confirmada!</h3>
          <p className="text-blue-200 text-sm mt-1">Você receberá as melhores notícias no seu e-mail.</p>
          <button onClick={() => setSubmitted(false)} className="mt-3 text-xs text-blue-300 underline">Inscrever outro e-mail</button>
        </div>
      ) : (
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[#cc0000] text-xl">✉</span>
            <h3 className="font-black text-lg uppercase tracking-tight">Fique Atualizado</h3>
          </div>
          <p className="text-blue-200 text-sm mb-4">
            Fuja dos algoritmos. Receba os alertas mais importantes por E-mail.
          </p>
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Seu Nome"
              className="w-full px-4 py-3 rounded-lg text-gray-800 text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#cc0000]"
            />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Seu E-mail"
              className="w-full px-4 py-3 rounded-lg text-gray-800 text-sm font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#cc0000]"
            />
            <button
              onClick={() => {
                if (name.trim().length >= 2 && email.includes("@")) {
                  subscribe.mutate({ name: name.trim(), email: email.trim() });
                }
              }}
              disabled={subscribe.isPending}
              className="w-full bg-[#cc0000] hover:bg-[#aa0000] text-white font-black py-3 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {subscribe.isPending ? "Inscrevendo..." : "Assinar Grátis"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
