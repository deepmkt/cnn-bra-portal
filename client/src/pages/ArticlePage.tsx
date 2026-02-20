import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Send, ThumbsUp, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

export default function ArticlePage({ id }: { id: number }) {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { data: article, isLoading } = trpc.articles.getById.useQuery({ id });
  const { data: commentsData = [] } = trpc.comments.list.useQuery({ articleId: id });
  const { data: allArticles } = trpc.articles.list.useQuery({ status: "published", limit: 10 });
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

  const recommended = (allArticles ?? []).filter(a => a.id !== id).slice(0, 2);

  useEffect(() => {
    incrementView.mutate({ id });
    window.scrollTo({ top: 0, behavior: "smooth" });
    return () => {
      if (isAuthenticated && article) {
        const duration = Math.floor((Date.now() - startTime.current) / 1000);
        trackRead.mutate({ articleId: id, category: article.category, readDurationSeconds: duration });
      }
    };
  }, [id]);

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
        <Link href="/">
          <button className="bg-[#001c56] text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs">
            Voltar para Início
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Ticker */}
      <div className="bg-[#001c56] text-white text-sm h-10 flex items-center w-full overflow-hidden sticky top-0 z-[60]">
        <div className="font-bold uppercase px-4 h-full flex items-center bg-[#001c56] z-20 relative border-r border-white/20 shadow-xl whitespace-nowrap">
          <span className="text-red-500 mr-2 animate-pulse">●</span> De Última Hora
        </div>
        <div className="flex-1 overflow-hidden relative h-full flex items-center">
          <div className="animate-marquee whitespace-nowrap inline-block pl-4 font-medium">
            Acompanhe as últimas notícias do Brasil e do mundo no CNN BRA
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-gray-200 bg-white z-50 sticky top-10 shadow-sm">
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

      {/* Article Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back button */}
        <button
          onClick={() => setLocation("/")}
          className="mb-10 font-black text-[11px] uppercase text-gray-400 tracking-[0.3em] hover:text-[#001c56] flex items-center transition-colors"
        >
          ← Voltar para Notícias
        </button>

        {/* Title */}
        <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-12 text-gray-900 drop-shadow-sm">
          {article.title}
        </h1>

        {/* Meta bar */}
        <div className="flex flex-wrap items-center justify-between border-y py-8 mb-12 gap-8 border-gray-100">
          <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] italic">
            {article.publishedAt ? timeAgo(article.publishedAt) : "Recente"} • CNN BRA Oficial
          </span>
          <button
            onClick={handleShareWA}
            className="bg-green-600 hover:bg-green-700 text-white px-10 py-5 rounded-full font-black text-xs uppercase shadow-2xl transition-all active:scale-95 flex items-center"
          >
            Compartilhar no WhatsApp
          </button>
        </div>

        {/* IA Voice Player */}
        <div className="bg-blue-50 p-8 rounded-[3rem] border border-blue-100 mb-14 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
          <div className="flex items-center">
            <div className="bg-[#001c56] p-5 rounded-full text-white mr-6 shadow-2xl text-3xl">🎙️</div>
            <div>
              <h4 className="font-black text-[#001c56] uppercase text-xl tracking-tighter leading-none">Ouvir Matéria</h4>
              <p className="text-[10px] font-black uppercase text-blue-800 tracking-widest mt-1 opacity-70">IA Voice CNN BRA</p>
            </div>
          </div>
          <button
            onClick={handleIAVoice}
            className={`${isPlaying ? "bg-red-600 hover:bg-red-700" : "bg-[#001c56] hover:bg-blue-900"} text-white px-12 py-5 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl transition-all`}
          >
            {isPlaying ? "Pausar Áudio" : "Ouvir Agora"}
          </button>
        </div>

        {/* Featured Image */}
        <img
          src={article.imageUrl || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80"}
          alt={article.title}
          className="w-full rounded-[4rem] shadow-[0_40px_80px_rgba(0,0,0,0.25)] mb-16"
        />

        {/* Article Body */}
        <div className="prose prose-2xl max-w-none text-gray-800 font-serif leading-relaxed px-4">
          {/* Blockquote */}
          {article.excerpt && (
            <p className="text-2xl md:text-4xl font-bold text-gray-600 italic border-l-[12px] border-red-600 pl-10 mb-16 leading-tight">
              "{article.excerpt}"
            </p>
          )}
          {/* Content */}
          <div
            className="text-xl md:text-2xl space-y-8"
            dangerouslySetInnerHTML={{ __html: article.content?.replace(/\n/g, "<br/>") || `<p>${article.excerpt}</p>` }}
          />
        </div>

        {/* Share Bar */}
        <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-[2rem] shadow-sm my-12">
          <span className="text-sm font-black text-gray-500 uppercase tracking-widest">Compartilhar:</span>
          <button onClick={handleShareWA} className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl text-xs font-black uppercase hover:bg-green-600 transition-colors shadow-lg">
            WhatsApp
          </button>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copiado!"); }} className="flex items-center gap-2 bg-gray-200 text-gray-600 px-6 py-3 rounded-xl text-xs font-black uppercase hover:bg-gray-300 transition-colors">
            Copiar Link
          </button>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 mb-16">
          <h3 className="text-2xl font-black text-gray-800 mb-8 flex items-center gap-3 uppercase tracking-tighter">
            <MessageCircle className="w-6 h-6" /> Comentários ({commentsData.length})
          </h3>

          {/* Comment Form */}
          <div className="mb-8 border-b pb-8 border-gray-100">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Deixe seu comentário..."
              rows={3}
              className="w-full border-2 border-gray-100 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-[#001c56] resize-none font-medium"
            />
            <div className="flex justify-between items-center mt-3">
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

          {/* Comments List */}
          {commentsData.length === 0 ? (
            <p className="text-center text-gray-400 py-6 font-bold">Seja o primeiro a comentar!</p>
          ) : (
            <div className="space-y-6">
              {commentsData.map((comment: any) => (
                <div key={comment.id} className="border-b border-gray-50 pb-5 last:border-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#001c56] text-white rounded-full flex items-center justify-center text-sm font-black">
                        {(comment.authorName || "A")[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-black text-gray-700">{comment.authorName || "Anônimo"}</span>
                        <span className="text-xs text-gray-400 ml-2">{new Date(comment.createdAt).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                    <button onClick={() => likeComment.mutate({ id: comment.id })} className="flex items-center gap-1 text-gray-400 hover:text-[#001c56] text-xs font-bold">
                      <ThumbsUp className="w-4 h-4" /> {comment.likesCount}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 ml-13 leading-relaxed">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Articles */}
        {recommended.length > 0 && (
          <div className="mt-24 pt-12 border-t border-gray-100">
            <h3 className="font-black text-3xl text-[#001c56] uppercase mb-12 tracking-tighter italic">
              Recomendados para Si
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {recommended.map(r => (
                <div
                  key={r.id}
                  onClick={() => { setLocation(`/artigo/${r.id}`); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="cursor-pointer group flex flex-col"
                >
                  <div className="aspect-video overflow-hidden rounded-[2.5rem] mb-6 shadow-2xl">
                    <img
                      src={r.imageUrl || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80"}
                      alt={r.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-all duration-[2000ms]"
                    />
                  </div>
                  <h4 className="font-black text-xl leading-tight uppercase group-hover:text-red-600 transition-colors tracking-tighter">
                    {r.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black text-white py-24 mt-24 border-t-8 border-[#001c56]">
        <div className="container mx-auto px-4 text-center">
          <Link href="/">
            <button className="mb-14 transition-transform hover:scale-110">
              <div className="bg-[#001c56] text-white px-8 py-4 rounded-[3rem] font-black text-5xl shadow-2xl tracking-tighter inline-block">CNN BRA</div>
            </button>
          </Link>
          <p className="text-gray-800 text-[11px] font-black uppercase tracking-[0.5em] opacity-50">© 2026 CNN BRA. TODOS OS DIREITOS RESERVADOS.</p>
        </div>
      </footer>
    </div>
  );
}
