import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  LayoutDashboard, FileText, MessageCircle, Users, Shield, Trophy, Megaphone,
  Plus, Trash2, Edit, Eye, EyeOff, Check, X, ArrowLeft, Star, StarOff,
  Bell, Newspaper, Type, LogOut, BarChart3
} from "lucide-react";

type Tab = "dashboard" | "articles" | "ugc" | "comments" | "gamification" | "users" | "audit" | "ads" | "ticker";

const CATEGORIES = ["GERAL", "POLÍTICA", "ECONOMIA", "ESPORTES", "TECNOLOGIA", "SAÚDE", "ENTRETENIMENTO", "MUNDO", "BRASIL"];

export default function Admin() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin w-10 h-10 border-4 border-[#001c56] border-t-transparent rounded-full" /></div>;

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
        <div className="bg-[#001c56] text-white px-3 py-1 rounded-3xl font-black text-3xl inline-block mb-4">CNN</div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">Painel Administrativo</h2>
        <p className="text-gray-500 mb-6">Faça login para acessar o painel.</p>
        <a href={getLoginUrl()} className="inline-block bg-[#001c56] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#002a7a]">Entrar</a>
      </div>
    </div>
  );

  if (user?.role !== "admin") return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
        <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-red-600 mb-2">Acesso Negado</h2>
        <p className="text-gray-500 mb-6">Você não tem permissão de administrador.</p>
        <a href="/" className="inline-block bg-[#001c56] text-white px-6 py-3 rounded-xl font-bold">Voltar</a>
      </div>
    </div>
  );

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "articles", label: "Notícias", icon: FileText },
    { id: "ugc", label: "UGC", icon: Newspaper },
    { id: "comments", label: "Comentários", icon: MessageCircle },
    { id: "gamification", label: "Gamificação", icon: Trophy },
    { id: "users", label: "Usuários", icon: Users },
    { id: "audit", label: "Auditoria", icon: Shield },
    { id: "ads", label: "Anúncios", icon: Megaphone },
    { id: "ticker", label: "Ticker", icon: Type },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#001c56] text-white flex-col shrink-0 hidden md:flex">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="bg-white text-[#001c56] px-2 py-0.5 rounded-2xl font-black text-lg">CNN</div>
            <span className="font-black text-lg">Admin</span>
          </div>
          <p className="text-blue-200 text-xs mt-1">{user?.name || user?.email}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                activeTab === tab.id ? "bg-white/20 text-white" : "text-blue-200 hover:bg-white/10 hover:text-white"
              }`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-2">
          <a href="/" className="flex items-center gap-2 text-blue-200 hover:text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/10"><ArrowLeft className="w-4 h-4" /> Voltar ao Portal</a>
          <button onClick={() => logout()} className="flex items-center gap-2 text-blue-200 hover:text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/10 w-full"><LogOut className="w-4 h-4" /> Sair</button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 flex overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center py-2 min-w-[60px] text-[10px] ${activeTab === tab.id ? "text-[#001c56] font-bold" : "text-gray-400"}`}>
            <tab.icon className="w-4 h-4 mb-0.5" /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 pb-20 md:pb-6 overflow-auto">
        {activeTab === "dashboard" && <DashboardTab />}
        {activeTab === "articles" && <ArticlesTab />}
        {activeTab === "ugc" && <UGCTab />}
        {activeTab === "comments" && <CommentsTab />}
        {activeTab === "gamification" && <GamificationTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "audit" && <AuditTab />}
        {activeTab === "ads" && <AdsTab />}
        {activeTab === "ticker" && <TickerTab />}
      </div>
    </div>
  );
}

/* ===== DASHBOARD ===== */
function DashboardTab() {
  const { data: stats } = trpc.stats.overview.useQuery();
  const { data: ugcCount } = trpc.ugc.count.useQuery({ status: "pending" });
  const cards = [
    { label: "Artigos", value: stats?.articleCount ?? 0, icon: FileText, color: "bg-blue-500" },
    { label: "Visualizações", value: stats?.totalViews ?? 0, icon: Eye, color: "bg-green-500" },
    { label: "Comentários", value: stats?.commentCount ?? 0, icon: MessageCircle, color: "bg-purple-500" },
    { label: "Usuários", value: stats?.userCount ?? 0, icon: Users, color: "bg-orange-500" },
    { label: "UGC Pendente", value: ugcCount ?? 0, icon: Newspaper, color: "bg-red-500" },
  ];
  return (
    <div>
      <h1 className="text-2xl font-black text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl p-4 shadow-sm">
            <div className={`w-10 h-10 ${c.color} rounded-lg flex items-center justify-center mb-3`}>
              <c.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-black text-gray-800">{typeof c.value === "number" ? c.value.toLocaleString() : c.value}</p>
            <p className="text-xs text-gray-400">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== ARTICLES ===== */
function ArticlesTab() {
  const utils = trpc.useUtils();
  const { data: articles = [], isLoading } = trpc.articles.list.useQuery({});
  const createMutation = trpc.articles.create.useMutation({ onSuccess: () => { utils.articles.list.invalidate(); toast.success("Notícia criada!"); setIsCreating(false); resetForm(); } });
  const updateMutation = trpc.articles.update.useMutation({ onSuccess: () => { utils.articles.list.invalidate(); toast.success("Atualizado!"); setEditingId(null); } });
  const deleteMutation = trpc.articles.delete.useMutation({ onSuccess: () => { utils.articles.list.invalidate(); toast.success("Excluído!"); } });

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", excerpt: "", content: "", category: "GERAL", imageUrl: "", status: "draft" as "online" | "draft" | "review", isHero: false, isBreaking: false });
  const resetForm = () => setForm({ title: "", excerpt: "", content: "", category: "GERAL", imageUrl: "", status: "draft", isHero: false, isBreaking: false });

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error("Título obrigatório"); return; }
    if (editingId) updateMutation.mutate({ id: editingId, ...form });
    else createMutation.mutate(form);
  };

  const startEdit = (a: any) => {
    setEditingId(a.id); setIsCreating(true);
    setForm({ title: a.title, excerpt: a.excerpt || "", content: a.content || "", category: a.category, imageUrl: a.imageUrl || "", status: a.status, isHero: a.isHero, isBreaking: a.isBreaking || false });
  };

  if (isCreating) {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-gray-800">{editingId ? "Editar" : "Nova"} Notícia</h2>
          <Button variant="outline" onClick={() => { setIsCreating(false); setEditingId(null); resetForm(); }}>Cancelar</Button>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <input placeholder="Título *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]" />
          <textarea placeholder="Resumo" value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} rows={2} className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]" />
          <textarea placeholder="Conteúdo completo" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={8} className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]" />
          <div className="grid grid-cols-2 gap-4">
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]">
              <option value="draft">Rascunho</option><option value="review">Em Revisão</option><option value="online">Publicado</option>
            </select>
          </div>
          <input placeholder="URL da Imagem" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]" />
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.isHero} onChange={e => setForm({ ...form, isHero: e.target.checked })} className="w-4 h-4" /> Destaque</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.isBreaking} onChange={e => setForm({ ...form, isBreaking: e.target.checked })} className="w-4 h-4" /> Urgente</label>
          </div>
          <Button onClick={handleSubmit} className="w-full bg-[#001c56] py-3 font-bold" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? "Salvando..." : editingId ? "Atualizar" : "Publicar"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-800">Notícias ({articles.length})</h2>
        <Button onClick={() => { setIsCreating(true); resetForm(); }} className="bg-[#001c56] gap-2"><Plus className="w-4 h-4" /> Nova Notícia</Button>
      </div>
      {articles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm"><Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500 font-bold">Nenhuma notícia</p></div>
      ) : (
        <div className="space-y-2">
          {articles.map((a: any) => (
            <div key={a.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 group hover:shadow-md transition-shadow">
              <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {a.imageUrl ? <img src={a.imageUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Newspaper className="w-6 h-6" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-gray-800 truncate">{a.title}</h4>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded ${a.status === "online" ? "bg-green-100 text-green-700" : a.status === "review" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>{a.status}</span>
                  <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{a.category}</span>
                  {a.isHero && <span className="text-[10px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded">DESTAQUE</span>}
                  {a.isBreaking && <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded animate-pulse">URGENTE</span>}
                  <span className="text-[10px] text-gray-400">{a.viewCount} views</span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => updateMutation.mutate({ id: a.id, isHero: !a.isHero })} className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600">{a.isHero ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}</button>
                <button onClick={() => updateMutation.mutate({ id: a.id, status: a.status === "online" ? "draft" : "online" })} className="p-2 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600">{a.status === "online" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                <button onClick={() => startEdit(a)} className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm("Excluir?")) deleteMutation.mutate({ id: a.id }); }} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== UGC MODERATION ===== */
function UGCTab() {
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const { data: submissions = [] } = trpc.ugc.list.useQuery({ status: filter });
  const moderate = trpc.ugc.moderate.useMutation({ onSuccess: () => { utils.ugc.list.invalidate(); utils.ugc.count.invalidate(); toast.success("Moderado!"); } });
  const [reviewNote, setReviewNote] = useState("");

  const statusColors: Record<string, string> = { pending: "bg-yellow-100 text-yellow-700", approved: "bg-green-100 text-green-700", rejected: "bg-red-100 text-red-700", published: "bg-blue-100 text-blue-700" };
  const statusLabels: Record<string, string> = { pending: "Pendente", approved: "Aprovado", rejected: "Rejeitado", published: "Publicado" };

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-800 mb-2">Conteúdo do Usuário (UGC)</h1>
      <p className="text-sm text-gray-500 mb-6">Modere o conteúdo enviado pelos leitores.</p>
      <div className="flex gap-2 mb-4 flex-wrap">
        {[undefined, "pending", "approved", "rejected", "published"].map(s => (
          <button key={s || "all"} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filter === s ? "bg-[#001c56] text-white" : "bg-white text-gray-600 border"}`}>
            {s ? statusLabels[s] : "Todos"}
          </button>
        ))}
      </div>
      {submissions.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400"><Newspaper className="w-12 h-12 mx-auto mb-2" /><p>Nenhum conteúdo encontrado.</p></div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub: any) => (
            <div key={sub.id} className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${statusColors[sub.status]}`}>{statusLabels[sub.status]}</span>
                    <span className="text-[10px] text-gray-400">{sub.category}</span>
                  </div>
                  <h3 className="font-bold text-gray-800">{sub.title}</h3>
                  <p className="text-xs text-gray-400">Enviado em {new Date(sub.createdAt).toLocaleDateString("pt-BR")} · Usuário #{sub.userId}</p>
                </div>
                {sub.imageUrl && <img src={sub.imageUrl} alt="" className="w-20 h-20 rounded-lg object-cover" />}
              </div>
              <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap line-clamp-4">{sub.content}</p>
              {sub.location && <p className="text-xs text-gray-400 mb-3">Local: {sub.location}</p>}
              {sub.status === "pending" && (
                <div className="border-t pt-3 mt-3">
                  <input value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="Nota de revisão (opcional)" className="w-full border rounded-lg px-3 py-2 text-sm mb-2" />
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" onClick={() => { moderate.mutate({ id: sub.id, status: "published", reviewNote }); setReviewNote(""); }} className="bg-green-600 hover:bg-green-700 gap-1"><Check className="w-3 h-3" /> Publicar</Button>
                    <Button size="sm" onClick={() => { moderate.mutate({ id: sub.id, status: "approved", reviewNote }); setReviewNote(""); }} variant="outline" className="gap-1"><Check className="w-3 h-3" /> Aprovar</Button>
                    <Button size="sm" onClick={() => { moderate.mutate({ id: sub.id, status: "rejected", reviewNote }); setReviewNote(""); }} variant="outline" className="text-red-500 gap-1"><X className="w-3 h-3" /> Rejeitar</Button>
                  </div>
                </div>
              )}
              {sub.reviewNote && <p className="text-xs text-gray-500 mt-2 italic">Nota: {sub.reviewNote}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== COMMENTS ===== */
function CommentsTab() {
  const utils = trpc.useUtils();
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const { data: comments = [] } = trpc.comments.listAll.useQuery({ status: filter });
  const moderateComment = trpc.comments.moderate.useMutation({ onSuccess: () => { utils.comments.listAll.invalidate(); toast.success("Moderado!"); } });
  const deleteComment = trpc.comments.delete.useMutation({ onSuccess: () => { utils.comments.listAll.invalidate(); toast.success("Excluído!"); } });

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-800 mb-6">Moderação de Comentários</h1>
      <div className="flex gap-2 mb-4">
        {[undefined, "pending", "approved", "rejected"].map(s => (
          <button key={s || "all"} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filter === s ? "bg-[#001c56] text-white" : "bg-white text-gray-600 border"}`}>
            {s === undefined ? "Todos" : s === "pending" ? "Pendente" : s === "approved" ? "Aprovado" : "Rejeitado"}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {comments.map((c: any) => (
          <div key={c.id} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${c.status === "approved" ? "bg-green-100 text-green-700" : c.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{c.status}</span>
              <span className="text-xs text-gray-400">Artigo #{c.articleId} · {c.authorName || "Anônimo"} · {new Date(c.createdAt).toLocaleDateString("pt-BR")}</span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{c.content}</p>
            <div className="flex gap-2">
              {c.status === "pending" && (
                <>
                  <Button size="sm" variant="outline" onClick={() => moderateComment.mutate({ id: c.id, status: "approved" })} className="text-green-600 gap-1"><Check className="w-3 h-3" /> Aprovar</Button>
                  <Button size="sm" variant="outline" onClick={() => moderateComment.mutate({ id: c.id, status: "rejected" })} className="text-red-500 gap-1"><X className="w-3 h-3" /> Rejeitar</Button>
                </>
              )}
              <Button size="sm" variant="outline" onClick={() => deleteComment.mutate({ id: c.id })} className="text-red-500"><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
        {comments.length === 0 && <div className="bg-white rounded-xl p-8 text-center text-gray-400">Nenhum comentário.</div>}
      </div>
    </div>
  );
}

/* ===== GAMIFICATION ===== */
function GamificationTab() {
  const seedBadges = trpc.gamification.seedBadges.useMutation({ onSuccess: () => toast.success("Badges criados!") });
  const { data: allBadges = [] } = trpc.gamification.allBadges.useQuery();
  const { data: leaderboard = [] } = trpc.gamification.leaderboard.useQuery({ limit: 10 });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-800">Gamificação</h1>
        <Button onClick={() => seedBadges.mutate()} disabled={seedBadges.isPending || allBadges.length > 0} className="bg-[#001c56] gap-2">
          <Trophy className="w-4 h-4" /> {allBadges.length > 0 ? "Badges criados" : "Criar Badges Padrão"}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Badges ({allBadges.length})</h3>
          {allBadges.length === 0 ? <p className="text-gray-400 text-sm">Clique em "Criar Badges Padrão".</p> : (
            <div className="space-y-2">
              {allBadges.map((b: any) => (
                <div key={b.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <span className="text-2xl">{b.iconEmoji}</span>
                  <div className="flex-1"><p className="font-bold text-sm text-gray-800">{b.name}</p><p className="text-xs text-gray-400">{b.description} · +{b.pointsReward} pts</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Top 10 Leitores</h3>
          {leaderboard.length === 0 ? <p className="text-gray-400 text-sm">Nenhum leitor no ranking.</p> : (
            <div className="space-y-2">
              {leaderboard.map((e: any) => (
                <div key={e.userId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <span className="text-lg font-black text-gray-400 w-6">#{e.rank}</span>
                  <div className="flex-1"><p className="font-bold text-sm text-gray-800">{e.name}</p><p className="text-xs text-gray-400">Nível {e.level} · {e.articlesRead} artigos</p></div>
                  <span className="font-black text-[#001c56]">{e.totalPoints.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===== USERS ===== */
function UsersTab() {
  const utils = trpc.useUtils();
  const { data: users = [] } = trpc.users.list.useQuery();
  const updateRole = trpc.users.updateRole.useMutation({ onSuccess: () => { utils.users.list.invalidate(); toast.success("Papel atualizado!"); } });

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-800 mb-6">Usuários ({users.length})</h1>
      <div className="space-y-2">
        {users.map((u: any) => (
          <div key={u.id} className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-800 text-sm">{u.name || "Sem nome"}</p>
              <p className="text-xs text-gray-400">{u.email || u.openId} · Desde {new Date(u.createdAt).toLocaleDateString("pt-BR")}</p>
            </div>
            <select value={u.role} onChange={e => updateRole.mutate({ id: u.id, role: e.target.value as any })}
              className={`text-xs font-bold px-3 py-1 rounded-full border-0 cursor-pointer ${u.role === "admin" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
              <option value="user">Usuário</option><option value="admin">Admin</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== AUDIT LOGS ===== */
function AuditTab() {
  const [severity, setSeverity] = useState<string | undefined>(undefined);
  const { data: logs = [] } = trpc.audit.list.useQuery({ severity, limit: 100 });

  const severityColors: Record<string, string> = { info: "bg-blue-100 text-blue-700", warning: "bg-yellow-100 text-yellow-700", critical: "bg-red-100 text-red-700" };

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-800 mb-2">Logs de Auditoria</h1>
      <p className="text-sm text-gray-500 mb-6">Monitoramento de segurança e ações administrativas.</p>
      <div className="flex gap-2 mb-4">
        {[undefined, "info", "warning", "critical"].map(s => (
          <button key={s || "all"} onClick={() => setSeverity(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${severity === s ? "bg-[#001c56] text-white" : "bg-white text-gray-600 border"}`}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : "Todos"}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-bold text-gray-600">Data</th>
              <th className="text-left px-4 py-3 font-bold text-gray-600">Severidade</th>
              <th className="text-left px-4 py-3 font-bold text-gray-600">Ação</th>
              <th className="text-left px-4 py-3 font-bold text-gray-600">Usuário</th>
              <th className="text-left px-4 py-3 font-bold text-gray-600">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.map((log: any) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString("pt-BR")}</td>
                <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${severityColors[log.severity]}`}>{log.severity}</span></td>
                <td className="px-4 py-3 font-medium text-gray-800">{log.action}</td>
                <td className="px-4 py-3 text-gray-600">{log.userName || `#${log.userId || "-"}`}</td>
                <td className="px-4 py-3 text-xs text-gray-400 max-w-xs truncate">{log.details}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Nenhum log encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ===== ADS ===== */
function AdsTab() {
  const utils = trpc.useUtils();
  const { data: ads = [] } = trpc.ads.list.useQuery({});
  const createAd = trpc.ads.create.useMutation({ onSuccess: () => { utils.ads.list.invalidate(); toast.success("Anúncio criado!"); setShowForm(false); resetForm(); } });
  const updateAd = trpc.ads.update.useMutation({ onSuccess: () => { utils.ads.list.invalidate(); toast.success("Atualizado!"); } });
  const deleteAd = trpc.ads.delete.useMutation({ onSuccess: () => { utils.ads.list.invalidate(); toast.success("Excluído!"); } });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ imageUrl: "", link: "", sponsor: "", placement: "horizontal" as "horizontal" | "lateral", type: "custom" as "google" | "custom" });
  const resetForm = () => setForm({ imageUrl: "", link: "", sponsor: "", placement: "horizontal", type: "custom" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black text-gray-800">Anúncios ({ads.length})</h1>
        <Button onClick={() => setShowForm(!showForm)} className="bg-[#001c56] gap-2"><Plus className="w-4 h-4" /> Novo</Button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input placeholder="URL da Imagem" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Link de destino" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
          <input placeholder="Patrocinador" value={form.sponsor} onChange={e => setForm({ ...form, sponsor: e.target.value })} className="border rounded-lg px-3 py-2 text-sm" />
          <select value={form.placement} onChange={e => setForm({ ...form, placement: e.target.value as any })} className="border rounded-lg px-3 py-2 text-sm">
            <option value="horizontal">Horizontal</option><option value="lateral">Lateral</option>
          </select>
          <Button onClick={() => createAd.mutate(form)} className="bg-[#001c56] md:col-span-2">Criar Anúncio</Button>
        </div>
      )}
      <div className="space-y-2">
        {ads.map((ad: any) => (
          <div key={ad.id} className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              {ad.imageUrl && <img src={ad.imageUrl} alt="" className="w-16 h-10 rounded object-cover" />}
              <div><p className="font-bold text-sm text-gray-800">{ad.sponsor || "Sem patrocinador"}</p><p className="text-xs text-gray-400">{ad.placement} · {ad.isActive ? "Ativo" : "Inativo"}</p></div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => updateAd.mutate({ id: ad.id, isActive: !ad.isActive })}>{ad.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}</Button>
              <Button size="sm" variant="outline" className="text-red-500" onClick={() => deleteAd.mutate({ id: ad.id })}><Trash2 className="w-3 h-3" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== TICKER ===== */
function TickerTab() {
  const utils = trpc.useUtils();
  const { data: items = [] } = trpc.ticker.list.useQuery();
  const createTicker = trpc.ticker.create.useMutation({ onSuccess: () => { utils.ticker.list.invalidate(); toast.success("Criado!"); setText(""); } });
  const deleteTicker = trpc.ticker.delete.useMutation({ onSuccess: () => { utils.ticker.list.invalidate(); toast.success("Excluído!"); } });
  const [text, setText] = useState("");

  return (
    <div>
      <h1 className="text-2xl font-black text-gray-800 mb-6">Ticker de Notícias</h1>
      <div className="flex gap-2 mb-6">
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Texto do ticker..." className="flex-1 border rounded-lg px-3 py-2 text-sm" />
        <Button onClick={() => text.trim() && createTicker.mutate({ text: text.trim() })} className="bg-[#001c56]"><Plus className="w-4 h-4" /></Button>
      </div>
      <div className="space-y-2">
        {items.map((item: any) => (
          <div key={item.id} className="bg-white rounded-lg p-3 shadow-sm flex items-center justify-between">
            <p className="text-sm text-gray-700">{item.text}</p>
            <Button size="sm" variant="outline" className="text-red-500" onClick={() => deleteTicker.mutate({ id: item.id })}><Trash2 className="w-3 h-3" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
