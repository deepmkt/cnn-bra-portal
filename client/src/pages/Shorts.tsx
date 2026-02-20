import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import {
  Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX,
  ChevronUp, ChevronDown, ArrowLeft, Eye, Clock, Send, X, Loader2
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

// ===== Short Video Player =====
function ShortPlayer({
  short,
  isActive,
  isMuted,
  onToggleMute,
  likedShorts,
  onNext,
  onPrev,
  onOpenComments,
}: {
  short: any;
  isActive: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
  likedShorts: number[];
  onNext: () => void;
  onPrev: () => void;
  onOpenComments: () => void;
}) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [progress, setProgress] = useState(0);

  const isLiked = likedShorts.includes(short.id);

  const incrementView = trpc.shorts.incrementView.useMutation();
  const toggleLike = trpc.shorts.toggleLike.useMutation();
  const shareMutation = trpc.shorts.share.useMutation();
  const utils = trpc.useUtils();

  // Auto-play/pause based on active state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      incrementView.mutate({ id: short.id });
    } else {
      video.pause();
      video.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isActive, short.id]);

  // Mute state
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  // Progress tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleTimeUpdate = () => {
      if (video.duration) setProgress((video.currentTime / video.duration) * 100);
    };
    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true));
    } else {
      video.pause();
      setIsPlaying(false);
    }
    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 600);
  };

  const handleLike = () => {
    if (!user) {
      toast.info("Faça login para curtir");
      return;
    }
    toggleLike.mutate({ id: short.id }, {
      onSuccess: () => {
        utils.shorts.feed.invalidate();
        utils.shorts.myLikes.invalidate();
      },
    });
  };

  const handleShare = () => {
    const url = `${window.location.origin}/shorts?id=${short.id}`;
    const text = `Assista: ${short.title} - CNN BRA Shorts`;
    // WhatsApp share
    window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, "_blank");
    shareMutation.mutate({ id: short.id });
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center snap-start snap-always">
      {/* Video */}
      <video
        ref={videoRef}
        src={short.videoUrl}
        className="absolute inset-0 w-full h-full object-contain"
        loop
        playsInline
        muted={isMuted}
        poster={short.thumbnailUrl || undefined}
        onClick={togglePlay}
      />

      {/* Play/Pause overlay */}
      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-black/40 rounded-full p-5 animate-ping-once">
            {isPlaying ? <Play className="w-12 h-12 text-white" /> : <Pause className="w-12 h-12 text-white" />}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
        <div
          className="h-full bg-red-600 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent z-10" />

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 to-transparent z-10" />

      {/* Info overlay - bottom left */}
      <div className="absolute bottom-6 left-4 right-20 z-20">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-xs font-bold">
            CNN
          </div>
          <span className="text-white font-semibold text-sm">
            {short.authorName || "CNN BRA"}
          </span>
          <span className="text-white/60 text-xs bg-white/10 px-2 py-0.5 rounded-full">
            {short.category}
          </span>
        </div>
        <h3 className="text-white font-bold text-base leading-tight mb-1 line-clamp-2">
          {short.title}
        </h3>
        {short.description && (
          <p className="text-white/70 text-sm line-clamp-2">{short.description}</p>
        )}
        <div className="flex items-center gap-3 mt-2 text-white/50 text-xs">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatCount(short.viewCount)}</span>
          {short.duration > 0 && (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(short.duration)}</span>
          )}
        </div>
      </div>

      {/* Action buttons - right side */}
      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 z-20">
        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isLiked ? "bg-red-600 scale-110" : "bg-white/15 backdrop-blur-sm group-hover:bg-white/25"}`}>
            <Heart className={`w-5 h-5 transition-all ${isLiked ? "text-white fill-white" : "text-white"}`} />
          </div>
          <span className="text-white text-xs font-medium">{formatCount(short.likeCount)}</span>
        </button>

        {/* Comments */}
        <button onClick={onOpenComments} className="flex flex-col items-center gap-1 group">
          <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/25 transition-all">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xs font-medium">{formatCount(short.commentCount)}</span>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1 group">
          <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/25 transition-all">
            <Share2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-white text-xs font-medium">{formatCount(short.shareCount)}</span>
        </button>

        {/* Mute */}
        <button onClick={onToggleMute} className="flex flex-col items-center gap-1 group">
          <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/25 transition-all">
            {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
          </div>
        </button>
      </div>

      {/* Navigation arrows (desktop) */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex-col gap-2 z-20 hidden md:flex">
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
    addComment.mutate(
      { shortId, content: commentText.trim() },
      {
        onSuccess: () => {
          setCommentText("");
          utils.shorts.comments.invalidate({ shortId });
          utils.shorts.feed.invalidate();
        },
      }
    );
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 bg-gray-900/95 backdrop-blur-lg rounded-t-2xl max-h-[60vh] flex flex-col animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-white font-bold text-base">
          Comentários {comments?.length ? `(${comments.length})` : ""}
        </h3>
        <button onClick={onClose} className="text-white/60 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
          </div>
        ) : comments && comments.length > 0 ? (
          comments.map((c: any) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {(c.authorName || "A")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white/80 text-sm font-semibold">{c.authorName || "Anônimo"}</span>
                  <span className="text-white/30 text-xs">
                    {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <p className="text-white/70 text-sm mt-0.5">{c.content}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="w-10 h-10 text-white/20 mx-auto mb-2" />
            <p className="text-white/40 text-sm">Nenhum comentário ainda</p>
            <p className="text-white/30 text-xs mt-1">Seja o primeiro a comentar!</p>
          </div>
        )}
      </div>

      {/* Comment input */}
      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-white/10 flex gap-2">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={user ? "Adicione um comentário..." : "Faça login para comentar"}
          className="flex-1 bg-white/10 text-white placeholder-white/30 rounded-full px-4 py-2 text-sm outline-none focus:bg-white/15 transition-colors"
          disabled={!user}
        />
        <button
          type="submit"
          disabled={!commentText.trim() || addComment.isPending}
          className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white disabled:opacity-40 hover:bg-red-700 transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

// ===== Empty State =====
function ShortsEmptyState() {
  return (
    <div className="h-screen bg-[#001c56] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/20">
        <Link href="/">
          <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
            <span className="text-white text-xs font-black">CNN</span>
          </div>
          <span className="text-white font-bold text-lg">Shorts</span>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6">
          <Play className="w-10 h-10 text-white/40" />
        </div>
        <h2 className="text-white text-2xl font-bold mb-3">CNN Shorts</h2>
        <p className="text-white/60 text-base max-w-sm mb-8">
          Vídeos curtos com as principais notícias do Brasil e do mundo. Em breve, novos conteúdos serão publicados aqui.
        </p>
        <Link href="/">
          <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
            Voltar ao Portal
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ===== Main Shorts Page =====
export default function ShortsPage() {
  const { data: shortsData, isLoading } = trpc.shorts.feed.useQuery({});
  const { user } = useAuth();
  const { data: likedShorts } = trpc.shorts.myLikes.useQuery(undefined, { enabled: !!user });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  const shorts = shortsData || [];

  const goToNext = useCallback(() => {
    if (currentIndex < shorts.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowComments(false);
    }
  }, [currentIndex, shorts.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setShowComments(false);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") goToNext();
      if (e.key === "ArrowUp" || e.key === "k") goToPrev();
      if (e.key === "m") setIsMuted(prev => !prev);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev]);

  // Touch/swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(deltaY) > 60) {
      if (deltaY > 0) goToNext();
      else goToPrev();
    }
  };

  // Mouse wheel navigation
  const wheelTimeout = useRef<NodeJS.Timeout | null>(null);
  const handleWheel = (e: React.WheelEvent) => {
    if (wheelTimeout.current) return;
    wheelTimeout.current = setTimeout(() => { wheelTimeout.current = null; }, 500);
    if (e.deltaY > 30) goToNext();
    else if (e.deltaY < -30) goToPrev();
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      </div>
    );
  }

  if (shorts.length === 0) return <ShortsEmptyState />;

  return (
    <div className="h-screen bg-black overflow-hidden select-none">
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

      {/* Video feed */}
      <div
        ref={containerRef}
        className="h-full w-full relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <div
          className="h-full w-full transition-transform duration-500 ease-out"
          style={{ transform: `translateY(-${currentIndex * 100}%)` }}
        >
          {shorts.map((short: any, index: number) => (
            <div key={short.id} className="h-full w-full relative">
              <ShortPlayer
                short={short}
                isActive={index === currentIndex}
                isMuted={isMuted}
                onToggleMute={() => setIsMuted(prev => !prev)}
                likedShorts={likedShorts || []}
                onNext={goToNext}
                onPrev={goToPrev}
                onOpenComments={() => setShowComments(true)}
              />
            </div>
          ))}
        </div>

        {/* Comments panel */}
        {showComments && shorts[currentIndex] && (
          <CommentsPanel
            shortId={shorts[currentIndex].id}
            onClose={() => setShowComments(false)}
          />
        )}
      </div>

      {/* Position indicator */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1">
        {shorts.map((_: any, i: number) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-300 ${
              i === currentIndex ? "h-5 bg-white" : "h-1.5 bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
