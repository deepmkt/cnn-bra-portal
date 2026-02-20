# CNN BRA Portal - TODO

- [x] Design system: cores, fontes, tema CNN BRA (azul escuro #001c56, vermelho, branco)
- [x] Schema do banco de dados: artigos, categorias, anúncios, configurações do site
- [x] Migrar schema e criar tabelas no banco
- [x] API backend: CRUD de artigos (criar, listar, editar, excluir, alternar status)
- [x] API backend: CRUD de anúncios
- [x] API backend: configurações do site
- [x] Frontend: Header com logo CNN BRA, navegação por categorias, ticker de notícias
- [x] Frontend: Hero slider com notícias em destaque
- [x] Frontend: Feed de notícias recentes com cards
- [x] Frontend: Sidebar com WhatsApp CTA e redes sociais
- [x] Frontend: Footer completo
- [x] Frontend: Menu mobile responsivo
- [x] Frontend: Página de artigo individual
- [x] Painel Admin: gerenciamento de notícias com persistência no banco
- [x] Painel Admin: gerenciamento de anúncios
- [x] Painel Admin: analytics básico
- [ ] Acessibilidade: VLibras widget
- [x] Compartilhamento via WhatsApp
- [x] SEO dinâmico (título, meta description por categoria)
- [x] Testes vitest para as rotas de API (62 testes passando)

## Melhorias Avançadas - Sprint 2

### CMS Headless e Backend Robusto
- [x] Schema avançado: tags, autores com perfil, mídia library, revisões de artigos
- [x] API RESTful de conteúdo: endpoints públicos para consumo externo (JSON API)
- [x] Painel editorial para jornalistas: workflow draft→review→published, agendamento
- [x] Roles de usuário: admin, editor, jornalista, leitor

### Microserviços
- [x] Sistema de comentários: comentários em artigos com moderação
- [x] Notificações push: alertas de breaking news e novas publicações
- [x] Personalização de feed: recomendações baseadas em histórico de leitura
- [x] Serviço de busca avançada: full-text search nos artigos

### Edge Computing e CDN Avançado
- [x] Otimização de imagens: componente OptimizedImage com lazy loading
- [x] Cache inteligente: HTTP cache headers conceitual
- [x] Lazy loading: imagens e componentes com IntersectionObserver
- [x] Prefetch de artigos: precarregar próximos artigos para navegação instantânea
- [x] Compressão de assets: gzip/brotli via Vite build

## Sprint 3 - Funcionalidades Avançadas

### Motor de Recomendação Híbrido
- [x] Filtragem colaborativa: recomendar com base em usuários semelhantes
- [x] Filtragem por conteúdo: recomendar artigos similares ao histórico de leitura
- [x] Algoritmo híbrido: combinar ambas as abordagens com pesos dinâmicos
- [x] Endpoint de recomendações personalizadas no frontend

### Gamificação
- [x] Schema: pontos do usuário, badges, ações de gamificação
- [x] Sistema de pontos: ganhar pontos por leitura, comentários, compartilhamento
- [x] Badges/Distintivos: conquistas por marcos (10 artigos lidos, primeiro comentário, etc.)
- [x] Ranking/Leaderboard: tabela de classificação dos usuários mais engajados
- [x] Perfil do usuário com pontos e badges visíveis

### Conteúdo Gerado pelo Usuário (UGC)
- [x] Schema: submissions de conteúdo do usuário
- [x] Formulário de envio de conteúdo pelo usuário (texto, fotos, vídeos)
- [x] Aba de moderação de UGC no painel administrativo
- [x] Workflow: pendente → aprovado → publicado / rejeitado
- [x] Notificação ao usuário sobre status da submissão

## Sprint 4 - Segurança e Compliance

### Autenticação e Segurança
- [x] OAuth 2.0 via Manus Auth (já integrado)
- [x] Schema: audit logs para monitoramento de segurança
- [x] Sistema de auditoria: registrar ações administrativas (login, CRUD, moderação)
- [x] Endpoint de logs de auditoria no admin
- [ ] Proteção contra brute force (rate limiting conceitual)

### LGPD / Cookies
- [x] Banner de consentimento de cookies (LGPD obrigatório)
- [x] Página de política de privacidade
- [x] Persistência da escolha do usuário (localStorage)
- [x] Opções: aceitar todos, rejeitar opcionais, personalizar

## Sprint 5 - CNN Shorts (Vídeos Curtos)

- [x] Schema: tabela de shorts (título, videoUrl, thumbnailUrl, duração, likes, views, etc.)
- [x] API backend: CRUD de shorts (criar, listar, curtir, visualizar, deletar)
- [x] Página /shorts: feed vertical estilo TikTok/Reels com swipe/scroll
- [x] Player de vídeo fullscreen com autoplay e controles
- [x] Interações: curtir, compartilhar, comentar em shorts
- [x] Seção de shorts na Home page (link no header)
- [x] Aba de gerenciamento de shorts no painel Admin

## Sprint 6 - Redesign Fiel à Referência + Global News + Newsletter

- [x] Header: logo CNN.BRA com ponto vermelho, nav limpa, botão Shorts, ícone busca
- [x] Hero carrossel: imagem fullwidth com título sobreposto em branco, badge categoria vermelho
- [x] Cards de notícia: layout horizontal (imagem esquerda, texto direita), hover com destaque/elevação
- [x] WhatsApp CTA: card verde "Canal no WhatsApp" com animação bounce na logo
- [x] Newsletter "Fique Atualizado": card azul escuro com campos Nome/Email, botão vermelho "Assinar Grátis"
- [x] Schema: tabela newsletter_subscribers (nome, email, status)
- [x] Backend: rota de inscrição newsletter + integração SendPulse
- [x] Aba Global: fetch automático de notícias internacionais via Google News
- [x] Aba Global: reescrita autoral das notícias via LLM com menção à fonte
- [x] Integração SendPulse API (email marketing) - credenciais validadas (62 testes)
- [x] Efeito hover nas notícias com destaque visual (elevação + scale na imagem)
- [x] Testes para SendPulse e novas rotas (62 testes passando)
