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
- [x] Acessibilidade: VLibras widget
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

## Sprint 7 - Fidelidade Total ao Design de Referência

- [x] Ticker bar "De Última Hora" com dot vermelho pulsante + marquee animation (sticky top)
- [x] Header sticky abaixo do ticker com logo CNN pill + red dot + BRA
- [x] Menu Estados dropdown com grid 5 colunas (27 estados BR)
- [x] Hero banner: cantos arredondados (2.5rem), 55-75vh, ZOOM animation (scale 1.15 em 10s)
- [x] Hero: gradient overlay from-black/95, badge vermelho, título 7xl font-black
- [x] Hero: auto-rotação a cada 10 segundos entre notícias destaque
- [x] Cards notícia: imagem 420px 4/3 arredondada (2.5rem), hover scale-110 (2s)
- [x] Cards: badge categoria vermelho overlay, título hover vermelho, "COMPARTILHAR NO WHATSAPP"
- [x] Sidebar WhatsApp: gradiente verde, border-b-10, ícone rotate-12 hover, -translate-y-2
- [x] Sidebar CNN Shorts vitrine: bg gray-900, grid 2 colunas, thumbnails 9:16 com play overlay
- [x] Sidebar Newsletter: bg navy, círculo vermelho decorativo, "Fique por dentro"
- [x] Footer: bg preto, border-t-8 navy, logo CNN BRA pill, social icons com hover colorido
- [x] Shorts overlay fullscreen: snap-y scroll, cards fullscreen com gradient e botões like/share
- [x] Exit intent popup: detecção mouseleave, captura WhatsApp, design navy+vermelho
- [x] ArticlePage: "Ouvir Matéria" IA Voice player (SpeechSynthesis API)
- [x] ArticlePage: blockquote com borda vermelha, "Recomendados para Si"
- [x] VLibras widget integrado para acessibilidade
- [x] Animações: slideUp, slideRight, hero-zoom, marquee
- [x] Tipografia: font-black, tracking-tighter, uppercase em títulos
- [x] Shadow-2xl em todos os elementos principais

## Sprint 8 - Importação WordPress

- [x] Extrair e analisar backup WordPress (ZIP/WPRESS/WPVivid)
- [x] Criar script de importação (SQL dump → banco de dados CNN BRA)
- [x] Importar todas as postagens: 63 posts (49 online, 14 rascunhos), categorias mapeadas, imagens preservadas
- [x] Verificar dados importados: 3 artigos hero definidos, distribuição por categoria OK

## Sprint 9 - Minimalismo, Publicidade e Trending Topics

- [x] Reduzir fontes do site inteiro para visual mais minimalista
- [x] Ajustar tipografia: títulos menores, espaçamento mais limpo
- [x] Área de publicidade (banner 728x90) abaixo do hero carrossel
- [x] Sidebar: área de publicidade 300x250 junto com WhatsApp e Shorts
- [x] Trending Topics: ranking das matérias mais lidas (automático via viewCount)
- [x] Trending Topics: links clicáveis para as matérias
- [x] Garantir layout sidebar alinhada com botões "Receba no Zap" e "CNN Shorts"

## Sprint 10 - Notícias Globais Automáticas + Visual Minimalista

### Notícias Globais Automáticas
- [x] Fetch automático do Google News RSS (notícias internacionais)
- [x] Scraping de conteúdo completo dos artigos (título, texto, imagens, vídeos)
- [x] Reescrita autoral via LLM (IA) mantendo fidelidade à informação
- [x] Citação obrigatória das fontes originais em cada artigo
- [x] Extração e upload de imagens/vídeos para CDN
- [x] Publicação automática na categoria GLOBAL
- [x] Cron job no servidor rodando a cada 30 minutos (5 artigos importados no primeiro ciclo)
- [x] Deduplicação: não republicar notícias já importadas

### Visual Minimalista
- [x] Reduzir fontes do site inteiro (títulos, body, badges)
- [x] Área de publicidade abaixo do hero carrossel (banner horizontal 728x90)
- [x] Sidebar: área de publicidade 300x250
- [x] Trending Topics: ranking automático das matérias mais lidas (viewCount)
- [x] Trending Topics: links clicáveis para as matérias

## Sprint 11 - Publicidade Responsiva, Imagens Globais e Shorts

### Publicidade
- [x] Banner de publicidade intercalado no meio da lista de últimas notícias (a cada 4 artigos)
- [x] Publicidade responsiva: adaptar ao tamanho da tela sem perder qualidade ou cobrir informações
- [x] Garantir que ads não quebrem layout em mobile/tablet/desktop (aspect-ratio responsivo)

### Imagens Globais
- [x] Corrigir fetch de imagens das notícias globais (detectar e rejeitar logos Google News < 15KB)
- [x] Melhorar scraping de imagens: extrair og:image, meta image, ou imagem principal do artigo
- [x] Fallback para imagem placeholder quando não encontrar imagem (geração via IA ou Unsplash)
- [x] Job automático para corrigir imagens existentes no banco (fixGlobalNewsImages)

### CNN Shorts
- [x] Adaptar matérias de vídeo automaticamente para o formato CNN Shorts
- [x] Converter artigos com vídeo em shorts (extrair vídeo + título resumido)
- [x] Criar shorts automaticamente a partir de notícias globais com vídeo
- [x] Endpoint admin autoConvert para converter artigos com vídeo em shorts

### Correções
- [x] Cookie consent: botões com event handling robusto (preventDefault + stopPropagation)
- [x] 77 testes passando (incluindo 15 novos para Sprint 11)

## Sprint 12 — Ocultar Marca Manus

- [x] Ocultar/remover todas as referências visuais ao "Manus" (botões, logos, diálogos, links)
- [x] Garantir que nenhuma marca Manus apareça para o usuário final (textos do ManusDialog traduzidos para PT-BR, sem menção ao Manus)

## Sprint 13 — Correções de Imagem, Fonte, Títulos e WhatsApp

### Imagens
- [x] Remover geração de imagens por IA no scraper (removido generateArticleImage)
- [x] Usar imagem original da matéria (baixar ou usar link direto da og:image do artigo real)
- [x] Indexar imagem original na matéria publicada no CNN BRA (upload S3 ou URL direta)

### Fonte / Link Original
- [x] Resolver URL real do artigo (decoder Google News + fallback redirect)
- [x] Link da "Fonte" deve ser clicável e levar ao artigo original
- [x] Exibir "Fonte: Nome do Veículo" como link clicável (mapa de 30+ fontes conhecidas)

### Títulos
- [x] Corrigir capitalização: primeira letra maiúscula, restante minúscula (capitalizeTitle)
- [x] Respeitar exceções: nomes próprios, siglas, regras do português (80+ siglas, preposições)
- [x] Aplicar capitalizeTitle no frontend (Home.tsx hero + feed + ArticlePage)

### WhatsApp Mobile
- [x] Corrigir botão de compartilhar no WhatsApp que fica cortado no mobile (padding responsivo)
- [x] Adicionar ícone WhatsApp SVG e texto adaptativo (sm:inline)
- [x] Corrigir share bar inferior para mobile (flex-wrap + padding responsivo)

### Testes
- [x] 93 testes passando (16 novos para Sprint 13)
