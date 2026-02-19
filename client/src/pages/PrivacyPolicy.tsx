import { Link } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#001c56] text-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <span className="text-white/80 hover:text-white cursor-pointer"><ArrowLeft className="w-5 h-5" /></span>
          </Link>
          <Shield className="w-5 h-5" />
          <h1 className="text-lg font-black">Política de Privacidade</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm prose prose-lg max-w-none">
          <h1 className="text-3xl font-black text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            Política de Privacidade e Proteção de Dados
          </h1>
          <p className="text-sm text-gray-400">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

          <h2 className="text-xl font-black text-gray-800 mt-8">1. Introdução</h2>
          <p className="text-gray-600 leading-relaxed">
            O <strong>CNN BRA</strong> ("nós", "nosso") está comprometido com a proteção da privacidade e dos dados pessoais
            dos nossos usuários ("você", "seu"). Esta Política de Privacidade descreve como coletamos, usamos, armazenamos
            e protegemos suas informações pessoais, em conformidade com a <strong>Lei Geral de Proteção de Dados
            (LGPD - Lei nº 13.709/2018)</strong> e demais legislações aplicáveis.
          </p>

          <h2 className="text-xl font-black text-gray-800 mt-8">2. Dados que Coletamos</h2>
          <p className="text-gray-600 leading-relaxed">Podemos coletar os seguintes tipos de dados:</p>
          <ul className="text-gray-600 space-y-2">
            <li><strong>Dados de identificação:</strong> nome, e-mail, foto de perfil (quando fornecidos via login social).</li>
            <li><strong>Dados de navegação:</strong> páginas visitadas, tempo de leitura, artigos acessados, preferências de categorias.</li>
            <li><strong>Dados de interação:</strong> comentários, conteúdo enviado (UGC), compartilhamentos, pontuação de gamificação.</li>
            <li><strong>Dados técnicos:</strong> endereço IP, tipo de navegador, sistema operacional, resolução de tela.</li>
            <li><strong>Cookies:</strong> identificadores armazenados no seu dispositivo para melhorar a experiência de navegação.</li>
          </ul>

          <h2 className="text-xl font-black text-gray-800 mt-8">3. Finalidade do Tratamento</h2>
          <p className="text-gray-600 leading-relaxed">Utilizamos seus dados para:</p>
          <ul className="text-gray-600 space-y-2">
            <li>Fornecer e personalizar o conteúdo noticioso com base nos seus interesses.</li>
            <li>Operar o sistema de gamificação (pontos, badges, ranking).</li>
            <li>Moderar comentários e conteúdo gerado por usuários.</li>
            <li>Enviar notificações sobre notícias urgentes e atualizações.</li>
            <li>Melhorar nossos serviços através de análises estatísticas.</li>
            <li>Cumprir obrigações legais e regulatórias.</li>
          </ul>

          <h2 className="text-xl font-black text-gray-800 mt-8">4. Base Legal</h2>
          <p className="text-gray-600 leading-relaxed">
            O tratamento dos seus dados pessoais é realizado com base nas seguintes hipóteses legais previstas na LGPD:
            <strong> consentimento</strong> (Art. 7º, I), <strong>execução de contrato</strong> (Art. 7º, V),
            <strong> interesse legítimo</strong> (Art. 7º, IX) e <strong>cumprimento de obrigação legal</strong> (Art. 7º, II).
          </p>

          <h2 className="text-xl font-black text-gray-800 mt-8">5. Cookies</h2>
          <p className="text-gray-600 leading-relaxed">
            Utilizamos cookies essenciais (necessários para o funcionamento do site), cookies de análise
            (para entender o uso do site), cookies de marketing (para anúncios relevantes) e cookies de
            personalização (para recomendações de conteúdo). Você pode gerenciar suas preferências de
            cookies a qualquer momento através do banner de consentimento.
          </p>

          <h2 className="text-xl font-black text-gray-800 mt-8">6. Seus Direitos (LGPD)</h2>
          <p className="text-gray-600 leading-relaxed">Conforme a LGPD, você tem direito a:</p>
          <ul className="text-gray-600 space-y-2">
            <li>Confirmar a existência de tratamento de dados.</li>
            <li>Acessar seus dados pessoais.</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
            <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.</li>
            <li>Solicitar a portabilidade dos dados.</li>
            <li>Revogar o consentimento a qualquer momento.</li>
            <li>Ser informado sobre o compartilhamento de dados.</li>
          </ul>

          <h2 className="text-xl font-black text-gray-800 mt-8">7. Segurança dos Dados</h2>
          <p className="text-gray-600 leading-relaxed">
            Adotamos medidas técnicas e administrativas para proteger seus dados pessoais contra acessos
            não autorizados, destruição, perda, alteração ou qualquer forma de tratamento inadequado.
            Isso inclui criptografia, controle de acesso, logs de auditoria e monitoramento contínuo.
          </p>

          <h2 className="text-xl font-black text-gray-800 mt-8">8. Retenção de Dados</h2>
          <p className="text-gray-600 leading-relaxed">
            Seus dados pessoais serão mantidos apenas pelo tempo necessário para cumprir as finalidades
            para as quais foram coletados, respeitando os prazos legais aplicáveis.
          </p>

          <h2 className="text-xl font-black text-gray-800 mt-8">9. Contato</h2>
          <p className="text-gray-600 leading-relaxed">
            Para exercer seus direitos ou esclarecer dúvidas sobre esta Política de Privacidade,
            entre em contato com nosso Encarregado de Proteção de Dados (DPO) através do e-mail:
            <strong> privacidade@cnnbra.com.br</strong>
          </p>

          <div className="mt-8 p-4 bg-gray-50 rounded-xl text-center">
            <p className="text-sm text-gray-500">
              Esta política pode ser atualizada periodicamente. Recomendamos que você a revise regularmente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
