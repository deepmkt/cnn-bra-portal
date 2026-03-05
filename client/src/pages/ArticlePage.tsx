import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Send, ThumbsUp, MessageCircle, Bell, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { capitalizeTitle } from "@shared/titleUtils";
import AdBanner from "@/components/AdBanner";
import { trackArticleRead, trackArticleShare } from "@/hooks/useAnalytics";

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

// ===== SIDEBAR NEWSLETTER =====
function NewsletterWidget() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const subscribeMut = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => { toast.success("Inscrição realizada! Bem-vindo(a) à newsletter CNN BRA."); setName(""); setEmail(""); },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="bg-[#001c56] rounded-2xl p-5 text-white">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-4 h-4 text-red-400" />
        <h3 className="font-black text-sm uppercase tracking-wider">Newsletter CNN BRA</h3>
      </div>
      <p className="text-xs text-blue-200 mb-4 leading-relaxed">Receba as principais notícias diretamente no seu e-mail.</p>
      <div className="space-y-2">
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Seu nome"
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-blue-300 focus:outline-none focus:border-white"
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Seu e-mail"
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-blue-300 focus:outline-none focus:border-white"
        />
        <Button
          onClick={() => { if (name.trim() && email.trim()) subscribeMut.mutate({ name: name.trim(), email: email.trim() }); }}
          disabled={!name.trim() || !email.trim() || subscribeMut.isPending}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider"
          size="sm"
        >
          {subscribeMut.isPending ? "Inscrevendo..." : "Inscrever-se Grátis"}
        </Button>
      </div>
    </div>
  );
}

// ===== SIDEBAR WHATSAPP =====
function WhatsAppWidget() {
  return (
    <a
      href="https://chat.whatsapp.com/JkINsZPG80d7YZewPeiGQp"
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-green-600 hover:bg-green-700 transition-colors rounded-2xl p-5 text-white group"
    >
      <div className="flex items-center gap-3 mb-2">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 shrink-0">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <h3 className="font-black text-sm uppercase tracking-wider">Canal no WhatsApp</h3>
      </div>
      <p className="text-xs text-green-100 mb-3 leading-relaxed">Entre na nossa comunidade e receba notícias em primeira mão.</p>
      <div className="flex items-center gap-1 text-xs font-black uppercase tracking-wider group-hover:gap-2 transition-all">
        Entrar no Canal <ChevronRight className="w-3 h-3" />
      </div>
    </a>
  );
}

// ===== SIDEBAR RECENT NEWS =====
function RecentNewsWidget({ currentId }: { currentId: number }) {
  const [, setLocation] = useLocation();
  const { data: recent = [] } = trpc.articles.list.useQuery({ status: "online", limit: 8 });
  const filtered = recent.filter((a: any) => a.id !== currentId).slice(0, 6);
  if (filtered.length === 0) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-[#001c56] px-4 py-3">
        <h3 className="font-black text-sm text-white uppercase tracking-wider">Últimas Notícias</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {filtered.map((a: any) => (
          <button
            key={a.id}
            onClick={() => { setLocation(`/artigo/${a.id}`); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="w-full flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors text-left group"
          >
            <img
              src={a.imageUrl || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=200&q=60"}
              alt={a.title}
              className="w-16 h-12 object-cover rounded-lg shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black text-red-600 uppercase tracking-wider">{a.category}</span>
              <p className="text-xs font-bold text-gray-800 leading-tight mt-0.5 line-clamp-2 group-hover:text-[#001c56] transition-colors">
                {capitalizeTitle(a.title)}
              </p>
              <span className="text-[10px] text-gray-400 mt-0.5 block">{a.publishedAt ? timeAgo(a.publishedAt) : ""}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ===== RELATED POSTS BY TAGS =====
function RelatedPosts({ articleId, tags }: { articleId: number; tags: string[] }) {
  const [, setLocation] = useLocation();
  const { data: similar = [] } = trpc.recommendations.similar.useQuery({ articleId, limit: 6 });
  // Also fetch by category/tag as fallback
  const { data: byTag = [] } = trpc.articles.list.useQuery(
    tags.length > 0 ? { tag: tags[0], limit: 12, status: "online" } : undefined,
    { enabled: similar.length < 3 }
  );

  const candidates = similar.length >= 3 ? similar : [
    ...similar,
    ...byTag.filter((a: any) => a.id !== articleId && !similar.find((s: any) => s.id === a.id))
  ];
  const posts = candidates.filter((a: any) => a.id !== articleId).slice(0, 6);

  if (posts.length === 0) return null;

  return (
    <div className="mt-16 pt-12 border-t-2 border-gray-100">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-1 h-8 bg-red-600 rounded-full" />
        <h3 className="font-black text-2xl text-gray-900 uppercase tracking-tighter">Notícias Relacionadas</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((r: any) => (
          <button
            key={r.id}
            onClick={() => { setLocation(`/artigo/${r.id}`); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className="text-left group flex flex-col"
          >
            <div className="aspect-video overflow-hidden rounded-2xl mb-3 shadow-md">
              {r.imageUrl ? (
                <img
                  src={r.imageUrl}
                  alt={r.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#001c56] to-[#003080] flex items-center justify-center">
                  <span className="text-white font-black text-2xl opacity-30">CNN</span>
                </div>
              )}
            </div>
            <span className="text-[10px] font-black text-red-600 uppercase tracking-wider mb-1">{r.category}</span>
            <h4 className="font-black text-base leading-tight text-gray-900 group-hover:text-[#001c56] transition-colors line-clamp-2 tracking-tight">
              {capitalizeTitle(r.title)}
            </h4>
            {r.publishedAt && (
              <span className="text-xs text-gray-400 mt-1">{timeAgo(r.publishedAt)}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ===== BACK TO TOP BUTTON =====
function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-[#001c56] hover:bg-[#002a7a] text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      aria-label="Voltar ao topo"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 15l-6-6-6 6"/>
      </svg>
    </button>
  );
}

export default function ArticlePage({ id }: { id: number }) {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: article, isLoading } = trpc.articles.getById.useQuery({ id });
  const { data: commentsData = [] } = trpc.comments.list.useQuery({ articleId: id });
  const incrementView = trpc.articles.incrementView.useMutation();
  const incrementShare = trpc.articles.incrementShare.useMutation();
  const trackRead = trpc.personalization.trackRead.useMutation();
  const createComment = trpc.comments.create.useMutation({
    onSuccess: () => { utils.comments.list.invalidate({ articleId: id }); setCommentText(""); toast.success("Comentário enviado para moderação!"); },
  });
  const likeComment = trpc.comments.like.useMutation({
    onSuccess: () => utils.comments.list.invalidate({ articleId: id }),
  });
  const utils = trpc.useUtils();

  const [commentText, setCommentText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const startTime = useRef(Date.now());

  // Parse article tags
  const articleTags: string[] = (() => {
    try { return article?.tags ? JSON.parse(article.tags) : []; } catch { return []; }
  })();

  useEffect(() => {
    incrementView.mutate({ id });
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Rastrear leitura no GA4 após 10s na página
    const readTimer = setTimeout(() => {
      if (article) trackArticleRead(id, article.title, article.category);
    }, 10_000);
    return () => {
      clearTimeout(readTimer);
      if (isAuthenticated && article) {
        const duration = Math.floor((Date.now() - startTime.current) / 1000);
        trackRead.mutate({ articleId: id, category: article.category, readDurationSeconds: duration });
      }
    };
  }, [id]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ===== SEO dinâmico: title, meta description, og:image, JSON-LD =====
  useEffect(() => {
    if (!article) return;

    const title = `${article.title} | CNN BRA`;
    const description = article.excerpt || article.content?.replace(/<[^>]*>/g, '').slice(0, 160) || 'Leia a notícia completa no CNN BRA.';
    const image = article.imageUrl || 'https://cnnbra.com.br/og-default.jpg';
    const url = `https://cnnbra.com.br/artigo/${article.id}`;
    const publishedAt = article.publishedAt ? new Date(article.publishedAt).toISOString() : new Date().toISOString();

    // Page title
    document.title = title;

    // Helper to set/create meta tag
    const setMeta = (selector: string, attr: string, value: string) => {
      let el = document.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        const [attrName, attrVal] = selector.replace('meta[', '').replace(']', '').split('="');
        el.setAttribute(attrName, attrVal.replace('"', ''));
        document.head.appendChild(el);
      }
      el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]', 'content', description);
    setMeta('meta[name="keywords"]', 'content', `${article.category}, notícias, CNN BRA, ${article.tags ? JSON.parse(article.tags).join(', ') : ''}`);
    setMeta('meta[property="og:title"]', 'content', title);
    setMeta('meta[property="og:description"]', 'content', description);
    setMeta('meta[property="og:image"]', 'content', image);
    setMeta('meta[property="og:url"]', 'content', url);
    setMeta('meta[property="og:type"]', 'content', 'article');
    setMeta('meta[property="article:published_time"]', 'content', publishedAt);
    setMeta('meta[property="article:section"]', 'content', article.category || 'Geral');
    setMeta('meta[name="twitter:card"]', 'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'content', title);
    setMeta('meta[name="twitter:description"]', 'content', description);
    setMeta('meta[name="twitter:image"]', 'content', image);

    // JSON-LD structured data (NewsArticle)
    let jsonLd = document.getElementById('article-jsonld');
    if (!jsonLd) {
      jsonLd = document.createElement('script');
      jsonLd.id = 'article-jsonld';
      jsonLd.setAttribute('type', 'application/ld+json');
      document.head.appendChild(jsonLd);
    }
    jsonLd.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: article.title,
      description: description,
      image: [image],
      datePublished: publishedAt,
      dateModified: publishedAt,
      author: [{ '@type': 'Organization', name: 'CNN BRA', url: 'https://cnnbra.com.br' }],
      publisher: {
        '@type': 'Organization',
        name: 'CNN BRA',
        logo: { '@type': 'ImageObject', url: 'https://cnnbra.com.br/logo.png' }
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      articleSection: article.category || 'Geral',
      inLanguage: 'pt-BR',
    });

    // Cleanup: restore defaults when leaving the page
    return () => {
      document.title = 'CNN BRA — Notícias do Brasil e do Mundo';
      const jsonLdEl = document.getElementById('article-jsonld');
      if (jsonLdEl) jsonLdEl.remove();
    };
  }, [article]);

  // IA Voice - SpeechSynthesis
  const handleIAVoice = () => {
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else if (article) {
      const text = `${article.title}. ${article.content?.replace(/<[^>]*>/g, '') || article.excerpt}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    }
  };

  const handleShareWA = () => {
    if (article) {
      shareOnWhatsApp(article.title);
      incrementShare.mutate({ id });
      trackArticleShare(id, article.title, 'whatsapp');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-12 h-12 border-4 border-[#001c56] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center p-8">
        <h1 className="text-4xl font-black text-gray-900 mb-4">Artigo não encontrado</h1>
        <Link href="/"><button className="bg-[#001c56] text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs">Voltar para Início</button></Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white z-50 sticky top-0 shadow-sm">
        <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <Link href="/">
            <button className="flex items-end group transition-transform active:scale-95">
              <div className="bg-[#001c56] text-white px-3 py-1 rounded-3xl font-black text-3xl md:text-4xl tracking-tighter shadow-md">CNN</div>
              <div className="w-3 h-3 md:w-4 md:h-4 bg-red-600 ml-1 mb-1.5 md:mb-2 rounded-sm"></div>
              <span className="text-[#001c56] font-black text-3xl md:text-4xl ml-1 tracking-tighter uppercase">BRA</span>
            </button>
          </Link>
          <Link href="/busca">
            <button className="p-2.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </button>
          </Link>
        </div>
      </header>

      {/* Main layout: content + sidebar */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ===== ARTICLE CONTENT ===== */}
          <main className="flex-1 min-w-0">
            {/* Back button */}
            <button
              onClick={() => setLocation("/")}
              className="mb-8 font-black text-[11px] uppercase text-gray-400 tracking-[0.3em] hover:text-[#001c56] flex items-center transition-colors"
            >
              ← Voltar para Notícias
            </button>

            {/* Category + Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                {article.category}
              </span>
              {articleTags.slice(0, 4).map((tag: string) => (
                <span key={tag} className="bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-[0.95] mb-8 text-gray-900">
              {capitalizeTitle(article.title)}
            </h1>

            {/* Meta bar */}
            <div className="flex flex-wrap items-center justify-between border-y py-4 mb-8 gap-4 border-gray-100">
              <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] italic">
                {article.publishedAt ? timeAgo(article.publishedAt) : "Recente"} • CNN BRA Oficial
              </span>
              <button
                onClick={handleShareWA}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-full font-black text-[10px] uppercase shadow-lg transition-all active:scale-95 flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span className="hidden sm:inline">Compartilhar no</span> WhatsApp
              </button>
            </div>

            {/* IA Voice Player */}
            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center">
                <div className="bg-[#001c56] p-3 rounded-full text-white mr-4 shadow-lg text-xl">🎙️</div>
                <div>
                  <h4 className="font-black text-[#001c56] uppercase text-base tracking-tighter leading-none">Ouvir Matéria</h4>
                  <p className="text-[10px] font-black uppercase text-blue-800 tracking-widest mt-0.5 opacity-70">IA Voice CNN BRA</p>
                </div>
              </div>
              <button
                onClick={handleIAVoice}
                className={`${isPlaying ? "bg-red-600 hover:bg-red-700" : "bg-[#001c56] hover:bg-blue-900"} text-white px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-lg transition-all`}
              >
                {isPlaying ? "Pausar Áudio" : "Ouvir Agora"}
              </button>
            </div>

            {/* Featured Image */}
            <img
              src={article.imageUrl || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80"}
              alt={article.title}
              className="w-full rounded-3xl shadow-xl mb-10"
            />

            {/* Article Body */}
            <div className="prose prose-lg max-w-none text-gray-800 font-serif leading-relaxed">
              {article.excerpt && (
                <p className="text-xl md:text-2xl font-bold text-gray-600 italic border-l-8 border-red-600 pl-6 mb-10 leading-tight">
                  "{article.excerpt}"
                </p>
              )}
              <div
                className="text-lg space-y-6"
                dangerouslySetInnerHTML={{ __html: article.content?.replace(/\n/g, "<br/>") || `<p>${article.excerpt}</p>` }}
              />
            </div>

            {/* Mid-article Ad Banner */}
            <div className="my-10">
              <AdBanner placement="article-mid" className="w-full" />
            </div>

            {/* Tags footer */}
            {articleTags.length > 0 && (
              <div className="flex flex-wrap gap-2 my-8 pt-6 border-t border-gray-100">
                <span className="text-xs font-black text-gray-400 uppercase tracking-wider mr-1">Tags:</span>
                {articleTags.map((tag: string) => (
                  <span key={tag} className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full cursor-pointer transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Share Bar */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-2xl shadow-sm my-8">
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest w-full sm:w-auto">Compartilhar:</span>
              <button onClick={handleShareWA} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-green-600 transition-colors shadow">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copiado!"); }}
                className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-gray-300 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copiar Link
              </button>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-12">
              <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-3 uppercase tracking-tighter">
                <MessageCircle className="w-5 h-5" /> Comentários ({commentsData.length})
              </h3>
              <div className="mb-6 border-b pb-6 border-gray-100">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Deixe seu comentário..."
                  rows={3}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#001c56] resize-none font-medium"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-400 font-bold">{commentText.length}/2000</span>
                  <Button
                    onClick={() => { if (commentText.trim()) createComment.mutate({ articleId: id, content: commentText.trim() }); }}
                    disabled={!commentText.trim() || createComment.isPending}
                    className="bg-[#001c56] hover:bg-[#002a7a] text-white font-black rounded-xl gap-2 uppercase tracking-widest text-xs"
                    size="sm"
                  >
                    <Send className="w-4 h-4" /> Enviar
                  </Button>
                </div>
              </div>
              {commentsData.length === 0 ? (
                <p className="text-center text-gray-400 py-4 font-bold text-sm">Seja o primeiro a comentar!</p>
              ) : (
                <div className="space-y-4">
                  {commentsData.map((comment: any) => (
                    <div key={comment.id} className="border-b border-gray-50 pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#001c56] text-white rounded-full flex items-center justify-center text-xs font-black">
                            {(comment.authorName || "A")[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-black text-gray-700">{comment.authorName || "Anônimo"}</span>
                            <span className="text-xs text-gray-400 ml-2">{new Date(comment.createdAt).toLocaleDateString("pt-BR")}</span>
                          </div>
                        </div>
                        <button onClick={() => likeComment.mutate({ id: comment.id })} className="flex items-center gap-1 text-gray-400 hover:text-[#001c56] text-xs font-bold">
                          <ThumbsUp className="w-3.5 h-3.5" /> {comment.likesCount}
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed pl-10">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Related Posts by Tags */}
            <RelatedPosts articleId={id} tags={articleTags} />
          </main>

          {/* ===== SIDEBAR ===== */}
          <aside className="w-full lg:w-80 xl:w-96 shrink-0 space-y-6">
            {/* Sidebar Ad */}
            <AdBanner placement="article-sidebar" className="w-full" />

            {/* Recent News */}
            <RecentNewsWidget currentId={id} />

            {/* Newsletter */}
            <NewsletterWidget />

            {/* WhatsApp */}
            <WhatsAppWidget />

            {/* Sticky second ad */}
            <div className="sticky top-32">
              <AdBanner placement="article-sidebar" className="w-full" />
            </div>
          </aside>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black text-white py-16 mt-8 border-t-8 border-[#001c56]">
        <div className="container mx-auto px-4 text-center">
          <Link href="/">
            <button className="mb-8 transition-transform hover:scale-110">
              <div className="bg-[#001c56] text-white px-8 py-4 rounded-[3rem] font-black text-4xl shadow-2xl tracking-tighter inline-block">CNN BRA</div>
            </button>
          </Link>
          <p className="text-gray-800 text-[11px] font-black uppercase tracking-[0.5em] opacity-50">© 2026 CNN BRA. TODOS OS DIREITOS RESERVADOS.</p>
        </div>
      </footer>

      {/* Back to Top */}
      <BackToTopButton />
    </div>
  );
}
