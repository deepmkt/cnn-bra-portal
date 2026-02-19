import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowLeft, Clock, Eye, Share2, MessageCircle, ThumbsUp, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { OptimizedImage } from "@/components/OptimizedImage";

export default function ArticlePage({ id }: { id: number }) {
  const { user, isAuthenticated } = useAuth();
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
  const startTime = useRef(Date.now());

  useEffect(() => {
    incrementView.mutate({ id });
    return () => {
      if (isAuthenticated && article) {
        const duration = Math.floor((Date.now() - startTime.current) / 1000);
        trackRead.mutate({ articleId: id, category: article.category, readDurationSeconds: duration });
      }
    };
  }, [id]);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: article?.title, url });
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(article?.title + " " + url)}`, "_blank");
    }
    incrementShare.mutate({ id });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-64 bg-gray-200 rounded-2xl" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-800 mb-2">Artigo não encontrado</h2>
          <Link href="/"><span className="text-[#001c56] font-bold hover:underline cursor-pointer">Voltar ao início</span></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <span className="flex items-center gap-2 text-[#001c56] font-bold hover:opacity-80 cursor-pointer">
              <ArrowLeft className="w-5 h-5" /> CNN BRA
            </span>
          </Link>
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
            <Share2 className="w-4 h-4" /> Compartilhar
          </Button>
        </div>
      </header>

      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* Category & Meta */}
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-[#cc0000] text-white text-xs font-black uppercase px-3 py-1 rounded">{article.category}</span>
          {article.isBreaking && <span className="bg-red-600 text-white text-xs font-black uppercase px-3 py-1 rounded animate-pulse">URGENTE</span>}
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Clock className="w-3 h-3" /> {article.readTimeMinutes} min de leitura
          </div>
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <Eye className="w-3 h-3" /> {article.viewCount}
          </div>
          <div className="flex items-center gap-1 text-gray-400 text-xs">
            <MessageCircle className="w-3 h-3" /> {article.commentCount}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="text-lg text-gray-600 mb-6 leading-relaxed">{article.excerpt}</p>
        )}

        {/* Date */}
        <p className="text-sm text-gray-400 mb-6">
          {new Date(article.publishedAt || article.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>

        {/* Image */}
        {article.imageUrl && (
          <div className="mb-8 rounded-2xl overflow-hidden">
            <OptimizedImage src={article.imageUrl} alt={article.title} className="w-full h-auto" width={800} />
          </div>
        )}

        {/* Video */}
        {article.videoUrl && (
          <div className="mb-8 rounded-2xl overflow-hidden aspect-video">
            <iframe src={article.videoUrl} className="w-full h-full" allowFullScreen loading="lazy" />
          </div>
        )}

        {/* Content */}
        <div className="prose prose-lg max-w-none mb-12 text-gray-800 leading-relaxed" dangerouslySetInnerHTML={{ __html: article.content?.replace(/\n/g, "<br/>") || "" }} />

        {/* Tags */}
        {article.tags && (
          <div className="flex flex-wrap gap-2 mb-8">
            {(() => { try { return JSON.parse(article.tags); } catch { return []; } })().map((tag: string) => (
              <span key={tag} className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">#{tag}</span>
            ))}
          </div>
        )}

        {/* Share Bar */}
        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm mb-8">
          <span className="text-sm font-bold text-gray-600">Compartilhar:</span>
          <button onClick={handleShare} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-600 transition-colors">
            WhatsApp
          </button>
          <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copiado!"); }} className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors">
            Copiar Link
          </button>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-black text-gray-800 mb-6 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" /> Comentários ({commentsData.length})
          </h3>

          {/* Comment Form */}
          <div className="mb-6 border-b pb-6">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Deixe seu comentário..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56] resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-400">{commentText.length}/2000</span>
              <Button
                onClick={() => { if (commentText.trim()) createComment.mutate({ articleId: id, content: commentText.trim() }); }}
                disabled={!commentText.trim() || createComment.isPending}
                className="bg-[#001c56] hover:bg-[#002a7a] text-white font-bold rounded-xl gap-2"
                size="sm"
              >
                <Send className="w-4 h-4" /> Enviar
              </Button>
            </div>
          </div>

          {/* Comments List */}
          {commentsData.length === 0 ? (
            <p className="text-center text-gray-400 py-4">Seja o primeiro a comentar!</p>
          ) : (
            <div className="space-y-4">
              {commentsData.map((comment: any) => (
                <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#001c56] text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {(comment.authorName || "A")[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-gray-700">{comment.authorName || "Anônimo"}</span>
                      <span className="text-xs text-gray-400">{new Date(comment.createdAt).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <button onClick={() => likeComment.mutate({ id: comment.id })} className="flex items-center gap-1 text-gray-400 hover:text-[#001c56] text-xs">
                      <ThumbsUp className="w-3 h-3" /> {comment.likesCount}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 ml-10">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
