import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { ArrowLeft, Send, FileText, Image, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

const CATEGORIES = ["GERAL", "POLÍTICA", "ECONOMIA", "ESPORTES", "TECNOLOGIA", "SAÚDE", "ENTRETENIMENTO", "MUNDO", "BRASIL"];

export default function SubmitContent() {
  const { user, isAuthenticated, loading } = useAuth();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("GERAL");
  const [imageUrl, setImageUrl] = useState("");
  const [location, setLocation] = useState("");

  const submitMutation = trpc.ugc.submit.useMutation({
    onSuccess: () => {
      toast.success("Conteúdo enviado com sucesso! Será analisado pela nossa equipe.");
      setTitle("");
      setContent("");
      setImageUrl("");
      setLocation("");
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: mySubmissions = [] } = trpc.ugc.mySubmissions.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#001c56] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-gray-800 mb-2">Jornalismo Cidadão</h2>
          <p className="text-gray-500 mb-6">Faça login para enviar sua história, foto ou vídeo para o CNN BRA.</p>
          <a href={getLoginUrl()}>
            <Button className="bg-[#001c56] hover:bg-[#002a7a] text-white font-bold rounded-xl px-8">Fazer Login</Button>
          </a>
          <div className="mt-4">
            <Link href="/"><span className="text-[#001c56] text-sm font-bold hover:underline cursor-pointer">Voltar ao início</span></Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || content.trim().length < 10) {
      toast.error("Preencha o título e o conteúdo (mínimo 10 caracteres).");
      return;
    }
    submitMutation.mutate({
      title: title.trim(),
      content: content.trim(),
      category,
      imageUrl: imageUrl.trim() || undefined,
      location: location.trim() || undefined,
    });
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    published: "bg-blue-100 text-blue-700",
  };

  const statusLabels: Record<string, string> = {
    pending: "Em análise",
    approved: "Aprovado",
    rejected: "Rejeitado",
    published: "Publicado",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#001c56] text-white sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <span className="text-white/80 hover:text-white cursor-pointer"><ArrowLeft className="w-5 h-5" /></span>
          </Link>
          <h1 className="text-lg font-black">Enviar Conteúdo</h1>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <h3 className="font-bold text-blue-800 mb-1">Jornalismo Cidadão</h3>
          <p className="text-sm text-blue-600">
            Envie sua história, denúncia ou registro para o CNN BRA. Todo conteúdo passa por moderação
            antes de ser publicado. Ao enviar, você ganha <strong>30 pontos</strong> e, se aprovado, mais <strong>100 pontos</strong>!
          </p>
        </div>

        {/* Submit Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Título *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título da sua matéria ou denúncia"
                maxLength={500}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Conteúdo * (mín. 10 caracteres)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Descreva os fatos, contexto e detalhes relevantes..."
                rows={8}
                maxLength={10000}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56] resize-none"
              />
              <span className="text-xs text-gray-400">{content.length}/10000</span>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                <Image className="w-4 h-4 inline mr-1" /> URL da Imagem (opcional)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemplo.com/foto.jpg"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                <MapPin className="w-4 h-4 inline mr-1" /> Localização (opcional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: São Paulo, SP"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001c56]"
              />
            </div>

            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full bg-[#001c56] hover:bg-[#002a7a] text-white font-bold rounded-xl py-3 gap-2"
            >
              <Send className="w-4 h-4" /> {submitMutation.isPending ? "Enviando..." : "Enviar Conteúdo"}
            </Button>
          </div>
        </form>

        {/* My Submissions */}
        {mySubmissions.length > 0 && (
          <div>
            <h3 className="text-lg font-black text-gray-800 mb-4">Meus Envios</h3>
            <div className="space-y-3">
              {mySubmissions.map((sub: any) => (
                <div key={sub.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm">{sub.title}</h4>
                    <p className="text-xs text-gray-400">{new Date(sub.createdAt).toLocaleDateString("pt-BR")}</p>
                    {sub.reviewNote && <p className="text-xs text-gray-500 mt-1">Nota: {sub.reviewNote}</p>}
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColors[sub.status] || "bg-gray-100 text-gray-600"}`}>
                    {statusLabels[sub.status] || sub.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
