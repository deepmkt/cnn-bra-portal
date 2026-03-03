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
type Tab = "dashboard" | "articles" | "hero" | "media" | "ads" | "ticker" | "seo" | "import" | "comments" | "users" | "ugc" | "shorts" | "gamification";

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
  const utils = trpc.useUtils();

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

          <div className="bg-gray-50 rounded-xl p-4 border">
            <Label className="font-semibold text-sm">Tags (JSON array)</Label>
            <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder='["política","brasil"]' className="mt-1 text-xs font-mono" />
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
  const [showForm, setShowForm] = useState(false);
  const [editingAd, setEditingAd] = useState<any>(null);
  const [form, setForm] = useState({ type: "custom" as "custom" | "google", placement: "horizontal" as "horizontal" | "lateral" | "middle", imageUrl: "", adCode: "", link: "", sponsor: "", duration: 5000, position: 0, isActive: true });
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

  const resetForm = () => setForm({ type: "custom", placement: "horizontal", imageUrl: "", adCode: "", link: "", sponsor: "", duration: 5000, position: 0, isActive: true });

  const openEdit = (ad: any) => {
    setEditingAd(ad);
    setForm({ type: ad.type, placement: ad.placement, imageUrl: ad.imageUrl || "", adCode: ad.adCode || "", link: ad.link || "", sponsor: ad.sponsor || "", duration: ad.duration, position: ad.position || 0, isActive: ad.isActive });
    setShowForm(true);
  };

  const handleSave = () => {
    if (editingAd) updateMut.mutate({ id: editingAd.id, ...form });
    else createMut.mutate(form);
  };

  const placementLabels: Record<string, string> = { horizontal: "Topo Central (728×90)", middle: "Meio da Notícia (728×90)", lateral: "Barra Lateral (300×250)" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-800">Gestão de Publicidade</h2>
        <Button onClick={() => { setEditingAd(null); resetForm(); setShowForm(true); }}
          className="bg-[#001c56] hover:bg-[#002a7a] text-white font-bold">
          <Plus className="w-4 h-4 mr-1" /> Novo Anúncio
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-lg">{editingAd ? "Editar Anúncio" : "Novo Anúncio"}</h3>
            <button onClick={() => { setShowForm(false); setEditingAd(null); resetForm(); }}><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold text-sm">Tipo</Label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white">
                <option value="custom">Banner Próprio (imagem/GIF)</option>
                <option value="google">Google AdSense (código)</option>
              </select>
            </div>
            <div>
              <Label className="font-semibold text-sm">Posição</Label>
              <select value={form.placement} onChange={e => setForm(f => ({ ...f, placement: e.target.value as any }))}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm bg-white">
                <option value="horizontal">Topo Central (728×90)</option>
                <option value="middle">Meio da Notícia (728×90)</option>
                <option value="lateral">Barra Lateral (300×250)</option>
              </select>
            </div>
          </div>

          {form.type === "custom" ? (
            <>
              <div>
                <Label className="font-semibold text-sm">URL da Imagem/GIF</Label>
                <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." className="mt-1" />
                {form.imageUrl && <img src={form.imageUrl} alt="Preview" className="mt-2 h-16 object-contain rounded border" />}
              </div>
              <div>
                <Label className="font-semibold text-sm">Link de Destino</Label>
                <Input value={form.link} onChange={e => setForm(f => ({ ...f, link: e.target.value }))} placeholder="https://..." className="mt-1" />
              </div>
              <div>
                <Label className="font-semibold text-sm">Anunciante / Patrocinador</Label>
                <Input value={form.sponsor} onChange={e => setForm(f => ({ ...f, sponsor: e.target.value }))} placeholder="Nome do anunciante..." className="mt-1" />
              </div>
            </>
          ) : (
            <div>
              <Label className="font-semibold text-sm">Código Google AdSense</Label>
              <Textarea value={form.adCode} onChange={e => setForm(f => ({ ...f, adCode: e.target.value }))}
                placeholder="<ins class='adsbygoogle'...></ins><script>...</script>" className="mt-1 font-mono text-xs" rows={6} />
              <p className="text-xs text-gray-400 mt-1">Cole aqui o código completo do bloco de anúncio do Google AdSense.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="font-semibold text-sm">Duração na Rotação (ms)</Label>
              <Input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} min={1000} step={500} className="mt-1" />
              <p className="text-xs text-gray-400 mt-0.5">{(form.duration / 1000).toFixed(1)} segundos</p>
            </div>
            <div>
              <Label className="font-semibold text-sm">Ordem de Exibição</Label>
              <Input type="number" value={form.position} onChange={e => setForm(f => ({ ...f, position: Number(e.target.value) }))} min={0} className="mt-1" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
            <Label className="text-sm">Anúncio ativo</Label>
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

      {isLoading ? (
        <div className="flex justify-center py-8"><div className="animate-spin w-8 h-8 border-4 border-[#001c56] border-t-transparent rounded-full" /></div>
      ) : ads.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Megaphone className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Nenhum anúncio cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(["horizontal", "middle", "lateral"] as const).map(placement => {
            const placementAds = ads.filter((a: any) => a.placement === placement);
            if (placementAds.length === 0) return null;
            return (
              <div key={placement}>
                <h3 className="font-bold text-sm text-gray-500 mb-2 uppercase tracking-wider">{placementLabels[placement]}</h3>
                <div className="space-y-2">
                  {placementAds.map((ad: any) => (
                    <div key={ad.id} className={`bg-white rounded-xl border p-4 flex items-center gap-3 ${!ad.isActive ? "opacity-50" : ""}`}>
                      {ad.imageUrl && <img src={ad.imageUrl} alt={ad.sponsor || "Ad"} className="h-12 w-20 object-contain rounded border shrink-0" />}
                      {ad.type === "google" && !ad.imageUrl && <div className="h-12 w-20 bg-blue-50 rounded border flex items-center justify-center shrink-0"><Code className="w-6 h-6 text-blue-400" /></div>}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ad.type === "google" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                            {ad.type === "google" ? "Google AdSense" : "Banner Próprio"}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${ad.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                            {ad.isActive ? "Ativo" : "Inativo"}
                          </span>
                          <span className="text-xs text-gray-400">{(ad.duration / 1000).toFixed(1)}s</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-700 mt-0.5">{ad.sponsor || ad.link || "Sem nome"}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" onClick={() => toggleMut.mutate({ id: ad.id, isActive: !ad.isActive })}>
                          {ad.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(ad)}><Edit className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" className="text-red-500"
                          onClick={() => { if (confirm("Excluir anúncio?")) deleteMut.mutate({ id: ad.id }); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
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
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-black text-gray-800">Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Notícias", value: stats?.articleCount ?? "—", color: "blue", icon: FileText },
          { label: "Visualizações", value: stats?.totalViews ?? "—", color: "green", icon: Eye },
          { label: "Comentários", value: stats?.commentCount ?? "—", color: "purple", icon: MessageCircle },
          { label: "Usuários", value: stats?.userCount ?? "—", color: "orange", icon: Users },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-${color}-100`}>
              <Icon className={`w-5 h-5 text-${color}-600`} />
            </div>
            <p className="text-2xl font-black text-gray-800">{typeof value === "number" ? value.toLocaleString("pt-BR") : value}</p>
            <p className="text-sm text-gray-500 font-medium">{label}</p>
          </div>
        ))}
      </div>
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
      <h2 className="text-xl font-black text-gray-800">Gerenciar Usuários</h2>
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
        </div>
      </div>
    </div>
  );
}
