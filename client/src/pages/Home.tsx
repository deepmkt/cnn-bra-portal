import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Search, X, Menu } from "lucide-react";

// ===== CATEGORIES =====
const NAV_ITEMS = [
  { label: "Início", category: "home" },
  { label: "Política", category: "POLÍTICA" },
  { label: "Dia a Dia", category: "GERAL" },
  { label: "Global", category: "GLOBAL" },
  { label: "Esportes", category: "ESPORTES" },
];

const BR_STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

// ===== TIME AGO =====
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

// ===== WHATSAPP ICON =====
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
  const { data: articlesData } = trpc.articles.list.useQuery({
    status: "published",
    limit: 20,
  });
  const articles = articlesData ?? [];

  // Fetch ticker items
  const { data: tickerData } = trpc.ticker.list.useQuery();
  const tickerItems = tickerData ?? [];

  // Fetch shorts
  const { data: shortsData } = trpc.shorts.list.useQuery({ limit: 10 });
  const shorts = shortsData ?? [];

  // Newsletter mutation
  const subscribeMutation = trpc.newsletter.subscribe.useMutation();

  // Filter articles by category
  const filteredArticles = currentCategory === "home"
    ? articles
    : articles.filter(a => a.category === currentCategory);

  const heroArticles = filteredArticles.filter(a => a.isHero);
  const currentHero = heroArticles.length > 0 ? heroArticles[heroIndex % heroArticles.length] : filteredArticles[0];

  // Hero auto-rotation every 10s
  useEffect(() => {
    if (heroArticles.length <= 1) return;
    const interval = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroArticles.length);
      setHeroZoomed(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [heroArticles.length]);

  // Trigger zoom after hero render
  useEffect(() => {
    setHeroZoomed(false);
    const timer = setTimeout(() => setHeroZoomed(true), 100);
    return () => clearTimeout(timer);
  }, [heroIndex, currentCategory]);

  // Exit intent popup
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
      <div className="bg-cnn-blue text-white text-sm h-10 flex items-center w-full overflow-hidden sticky top-0 z-[60]">
        <div className="font-bold uppercase px-4 h-full flex items-center bg-cnn-blue z-20 relative border-r border-white/20 shadow-xl whitespace-nowrap">
          <span className="text-red-500 mr-2 animate-pulse">●</span> De Última Hora
        </div>
        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          <div className="animate-marquee whitespace-nowrap inline-block pl-4 font-medium">
            {tickerText}
          </div>
        </div>
      </div>

      {/* ===== HEADER ===== */}
      <header className="border-b border-gray-200 bg-white z-50 sticky top-10 shadow-sm">
        <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          {/* Mobile menu button */}
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 text-gray-700 hover:text-red-600 transition-colors">
            <Menu size={24} strokeWidth={2.5} />
          </button>

          {/* LOGO */}
          <div className="flex-1 md:flex-none flex justify-center md:justify-start">
            <button onClick={() => changeCategory("home")} className="flex items-end group transition-transform active:scale-95">
              <div className="bg-[#001c56] text-white px-3 py-1 rounded-3xl font-black text-3xl md:text-4xl tracking-tighter shadow-md">CNN</div>
              <div className="w-3 h-3 md:w-4 md:h-4 bg-red-600 ml-1 mb-1.5 md:mb-2 rounded-sm"></div>
              <span className="text-cnn-blue font-black text-3xl md:text-4xl ml-1 tracking-tighter uppercase">BRA</span>
            </button>
          </div>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center space-x-8 font-bold text-[14px] uppercase tracking-widest">
            {NAV_ITEMS.map(item => (
              <button
                key={item.category}
                onClick={() => changeCategory(item.category)}
                className={`nav-btn py-4 border-b-2 transition-all ${
                  currentCategory === item.category
                    ? "border-[#001c56] text-cnn-blue"
                    : "border-transparent hover:text-cnn-blue"
                }`}
              >
                {item.label}
              </button>
            ))}
            {/* Estados dropdown */}
            <div className="relative" onMouseEnter={() => setStatesOpen(true)} onMouseLeave={() => setStatesOpen(false)}>
              <button className="flex items-center hover:text-cnn-blue py-4">
                Estados
                <svg className="ml-1" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3"><path d="m2 4 4 4 4-4" /></svg>
              </button>
              {statesOpen && (
                <div className="absolute top-full left-0 w-[420px] bg-white shadow-2xl border p-4 grid grid-cols-5 gap-2 rounded-b-2xl z-[100] animate-slide-up">
                  {BR_STATES.map(s => (
                    <a key={s} href={`https://${s.toLowerCase()}.cnnbra.com.br`} target="_blank" rel="noopener noreferrer"
                      className="text-center py-2 hover:bg-cnn-blue hover:text-white rounded-lg text-xs font-black transition-all uppercase">
                      {s}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* HEADER ACTIONS */}
          <div className="flex items-center space-x-4">
            <button onClick={() => setShortsOpen(true)} className="hidden md:flex items-center text-sm font-black bg-black text-white px-5 py-2 rounded-full hover:bg-gray-800 shadow-xl transition-transform hover:scale-105 active:scale-95">
              <span className="text-red-500 mr-2 text-lg">▶</span> SHORTS
            </button>
            <Link href="/busca">
              <button className="p-2.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                <Search size={20} strokeWidth={2.5} />
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* ===== MOBILE MENU ===== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100]">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-4/5 max-w-sm bg-white h-full flex flex-col shadow-2xl animate-slide-right p-8">
            <div className="flex items-center justify-between mb-12 pb-4 border-b">
              <span className="font-black text-2xl text-cnn-blue tracking-tighter uppercase">PORTAL CNN BRA</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-3 bg-gray-100 rounded-full text-gray-500">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-8 font-black uppercase text-xl flex flex-col items-start text-gray-800 tracking-tighter">
              {NAV_ITEMS.map(item => (
                <button key={item.category} onClick={() => changeCategory(item.category)}>
                  {item.label}
                </button>
              ))}
              <Link href="/admin" className="mt-12 pt-10 border-t w-full text-red-600 flex items-center tracking-widest font-black italic">
                ACESSO ADMINISTRATIVO
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className="container mx-auto px-4 py-8">

        {/* ===== HERO BANNER ===== */}
        {currentHero && (
          <section
            className="relative w-full h-[55vh] md:h-[75vh] rounded-[2.5rem] overflow-hidden mb-14 shadow-2xl group cursor-pointer animate-slide-up"
            onClick={() => setLocation(`/artigo/${currentHero.id}`)}
          >
            <div
              className={`absolute inset-0 bg-cover bg-center hero-zoom ${heroZoomed ? "hero-active-zoom" : ""}`}
              style={{ backgroundImage: `url('${currentHero.imageUrl || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80"}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 text-white pointer-events-none">
              <span className="bg-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase mb-6 inline-block tracking-[0.2em] shadow-xl">
                {currentHero.category}
              </span>
              <h2 className="text-3xl md:text-7xl font-black leading-[1] mb-6 line-clamp-3 tracking-tighter drop-shadow-2xl">
                {currentHero.title}
              </h2>
            </div>
          </section>
        )}

        {/* ===== GRID ===== */}
        <div className="flex flex-col lg:flex-row gap-12">

          {/* ===== NEWS FEED (LEFT) ===== */}
          <div className="w-full lg:w-2/3">
            <div className="flex items-center justify-between border-b-4 border-cnn-blue pb-5 mb-12">
              <h3 className="text-3xl font-black uppercase tracking-tighter text-cnn-blue">
                {currentCategory === "home" ? "Manchetes Recentes" : currentCategory}
              </h3>
            </div>

            {filteredArticles.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <p className="text-xl font-bold">Nenhuma notícia disponível</p>
                <p className="text-sm mt-2">Adicione notícias pelo painel admin.</p>
              </div>
            )}

            {filteredArticles.map(article => (
              <article key={article.id} className="flex flex-col md:flex-row gap-10 group mb-16 animate-slide-up">
                <div
                  onClick={() => setLocation(`/artigo/${article.id}`)}
                  className="w-full md:w-[420px] aspect-[4/3] overflow-hidden rounded-[2.5rem] relative cursor-pointer shadow-2xl flex-shrink-0"
                >
                  <img
                    src={article.imageUrl || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80"}
                    alt={article.title}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-[2000ms]"
                  />
                  <div className="absolute top-5 left-5 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase shadow-xl">
                    {article.category}
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-between py-2">
                  <div onClick={() => setLocation(`/artigo/${article.id}`)} className="cursor-pointer">
                    <h4 className="text-3xl md:text-4xl font-black leading-[1.1] mb-5 group-hover:text-red-600 transition-colors tracking-tighter">
                      {article.title}
                    </h4>
                    <p className="text-gray-500 line-clamp-2 font-medium text-lg leading-relaxed mb-8">
                      {article.excerpt}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                      {article.publishedAt ? timeAgo(article.publishedAt) : "Recente"}
                    </span>
                    <button
                      onClick={() => shareOnWhatsApp(article.title)}
                      className="flex items-center text-gray-400 hover:text-green-600 font-black uppercase text-[10px] tracking-[0.2em] transition-all"
                    >
                      COMPARTILHAR NO WHATSAPP
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* ===== SIDEBAR (RIGHT) ===== */}
          <aside className="w-full lg:w-1/3 space-y-12">

            {/* WhatsApp CTA */}
            <a href="#" className="block w-full bg-gradient-to-br from-green-500 to-green-700 rounded-[2rem] p-7 shadow-2xl group hover:-translate-y-2 transition-all border-b-[10px] border-green-900">
              <div className="flex items-center text-white">
                <div className="bg-white p-5 rounded-full mr-6 shadow-2xl group-hover:rotate-12 transition-transform">
                  <WhatsAppIcon className="w-8 h-8 text-green-600 animate-whatsapp-bounce" />
                </div>
                <div>
                  <span className="bg-green-400 text-green-900 text-[10px] font-black uppercase px-3 py-1 rounded-full mb-2 inline-block">Comunidade VIP</span>
                  <h3 className="font-black text-2xl uppercase tracking-tighter leading-none">Receba no Zap</h3>
                  <p className="text-xs text-green-100 font-bold uppercase mt-1 opacity-80">Giro de notícias em tempo real</p>
                </div>
              </div>
            </a>

            {/* CNN Shorts Vitrine */}
            <div className="bg-gray-900 rounded-[2rem] p-7 shadow-2xl border border-gray-800">
              <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-5">
                <h3 className="text-white font-black text-xl flex items-center tracking-tighter uppercase">
                  <span className="text-red-500 mr-2">▶</span> CNN Shorts
                </h3>
                <button onClick={() => setShortsOpen(true)} className="text-[11px] uppercase font-black text-gray-500 hover:text-white transition-colors border border-gray-800 px-3 py-1 rounded-full">
                  Ver Tudo
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {(shorts.length > 0 ? shorts.slice(0, 4) : [
                  { id: 1, title: "Operação policial na madrugada", thumbnailUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=400&q=80" },
                  { id: 2, title: "Protestos em Paris", thumbnailUrl: "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=400&q=80" },
                ]).map((s: any) => (
                  <div key={s.id} onClick={() => setShortsOpen(true)} className="relative aspect-[9/16] rounded-2xl overflow-hidden group cursor-pointer border border-gray-800 shadow-2xl">
                    <img src={s.thumbnailUrl || s.videoUrl} alt={s.title} className="w-full h-full object-cover opacity-60 group-hover:scale-125 transition-all duration-[2500ms]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-4xl opacity-80 group-hover:opacity-100 group-hover:scale-125 transition-all">▶</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Newsletter "Fique por dentro" */}
            <div className="bg-cnn-blue rounded-[2rem] p-10 text-white relative overflow-hidden shadow-2xl border border-blue-900">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-red-600 rounded-full opacity-10" />
              <h3 className="text-3xl font-black uppercase mb-2 relative z-10 leading-none tracking-tighter">Fique por dentro</h3>
              <p className="text-xs text-blue-200 mb-10 relative z-10 font-bold uppercase tracking-widest opacity-80 italic">
                Informativo diário gratuito no e-mail
              </p>
              {nlSuccess ? (
                <div className="relative z-10 text-center py-8">
                  <p className="text-2xl font-black">✓ Inscrito!</p>
                  <p className="text-blue-200 text-sm mt-2">Você receberá nossas manchetes diárias.</p>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="space-y-4 relative z-10">
                  <input
                    placeholder="Nome Completo"
                    value={nlName}
                    onChange={e => setNlName(e.target.value)}
                    className="w-full p-4 rounded-xl text-gray-900 text-sm font-bold outline-none border-0 shadow-inner"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Seu melhor E-mail"
                    value={nlEmail}
                    onChange={e => setNlEmail(e.target.value)}
                    className="w-full p-4 rounded-xl text-gray-900 text-sm font-bold outline-none border-0 shadow-inner"
                    required
                  />
                  <button
                    type="submit"
                    disabled={subscribeMutation.isPending}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-xl shadow-xl transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-50"
                  >
                    {subscribeMutation.isPending ? "Enviando..." : "Assinar Agora"}
                  </button>
                </form>
              )}
            </div>

          </aside>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="bg-black text-white py-24 mt-24 border-t-8 border-cnn-blue">
        <div className="container mx-auto px-4 text-center">
          <button onClick={() => changeCategory("home")} className="mb-14 transition-transform hover:scale-110">
            <div className="bg-cnn-blue text-white px-8 py-4 rounded-[3rem] font-black text-5xl shadow-2xl tracking-tighter inline-block">CNN BRA</div>
          </button>
          <div className="flex flex-wrap justify-center gap-12 mb-16 font-black uppercase text-xs tracking-[0.3em] text-gray-500">
            <button onClick={() => changeCategory("POLÍTICA")} className="hover:text-white transition-colors">Política</button>
            <button onClick={() => changeCategory("GERAL")} className="hover:text-white transition-colors">Cotidiano</button>
            <button onClick={() => changeCategory("GLOBAL")} className="hover:text-white transition-colors">Giro Global</button>
          </div>
          <div className="flex justify-center space-x-10 mb-16">
            <a href="#" className="bg-gray-900 p-5 rounded-full hover:bg-blue-600 hover:scale-110 transition-all shadow-xl text-sm font-black">FB</a>
            <a href="#" className="bg-gray-900 p-5 rounded-full hover:bg-gray-800 hover:scale-110 transition-all shadow-xl border border-gray-800 text-sm font-black">X</a>
            <a href="#" className="bg-gray-900 p-5 rounded-full hover:bg-pink-600 hover:scale-110 transition-all shadow-xl text-sm font-black">IG</a>
          </div>
          <Link href="/admin">
            <button className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 hover:text-white bg-gray-950 px-8 py-4 rounded-xl border border-gray-900 mb-10 transition-all">
              Painel Administrativo
            </button>
          </Link>
          <p className="text-gray-800 text-[11px] font-black uppercase tracking-[0.5em] opacity-50">© 2026 CNN BRA. TODOS OS DIREITOS RESERVADOS.</p>
        </div>
      </footer>

      {/* ===== SHORTS OVERLAY ===== */}
      {shortsOpen && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col animate-slide-up">
          <div className="p-8 flex justify-between items-center text-white bg-gradient-to-b from-black/90 to-transparent absolute top-0 w-full z-20">
            <button onClick={() => setShortsOpen(false)} className="text-4xl font-light">✕</button>
            <span className="font-black tracking-[0.3em] uppercase text-xl">CNN SHORTS</span>
            <div className="w-10" />
          </div>
          <div className="flex-1 overflow-y-scroll snap-y hide-scrollbar">
            {(shorts.length > 0 ? shorts : [
              { id: 1, title: "Operação Lei Seca na orla flagra motoristas", category: "POLÍCIA", thumbnailUrl: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80", likes: 12000 },
              { id: 2, title: "Protestos tomam as ruas de Paris contra nova lei", category: "GLOBAL", thumbnailUrl: "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=800&q=80", likes: 45000 },
            ]).map((s: any) => (
              <div key={s.id} className="w-full h-screen snap-start relative flex items-center justify-center bg-gray-950 border-b border-gray-900">
                <img src={s.thumbnailUrl || s.videoUrl} alt={s.title} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-28 left-8 right-24 text-white z-10 animate-slide-up">
                  <span className="bg-red-600 px-4 py-1 rounded-full text-[10px] font-black uppercase mb-5 inline-block tracking-widest shadow-xl">
                    {s.category || "CNN SHORTS"}
                  </span>
                  <h2 className="text-3xl md:text-5xl font-black leading-tight drop-shadow-2xl tracking-tighter italic">{s.title}</h2>
                </div>
                <div className="absolute bottom-28 right-8 flex flex-col space-y-10 items-center text-white z-20">
                  <div className="flex flex-col items-center">
                    <div className="p-5 bg-white/10 backdrop-blur-xl rounded-full mb-2 shadow-2xl border border-white/20">❤️</div>
                    <span className="text-[10px] font-black">{s.likes ? `${Math.round(s.likes / 1000)}K` : "0"}</span>
                  </div>
                  <div onClick={() => shareOnWhatsApp(s.title)} className="flex flex-col items-center cursor-pointer group">
                    <div className="p-5 bg-white/10 backdrop-blur-xl rounded-full mb-2 group-hover:bg-green-600 transition-colors border border-white/20">↗️</div>
                    <span className="text-[10px] font-black uppercase">Enviar</span>
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
          <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl animate-slide-up border-4 border-white">
            <div className="bg-cnn-blue p-12 text-center text-white relative">
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-red-600 rounded-full opacity-20 blur-2xl" />
              <h2 className="text-4xl font-black uppercase leading-none tracking-tighter mb-4">Espere um pouco!</h2>
              <p className="text-blue-200 text-sm font-bold uppercase tracking-widest leading-relaxed">
                Não saia sem receber as manchetes exclusivas no seu WhatsApp!
              </p>
            </div>
            <div className="p-12">
              <form onSubmit={(e) => { e.preventDefault(); setExitPopupVisible(false); alert("Cadastrado com sucesso!"); }} className="space-y-5">
                <input
                  placeholder="Digite o seu WhatsApp (DDD)"
                  value={exitPhone}
                  onChange={e => setExitPhone(e.target.value)}
                  className="w-full p-5 border-2 border-gray-100 rounded-2xl outline-none focus:border-red-600 font-bold text-lg text-center"
                  required
                />
                <button className="w-full bg-red-600 text-white font-black py-6 rounded-2xl shadow-2xl text-xl uppercase tracking-widest hover:bg-red-700 active:scale-95 transition-all">
                  SIM! QUERO RECEBER AGORA
                </button>
                <button type="button" onClick={() => setExitPopupVisible(false)} className="w-full text-gray-400 text-xs uppercase font-black mt-4 hover:text-gray-800 transition-colors tracking-widest">
                  Vou deixar para a próxima
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
