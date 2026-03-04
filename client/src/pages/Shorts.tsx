import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX,
  ChevronUp, ChevronDown, ArrowLeft, Eye, Clock, Send, X, Loader2,
  ExternalLink, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ===== AD CARD =====
function AdCard({ onSkip }: { onSkip: () => void }) {
  const [countdown, setCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); setCanSkip(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="relative w-full h-full bg-gray-950 flex flex-col items-center justify-center">
      <div className="absolute top-16 left-4 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded">PUBLICIDADE</div>
      <div className="absolute top-16 right-4">
        {canSkip ? (
          <button onClick={onSkip} className="bg-white/20 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full hover:bg-white/30 transition-all flex items-center gap-1">
            Pular <ChevronDown className="w-4 h-4" />
          </button>
        ) : (
          <div className="bg-black/50 text-white/70 text-sm px-3 py-1.5 rounded-full">Pular em {countdown}s</div>
        )}
      </div>
      <div className="w-full max-w-sm px-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center mx-auto mb-4">
          <Zap className="w-10 h-10 text-white" />
        </div>
        <div className="text-white/40 text-xs mb-2 uppercase tracking-widest">Anúncio</div>
        <h3 className="text-white font-bold text-xl mb-2">Anuncie no CNN BRA</h3>
        <p className="text-white/60 text-sm mb-6">Alcance milhares de leitores com seus anúncios no maior portal de notícias de Alagoas.</p>
        <a href="mailto:contato@cnnbra.com.br" className="inline-block bg-red-600 text-white font-bold px-6 py-2.5 rounded-full hover:bg-red-700 transition-all">Saiba Mais</a>
      </div>
    </div>
  );
}

// ===== Ken Burns Image Player =====
function KenBurnsPlayer({ imageUrl, isActive }: { imageUrl: string; isActive: boolean }) {
  const [animKey, setAnimKey] = useState(0);
  useEffect(() => { if (isActive) setAnimKey(prev => prev + 1); }, [isActive]);
  const anims = ["kenburns-zoom-in", "kenburns-zoom-out", "kenburns-pan-left", "kenburns-pan-right"];
  const anim = useMemo(() => anims[Math.floor(Math.random() * anims.length)], [animKey]);
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      <img key={animKey} src={imageUrl} alt="" className={`absolute inset-0 w-full h-full object-cover ${isActive ? anim : ""}`} />
      <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-transparent to-blue-900/20" />
    </div>
  );
}

// ===== YouTube Embed Player =====
function YouTubePlayer({ youtubeId, isActive, isMuted }: { youtubeId: string; isActive: boolean; isMuted: boolean }) {
  const mute = isMuted ? 1 : 0;
  const autoplay = isActive ? 1 : 0;
  const src = `https://www.youtube.com/embed/${youtubeId}?autoplay=${autoplay}&mute=${mute}&loop=1&playlist=${youtubeId}&controls=0&rel=0&modestbranding=1&playsinline=1`;
  return (
    <div className="absolute inset-0 bg-black">
      <iframe src={isActive ? src : ""} className="absolute inset-0 w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title="CNN Shorts" style={{ border: "none", pointerEvents: "none" }} />
    </div>
  );
}

// ===== Native Video Player =====
function NativeVideoPlayer({ videoUrl, thumbnailUrl, isActive, isMuted, onProgress }: {
  videoUrl: string; thumbnailUrl?: string; isActive: boolean; isMuted: boolean; onProgress: (p: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showIcon, setShowIcon] = useState(false);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) { video.play().then(() => setIsPlaying(true)).catch(() => {}); }
    else { video.pause(); video.currentTime = 0; setIsPlaying(false); }
  }, [isActive]);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handler = () => { if (video.duration) onProgress((video.currentTime / video.duration) * 100); };
    video.addEventListener("timeupdate", handler);
    return () => video.removeEventListener("timeupdate", handler);
  }, [onProgress]);
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) { video.play().then(() => setIsPlaying(true)); } else { video.pause(); setIsPlaying(false); }
    setShowIcon(true); setTimeout(() => setShowIcon(false), 600);
  };
  return (
    <div className="absolute inset-0 bg-black" onClick={togglePlay}>
      <video ref={videoRef} src={videoUrl} className="absolute inset-0 w-full h-full object-contain" loop playsInline muted={isMuted} poster={thumbnailUrl} />
      {showIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-black/40 rounded-full p-5">
            {isPlaying ? <Pause className="w-12 h-12 text-white" /> : <Play className="w-12 h-12 text-white" />}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Short Item =====
function ShortItem({ short, isActive, isMuted, onToggleMute, likedShorts, onNext, onPrev, onOpenComments }: {
  short: any; isActive: boolean; isMuted: boolean; onToggleMute: () => void;
  likedShorts: number[]; onNext: () => void; onPrev: () => void; onOpenComments: () => void;
}) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [progress, setProgress] = useState(0);
  const isLiked = likedShorts.includes(short.id);
  const incrementView = trpc.shorts.incrementView.useMutation();
  const toggleLike = trpc.shorts.toggleLike.useMutation();
  const shareMutation = trpc.shorts.share.useMutation();
  const utils = trpc.useUtils();

  const isYoutube = !!short.youtubeId;
  const isNativeVideo = !isYoutube && short.videoUrl && (short.videoUrl.includes(".mp4") || short.videoUrl.includes(".webm") || short.videoUrl.includes("blob:"));

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => { incrementView.mutate({ id: short.id }); }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isActive, short.id]);

  const handleLike = () => {
    if (!user) { toast.info("Faça login para curtir"); return; }
    toggleLike.mutate({ id: short.id }, { onSuccess: () => { utils.shorts.feedInfinite.invalidate(); utils.shorts.myLikes.invalidate(); } });
  };
  const handleShare = () => {
    const url = `${window.location.origin}/shorts?id=${short.id}`;
    const text = `Assista: ${short.title} - CNN BRA Shorts`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank");
    shareMutation.mutate({ id: short.id });
  };
  const handleArticleClick = () => { if (short.articleId) navigate(`/artigo/${short.articleId}`); };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {isYoutube ? (
        <YouTubePlayer youtubeId={short.youtubeId} isActive={isActive} isMuted={isMuted} />
      ) : isNativeVideo ? (
        <NativeVideoPlayer videoUrl={short.videoUrl} thumbnailUrl={short.thumbnailUrl} isActive={isActive} isMuted={isMuted} onProgress={setProgress} />
      ) : (
        <KenBurnsPlayer imageUrl={short.thumbnailUrl || short.videoUrl || ""} isActive={isActive} />
      )}

      {isNativeVideo && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
          <div className="h-full bg-red-600 transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/70 to-transparent z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-black/90 to-transparent z-10 pointer-events-none" />

      {isYoutube && (
        <div className="absolute top-16 left-4 z-20 bg-red-600/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
          <Play className="w-2.5 h-2.5 fill-white" /> YouTube
        </div>
      )}
      {short.sourceType === "ai" && (
        <div className="absolute top-16 left-4 z-20 bg-purple-600/90 backdrop-blur-sm text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
          <Zap className="w-2.5 h-2.5" /> IA
        </div>
      )}

      <div className="absolute bottom-6 left-4 right-20 z-20">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-black">CNN</div>
          <span className="text-white font-semibold text-sm">{short.authorName || "CNN BRA"}</span>
          <span className="text-white/60 text-xs bg-white/10 px-2 py-0.5 rounded-full">{short.category}</span>
        </div>
        <h3 className="text-white font-bold text-base leading-tight mb-1 line-clamp-2">{short.title}</h3>
        {short.description && <p className="text-white/70 text-sm line-clamp-2">{short.description}</p>}
        <div className="flex items-center gap-3 mt-2 text-white/50 text-xs">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatCount(short.viewCount)}</span>
          {short.duration > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(short.duration)}</span>}
          {short.articleId && (
            <button onClick={handleArticleClick} className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors">
              <ExternalLink className="w-3 h-3" /> Ver matéria
            </button>
          )}
        </div>
      </div>

      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-20">
        <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isLiked ? "bg-red-600 scale-110" : "bg-white/15 backdrop-blur-sm group-hover:bg-white/25"}`}>
            <Heart className={`w-5 h-5 transition-all ${isLiked ? "text-white fill-white" : "text-white"}`} />
          </div>
          <span className="text-white text-xs font-medium">{formatCount(short.likeCount)}</span>
        </button>
        <button onClick={onOpenComments} className="flex flex-col items-center gap-1 group">
          <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/25 transition-all">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xs font-medium">{formatCount(short.commentCount)}</span>
        </button>
        <button onClick={handleShare} className="flex flex-col items-center gap-1 group">
          <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/25 transition-all">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xs font-medium">{formatCount(short.shareCount)}</span>
        </button>
        <button onClick={onToggleMute} className="flex flex-col items-center gap-1 group">
          <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/25 transition-all">
            {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
          </div>
        </button>
      </div>

      <div className="absolute right-16 top-1/2 -translate-y-1/2 flex-col gap-2 z-20 hidden md:flex">
        <button onClick={onPrev} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all">
          <ChevronUp className="w-5 h-5 text-white" />
        </button>
        <button onClick={onNext} className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all">
          <ChevronDown className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}

// ===== Comments Panel =====
function CommentsPanel({ shortId, onClose }: { shortId: number; onClose: () => void }) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const { data: comments, isLoading } = trpc.shorts.comments.useQuery({ shortId });
  const addComment = trpc.shorts.addComment.useMutation();
  const utils = trpc.useUtils();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment.mutate({ shortId, content: commentText.trim() }, {
      onSuccess: () => { setCommentText(""); utils.shorts.comments.invalidate({ shortId }); },
    });
  };
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 bg-gray-900/95 backdrop-blur-lg rounded-t-2xl max-h-[60vh] flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-white font-bold text-base">Comentários {comments?.length ? `(${comments.length})` : ""}</h3>
        <button onClick={onClose} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-white/40 animate-spin" /></div>
        ) : comments && comments.length > 0 ? (
          comments.map((c: any) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {(c.authorName || "A")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white/80 text-sm font-semibold">{c.authorName || "Anônimo"}</span>
                  <span className="text-white/30 text-xs">{new Date(c.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
                <p className="text-white/70 text-sm mt-0.5">{c.content}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="w-10 h-10 text-white/20 mx-auto mb-2" />
            <p className="text-white/40 text-sm">Nenhum comentário ainda</p>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-white/10 flex gap-2">
        <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder={user ? "Adicione um comentário..." : "Faça login para comentar"} disabled={!user} className="flex-1 bg-white/10 text-white placeholder-white/40 rounded-full px-4 py-2 text-sm outline-none focus:bg-white/15 transition-all" />
        <button type="submit" disabled={!commentText.trim() || !user} className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center disabled:opacity-40 hover:bg-red-700 transition-all">
          <Send className="w-4 h-4 text-white" />
        </button>
      </form>
    </div>
  );
}

// ===== Feed item type =====
type FeedItem = { type: "short"; data: any; key: string } | { type: "ad"; key: string };

// ===== Main Shorts Page =====
export default function ShortsPage() {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [skippedAds, setSkippedAds] = useState<Set<string>>(new Set());
  const touchStartY = useRef(0);
  const wheelTimeout = useRef<NodeJS.Timeout | null>(null);

  const [allShorts, setAllShorts] = useState<any[]>([]);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const { data: initialData, isLoading } = trpc.shorts.feedInfinite.useQuery({ limit: 12 });
  const { data: likedShorts } = trpc.shorts.myLikes.useQuery(undefined, { enabled: !!user });
  const utils = trpc.useUtils();

  useEffect(() => {
    if (initialData) {
      setAllShorts(initialData.items || []);
      setCursor(initialData.nextCursor);
      setHasMore(!!initialData.nextCursor);
    }
  }, [initialData]);

  const feedItems = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];
    allShorts.forEach((short, i) => {
      items.push({ type: "short", data: short, key: `short-${short.id}` });
      if ((i + 1) % 5 === 0) items.push({ type: "ad", key: `ad-${i}` });
    });
    return items;
  }, [allShorts]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !cursor) return;
    setIsLoadingMore(true);
    try {
      const result = await utils.shorts.feedInfinite.fetch({ limit: 10, cursor });
      if (result) {
        setAllShorts(prev => [...prev, ...(result.items || [])]);
        setCursor(result.nextCursor);
        setHasMore(!!result.nextCursor);
      }
    } catch (e) { console.error("Load more error:", e); }
    finally { setIsLoadingMore(false); }
  }, [hasMore, isLoadingMore, cursor, utils]);

  useEffect(() => {
    if (currentIndex >= feedItems.length - 3) loadMore();
  }, [currentIndex, feedItems.length, loadMore]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => {
      if (prev + 1 < feedItems.length) { setShowComments(false); return prev + 1; }
      return prev;
    });
  }, [feedItems.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex(prev => {
      if (prev > 0) { setShowComments(false); return prev - 1; }
      return prev;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") goToNext();
      if (e.key === "ArrowUp" || e.key === "k") goToPrev();
      if (e.key === "m") setIsMuted(prev => !prev);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(deltaY) > 60) { if (deltaY > 0) goToNext(); else goToPrev(); }
  };
  const handleWheel = (e: React.WheelEvent) => {
    if (wheelTimeout.current) return;
    wheelTimeout.current = setTimeout(() => { wheelTimeout.current = null; }, 500);
    if (e.deltaY > 30) goToNext(); else if (e.deltaY < -30) goToPrev();
  };

  const currentFeedItem = feedItems[currentIndex];
  const currentShortId = currentFeedItem?.type === "short" ? currentFeedItem.data.id : null;

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center">
          <Play className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-white font-bold text-xl">Nenhum short disponível</h2>
        <p className="text-white/50 text-sm">Os shorts serão gerados automaticamente em breve.</p>
        <Link href="/"><Button variant="outline" className="border-white/30 text-white hover:bg-white/10">Voltar ao Portal</Button></Link>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black overflow-hidden select-none">
      <style>{`
        @keyframes kenburns-zoom-in { 0% { transform: scale(1) translate(0,0); } 100% { transform: scale(1.2) translate(-2%,-2%); } }
        @keyframes kenburns-zoom-out { 0% { transform: scale(1.2) translate(2%,2%); } 100% { transform: scale(1) translate(0,0); } }
        @keyframes kenburns-pan-left { 0% { transform: scale(1.1) translate(3%,0); } 100% { transform: scale(1.1) translate(-3%,0); } }
        @keyframes kenburns-pan-right { 0% { transform: scale(1.1) translate(-3%,0); } 100% { transform: scale(1.1) translate(3%,0); } }
        .kenburns-zoom-in { animation: kenburns-zoom-in 8s ease-in-out forwards; }
        .kenburns-zoom-out { animation: kenburns-zoom-out 8s ease-in-out forwards; }
        .kenburns-pan-left { animation: kenburns-pan-left 8s ease-in-out forwards; }
        .kenburns-pan-right { animation: kenburns-pan-right 8s ease-in-out forwards; }
      `}</style>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3">
        <Link href="/">
          <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-all">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-red-600 rounded flex items-center justify-center">
            <span className="text-white text-[10px] font-black">CNN</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Shorts</span>
        </div>
        <div className="w-10" />
      </div>

      {/* Feed */}
      <div className="h-full w-full relative" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onWheel={handleWheel}>
        <div className="h-full w-full transition-transform duration-500 ease-out" style={{ transform: `translateY(-${currentIndex * 100}%)` }}>
          {feedItems.map((item, idx) => (
            <div key={item.key} className="relative" style={{ height: "100vh", width: "100%" }}>
              {item.type === "ad" ? (
                skippedAds.has(item.key) ? (
                  <div className="h-full bg-black" />
                ) : (
                  <AdCard onSkip={() => { setSkippedAds(prev => { const s = new Set(Array.from(prev)); s.add(item.key); return s; }); goToNext(); }} />
                )
              ) : (
                <ShortItem
                  short={item.data}
                  isActive={idx === currentIndex}
                  isMuted={isMuted}
                  onToggleMute={() => setIsMuted(prev => !prev)}
                  likedShorts={likedShorts || []}
                  onNext={goToNext}
                  onPrev={goToPrev}
                  onOpenComments={() => setShowComments(true)}
                />
              )}
            </div>
          ))}
        </div>

        {isLoadingMore && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30">
            <div className="bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2">
              <Loader2 className="w-3 h-3 text-white animate-spin" />
              <span className="text-white text-xs">Carregando mais...</span>
            </div>
          </div>
        )}

        {showComments && currentShortId && (
          <CommentsPanel shortId={currentShortId} onClose={() => setShowComments(false)} />
        )}
      </div>

      {/* Position indicator */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1 max-h-40 overflow-hidden">
        {feedItems.slice(Math.max(0, currentIndex - 5), currentIndex + 6).map((_, i) => {
          const realIdx = Math.max(0, currentIndex - 5) + i;
          return (
            <div key={realIdx} className={`w-1 rounded-full transition-all duration-300 ${realIdx === currentIndex ? "h-5 bg-white" : "h-1.5 bg-white/30"}`} />
          );
        })}
      </div>
    </div>
  );
}
