import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Mail, Phone, MapPin, Send, Newspaper, Clock } from "lucide-react";
import { toast } from "sonner";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    document.title = "Contato | CNN BRA — Portal de Notícias";
    let metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = "Entre em contato com a redação do CNN BRA. Envie pautas, sugestões, críticas ou solicite informações sobre publicidade.";
    return () => { document.title = "CNN BRA — Notícias do Brasil e do Mundo"; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    setSending(true);
    // Simula envio — em produção, conectar a um endpoint de e-mail
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    toast.success("Mensagem enviada! Retornaremos em até 48 horas.");
    setName(""); setEmail(""); setSubject(""); setMessage("");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#001c56] text-white py-4 border-b-4 border-red-600">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Link href="/">
            <div className="bg-white text-[#001c56] px-4 py-1.5 rounded-xl font-black text-xl tracking-tighter cursor-pointer hover:opacity-90 transition-opacity">
              CNN<span className="text-red-600">•</span>BRA
            </div>
          </Link>
          <nav className="flex gap-6 text-sm font-semibold">
            <Link href="/" className="hover:text-red-400 transition-colors">Início</Link>
            <Link href="/sobre" className="hover:text-red-400 transition-colors">Sobre</Link>
            <Link href="/privacidade" className="hover:text-red-400 transition-colors">Privacidade</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#001c56] to-[#003399] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            Fale com a <span className="text-red-400">Redação</span>
          </h1>
          <p className="text-lg text-blue-200 max-w-xl mx-auto">
            Envie pautas, sugestões, críticas ou solicite informações sobre publicidade.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Form */}
            <div>
              <h2 className="text-2xl font-black text-[#001c56] mb-6">Envie uma Mensagem</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Nome <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#001c56] focus:ring-2 focus:ring-[#001c56]/10 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    E-mail <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#001c56] focus:ring-2 focus:ring-[#001c56]/10 transition"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Assunto</label>
                  <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#001c56] focus:ring-2 focus:ring-[#001c56]/10 transition bg-white"
                  >
                    <option value="">Selecione um assunto</option>
                    <option value="pauta">Enviar pauta / denúncia</option>
                    <option value="publicidade">Publicidade e anúncios</option>
                    <option value="correcao">Correção de matéria</option>
                    <option value="parceria">Parceria editorial</option>
                    <option value="outro">Outro assunto</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Mensagem <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Escreva sua mensagem aqui..."
                    rows={5}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#001c56] focus:ring-2 focus:ring-[#001c56]/10 transition resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-[#001c56] hover:bg-[#002a7a] disabled:opacity-60 text-white font-black py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Enviando...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Enviar Mensagem</>
                  )}
                </button>
              </form>
            </div>

            {/* Info */}
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-[#001c56] mb-6">Informações de Contato</h2>

              <div className="bg-gray-50 rounded-2xl p-6 space-y-5">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-[#001c56] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-black text-gray-900 text-sm">E-mail da Redação</div>
                    <a href="mailto:redacao@cnnbra.com.br" className="text-[#001c56] hover:text-red-600 transition-colors text-sm">
                      redacao@cnnbra.com.br
                    </a>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-[#001c56] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Newspaper className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-black text-gray-900 text-sm">Publicidade</div>
                    <a href="mailto:publicidade@cnnbra.com.br" className="text-[#001c56] hover:text-red-600 transition-colors text-sm">
                      publicidade@cnnbra.com.br
                    </a>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-[#001c56] rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-black text-gray-900 text-sm">Localização</div>
                    <p className="text-gray-600 text-sm">Maceió, Alagoas — Brasil</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-[#001c56] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-black text-gray-900 text-sm">Horário de Atendimento</div>
                    <p className="text-gray-600 text-sm">Segunda a Sexta, 8h às 18h</p>
                    <p className="text-gray-500 text-xs mt-0.5">Plantão de notícias 24h/7d</p>
                  </div>
                </div>
              </div>

              {/* Advertise CTA */}
              <div className="bg-[#001c56] rounded-2xl p-6 text-white">
                <h3 className="font-black mb-2">Anuncie no CNN BRA</h3>
                <p className="text-blue-200 text-sm leading-relaxed mb-4">
                  Alcance milhares de leitores engajados com notícias do Brasil e do mundo.
                  Oferecemos banners, patrocínio de seções e conteúdo patrocinado.
                </p>
                <a
                  href="mailto:publicidade@cnnbra.com.br"
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black px-5 py-2.5 rounded-full text-sm transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Solicitar Mídia Kit
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-gray-500 py-8 text-center text-xs">
        <div className="container mx-auto px-4">
          <div className="flex justify-center gap-6 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Início</Link>
            <Link href="/sobre" className="hover:text-white transition-colors">Sobre</Link>
            <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
            <Link href="/enviar-conteudo" className="hover:text-white transition-colors">Enviar Conteúdo</Link>
          </div>
          <p>© {new Date().getFullYear()} CNN BRA — Portal de Notícias. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
