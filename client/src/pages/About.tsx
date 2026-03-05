import { useEffect } from "react";
import { Link } from "wouter";
import { Newspaper, Globe, Shield, Users, Mail, MapPin } from "lucide-react";

export default function About() {
  useEffect(() => {
    document.title = "Sobre Nós | CNN BRA — Portal de Notícias";
    let metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = "Conheça o CNN BRA, o portal de notícias 24 horas com cobertura do Brasil e do mundo. Jornalismo independente, ágil e comprometido com a verdade.";
    return () => { document.title = "CNN BRA — Notícias do Brasil e do Mundo"; };
  }, []);

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
            <Link href="/contato" className="hover:text-red-400 transition-colors">Contato</Link>
            <Link href="/privacidade" className="hover:text-red-400 transition-colors">Privacidade</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#001c56] to-[#003399] text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
            Sobre o <span className="text-red-400">CNN BRA</span>
          </h1>
          <p className="text-xl text-blue-200 max-w-2xl mx-auto leading-relaxed">
            O portal de notícias 24 horas com cobertura completa do Brasil e do mundo.
            Jornalismo independente, ágil e comprometido com a verdade.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black text-[#001c56] mb-4">Nossa Missão</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                O <strong>CNN BRA</strong> nasceu com o propósito de democratizar o acesso à informação de qualidade.
                Acreditamos que um jornalismo sério, rápido e verificado é fundamental para uma sociedade bem informada.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Cobrimos política, economia, esportes, entretenimento, tecnologia e muito mais — com foco especial
                nas notícias que impactam o cotidiano dos brasileiros, especialmente em Alagoas e no Nordeste.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Newspaper, label: "800+", desc: "Artigos publicados" },
                { icon: Globe, label: "24h", desc: "Cobertura contínua" },
                { icon: Shield, label: "100%", desc: "Conteúdo verificado" },
                { icon: Users, label: "10K+", desc: "Leitores mensais" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={desc} className="bg-gray-50 rounded-2xl p-5 text-center border border-gray-100">
                  <Icon className="w-6 h-6 text-[#001c56] mx-auto mb-2" />
                  <div className="text-2xl font-black text-[#001c56]">{label}</div>
                  <div className="text-xs text-gray-500 mt-1">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-black text-[#001c56] mb-10 text-center">Nossos Valores</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Independência Editorial",
                desc: "Nossa linha editorial é guiada exclusivamente pelo interesse público, sem influência de grupos políticos ou econômicos.",
                color: "border-blue-500",
              },
              {
                title: "Velocidade com Responsabilidade",
                desc: "Publicamos com agilidade, mas sempre verificando as informações antes de divulgá-las ao público.",
                color: "border-red-500",
              },
              {
                title: "Transparência",
                desc: "Quando erramos, corrigimos publicamente. A credibilidade é construída com honestidade e responsabilidade.",
                color: "border-green-500",
              },
            ].map(v => (
              <div key={v.title} className={`bg-white rounded-2xl p-6 border-t-4 ${v.color} shadow-sm`}>
                <h3 className="font-black text-gray-900 mb-3">{v.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-[#001c56] text-white">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl font-black mb-4">Entre em Contato</h2>
          <p className="text-blue-200 mb-8">
            Tem uma pauta, sugestão ou quer anunciar no CNN BRA? Nossa equipe está pronta para atendê-lo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contato">
              <button className="bg-red-600 hover:bg-red-700 text-white font-black px-8 py-3 rounded-full transition-colors flex items-center gap-2 mx-auto sm:mx-0">
                <Mail className="w-4 h-4" />
                Fale Conosco
              </button>
            </Link>
            <Link href="/enviar-conteudo">
              <button className="bg-white/10 hover:bg-white/20 text-white font-black px-8 py-3 rounded-full transition-colors flex items-center gap-2 mx-auto sm:mx-0 border border-white/20">
                <Newspaper className="w-4 h-4" />
                Enviar Pauta
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-gray-500 py-8 text-center text-xs">
        <div className="container mx-auto px-4">
          <div className="flex justify-center gap-6 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Início</Link>
            <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
            <Link href="/contato" className="hover:text-white transition-colors">Contato</Link>
            <Link href="/enviar-conteudo" className="hover:text-white transition-colors">Enviar Conteúdo</Link>
          </div>
          <p>© {new Date().getFullYear()} CNN BRA — Portal de Notícias. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
