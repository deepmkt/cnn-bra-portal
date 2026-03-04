import { useState, useRef, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  LayoutDashboard, FileText, MessageCircle, Users, Shield, Megaphone,
  Plus, Trash2, Edit, Eye, EyeOff, Check, X, ArrowLeft, Star, StarOff,
  Bell, Newspaper, Type, LogOut, BarChart3, Upload, Image, Video,
  Globe, Code, Download, RefreshCw, MapPin, Zap, Volume2,
  Search, AlertCircle, Trophy, PlayCircle
} from "lucide-react";

// ===== TYPES =====
type Tab = "dashboard" | "articles" | "hero" | "media" | "ads" | "ticker" | "seo" | "import" | "comments" | "users" | "ugc" | "shorts" | "gamification" | "adminUsers" | "backup";
type AdminRole = "admin" | "editor" | "contributor";

const CATEGORIES = ["GERAL", "POLÍTICA", "ECONOMIA", "ESPORTES", "TECNOLOGIA", "SAÚDE", "ENTRETENIMENTO", "MUNDO", "BRASIL", "DIA A DIA", "GLOBAL"];

const BRAZILIAN_STATES = [
  { code: "", label: "Nacional (sem estado)" },
  { code: "AC", label: "Acre" }, { code: "AL", label: "Alagoas" },
  { code: "AP", label: "Amapá" }, { code: "AM", label: "Amazonas" },
  { code: "BA", label: "Bahia" }, { code: "CE", label: "Ceará" },
  { code: "DF", label: "Distrito Federal" }, { code: "ES", label: "Espírito Santo" },
  { code: "GO", label: "Goiás" }, { code: "MA", label: "Maranhão" },
  { code: "MT", label: "Mato Grosso" }, { code: "MS", label: "Mato Grosso do Sul" },
  { code: "MG", label: "Minas Gerais" }, { code: "PA", label: "Pará" },
  { code: "PB", label: "Paraíba" }, { code: "PR", label: "Paraná" },
  { code: "PE", label: "Pernambuco" }, { code: "PI", label: "Piauí" },
  { code: "RJ", label: "Rio de Janeiro" }, { code: "RN", label: "Rio Grande do Norte" },
  { code: "RS", label: "Rio Grande do Sul" }, { code: "RO", label: "Rondônia" },
  { code: "RR", label: "Roraima" }, { code: "SC", label: "Santa Catarina" },
  { code: "SP", label: "São Paulo" }, { code: "SE", label: "Sergipe" },
  { code: "TO", label: "Tocantins" },
];

// ===== ADMIN LOGIN SCREEN =====
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const loginMut = trpc.adminAuth.login.useMutation({
    onSuccess: () => { toast.success("Login realizado com sucesso!"); onLogin(); },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    loginMut.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#001c56] to-[#002a7a]">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-[#001c56] text-white px-4 py-2 rounded-3xl font-black text-3xl inline-block mb-3">CNN</div>
          <div className="text-red-600 font-black text-lg">.BRA</div>
          <h2 className="text-2xl font-black text-gray-800 mt-2">Painel Administrativo</h2>
          <p className="text-gray-500 text-sm mt-1">Acesso restrito à equipe editorial</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">E-mail</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com" className="mt-1" required />
          </div>
          <div>
            <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Senha</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" className="mt-1" required />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}
          <Button type="submit" className="w-full bg-[#001c56] hover:bg-[#002a7a] text-white font-bold py-3"
            disabled={loginMut.isPending}>
            {loginMut.isPending ? "Entrando..." : "Entrar no Painel"}
          </Button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-6">
          <a href="/" className="hover:text-gray-600">← Voltar ao portal</a>
        </p>
      </div>
    </div>
  );
}

// ===== ARTICLE FORM =====
function ArticleForm({ article, onSave, onCancel, mediaItems }: {
  article?: any; onSave: () => void; onCancel: () => void; mediaItems: any[];
}) {
  const [form, setForm] = useState({
    title: article?.title || "",
    excerpt: article?.excerpt || "",
    content: article?.content || "",
    category: article?.category || "GERAL",
    tags: article?.tags || "",
    imageUrl: article?.imageUrl || "",
    videoUrl: article?.videoUrl || "",
    status: article?.status || "draft",
    isHero: article?.isHero || false,
    isFeatured: article?.isFeatured || false,
    isBreaking: article?.isBreaking || false,
    state: article?.state || "",
    newCategory: "",
  });
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [categories, setCategories] = useState([...CATEGORIES]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [showSuggestedTags, setShowSuggestedTags] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const utils = trpc.useUtils();

  // Parse current tags from JSON string to array
  const currentTagsArray = (): string[] => {
    try { return JSON.parse(form.tags || "[]"); } catch { return []; }
  };

  // Add a tag to the current tags list
  const addTag = (tag: string) => {
    const t = tag.toLowerCase().trim();
    if (!t) return;
    const current = currentTagsArray();
    if (!current.includes(t)) {
      setForm(f => ({ ...f, tags: JSON.stringify([...current, t]) }));
    }
    setSuggestedTags(prev => prev.filter(s => s !== t));
  };

  // Remove a tag from the current tags list
  const removeTag = (tag: string) => {
    const current = currentTagsArray().filter(t => t !== tag);
    setForm(f => ({ ...f, tags: JSON.stringify(current) }));
  };

  const suggestTagsMut = trpc.tags.suggest.useMutation({
    onSuccess: (data) => {
      const current = currentTagsArray();
      const newSuggestions = data.tags.filter(t => !current.includes(t));
      setSuggestedTags(newSuggestions);
      setShowSuggestedTags(true);
      if (newSuggestions.length === 0) toast.info("Nenhuma tag nova para sugerir.");
      else toast.success(`${newSuggestions.length} tags sugeridas pela IA!`);
    },
    onError: () => toast.error("Erro ao sugerir tags. Tente novamente."),
  });

  const createMut = trpc.articles.create.useMutation({
    onSuccess: () => { toast.success("Notícia criada!"); utils.articles.list.invalidate(); onSave(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.articles.update.useMutation({
    onSuccess: () => { toast.success("Notícia atualizada!"); utils.articles.list.invalidate(); onSave(); },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = (status: string) => {
    const data = { ...form, status: status as any };
    if (article?.id) updateMut.mutate({ id: article.id, ...data });
    else createMut.mutate(data);
  };

  const addCategory = () => {
    if (form.newCategory.trim() && !categories.includes(form.newCategory.trim().toUpperCase())) {
      const newCat = form.newCategory.trim().toUpperCase();
      setCategories(prev => [...prev, newCat]);
      setForm(f => ({ ...f, category: newCat, newCategory: "" }));
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <h3 className="font-black text-lg text-gray-800">{article?.id ? "Editar Notícia" : "Nova Notícia"}</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <Label className="font-semibold">Título *</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Título da notícia..." className="mt-1 text-lg font-semibold" />
          </div>
          <div>
            <Label className="font-semibold">Resumo (Excerpt)</Label>
            <Textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
              placeholder="Breve resumo da notícia..." className="mt-1" rows={3} />
          </div>
          <div>
            <Label className="font-semibold">Conteúdo Completo</Label>
            <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Texto completo da notícia..." className="mt-1 font-mono text-sm" rows={16} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 border">
            <Label className="font-semibold text-sm">Imagem de Capa</Label>
            {form.imageUrl ? (
              <div className="mt-2 relative">
                <img src={form.imageUrl} alt="Capa" className="w-full h-32 object-cover rounded-lg" />
                <button onClick={() => setForm(f => ({ ...f, imageUrl: "" }))}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-400 text-sm">
                <Image className="w-8 h-8 mx-auto mb-1 opacity-40" />Nenhuma imagem selecionada
              </div>
            )}
            <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
              placeholder="URL da imagem..." className="mt-2 text-xs" />
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setShowMediaGallery(true)}>
              <Image className="w-3 h-3 mr-1" /> Escolher da Galeria
            </Button>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border">
            <Label className="font-semibold text-sm">URL do Vídeo (MP4/YouTube)</Label>
            <Input value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
              placeholder="https://..." className="mt-2 text-xs" />
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border">
            <Label className="font-semibold text-sm">Categoria</Label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white">
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex gap-1 mt-2">
              <Input value={form.newCategory} onChange={e => setForm(f => ({ ...f, newCategory: e.target.value }))}
                placeholder="Nova categoria..." className="text-xs h-8" />
              <Button size="sm" variant="outline" onClick={addCategory} className="h-8 px-2">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border">
            <Label className="font-semibold text-sm flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Estado (Regionalização)
            </Label>
            <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white">
              {BRAZILIAN_STATES.map(s => <option key={s.code} value={s.code}>{s.label}</option>)}
            </select>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border space-y-3">
            <Label className="font-semibold text-sm">Destaques e Visibilidade</Label>
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" /> Hero (Carrossel)</Label>
              <Switch checked={form.isHero} onCheckedChange={v => setForm(f => ({ ...f, isHero: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-1"><Zap className="w-3 h-3 text-blue-500" /> Destaque na Grade</Label>
              <Switch checked={form.isFeatured} onCheckedChange={v => setForm(f => ({ ...f, isFeatured: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-1"><Bell className="w-3 h-3 text-red-500" /> Urgente (Breaking)</Label>
              <Switch checked={form.isBreaking} onCheckedChange={v => setForm(f => ({ ...f, isBreaking: v }))} />
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 border space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-sm flex items-center gap-1">
                <Search className="w-3 h-3" /> Tags
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs px-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                disabled={!form.title || suggestTagsMut.isPending}
                onClick={() => suggestTagsMut.mutate({
                  title: form.title,
                  excerpt: form.excerpt,
                  content: form.content,
                  category: form.category,
                })}
              >
                {suggestTagsMut.isPending ? (
                  <><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Analisando...</>
                ) : (
                  <><Zap className="w-3 h-3 mr-1" /> Sugerir com IA</>
                )}
              </Button>
            </div>

            {/* Current tags as chips */}
            {currentTagsArray().length > 0 && (
              <div className="flex flex-wrap gap-1">
                {currentTagsArray().map(tag => (
                  <span key={tag}
                    className="inline-flex items-center gap-1 bg-[#001c56] text-white text-xs px-2 py-0.5 rounded-full">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}
                      className="hover:text-red-300 transition-colors">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* AI Suggested tags */}
            {showSuggestedTags && suggestedTags.length > 0 && (
              <div className="border border-purple-200 rounded-lg p-2 bg-purple-50">
                <p className="text-xs text-purple-600 font-semibold mb-1.5 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Sugestões da IA — clique para adicionar:
                </p>
                <div className="flex flex-wrap gap-1">
                  {suggestedTags.map(tag => (
                    <button key={tag} type="button" onClick={() => addTag(tag)}
                      className="inline-flex items-center gap-1 bg-white border border-purple-300 text-purple-700 text-xs px-2 py-0.5 rounded-full hover:bg-purple-100 transition-colors">
                      <Plus className="w-2.5 h-2.5" /> {tag}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => { setSuggestedTags([]); setShowSuggestedTags(false); }}
                  className="text-xs text-gray-400 mt-1.5 hover:text-gray-600">
                  Descartar sugestões
                </button>
              </div>
            )}

            {/* Manual tag input */}
            <div className="flex gap-1">
              <Input
                value={newTagInput}
                onChange={e => setNewTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addTag(newTagInput); setNewTagInput(""); } }}
                placeholder="Adicionar tag manualmente..."
                className="text-xs h-8"
              />
              <Button type="button" size="sm" variant="outline" className="h-8 px-2"
                onClick={() => { addTag(newTagInput); setNewTagInput(""); }}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-xs text-gray-400">Pressione Enter ou clique + para adicionar</p>
          </div>

          <div className="space-y-2">
            <Button onClick={() => handleSave("online")} disabled={isPending || !form.title}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold">
              <Eye className="w-4 h-4 mr-1" />{isPending ? "Salvando..." : "Publicar (Online)"}
            </Button>
            <Button onClick={() => handleSave("draft")} disabled={isPending || !form.title}
              variant="outline" className="w-full font-bold">
              <EyeOff className="w-4 h-4 mr-1" /> Salvar como Rascunho
            </Button>
            <Button onClick={onCancel} variant="ghost" className="w-full text-gray-500">Cancelar</Button>
          </div>
        </div>
      </div>

      {showMediaGallery && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-black text-lg">Galeria de Mídia</h3>
              <button onClick={() => setShowMediaGallery(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {mediaItems.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <Image className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>Nenhuma mídia disponível. Faça upload na aba Mídia.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {mediaItems.map((item: any) => (
                    <button key={item.id} onClick={() => { setForm(f => ({ ...f, imageUrl: item.url })); setShowMediaGallery(false); }}
                      className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-[#001c56] transition-all">
                      {item.mimeType?.startsWith("video/") ? (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          <Video className="w-8 h-8 text-white opacity-60" />
                        </div>
                      ) : (
                        <img src={item.url} alt={item.alt || item.filename} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                        <Check className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== ARTICLES TAB =====
function ArticlesTab() {
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const utils = trpc.useUtils();
  const { data: articles = [], isLoading } = trpc.articles.list.useQuery({ search: search || undefined, status: statusFilter || undefined, limit: 100 });
  const { data: mediaItems = [] } = trpc.mediaUpload.list.useQuery();
  const deleteMut = trpc.articles.delete.useMutation({
    onSuccess: () => { toast.success("Notícia excluída!"); utils.articles.list.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.articles.update.useMutation({
    onSuccess: () => utils.articles.list.invalidate(),
  });

  if (showForm) {
    return <ArticleForm article={editingArticle} mediaItems={mediaItems}
      onSave={() => { setShowForm(false); setEditingArticle(null); }}
      onCancel={() => { setShowForm(false); setEditingArticle(null); }} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black text-gray-800">Gerenciar Notícias</h2>
        <Button onClick={() => { setEditingArticle(null); setShowForm(true); }}
          className="bg-[#001c56] hover:bg-[#002a7a] text-white font-bold">
          <Plus className="w-4 h-4 mr-1" /> Nova Notícia
        </Button>
      </div>
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar notícias..." className="pl-9" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">Todos os status</option>
          <option value="online">Online</option>
          <option value="draft">Rascunho</option>
          <option value="review">Em revisão</option>
        </select>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-[#001c56] border-t-transparent rounded-full" /></div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Nenhuma notícia encontrada.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {articles.map((article: any) => (
            <div key={article.id} className="bg-white rounded-xl border p-4 flex items-start gap-3 hover:shadow-sm transition-shadow">
              {article.imageUrl && <img src={article.imageUrl} alt={article.title} className="w-16 h-12 object-cover rounded-lg shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${article.status === "online" ? "bg-green-100 text-green-700" : article.status === "draft" ? "bg-gray-100 text-gray-600" : "bg-yellow-100 text-yellow-700"}`}>{article.status}</span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{article.category}</span>
                  {article.state && <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">{article.state}</span>}
                  {article.isHero && <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">⭐ Hero</span>}
                  {article.isFeatured && <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">⚡ Destaque</span>}
                  {article.isBreaking && <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">🔴 Urgente</span>}
                </div>
                <p className="font-semibold text-gray-800 text-sm truncate">{article.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(article.createdAt).toLocaleDateString("pt-BR")} · {article.viewCount} views</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="sm" variant="ghost" onClick={() => updateMut.mutate({ id: article.id, status: article.status === "online" ? "draft" : "online" })}>
                  {article.status === "online" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditingArticle(article); setShowForm(true); }}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700"
                  onClick={() => { if (confirm("Excluir permanentemente?")) deleteMut.mutate({ id: article.id }); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== MEDIA TAB =====
function MediaTab() {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const { data: mediaItems = [], isLoading } = trpc.mediaUpload.list.useQuery({ limit: 100 });
  const uploadMut = trpc.mediaUpload.upload.useMutation({
    onSuccess: () => { toast.success("Arquivo enviado!"); utils.mediaUpload.list.invalidate(); },
    onError: (e) => toast.error(`Erro no upload: ${e.message}`),
  });

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      if (file.size > 16 * 1024 * 1024) { toast.error(`${file.name}: arquivo muito grande (máx 16MB)`); continue; }
      try {
        const reader = new FileReader();
        const dataBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        await uploadMut.mutateAsync({ filename: file.name, mimeType: file.type, dataBase64 });
      } catch { toast.error(`Erro ao enviar ${file.name}`); }
    }
    setUploading(false);
  }, [uploadMut]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-800">Biblioteca de Mídia</h2>
      <div onDrop={handleDrop} onDragOver={e => e.preventDefault()} onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 hover:border-[#001c56] rounded-xl p-8 text-center cursor-pointer transition-colors bg-gray-50 hover:bg-blue-50">
        <Upload className="w-10 h-10 mx-auto mb-2 text-gray-400" />
        <p className="font-semibold text-gray-600">Clique ou arraste arquivos aqui</p>
        <p className="text-sm text-gray-400 mt-1">PNG, JPG, GIF, MP4 — máx. 16MB por arquivo</p>
        {uploading && <p className="text-blue-600 font-semibold mt-2 animate-pulse">Enviando...</p>}
        <input ref={fileInputRef} type="file" multiple accept="image/png,image/jpeg,image/gif,image/webp,video/mp4"
          className="hidden" onChange={e => handleFileUpload(e.target.files)} />
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8"><div className="animate-spin w-8 h-8 border-4 border-[#001c56] border-t-transparent rounded-full" /></div>
      ) : mediaItems.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Image className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Nenhuma mídia enviada ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {mediaItems.map((item: any) => (
            <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden border bg-gray-100">
              {item.mimeType?.startsWith("video/") ? (
                <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center gap-1">
                  <Video className="w-8 h-8 text-white opacity-60" /><span className="text-white text-xs opacity-60">MP4</span>
                </div>
              ) : (
                <img src={item.url} alt={item.alt || item.filename} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button onClick={() => { navigator.clipboard.writeText(item.url); toast.success("URL copiada!"); }}
                  className="bg-white text-gray-800 text-xs px-3 py-1 rounded-full font-semibold">Copiar URL</button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-all">
                {item.filename}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== ADS TAB =====
function AdsTab() {
  const AD_PLACEMENTS = [
    { key: "home-top",        label: "Home — Topo Central",      desc: "728×90 · Abaixo do hero principal",          color: "bg-blue-50 border-blue-200" },
    { key: "home-mid",        label: "Home — Meio do Feed",       desc: "728×90 · Entre os blocos de notícias",        color: "bg-indigo-50 border-indigo-200" },
    { key: "home-sidebar",    label: "Home — Barra Lateral",      desc: "300×250 · Sidebar da página inicial",         color: "bg-purple-50 border-purple-200" },
    { key: "article-mid",     label: "Notícia — Meio do Conteúdo",desc: "728×90 · No meio do texto do artigo",         color: "bg-orange-50 border-orange-200" },
    { key: "article-sidebar", label: "Notícia — Barra Lateral",   desc: "300×250 · Sidebar das páginas de notícia",    color: "bg-rose-50 border-rose-200" },
  ] as const;

  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: "custom" as "custom" | "google",
    placement: "home-top" as string,
    imageUrl: "", adCode: "", link: "", sponsor: "", duration: 5000, position: 0, isActive: true
  });
  const [uploading, setUploading] = useState(false);
  const utils = trpc.useUtils();
  const { data: ads = [], isLoading } = trpc.ads.list.useQuery();
  const createMut = trpc.ads.create.useMutation({
    onSuccess: () => { toast.success("Anúncio criado!"); utils.ads.list.invalidate(); setShowForm(false); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.ads.update.useMutation({
    onSuccess: () => { toast.success("Anúncio atualizado!"); utils.ads.list.invalidate(); setShowForm(false); setEditingAd(null); resetForm(); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.ads.delete.useMutation({
    onSuccess: () => { toast.success("Anúncio excluído!"); utils.ads.list.invalidate(); },
  });
  const toggleMut = trpc.ads.update.useMutation({ onSuccess: () => utils.ads.list.invalidate() });

  const resetForm = () => setForm({ type: "custom", placement: activeSection || "home-top", imageUrl: "", adCode: "", link: "", sponsor: "", duration: 5000, position: 0, isActive: true });

  const openEdit = (ad: any) => {
    setEditingAd(ad);
    setForm({ type: ad.type, placement: ad.placement, imageUrl: ad.imageUrl || "", adCode: ad.adCode || "", link: ad.link || "", sponsor: ad.sponsor || "", duration: ad.duration, position: ad.position || 0, isActive: ad.isActive });
    setShowForm(true);
  };

  const openNew = (placementKey: string) => {
    setEditingAd(null);
    setActiveSection(placementKey);
    setForm({ type: "custom", placement: placementKey, imageUrl: "", adCode: "", link: "", sponsor: "", duration: 5000, position: 0, isActive: true });
    setShowForm(true);
  };

  const handleSave = () => {
    if (editingAd) updateMut.mutate({ id: editingAd.id, ...form } as any);
    else createMut.mutate(form as any);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/media/upload", { method: "POST", body: fd, credentials: "include" });
      const json = await res.json();
      if (json.url) setForm(f => ({ ...f, imageUrl: json.url }));
      else toast.error("Falha no upload");
    } catch { toast.error("Erro no upload"); }
    setUploading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-800">Gestão de Publicidade</h2>
          <p className="text-sm text-gray-500 mt-0.5">Gerencie banners individualmente por posição no site</p>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white rounded-xl border-2 border-[#001c56] p-6 shadow-lg space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-lg">{editingAd ? "Editar Anúncio" : "Novo Anúncio"}</h3>
            <button onClick={() => { setShowForm(false); setEditingAd(null); resetForm(); }}><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold text-sm">Tipo de Anúncio</Label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white">
                <option value="custom">Banner Próprio (imagem/GIF)</option>
                <option value="google">Google AdSense (código HTML)</option>
              </select>
            </div>
            <div>
              <Label className="font-semibold text-sm">Posição no Site</Label>
              <select value={form.placement} onChange={e => setForm(f => ({ ...f, placement: e.target.value }))}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white">
                {AD_PLACEMENTS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {form.type === "custom" ? (
            <>
              <div>
                <Label className="font-semibold text-sm">Imagem / GIF do Banner</Label>
                <div className="mt-1 flex gap-2">
                  <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="Cole a URL ou faça upload →" className="flex-1" />
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold border transition-colors">
                      {uploading ? <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full" /> : <Upload className="w-4 h-4" />}
                      Upload
                    </span>
                    <input type="file" accept="image/*,.gif" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
                {form.imageUrl && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg border">
                    <img src={form.imageUrl} alt="Preview" className="max-h-20 object-contain rounded" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold text-sm">Link de Destino (ao clicar)</Label>
                  <Input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://..." className="mt-1" />
                </div>
                <div>
                  <Label className="font-semibold text-sm">Anunciante / Patrocinador</Label>
                  <Input value={form.sponsor} onChange={e => setForm(f => ({ ...f, sponsor: e.target.value }))} placeholder="Nome do anunciante..." className="mt-1" />
                </div>
              </div>
            </>
          ) : (
            <div>
              <Label className="font-semibold text-sm">Código Google AdSense</Label>
              <Textarea value={form.adCode} onChange={e => setForm(f => ({ ...f, adCode: e.target.value }))}
                placeholder="<ins class='adsbygoogle'...></ins>" className="mt-1 font-mono text-xs" rows={6} />
              <p className="text-xs text-gray-400 mt-1">Cole o código completo do bloco de anúncio do Google AdSense.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold text-sm">Duração na Rotação</Label>
              <Input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} min={1000} step={500} className="mt-1" />
              <p className="text-xs text-gray-400 mt-0.5">{(form.duration / 1000).toFixed(1)} segundos</p>
            </div>
            <div>
              <Label className="font-semibold text-sm">Ordem de Exibição</Label>
              <Input type="number" value={form.position} onChange={e => setForm(f => ({ ...f, position: Number(e.target.value) }))} min={0} className="mt-1" />
              <p className="text-xs text-gray-400 mt-0.5">Menor número = exibido primeiro</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
            <Label className="text-sm font-medium">Anúncio ativo (visível no site)</Label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}
              className="bg-[#001c56] hover:bg-[#002a7a] text-white font-bold">
              {createMut.isPending || updateMut.isPending ? "Salvando..." : "Salvar Anúncio"}
            </Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingAd(null); resetForm(); }}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Sections by placement */}
      {isLoading ? (
        <div className="flex justify-center py-8"><div className="animate-spin w-8 h-8 border-4 border-[#001c56] border-t-transparent rounded-full" /></div>
      ) : (
        <div className="space-y-4">
          {AD_PLACEMENTS.map(({ key, label, desc, color }) => {
            const placementAds = ads.filter((a: any) => a.placement === key || (key === "home-top" && a.placement === "horizontal") || (key === "article-mid" && a.placement === "middle") || (key === "home-sidebar" && a.placement === "lateral"));
            return (
              <div key={key} className={`rounded-xl border-2 p-4 ${color}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-black text-sm text-gray-800">{label}</h3>
                    <p className="text-xs text-gray-500">{desc} · {placementAds.length} anúncio{placementAds.length !== 1 ? "s" : ""}</p>
                  </div>
                  <Button size="sm" onClick={() => openNew(key)}
                    className="bg-[#001c56] hover:bg-[#002a7a] text-white font-bold text-xs h-8">
                    <Plus className="w-3 h-3 mr-1" /> Adicionar
                  </Button>
                </div>
                {placementAds.length === 0 ? (
                  <div className="text-center py-4 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                    Nenhum anúncio nesta posição. Clique em "Adicionar" para criar.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {placementAds.map((ad: any) => (
                      <div key={ad.id} className={`bg-white rounded-lg border p-3 flex items-center gap-3 ${!ad.isActive ? "opacity-50" : ""}`}>
                        {ad.imageUrl && <img src={ad.imageUrl} alt={ad.sponsor || "Ad"} className="h-12 w-20 object-contain rounded border shrink-0 bg-gray-50" />}
                        {ad.type === "google" && !ad.imageUrl && (
                          <div className="h-12 w-20 bg-blue-50 rounded border flex items-center justify-center shrink-0">
                            <Code className="w-6 h-6 text-blue-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ad.type === "google" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                              {ad.type === "google" ? "AdSense" : "Banner"}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${ad.isActive ? "bg-green-50 text-green-600 font-semibold" : "bg-gray-100 text-gray-500"}`}>
                              {ad.isActive ? "● Ativo" : "○ Inativo"}
                            </span>
                            <span className="text-xs text-gray-400">{(ad.duration / 1000).toFixed(1)}s</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-700 mt-0.5 truncate">{ad.sponsor || ad.link || "Sem nome"}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button size="sm" variant="ghost" title={ad.isActive ? "Desativar" : "Ativar"}
                            onClick={() => toggleMut.mutate({ id: ad.id, isActive: !ad.isActive })}>
                            {ad.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="ghost" title="Editar" onClick={() => openEdit(ad)}><Edit className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" className="text-red-500" title="Excluir"
                            onClick={() => { if (confirm("Excluir este anúncio?")) deleteMut.mutate({ id: ad.id }); }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== TICKER TAB =====
function TickerTab() {
  const [text, setText] = useState("");
  const utils = trpc.useUtils();
  const { data: items = [] } = trpc.ticker.list.useQuery();
  const createMut = trpc.ticker.create.useMutation({
    onSuccess: () => { toast.success("Item adicionado!"); utils.ticker.list.invalidate(); setText(""); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.ticker.delete.useMutation({
    onSuccess: () => { toast.success("Item removido!"); utils.ticker.list.invalidate(); },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-800">Barra "De Última Hora" (Ticker)</h2>
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <p className="text-sm text-blue-700 font-semibold mb-1">Modo Manual</p>
        <p className="text-xs text-blue-600">Adicione textos personalizados que ficam girando no topo do portal.</p>
      </div>
      <div className="flex gap-2">
        <Input value={text} onChange={e => setText(e.target.value)} placeholder="Digite o texto do ticker..." className="flex-1"
          onKeyDown={e => { if (e.key === "Enter" && text.trim()) createMut.mutate({ text }); }} />
        <Button onClick={() => text.trim() && createMut.mutate({ text })} disabled={createMut.isPending || !text.trim()}
          className="bg-[#001c56] hover:bg-[#002a7a] text-white font-bold">
          <Plus className="w-4 h-4 mr-1" /> Adicionar
        </Button>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Type className="w-10 h-10 mx-auto mb-2 opacity-30" /><p>Nenhum item no ticker.</p>
          </div>
        ) : items.map((item: any) => (
          <div key={item.id} className="bg-white rounded-xl border p-3 flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
            <p className="flex-1 text-sm text-gray-700">{item.text}</p>
            <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteMut.mutate({ id: item.id })}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== SEO & ANALYTICS TAB =====
function SeoTab() {
  const utils = trpc.useUtils();
  const { data: allSettings } = trpc.settings.getAll.useQuery();
  const [ga4Id, setGa4Id] = useState("");
  const [gtmId, setGtmId] = useState("");
  const [vlibrasEnabled, setVlibrasEnabled] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  useEffect(() => {
    if (allSettings) {
      const getVal = (key: string) => (allSettings as any[]).find(s => s.settingKey === key)?.settingValue || "";
      setGa4Id(getVal("ga4_id"));
      setGtmId(getVal("gtm_id"));
      setVlibrasEnabled(getVal("vlibras_enabled") === "true");
      setTtsEnabled(getVal("tts_enabled") === "true");
    }
  }, [allSettings]);

  const setMut = trpc.settings.set.useMutation({
    onSuccess: () => { toast.success("Configuração salva!"); utils.settings.getAll.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-gray-800">SEO & Analytics</h2>

      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-black text-gray-800">Google Analytics 4 (GA4)</h3>
            <p className="text-xs text-gray-500">Rastreamento de audiência e comportamento</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Input value={ga4Id} onChange={e => setGa4Id(e.target.value)} placeholder="G-XXXXXXXXXX" className="font-mono" />
          <Button onClick={() => setMut.mutate({ key: "ga4_id", value: ga4Id })} disabled={setMut.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold shrink-0">Salvar</Button>
        </div>
        {ga4Id && <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><Check className="w-3 h-3" /> GA4 configurado: {ga4Id}</p>}
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Code className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-black text-gray-800">Google Tag Manager (GTM)</h3>
            <p className="text-xs text-gray-500">Gerenciamento de tags e pixels de conversão</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Input value={gtmId} onChange={e => setGtmId(e.target.value)} placeholder="GTM-XXXXXXX" className="font-mono" />
          <Button onClick={() => setMut.mutate({ key: "gtm_id", value: gtmId })} disabled={setMut.isPending}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold shrink-0">Salvar</Button>
        </div>
        {gtmId && <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><Check className="w-3 h-3" /> GTM configurado: {gtmId}</p>}
      </div>

      <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
        <h3 className="font-black text-gray-800">Acessibilidade e Recursos</h3>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">VLibras (Libras)</p>
              <p className="text-xs text-gray-500">Ícone flutuante de tradução para Libras</p>
            </div>
          </div>
          <Switch checked={vlibrasEnabled} onCheckedChange={v => { setVlibrasEnabled(v); setMut.mutate({ key: "vlibras_enabled", value: v.toString() }); }} />
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Volume2 className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Voz IA (Text-to-Speech)</p>
              <p className="text-xs text-gray-500">Leitor de notícias por áudio para usuários</p>
            </div>
          </div>
          <Switch checked={ttsEnabled} onCheckedChange={v => { setTtsEnabled(v); setMut.mutate({ key: "tts_enabled", value: v.toString() }); }} />
        </div>
      </div>
    </div>
  );
}

// ===== IMPORT TAB =====
function ImportTab() {
  const [xmlContent, setXmlContent] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMut = trpc.wordpressImport.importXml.useMutation({
    onSuccess: (data) => { setResult(data); setImporting(false); toast.success(`Importação concluída: ${data.imported} posts importados!`); },
    onError: (e) => { setImporting(false); toast.error(`Erro na importação: ${e.message}`); },
  });

  const handleFileRead = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setXmlContent(e.target?.result as string || "");
    reader.readAsText(file, "UTF-8");
  };

  const handleImport = () => {
    if (!xmlContent.trim()) { toast.error("Nenhum arquivo carregado."); return; }
    setImporting(true); setResult(null);
    importMut.mutate({ xmlContent });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-800">Importação de Backup WordPress</h2>
      <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
        <p className="text-sm text-yellow-800 font-semibold mb-1">Como exportar do WordPress</p>
        <p className="text-xs text-yellow-700">No WordPress: Ferramentas → Exportar → Selecione "Todos os posts" → Baixar arquivo de exportação (.xml)</p>
      </div>
      <div onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 hover:border-[#001c56] rounded-xl p-8 text-center cursor-pointer transition-colors bg-gray-50 hover:bg-blue-50">
        <Download className="w-10 h-10 mx-auto mb-2 text-gray-400" />
        <p className="font-semibold text-gray-600">Clique para selecionar o arquivo XML/WXR</p>
        <p className="text-sm text-gray-400 mt-1">Arquivo de exportação do WordPress (.xml)</p>
        {xmlContent && <p className="text-green-600 font-semibold mt-2">✓ Arquivo carregado ({Math.round(xmlContent.length / 1024)} KB)</p>}
        <input ref={fileInputRef} type="file" accept=".xml,.wxr" className="hidden"
          onChange={e => e.target.files?.[0] && handleFileRead(e.target.files[0])} />
      </div>
      {xmlContent && (
        <Button onClick={handleImport} disabled={importing} className="w-full bg-[#001c56] hover:bg-[#002a7a] text-white font-bold py-3">
          {importing ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Importando posts...</> : <><Upload className="w-4 h-4 mr-2" /> Iniciar Importação</>}
        </Button>
      )}
      {result && (
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-black text-lg text-gray-800 mb-4">Resultado da Importação</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <p className="text-2xl font-black text-green-600">{result.imported}</p>
              <p className="text-xs text-green-700 font-semibold">Importados</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-xl">
              <p className="text-2xl font-black text-yellow-600">{result.skipped}</p>
              <p className="text-xs text-yellow-700 font-semibold">Ignorados</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-xl">
              <p className="text-2xl font-black text-red-600">{result.errors}</p>
              <p className="text-xs text-red-700 font-semibold">Erros</p>
            </div>
          </div>
          {result.posts.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {result.posts.slice(0, 20).map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="w-3 h-3 text-green-500 shrink-0" />
                  <span className="truncate">{p.title}</span>
                  <span className={`text-xs shrink-0 ${p.status === "online" ? "text-green-600" : "text-gray-400"}`}>{p.status}</span>
                </div>
              ))}
              {result.posts.length > 20 && <p className="text-xs text-gray-400 text-center">... e mais {result.posts.length - 20} posts</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== DASHBOARD TAB =====
function DashboardTab() {
  const { data: stats } = trpc.stats.overview.useQuery();
  const { data: rich } = trpc.stats.rich.useQuery();
  const [fixResult, setFixResult] = useState<{ fixed: number; errors: number; total: number } | null>(null);

  const fixAllImages = trpc.globalNews.fixAllImages.useMutation({
    onSuccess: (data: { fixed: number; errors: number; total: number }) => {
      setFixResult(data);
      toast.success(`Concluído! ${data.fixed} imagens corrigidas de ${data.total} artigos com imagens inválidas.`);
    },
    onError: (err: any) => {
      toast.error(`Erro ao corrigir imagens: ${err.message}`);
    },
  });

  // Build articles-per-day chart data (fill missing days with 0)
  const chartData = (() => {
    const map: Record<string, number> = {};
    (rich?.articlesPerDay ?? []).forEach((r: any) => { if (r.date) map[r.date] = Number(r.count); });
    const result = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key.slice(5), count: map[key] ?? 0 });
    }
    return result;
  })();

  const CATEGORY_COLORS = ["#001c56","#e63946","#2a9d8f","#e9c46a","#f4a261","#264653","#a8dadc","#457b9d","#1d3557","#6d6875"];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-gray-800">Dashboard</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: "Notícias", value: stats?.articleCount ?? "—", color: "blue", icon: FileText },
          { label: "Visualizações", value: stats?.totalViews ?? "—", color: "green", icon: Eye },
          { label: "Comentários", value: stats?.commentCount ?? "—", color: "purple", icon: MessageCircle },
          { label: "Usuários", value: stats?.userCount ?? "—", color: "orange", icon: Users },
          { label: "Shorts", value: stats?.shortCount ?? "—", color: "red", icon: PlayCircle },
          { label: "Newsletter", value: stats?.newsletterCount ?? "—", color: "teal", icon: Bell },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 bg-${color}-100`}>
              <Icon className={`w-4 h-4 text-${color}-600`} />
            </div>
            <p className="text-2xl font-black text-gray-800">{typeof value === "number" ? value.toLocaleString("pt-BR") : value}</p>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Articles per day chart */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h3 className="font-black text-gray-700 mb-4">Artigos Publicados (últimos 30 dias)</h3>
        <div className="h-48">
          {chartData.length > 0 ? (
            <BarChartComponent data={chartData} />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">Carregando dados...</div>
          )}
        </div>
      </div>

      {/* Top Articles + Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Articles */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-black text-gray-700 mb-4">Top 10 Artigos Mais Lidos</h3>
          <div className="space-y-2">
            {(rich?.topArticles ?? []).length === 0 && (
              <p className="text-sm text-gray-400">Nenhum artigo com visualizações ainda.</p>
            )}
            {(rich?.topArticles ?? []).map((a: any, i: number) => (
              <div key={a.id} className="flex items-center gap-3">
                <span className="text-xs font-black text-gray-400 w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{a.title}</p>
                  <p className="text-xs text-gray-400">{a.category}</p>
                </div>
                <span className="text-xs font-bold text-blue-600 shrink-0">{Number(a.viewCount).toLocaleString("pt-BR")} views</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <h3 className="font-black text-gray-700 mb-4">Distribuição por Categoria</h3>
          <div className="space-y-2">
            {(rich?.categoryDistribution ?? []).map((c: any, i: number) => {
              const total = (rich?.categoryDistribution ?? []).reduce((s: number, x: any) => s + Number(x.count), 0);
              const pct = total > 0 ? Math.round((Number(c.count) / total) * 100) : 0;
              return (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-600 w-28 shrink-0 truncate">{c.category}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right shrink-0">{Number(c.count)} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h3 className="font-black text-gray-700 mb-4">Atividade Recente</h3>
        <div className="space-y-2">
          {(rich?.recentActivity ?? []).map((a: any) => (
            <div key={a.id} className="flex items-center gap-3 py-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                a.status === "online" ? "bg-green-100 text-green-700" :
                a.status === "draft" ? "bg-gray-100 text-gray-600" :
                "bg-yellow-100 text-yellow-700"
              }`}>{a.status}</span>
              <p className="flex-1 text-sm text-gray-700 truncate">{a.title}</p>
              <span className="text-xs text-gray-400 shrink-0">{a.category}</span>
              <span className="text-xs text-gray-400 shrink-0">
                {a.createdAt ? new Date(a.createdAt).toLocaleDateString("pt-BR") : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Maintenance Tools */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h3 className="font-black text-gray-700 mb-1">Manutenção</h3>
        <p className="text-sm text-gray-500 mb-4">Ferramentas para corrigir e otimizar o conteúdo do portal.</p>

        {/* Fix All Images */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Image className="w-5 h-5 text-amber-600 shrink-0" />
              <span className="font-bold text-gray-800">Corrigir Imagens de Todos os Artigos</span>
            </div>
            <p className="text-sm text-gray-500">
              Varre todos os artigos publicados e substitui imagens inválidas (logo do Google, imagens ausentes)
              pelas imagens originais das fontes. Pode demorar alguns minutos.
            </p>
            {fixResult && (
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                <span className="text-green-600 font-semibold">✓ {fixResult.fixed} corrigidas</span>
                <span className="text-red-500 font-semibold">✗ {fixResult.errors} sem fonte disponível</span>
                <span className="text-gray-500">{fixResult.total} total com imagem inválida</span>
              </div>
            )}
          </div>
          <Button
            onClick={() => { setFixResult(null); fixAllImages.mutate(); }}
            disabled={fixAllImages.isPending}
            className="bg-amber-500 hover:bg-amber-600 text-white whitespace-nowrap shrink-0"
          >
            {fixAllImages.isPending ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Corrigindo...</>
            ) : (
              <><Image className="w-4 h-4 mr-2" />Corrigir Imagens Agora</>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Access */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h3 className="font-black text-gray-700 mb-3">Acesso Rápido</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Nova Notícia", icon: Plus, tab: "articles" },
            { label: "Upload de Mídia", icon: Upload, tab: "media" },
            { label: "Gerenciar Ads", icon: Megaphone, tab: "ads" },
            { label: "Importar WP", icon: Download, tab: "import" },
          ].map(({ label, icon: Icon, tab }) => (
            <a key={tab} href={`#${tab}`} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 hover:text-[#001c56] transition-colors text-gray-600 text-sm font-semibold">
              <Icon className="w-6 h-6" />{label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// Simple bar chart component using recharts
function BarChartComponent({ data }: { data: { date: string; count: number }[] }) {
  // Use inline recharts import to avoid adding to global imports
  const { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } = require("recharts");
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
        <Tooltip formatter={(v: number) => [v, "Artigos"]} />
        <Bar dataKey="count" fill="#001c56" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ===== COMMENTS TAB (simplified) =====
function CommentsTab() {
  const utils = trpc.useUtils();
  const { data: comments = [] } = trpc.comments.listAll.useQuery({ status: "pending" });
  const moderateMut = trpc.comments.moderate.useMutation({ onSuccess: () => { toast.success("Moderado!"); utils.comments.listAll.invalidate(); } });
  const deleteMut = trpc.comments.delete.useMutation({ onSuccess: () => { toast.success("Excluído!"); utils.comments.listAll.invalidate(); } });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-800">Moderação de Comentários</h2>
      {comments.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Nenhum comentário pendente.</p>
        </div>
      ) : comments.map((c: any) => (
        <div key={c.id} className="bg-white rounded-xl border p-4">
          <p className="text-sm font-semibold text-gray-700">{c.authorName || "Anônimo"}</p>
          <p className="text-sm text-gray-600 mt-1">{c.content}</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="bg-green-600 text-white" onClick={() => moderateMut.mutate({ id: c.id, status: "approved" })}>
              <Check className="w-3 h-3 mr-1" /> Aprovar
            </Button>
            <Button size="sm" variant="outline" className="text-red-500" onClick={() => moderateMut.mutate({ id: c.id, status: "rejected" })}>
              <X className="w-3 h-3 mr-1" /> Rejeitar
            </Button>
            <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteMut.mutate({ id: c.id })}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== USERS TAB (simplified) =====
function UsersTab() {
  const utils = trpc.useUtils();
  const { data: users = [] } = trpc.users.list.useQuery();
  const updateRoleMut = trpc.users.updateRole.useMutation({ onSuccess: () => { toast.success("Papel atualizado!"); utils.users.list.invalidate(); } });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-black text-gray-800">Usuários do Portal</h2>
      <p className="text-sm text-gray-500">Usuários cadastrados via login OAuth (leitores e colaboradores do portal).</p>
      <div className="space-y-2">
        {users.map((u: any) => (
          <div key={u.id} className="bg-white rounded-xl border p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
              {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full rounded-full object-cover" /> : <Users className="w-5 h-5 text-gray-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-800 truncate">{u.name || "Sem nome"}</p>
              <p className="text-xs text-gray-400 truncate">{u.email}</p>
            </div>
            <select value={u.role} onChange={e => updateRoleMut.mutate({ id: u.id, role: e.target.value as any })}
              className="border rounded-lg px-2 py-1 text-xs bg-white shrink-0">
              <option value="user">Usuário</option>
              <option value="journalist">Jornalista</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== ADMIN USERS TAB (manage CMS access accounts) =====
function AdminUsersTab() {
  const utils = trpc.useUtils();
  const { data: adminUsers = [], isLoading } = trpc.adminAuth.listUsers.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "contributor" as AdminRole });
  const [editForm, setEditForm] = useState({ name: "", role: "contributor" as AdminRole, isActive: true, password: "" });

  const createMut = trpc.adminAuth.createUser.useMutation({
    onSuccess: () => { toast.success("Usuário criado!"); utils.adminAuth.listUsers.invalidate(); setShowForm(false); setForm({ name: "", email: "", password: "", role: "contributor" }); },
    onError: (e) => toast.error(e.message),
  });
  const updateMut = trpc.adminAuth.updateUser.useMutation({
    onSuccess: () => { toast.success("Usuário atualizado!"); utils.adminAuth.listUsers.invalidate(); setEditUser(null); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.adminAuth.deleteUser.useMutation({
    onSuccess: () => { toast.success("Usuário removido!"); utils.adminAuth.listUsers.invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const ROLE_LABELS: Record<AdminRole, string> = { admin: "Administrador", editor: "Editor", contributor: "Contribuidor" };
  const ROLE_COLORS: Record<AdminRole, string> = {
    admin: "bg-red-100 text-red-700",
    editor: "bg-blue-100 text-blue-700",
    contributor: "bg-green-100 text-green-700",
  };
  const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
    admin: ["Acesso total", "Gerenciar usuários do painel", "Configurações do site", "Publicar/remover qualquer conteúdo"],
    editor: ["Criar e editar notícias", "Gerenciar hero/carrossel", "Aprovar comentários", "Gerenciar mídia", "Gerenciar anúncios", "Gerenciar shorts"],
    contributor: ["Criar notícias (ficam em rascunho)", "Enviar para revisão", "Editar próprias notícias"],
  };

  const startEdit = (u: any) => {
    setEditUser(u);
    setEditForm({ name: u.name, role: u.role, isActive: u.isActive, password: "" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-800">Equipe Editorial</h2>
          <p className="text-sm text-gray-500 mt-1">Gerencie quem tem acesso ao painel administrativo.</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-[#001c56] hover:bg-[#002a7a] text-white">
          <Plus className="w-4 h-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      {/* Permission levels reference */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(["admin", "editor", "contributor"] as AdminRole[]).map(role => (
          <div key={role} className="bg-white rounded-xl border p-4">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-3 ${ROLE_COLORS[role]}`}>
              <Shield className="w-3 h-3" /> {ROLE_LABELS[role]}
            </div>
            <ul className="space-y-1">
              {ROLE_PERMISSIONS[role].map(p => (
                <li key={p} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <Check className="w-3 h-3 text-green-500 mt-0.5 shrink-0" /> {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Create user form */}
      {showForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-4">
          <h3 className="font-bold text-gray-800">Novo Usuário do Painel</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-semibold">Nome</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-semibold">E-mail</Label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-semibold">Senha</Label>
              <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" className="mt-1" />
            </div>
            <div>
              <Label className="text-sm font-semibold">Nível de Acesso</Label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as AdminRole }))}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white">
                <option value="contributor">Contribuidor</option>
                <option value="editor">Editor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => createMut.mutate(form)} disabled={createMut.isPending} className="bg-[#001c56] text-white">
              {createMut.isPending ? "Criando..." : "Criar Usuário"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Users list */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-400">Carregando...</div>
      ) : (
        <div className="space-y-3">
          {(adminUsers as any[]).map((u: any) => (
            <div key={u.id} className="bg-white rounded-xl border p-4">
              {editUser?.id === u.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs font-semibold">Nome</Label>
                      <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="mt-1 text-sm" />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Nível de Acesso</Label>
                      <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value as AdminRole }))}
                        className="mt-1 w-full border rounded-lg px-3 py-1.5 text-sm bg-white">
                        <option value="contributor">Contribuidor</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Nova Senha (opcional)</Label>
                      <Input type="password" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} placeholder="Deixe em branco para manter" className="mt-1 text-sm" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={editForm.isActive} onCheckedChange={v => setEditForm(f => ({ ...f, isActive: v }))} />
                    <Label className="text-sm">{editForm.isActive ? "Conta ativa" : "Conta desativada"}</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateMut.mutate({ id: u.id, name: editForm.name, role: editForm.role, isActive: editForm.isActive, ...(editForm.password ? { password: editForm.password } : {}) })} disabled={updateMut.isPending} className="bg-[#001c56] text-white">
                      {updateMut.isPending ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#001c56] to-[#002a7a] rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-sm">{u.name?.charAt(0)?.toUpperCase() || "?"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-gray-800">{u.name}</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${ROLE_COLORS[u.role as AdminRole] || "bg-gray-100 text-gray-600"}`}>
                        <Shield className="w-2.5 h-2.5" /> {ROLE_LABELS[u.role as AdminRole] || u.role}
                      </span>
                      {!u.isActive && <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">Desativado</span>}
                    </div>
                    <p className="text-xs text-gray-400">{u.email}</p>
                    {u.lastLogin && <p className="text-xs text-gray-300">Último acesso: {new Date(u.lastLogin).toLocaleString("pt-BR")}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => startEdit(u)}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-500 hover:bg-red-50"
                      onClick={() => { if (confirm(`Remover ${u.name}?`)) deleteMut.mutate({ id: u.id }); }}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== HERO / CARROSSEL TAB =====
function HeroTab() {
  const utils = trpc.useUtils();
  const { data: heroArticles = [], isLoading: heroLoading } = trpc.articles.listHero.useQuery();
  const { data: allArticles = [], isLoading: allLoading } = trpc.articles.list.useQuery({ status: "online", limit: 50 });
  const setHeroMut = trpc.articles.setHero.useMutation({
    onSuccess: () => {
      toast.success("Carrossel atualizado!");
      utils.articles.listHero.invalidate();
      utils.articles.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const heroIds = new Set(heroArticles.map((a: any) => a.id));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-gray-800">Hero / Carrossel da Home</h2>
        <p className="text-sm text-gray-500 mt-1">
          Selecione até <strong>5 matérias</strong> para aparecerem no banner principal da página inicial.
          Se nenhuma for selecionada, as mais recentes serão exibidas automaticamente.
        </p>
      </div>

      {/* Current hero articles */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <h3 className="font-black text-gray-700">No Carrossel Agora ({heroArticles.length}/5)</h3>
        </div>
        {heroLoading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : heroArticles.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Star className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Nenhuma matéria selecionada. As mais recentes serão exibidas.</p>
          </div>
        ) : (
          <div className="divide-y">
            {heroArticles.map((a: any) => (
              <div key={a.id} className="p-4 flex items-center gap-4">
                {a.imageUrl && (
                  <img src={a.imageUrl} alt="" className="w-16 h-12 object-cover rounded-lg shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 line-clamp-2">{a.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.category} • {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("pt-BR") : "Rascunho"}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500 border-red-200 hover:bg-red-50 shrink-0"
                  onClick={() => setHeroMut.mutate({ id: a.id, isHero: false })}
                  disabled={setHeroMut.isPending}
                >
                  <StarOff className="w-3 h-3 mr-1" /> Remover
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All published articles — pick to add to hero */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-4 border-b">
          <h3 className="font-black text-gray-700">Matérias Publicadas</h3>
          <p className="text-xs text-gray-400 mt-0.5">Clique em “Adicionar ao Hero” para incluir no carrossel</p>
        </div>
        {allLoading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : (
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {allArticles.filter((a: any) => !heroIds.has(a.id)).map((a: any) => (
              <div key={a.id} className="p-4 flex items-center gap-4">
                {a.imageUrl && (
                  <img src={a.imageUrl} alt="" className="w-16 h-12 object-cover rounded-lg shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 line-clamp-2">{a.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{a.category} • {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("pt-BR") : ""}</p>
                </div>
                <Button
                  size="sm"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white shrink-0"
                  onClick={() => setHeroMut.mutate({ id: a.id, isHero: true })}
                  disabled={setHeroMut.isPending || heroArticles.length >= 5}
                >
                  <Star className="w-3 h-3 mr-1" /> Adicionar
                </Button>
              </div>
            ))}
            {allArticles.filter((a: any) => !heroIds.has(a.id)).length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm">Todas as matérias publicadas já estão no carrossel.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== SHORTS TAB =====
function ShortsTab() {
  const { data: shorts = [], refetch } = trpc.shorts.list.useQuery({ limit: 50 });
  const runAutomation = trpc.shorts.runAutomation.useMutation({
    onSuccess: (data: { youtubeImported: number; aiGenerated: number; errors: number }) => {
      refetch();
      toast.success(`Concluído! ${data.aiGenerated} shorts gerados via IA, ${data.youtubeImported} do YouTube.`);
    },
    onError: (err: any) => toast.error(`Erro ao gerar shorts: ${err.message}`),
  });
  const deleteShort = trpc.shorts.delete.useMutation({
    onSuccess: () => { refetch(); toast.success("Short removido!"); },
    onError: (err: any) => toast.error(`Erro: ${err.message}`),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-800">CNN Shorts</h2>
        <span className="text-sm text-gray-500">{shorts.length} shorts publicados</span>
      </div>

      {/* Gerar Shorts */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h3 className="font-black text-gray-700 mb-1">Automação de Shorts</h3>
        <p className="text-sm text-gray-500 mb-4">Gera shorts automaticamente a partir dos artigos recentes com imagens válidas e busca vídeos dos canais de notícias no YouTube.</p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-purple-600 shrink-0" />
              <span className="font-bold text-gray-800">Gerar Shorts Agora</span>
            </div>
            <p className="text-sm text-gray-500">
              Processa até 3 artigos recentes (com imagem real) e gera descrições via IA estilo Reels.
              Também importa vídeos recentes dos canais CNN Brasil, Jovem Pan, Record, Band, SBT e GloboNews.
            </p>
          </div>
          <Button
            onClick={() => runAutomation.mutate()}
            disabled={runAutomation.isPending}
            className="bg-purple-600 hover:bg-purple-700 text-white whitespace-nowrap shrink-0"
          >
            {runAutomation.isPending ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Gerando...</>
            ) : (
              <><Zap className="w-4 h-4 mr-2" />Gerar Shorts Agora</>
            )}
          </Button>
        </div>
      </div>

      {/* Lista de Shorts */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-black text-gray-700">Shorts Publicados</h3>
        </div>
        {shorts.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <PlayCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Nenhum short publicado ainda.</p>
            <p className="text-sm mt-1">Clique em "Gerar Shorts Agora" para criar os primeiros.</p>
          </div>
        ) : (
          <div className="divide-y">
            {shorts.map((s: any) => (
              <div key={s.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {s.thumbnailUrl && !s.thumbnailUrl.includes('googleusercontent') ? (
                    <img src={s.thumbnailUrl} alt={s.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#001c56] to-red-700 flex items-center justify-center">
                      <span className="text-white text-xs font-black">CNN</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm line-clamp-1">{s.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      s.sourceType === 'youtube' ? 'bg-red-100 text-red-700' :
                      s.sourceType === 'ai' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {s.sourceType === 'youtube' ? 'YouTube' : s.sourceType === 'ai' ? 'IA' : 'Manual'}
                    </span>
                    <span className="text-xs text-gray-400">{s.category}</span>
                    <span className="text-xs text-gray-400">{s.viewCount ?? 0} views</span>
                  </div>
                </div>
                <button
                  onClick={() => { if (confirm('Remover este short?')) deleteShort.mutate({ id: s.id }); }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== BACKUP TAB =====
function BackupTab() {
  const utils = trpc.useUtils();
  const { data: backups = [], isLoading } = trpc.stats.backup.useQuery();
  const createBackupMut = trpc.stats.createBackup.useMutation({
    onSuccess: (data: any) => {
      utils.stats.backup.invalidate();
      toast.success(`Backup criado com sucesso! ${Object.entries(data.tables || {}).map(([k, v]) => `${k}:${v}`).join(", ")}`);
    },
    onError: (err: any) => toast.error(`Erro ao criar backup: ${err.message}`),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-gray-800">Backup & Restauração</h2>

      {/* Create Backup */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h3 className="font-black text-gray-700 mb-1">Criar Backup Manual</h3>
        <p className="text-sm text-gray-500 mb-4">
          Exporta todos os artigos, shorts, configurações e dados do portal para um arquivo JSON no armazenamento em nuvem.
          Backups automáticos são criados a cada hora.
        </p>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Download className="w-5 h-5 text-blue-600 shrink-0" />
              <span className="font-bold text-gray-800">Backup Completo do Banco de Dados</span>
            </div>
            <p className="text-sm text-gray-500">
              Inclui: artigos, shorts, configurações do site, itens do ticker e usuários admin (senhas não são exportadas).
            </p>
          </div>
          <Button
            onClick={() => createBackupMut.mutate()}
            disabled={createBackupMut.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap shrink-0"
          >
            {createBackupMut.isPending ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Criando...</>
            ) : (
              <><Download className="w-4 h-4 mr-2" />Criar Backup Agora</>
            )}
          </Button>
        </div>
      </div>

      {/* Backup History */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        <h3 className="font-black text-gray-700 mb-4">Histórico de Backups</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Download className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum backup disponível ainda.</p>
            <p className="text-xs mt-1">O primeiro backup automático será criado em 5 minutos após o servidor iniciar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {backups.map((b: any) => (
              <div key={b.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Download className="w-4 h-4 text-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 truncate">{b.key}</p>
                  <p className="text-xs text-gray-400">
                    {b.createdAt ? new Date(b.createdAt).toLocaleString("pt-BR") : "—"}
                    {b.sizeBytes ? ` • ${(b.sizeBytes / 1024).toFixed(1)} KB` : ""}
                  </p>
                </div>
                {b.url && (
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline shrink-0 font-semibold"
                  >
                    Download
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800 font-semibold">Informações sobre Backup</p>
        <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc list-inside">
          <li>Backups automáticos são criados a cada hora</li>
          <li>Os últimos 48 backups são mantidos (2 dias de histórico)</li>
          <li>Senhas de administradores nunca são incluídas nos backups</li>
          <li>Para restaurar, entre em contato com o suporte técnico</li>
        </ul>
      </div>
    </div>
  );
}

// ===== MAIN ADMIN COMPONENT =====
export default function Admin() {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const logoutMut = trpc.adminAuth.logout.useMutation({
    onSuccess: () => { setIsAdminAuthenticated(false); toast.success("Logout realizado!"); },
  });

  const { data: authCheck, isLoading: checkLoading } = trpc.adminAuth.check.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!checkLoading) setIsAdminAuthenticated(authCheck?.authenticated ?? false);
  }, [authCheck, checkLoading]);

  // Handle hash navigation for quick access
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as Tab;
    if (hash && ["dashboard", "articles", "media", "ads", "ticker", "seo", "import", "comments", "users"].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  if (checkLoading || isAdminAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-10 h-10 border-4 border-[#001c56] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdminAuthenticated) return <AdminLogin onLogin={() => setIsAdminAuthenticated(true)} />;

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "articles", label: "Notícias", icon: FileText },
    { id: "hero", label: "Hero/Carrossel", icon: Star },
    { id: "media", label: "Mídia", icon: Image },
    { id: "ads", label: "Publicidade", icon: Megaphone },
    { id: "ticker", label: "Ticker", icon: Type },
    { id: "seo", label: "SEO & Analytics", icon: BarChart3 },
    { id: "import", label: "Importar WP", icon: Download },
    { id: "comments", label: "Comentários", icon: MessageCircle },
    { id: "users", label: "Usuários", icon: Users },
    { id: "shorts", label: "CNN Shorts", icon: PlayCircle },
    { id: "adminUsers", label: "Equipe Editorial", icon: Shield },
    { id: "backup", label: "Backup & Restauração", icon: Download },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#001c56] text-white flex-col shrink-0 hidden md:flex">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="bg-white text-[#001c56] px-2 py-0.5 rounded-2xl font-black text-lg">CNN</div>
            <span className="font-black text-lg">.BRA Admin</span>
          </div>
          <p className="text-blue-200 text-xs mt-1">Painel Editorial</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
          <a href="/" className="flex items-center gap-2 text-blue-200 hover:text-white text-sm font-semibold px-3 py-2 rounded-xl hover:bg-white/10 transition-colors">
            <Globe className="w-4 h-4" /> Ver Portal
          </a>
          <button onClick={() => logoutMut.mutate()}
            className="w-full flex items-center gap-2 text-blue-200 hover:text-white text-sm font-semibold px-3 py-2 rounded-xl hover:bg-white/10 transition-colors">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </div>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#001c56] text-white z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-white text-[#001c56] px-2 py-0.5 rounded-xl font-black text-sm">CNN</div>
          <span className="font-black text-sm">Admin</span>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {tabs.slice(0, 6).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-2 py-1 rounded-lg text-xs font-bold transition-colors ${activeTab === tab.id ? "bg-white/20" : "text-blue-200"}`}>
              <tab.icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 pt-16 md:pt-8 max-w-6xl mx-auto">
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "articles" && <ArticlesTab />}
          {activeTab === "hero" && <HeroTab />}
          {activeTab === "media" && <MediaTab />}
          {activeTab === "ads" && <AdsTab />}
          {activeTab === "ticker" && <TickerTab />}
          {activeTab === "seo" && <SeoTab />}
          {activeTab === "import" && <ImportTab />}
          {activeTab === "comments" && <CommentsTab />}
          {activeTab === "users" && <UsersTab />}
          {activeTab === "shorts" && <ShortsTab />}
          {activeTab === "adminUsers" && <AdminUsersTab />}
          {activeTab === "backup" && <BackupTab />}
        </div>
      </div>
    </div>
  );
}
