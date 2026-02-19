import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Newspaper, Megaphone, BarChart3, ArrowLeft, Plus, Trash2,
  Edit, Eye, EyeOff, Star, StarOff, TicketSlash, Type, LogOut,
} from "lucide-react";

const CATEGORIES = ["GERAL", "POLÍTICA", "ESPORTES", "ECONOMIA", "DIA A DIA", "GLOBAL"];

export default function Admin() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"articles" | "ads" | "ticker" | "stats">("articles");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-10 h-10 border-4 border-[#001c56] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <div className="bg-[#001c56] text-white px-3 py-1 rounded-3xl font-black text-3xl inline-block mb-4">CNN</div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">Painel Administrativo</h2>
          <p className="text-gray-500 mb-6">Faça login para acessar o painel de gerenciamento.</p>
          <a href={getLoginUrl()} className="inline-block bg-[#001c56] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#002a7a] transition-colors">
            Entrar com Manus
          </a>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <h2 className="text-2xl font-black text-red-600 mb-2">Acesso Negado</h2>
          <p className="text-gray-500 mb-6">Você não tem permissão de administrador.</p>
          <a href="/" className="inline-block bg-[#001c56] text-white px-6 py-3 rounded-xl font-bold">Voltar ao Portal</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#001c56] text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="bg-white text-[#001c56] px-2 py-0.5 rounded-2xl font-black text-lg">CNN</div>
            <span className="font-black text-lg">Admin</span>
          </div>
          <p className="text-blue-200 text-xs mt-1">{user?.name || user?.email}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { key: "articles" as const, icon: Newspaper, label: "Notícias" },
            { key: "ads" as const, icon: Megaphone, label: "Anúncios" },
            { key: "ticker" as const, icon: Type, label: "Ticker" },
            { key: "stats" as const, icon: BarChart3, label: "Estatísticas" },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                activeTab === item.key ? "bg-white/20 text-white" : "text-blue-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-2">
          <a href="/" className="flex items-center gap-2 text-blue-200 hover:text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Portal
          </a>
          <button onClick={() => logout()} className="flex items-center gap-2 text-blue-200 hover:text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/10 transition-colors w-full">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-auto">
        {activeTab === "articles" && <ArticlesPanel />}
        {activeTab === "ads" && <AdsPanel />}
        {activeTab === "ticker" && <TickerPanel />}
        {activeTab === "stats" && <StatsPanel />}
      </div>
    </div>
  );
}

/* ===== ARTICLES PANEL ===== */
function ArticlesPanel() {
  const utils = trpc.useUtils();
  const { data: articles = [], isLoading } = trpc.articles.list.useQuery({});
  const createMutation = trpc.articles.create.useMutation({ onSuccess: () => { utils.articles.list.invalidate(); toast.success("Notícia criada!"); setIsCreating(false); resetForm(); } });
  const updateMutation = trpc.articles.update.useMutation({ onSuccess: () => { utils.articles.list.invalidate(); toast.success("Notícia atualizada!"); setEditingId(null); } });
  const deleteMutation = trpc.articles.delete.useMutation({ onSuccess: () => { utils.articles.list.invalidate(); toast.success("Notícia excluída!"); } });

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", excerpt: "", content: "", category: "GERAL", imageUrl: "", status: "draft" as "online" | "draft", isHero: false });

  const resetForm = () => setForm({ title: "", excerpt: "", content: "", category: "GERAL", imageUrl: "", status: "draft", isHero: false });

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error("Título é obrigatório"); return; }
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate(form);
    }
  };

  const startEdit = (article: any) => {
    setEditingId(article.id);
    setIsCreating(true);
    setForm({
      title: article.title,
      excerpt: article.excerpt || "",
      content: article.content || "",
      category: article.category,
      imageUrl: article.imageUrl || "",
      status: article.status,
      isHero: article.isHero,
    });
  };

  const toggleStatus = (article: any) => {
    updateMutation.mutate({ id: article.id, status: article.status === "online" ? "draft" : "online" });
  };

  const toggleHero = (article: any) => {
    updateMutation.mutate({ id: article.id, isHero: !article.isHero });
  };

  if (isCreating) {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-gray-800">{editingId ? "Editar Notícia" : "Nova Notícia"}</h2>
          <Button variant="outline" onClick={() => { setIsCreating(false); setEditingId(null); resetForm(); }}>Cancelar</Button>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Título *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]" placeholder="Título da notícia" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Resumo</label>
            <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]" placeholder="Breve resumo da notícia" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Conteúdo</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]" placeholder="Conteúdo completo da notícia..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Categoria</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "online" | "draft" })} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]">
                <option value="draft">Rascunho</option>
                <option value="online">Online</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">URL da Imagem</label>
            <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]" placeholder="https://..." />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isHero} onChange={(e) => setForm({ ...form, isHero: e.target.checked })} className="w-5 h-5 rounded border-gray-300 text-[#001c56]" />
            <span className="text-sm font-bold text-gray-700">Destaque (Hero)</span>
          </label>
          <Button onClick={handleSubmit} className="w-full bg-[#001c56] hover:bg-[#002a7a] text-white font-bold py-3 rounded-xl" disabled={createMutation.isPending || updateMutation.isPending}>
            {createMutation.isPending || updateMutation.isPending ? "Salvando..." : editingId ? "Atualizar Notícia" : "Publicar Notícia"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-800">Notícias ({articles.length})</h2>
        <Button onClick={() => { setIsCreating(true); resetForm(); }} className="bg-[#001c56] hover:bg-[#002a7a] text-white font-bold rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Nova Notícia
        </Button>
      </div>
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
          <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-bold">Nenhuma notícia cadastrada</p>
          <p className="text-gray-400 text-sm">Clique em "Nova Notícia" para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article: any) => (
            <div key={article.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 group hover:shadow-md transition-shadow">
              <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {article.imageUrl ? (
                  <img src={article.imageUrl} className="w-full h-full object-cover" alt="" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300"><Newspaper className="w-6 h-6" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-gray-800 truncate">{article.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black uppercase bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{article.category}</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${article.status === "online" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {article.status === "online" ? "Online" : "Rascunho"}
                  </span>
                  {article.isHero && <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Destaque</span>}
                  <span className="text-[10px] text-gray-400">{article.viewCount} views</span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => toggleHero(article)} className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600" title={article.isHero ? "Remover destaque" : "Destacar"}>
                  {article.isHero ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                </button>
                <button onClick={() => toggleStatus(article)} className="p-2 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600" title={article.status === "online" ? "Despublicar" : "Publicar"}>
                  {article.status === "online" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => startEdit(article)} className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600" title="Editar">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => { if (confirm("Excluir esta notícia?")) deleteMutation.mutate({ id: article.id }); }} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600" title="Excluir">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== ADS PANEL ===== */
function AdsPanel() {
  const utils = trpc.useUtils();
  const { data: ads = [], isLoading } = trpc.ads.list.useQuery({});
  const createMutation = trpc.ads.create.useMutation({ onSuccess: () => { utils.ads.list.invalidate(); toast.success("Anúncio criado!"); setIsCreating(false); resetForm(); } });
  const updateMutation = trpc.ads.update.useMutation({ onSuccess: () => { utils.ads.list.invalidate(); toast.success("Anúncio atualizado!"); } });
  const deleteMutation = trpc.ads.delete.useMutation({ onSuccess: () => { utils.ads.list.invalidate(); toast.success("Anúncio excluído!"); } });

  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({ type: "custom" as "google" | "custom", placement: "horizontal" as "horizontal" | "lateral", imageUrl: "", link: "", sponsor: "", duration: 5000, isActive: true });

  const resetForm = () => setForm({ type: "custom", placement: "horizontal", imageUrl: "", link: "", sponsor: "", duration: 5000, isActive: true });

  const handleSubmit = () => {
    createMutation.mutate(form);
  };

  const toggleActive = (ad: any) => {
    updateMutation.mutate({ id: ad.id, isActive: !ad.isActive });
  };

  if (isCreating) {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-gray-800">Novo Anúncio</h2>
          <Button variant="outline" onClick={() => { setIsCreating(false); resetForm(); }}>Cancelar</Button>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tipo</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]">
                <option value="custom">Personalizado</option>
                <option value="google">Google AdSense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Posição</label>
              <select value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value as any })} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]">
                <option value="horizontal">Horizontal (728x90)</option>
                <option value="lateral">Lateral (300x600)</option>
              </select>
            </div>
          </div>
          {form.type === "custom" && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">URL da Imagem</label>
                <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Link de Destino</label>
                <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Patrocinador</label>
                <input value={form.sponsor} onChange={(e) => setForm({ ...form, sponsor: e.target.value })} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]" placeholder="Nome do patrocinador" />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Duração (ms)</label>
            <input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 5000 })} className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]" />
          </div>
          <Button onClick={handleSubmit} className="w-full bg-[#001c56] hover:bg-[#002a7a] text-white font-bold py-3 rounded-xl" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Salvando..." : "Criar Anúncio"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-800">Anúncios ({ads.length})</h2>
        <Button onClick={() => setIsCreating(true)} className="bg-[#001c56] hover:bg-[#002a7a] text-white font-bold rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Novo Anúncio
        </Button>
      </div>
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : ads.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
          <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-bold">Nenhum anúncio cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map((ad: any) => (
            <div key={ad.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4 group hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-800">{ad.type === "google" ? "Google AdSense" : ad.sponsor || "Anúncio Personalizado"}</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${ad.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {ad.isActive ? "Ativo" : "Inativo"}
                  </span>
                  <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{ad.placement}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => toggleActive(ad)} className="p-2 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600">
                  {ad.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => { if (confirm("Excluir este anúncio?")) deleteMutation.mutate({ id: ad.id }); }} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== TICKER PANEL ===== */
function TickerPanel() {
  const utils = trpc.useUtils();
  const { data: items = [], isLoading } = trpc.ticker.list.useQuery();
  const createMutation = trpc.ticker.create.useMutation({ onSuccess: () => { utils.ticker.list.invalidate(); toast.success("Item adicionado!"); setNewText(""); } });
  const deleteMutation = trpc.ticker.delete.useMutation({ onSuccess: () => { utils.ticker.list.invalidate(); toast.success("Item removido!"); } });
  const [newText, setNewText] = useState("");

  return (
    <div className="max-w-3xl">
      <h2 className="text-2xl font-black text-gray-800 mb-6">Ticker de Notícias</h2>
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
        <label className="block text-sm font-bold text-gray-700 mb-2">Novo item do ticker</label>
        <div className="flex gap-2">
          <input value={newText} onChange={(e) => setNewText(e.target.value)} className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]" placeholder="Texto que aparecerá no ticker..." onKeyDown={(e) => { if (e.key === "Enter" && newText.trim()) createMutation.mutate({ text: newText.trim() }); }} />
          <Button onClick={() => { if (newText.trim()) createMutation.mutate({ text: newText.trim() }); }} className="bg-[#001c56] hover:bg-[#002a7a] text-white font-bold rounded-xl" disabled={createMutation.isPending}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-2xl shadow-sm">
          <Type className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-bold">Nenhum item no ticker</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item: any) => (
            <div key={item.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 group hover:shadow-md transition-shadow">
              <span className="flex-1 text-sm text-gray-700">{item.text}</span>
              <button onClick={() => deleteMutation.mutate({ id: item.id })} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===== STATS PANEL ===== */
function StatsPanel() {
  const { data: stats, isLoading } = trpc.stats.overview.useQuery();

  if (isLoading) return <div className="text-center py-12 text-gray-400">Carregando estatísticas...</div>;

  return (
    <div>
      <h2 className="text-2xl font-black text-gray-800 mb-6">Estatísticas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total de Notícias</p>
          <p className="text-4xl font-black text-[#001c56] mt-2">{stats?.articleCount ?? 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Visualizações Totais</p>
          <p className="text-4xl font-black text-[#001c56] mt-2">{stats?.totalViews ?? 0}</p>
        </div>
      </div>
    </div>
  );
}
