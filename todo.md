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

## Sprint 14 — Acessibilidade Newsletter

- [x] Corrigir contraste dos campos de entrada na seção "Fique Atualizado"
- [x] Garantir que os inputs sejam visíveis sobre o fundo azul escuro (borda azul clara, placeholder cinza escuro, focus vermelho)

## Sprint 15 — CRÍTICO: Corrigir URLs da Fonte

- [x] Investigar por que URLs do Google News ainda aparecem no conteúdo dos artigos (decoder falhando)
- [x] Remover URLs do Google News de 115 artigos existentes (substituído por "Fonte: Agência Internacional")
- [x] Criar novo módulo decodeGoogleNewsUrl.ts com lógica melhorada
- [x] Novos artigos usarão URLs reais quando possível (redirect-following)

## Sprint 16 — Qualidade, Relevância e UX

### Filtro de Relevância
- [x] Reduzir quantidade de notícias importadas de 5 para 3 por ciclo (economia de créditos)
- [x] Google News RSS já fornece notícias relevantes (top stories)
- [x] Menos artigos = menos rewrites LLM = menos custos

### Correção Definitiva de Imagens
- [x] Validar formatos de imagem (.jpg, .png, .webp, .jpeg, .avif)
- [x] Garantir que imageUrl seja sempre uma URL válida via validateImageUrl()
- [x] Testar se imagens são acessíveis antes de salvar (HEAD request)
- [x] Usar URLs originais diretamente (sem upload S3 que retornava 403)
- [x] Fallback para Unsplash placeholder se imagem não encontrada

### Layout Hero + Sidebar
- [x] Reduzir hero para 2/3 da largura (lg:w-2/3)
- [x] Criar sidebar com lista de 5 posts mais relevantes (lg:w-1/3)
- [x] Garantir responsividade (mobile: hero full width + sidebar abaixo, desktop: lado a lado)
- [x] Sidebar com thumbnails, títulos e timestamps

### Sistema de Tags
- [x] Campo tags já existe na tabela articles
- [x] Categorizar automaticamente notícias por 17 tópicos via LLM (economia, saúde, tecnologia, política, esportes, educação, meio-ambiente, cultura, internacional, ciência, segurança, justiça, transporte, energia, agronegócio, turismo, entretenimento)
- [x] Criar navegação por tags no frontend (dropdown "Tópicos" no header)
- [x] Filtrar artigos por tag selecionada (selectedTag state)

## Sprint 17 — Shorts Mobile, Imagens e Relevância Brasil

### CNN Shorts Mobile
- [x] Adicionar botão "Shorts" no menu mobile (botão preto com play vermelho)
- [x] Garantir que o botão seja visível e acessível em telas pequenas

### Correção Definitiva de Imagens
- [x] Melhorar validação de imagens para rejeitar logos do Google News (gstatic.com, googleusercontent.com)
- [x] Detectar imagens genéricas: tamanho < 20KB, content-type inválido
- [x] Usar apenas imagens reais dos artigos originais (validateImageUrl)
- [x] Fallback para placeholder temático Unsplash quando não encontrar imagem válida

### Redução de Frequência e Filtro Brasil
- [x] Ajustar cron job de 30min para 1 hora (1 postagem/hora = 24/dia)
- [x] Adicionar filtro de relevância: checkBrazilRelevance() via LLM
- [x] Usar LLM para avaliar se notícia é relevante para contexto Brasil
- [x] Rejeitar notícias sem impacto/interesse para público brasileiro (fail-open em caso de erro)

## Sprint 18 — Credibilidade: Contador de Visualizações

- [x] Ajustar contador de visualizações para mostrar mínimo 5.000 + aleatório até 3.000 (5k-8k)
- [x] Dar credibilidade ao portal com números realistas de leitores

## Sprint 19 — CRÍTICO: Corrigir Imagens Definitivamente

- [x] Investigar por que favicon do Google News ainda está sendo capturado (Google News não redireciona via HTTP)
- [x] Melhorar scraping para extrair imagem real da matéria (og:image do artigo original)
- [x] Validar que imagens têm dimensões adequadas via validateImageUrl (HEAD request)
- [x] Rejeitar imagens pequenas (favicons, logos < 20KB, gstatic.com, googleusercontent.com)
- [x] Atualizar artigos existentes: 7 artigos com logos Google substituídos por placeholders Unsplash
- [x] Implementar decoder robusto: decodeGoogleNewsUrl.ts com HTML parsing
- [x] Cache agora salva rewrittenTitle para matching futuro
- [x] Novos artigos usarão imagens reais (decoder + validateImageUrl)

## Sprint 20 — Publicidade Real

- [x] Fazer upload dos 5 banners GIF fornecidos para o CDN (manuscdn.com)
- [x] Substituir placeholders de publicidade pelos banners reais
- [x] Configurar rotação de banners 728x90 (3 banners horizontais: Câmara Maceió, Saúde Fica, Esqueci Dinheiro)
- [x] Configurar rotação de banners 300x250 (2 banners sidebar: Saúde Fica, Câmara Maceió)
- [x] Criar adConfig.ts com funções getAdByRotation() e getRandomAd()
- [x] Garantir que os GIFs animados funcionem corretamente

## Sprint 21 — Banner de Publicidade Abaixo do Hero

- [x] Substituir placeholder "PUBLICIDADE --- 728×90" abaixo do hero principal por banner real com rotação

## Sprint 22 — Painel Administrativo Completo (Requisitos CNN BRA)

### 1. Acesso e Segurança
- [x] Login restrito com credenciais fixas (AGENCIADEEPMKT@GMAIL.COM / @Dp4156!)
- [x] Rota /admin protegida, separada da área pública e de membros
- [x] Sessão persistente com JWT/cookie para o admin

### 2. Gerenciamento de Conteúdo (Posts)
- [x] Upload de múltiplas imagens (PNG, JPG, GIF) e vídeos (MP4) para S3/CDN
- [x] Galeria interativa para selecionar imagem/vídeo de capa
- [x] Seleção de estado (AL, SP, RJ, etc.) vinculado à lógica de subdomínios
- [x] Opção "Destaque na Home" (grade principal)
- [x] Opção "Banner Inicial/Hero" (carrossel com zoom)
- [x] Botão de criar nova categoria instantaneamente no formulário de post
- [x] Botão Publicar (Online), Rascunho (Draft) e Excluir permanentemente

### 3. Gestão de Publicidade (ADS)
- [x] Controle de anúncios por posição: Topo Central, Meio da Notícia, Barra Lateral
- [x] Upload de banners estáticos (PNG, JPG) e animados (GIF) para CDN
- [x] Campo para inserir código Google AdSense
- [x] Rotação inteligente: alternar entre banners próprios e Google Ads
- [x] Tempo configurável (segundos) para cada banner individualmente
- [x] Remover indicadores visuais (bolinhas/números) da rotação

### 4. SEO e Analytics
- [x] Campo para ID do Google Analytics 4 (G-XXXXX)
- [x] Campo para ID do Google Tag Manager (GTM-XXXXX)
- [x] Injeção dinâmica dos scripts GA4 e GTM no HTML do site

### 5. Configurações Globais e IA
- [x] Ticker "De Última Hora": modo automático (Google News/RSS) e modo manual (texto livre)
- [x] Configurações de automação Global (scraping IA, reescrita, citação de fontes)
- [x] Toggle VLibras (acessibilidade Libras)
- [x] Toggle Voz IA (Text-to-Speech leitor de notícias)

### 6. Importação de Dados
- [x] Upload de arquivo XML/JSON com histórico de matérias WordPress
- [x] Parser e importação de posts do backup WordPress para o banco de dados

## Sprint 23 — Restrição do Painel Admin ao Subdomínio admin.cnnbra.com.br

- [x] Middleware no servidor: bloquear acesso a /admin e /api/trpc (rotas admin) fora do subdomínio admin.cnnbra.com.br
- [x] Frontend: redirecionar /admin para admin.cnnbra.com.br se acessado em outro domínio
- [x] Garantir que o portal público (cnnbra.com.br) redirecione /admin para admin.cnnbra.com.br

## Sprint 24 — Redirecionamento Automático admin.cnnbra.com.br → /admin

- [x] Adicionar middleware no servidor: quando hostname for admin.cnnbra.com.br e path for /, redirecionar para /admin
- [x] Garantir que admin.cnnbra.com.br/ vá direto para o painel de login

## Sprint 25 — Seleção Manual de Matérias para o Hero/Carrossel

- [x] Verificar se campo isHero já existe no schema de articles
- [x] Adicionar campo isHero ao schema se necessário e migrar banco
- [x] Rota tRPC: articles.setHero para marcar/desmarcar matéria como hero
- [x] Rota tRPC: articles.getHero para buscar matérias marcadas como hero
- [x] Painel admin: aba "Hero/Carrossel" com lista de matérias e toggle para marcar como hero (máx. 5)
- [x] Home: carrossel usa apenas matérias com isHero=true (fallback para mais recentes se vazio)

## Sprint 26 — Banners Individuais, Sidebar de Notícia e Tags Automáticas

### Publicidade — Gestão Individual por Posição
- [x] Aba Publicidade: listar banners agrupados por posição (home-top, home-mid, home-sidebar, article-mid, article-sidebar)
- [x] Permitir adicionar/editar/remover banners individualmente por posição
- [x] Campo de link de destino por banner
- [x] Campo de tempo de exibição (segundos) por banner
- [x] Suporte a código AdSense por posição

### Página de Notícia — Sidebar Completa
- [x] Sidebar fixa na página de artigo com: lista de notícias recentes para navegar
- [x] Sidebar: banners publicitários (article-sidebar)
- [x] Sidebar: formulário de inscrição na newsletter
- [x] Sidebar: botão de entrada no canal do WhatsApp
- [x] Banner no meio do conteúdo do artigo (article-mid)

### Sistema de Tags e Sugestões
- [x] Verificar se sistema de tags já existe no schema
- [x] Auto-tagging via IA ao criar/importar artigos (baseado em título, categoria e conteúdo)
- [x] Exibir tags clicáveis no final do artigo
- [x] Sugestões de posts semelhantes no fim do post baseadas em tags em comum
- [x] Rota tRPC: articles.related para buscar artigos com tags semelhantes

## Sprint 27 — Auto-Tagging com IA

- [x] Rota tRPC articles.suggestTags: recebe título, resumo e conteúdo, retorna array de tags via LLM
- [x] Painel admin: botão "Sugerir Tags com IA" no formulário de criação/edição de artigos
- [x] Painel admin: tags sugeridas aparecem como chips clicáveis para aceitar/rejeitar individualmente
- [x] Painel admin: campo de tags com autocomplete e adição manual também disponível
- [x] Pipeline global: auto-tagging automático ao importar notícias globais (sem interação manual)
- [x] Garantir que tags sejam salvas corretamente no banco ao criar/editar artigos

## Sprint 28 — Correção Definitiva de Imagens (Logo Google News)

- [x] Correção 1: Substituir validação de extensão por rejeição de extensões ruins (não rejeitar URLs sem .jpg/.png)
- [x] Correção 2: Remover fallback que usa imagem inválida (logo Google) mesmo após rejeição
- [x] Correção 3: Ampliar lista de domínios Google rejeitados (news.google.com, google.com/images)

## Sprint 29 — Botão "Corrigir Imagens" no Painel Admin

- [x] Rota tRPC globalNews.fixAllImages: reprocessar todos os artigos com imagem inválida (logo Google, vazia ou placeholder)
- [x] Botão "Corrigir Imagens Agora" no Dashboard do painel admin com spinner de carregamento
- [x] Exibir contagem de artigos corrigidos, sem fonte e total inválidas ao final do processo

## Sprint 30 — Correção Definitiva de Imagens (Diagnóstico Profundo)

- [x] Diagnosticar o fluxo completo: RSS → decodeUrl → scrapeArticle → validateImage → banco
- [x] Corrigir o decoder para usar o algoritmo correto (signature + timestamp + batchexecute API)
- [x] Testar com notícias reais e confirmar imagens corretas no banco (R7, CNN Brasil, Valor, BBC)

## Sprint 31 — Imagens Originais, 1 Post/Hora e Prioridade anoticiaal.com.br

### Imagens
- [x] Remover fallback Unsplash (não publicar artigo sem imagem real)
- [x] Remover fallback de geração de imagem via IA
- [x] Usar apenas og:image do artigo original; se não encontrar, pular o artigo

### Frequência e Rotação de Categorias
- [x] Limitar a 1 postagem por ciclo (não mais 3)
- [x] Implementar rotação de categorias: Política, Dia a Dia, Global, Esportes, Economia
- [x] Salvar no banco qual categoria foi postada por último para alternar no próximo ciclo

### Prioridade anoticiaal.com.br
- [x] Adicionar feed RSS do anoticiaal.com.br como fonte prioritária
- [x] Matérias do anoticiaal.com.br devem ser marcadas como isHero=true automaticamente
- [x] Garantir que matérias do anoticiaal.com.br apareçam em destaque na home

## Sprint 32 — Fontes Regionais de Alagoas

- [ ] Pesquisar portais de notícias de Alagoas e verificar feeds RSS disponíveis
- [ ] Adicionar feeds RSS dos portais regionais ao sistema de importação
- [ ] Garantir que matérias regionais de AL sejam marcadas com tags locais (alagoas, nordeste)
- [ ] Testar scraping de imagens dos portais regionais

## Sprint 33 — CNN Shorts Reformulado

### Backend
- [x] Busca automática de vídeos de notícias via YouTube RSS público (6 canais: CNN Brasil, Jovem Pan, Record, Band, SBT, GloboNews)
- [x] Geração automática de shorts via IA a partir de artigos recentes (descrição estilo Reels)
- [x] Cron job a cada 2 horas para alimentar shorts automaticamente
- [x] Contagem de visualizações de shorts (viewCount no banco, incrementado após 2s de visualização)
- [x] Schema: campos articleId, youtubeId, sourceType adicionados à tabela shorts
- [x] Endpoint admin: runAutomation para gerar shorts manualmente
- [x] Endpoint: feedInfinite com cursor pagination para rolagem infinita

### Frontend
- [x] Rolagem infinita no feed de shorts (carregar mais ao chegar no fim)
- [x] Publicidade intercalada a cada 5 shorts (card de anúncio pulável após 5s)
- [x] Notícias sem vídeo: efeito Ken Burns (zoom-in, zoom-out, pan-left, pan-right)
- [x] Player YouTube embed para shorts do YouTube
- [x] Clique em "Ver matéria" navega para o artigo original
- [x] Badges de fonte (YouTube, IA)
- [x] Indicador de posição lateral (dots)
- [ ] Transição suave entre shorts

## Sprint 34 — Google Analytics

- [x] Adicionar script gtag.js no index.html (carregamento global, G-DCKDKHYWY9)
- [x] GA4 ID salvo no banco de configurações (via AnalyticsInjector)
- [x] Rastreamento automático de mudança de rota SPA (RouteTracker no App.tsx)
- [x] Eventos rastreados: clique em artigo (home + hero), leitura (10s), compartilhamento WhatsApp, busca, inscrição newsletter
- [x] Hook useAnalytics com funções para todos os eventos do site

## Sprint 35 — Corrigir Imagens Google News no CNN Shorts

- [x] Identificar origem: shorts manuais importados antes da correção do decoder tinham lh3.googleusercontent.com
- [x] Remover 6 shorts com imagens do Google do banco de dados
- [x] Adicionar função isValidShortImage no shortsAutomation.ts (bloqueia googleusercontent, gstatic, unsplash)
- [x] Aplicar filtro nos artigos candidatos para geração de shorts por IA
- [x] Frontend: adicionar isValidImage no ShortCard com fallback gradiente CNN BRA quando não há imagem válida

## Sprint 36 — Botão Gerar Shorts Agora no Painel Admin

- [x] Criar ShortsTab no painel admin com botão "Gerar Shorts Agora"
- [x] Botão chama trpc.shorts.runAutomation e exibe feedback (IA gerados + YouTube importados)
- [x] Lista de shorts publicados com thumbnail, badge de fonte (IA/YouTube/Manual), categoria, views
- [x] Botão de remover short individual
- [x] Tab "CNN Shorts" adicionada ao menu lateral do admin

## Sprint 37 — Fontes Regionais de Alagoas

- [ ] Verificar feeds RSS do TNH1, Alagoas24h e outros portais regionais
- [ ] Adicionar fontes regionais como feeds prioritários no globalNewsFetcher
- [ ] Garantir mapeamento correto de categorias para fontes regionais
- [ ] Testar extração de og:image dos artigos regionais

## Sprint 38 — Capas em Destaque e Sentence Case

- [ ] Hero da home: artigos do anoticiaal.com.br com isHero=true aparecem automaticamente em destaque
- [ ] Admin pode sobrescrever o hero manualmente via painel (tab Hero/Carrossel)
- [ ] Corrigir capitalização de todos os títulos: sentence case (1ª letra maiúscula, nomes próprios preservados)
- [ ] Aplicar sentence case via IA no rewriteWithAI para novos artigos
- [ ] Corrigir títulos existentes no banco via script de migração

## Sprint 39 — Busca Inline na Home

- [ ] Barra de busca na home abre painel de resultados inline (sem nova aba)
- [ ] Resultados em modo lista (padrão) e modo grade 3x3
- [ ] Botão para alternar entre lista e grade
- [ ] Funciona em desktop e mobile
- [ ] Ao clicar no resultado, navega para o artigo
- [ ] Fechar busca retorna ao feed normal

## Sprint 40 — Slug com IA, Sugestões de Artigos e Botão Voltar ao Topo

- [ ] Slug gerado por IA com palavras-chave da notícia (SEO-friendly)
- [ ] Sugestões de artigos semelhantes no final da página do artigo (mesma categoria/tags)
- [ ] Botão flutuante "Voltar ao topo" na página do artigo
- [ ] Busca inline na home sem abrir nova aba (resultados em lista e grade 3x3)
- [ ] Sentence case nos títulos (apenas 1ª letra maiúscula, nomes próprios preservados)
- [ ] Corrigir títulos existentes no banco para sentence case

## Sprint 41 — Níveis de Permissão no Painel Admin

- [ ] Definir 3 níveis: Administrador (acesso total), Editor (gerencia artigos/shorts/ticker), Contribuidor (cria artigos, aguarda aprovação)
- [ ] Migrar sistema de contas fixas para tabela de usuários admin no banco
- [ ] Administrador pode criar/editar/remover contas de Editor e Contribuidor
- [ ] Controle de acesso por nível em cada aba do painel
- [ ] Aba "Usuários" no painel admin para gerenciar permissões
- [ ] Editor pode publicar, editar e remover artigos, mas não gerencia usuários
- [ ] Contribuidor pode criar artigos (ficam em rascunho para aprovação do editor/admin)

## Sprint 42 — Correção de Permissões do Painel Admin

- [x] Diagnosticado: adminProcedure verificava cookie === "authenticated" mas o cookie passou a armazenar JSON após Sprint 41
- [x] Corrigido: parseAdminSession() agora faz JSON.parse do cookie e aceita qualquer role válido (admin/editor/contributor)
- [x] Dois admins inseridos diretamente no banco (agenciadeepmkt@gmail.com e artsenna10@gmail.com)
- [x] 93 testes passando após a correção

## Sprint 43 — Concluir Aba Equipe Editorial

- [ ] Registrar tab "adminUsers" no menu lateral do painel admin
- [ ] Conectar render do AdminUsersTab no main content
- [ ] Verificar endpoints: listUsers, createUser, updateUser, deleteUser
- [ ] Testar criação e edição de usuários admin no painel

## Sprint 44 — Backup Automático do Banco de Dados

- [ ] Backup automático a cada hora: exportar artigos, configurações, admin_users, shorts para S3
- [ ] Manter os últimos 24 backups (1 por hora, rotação automática)
- [ ] Aba "Backup & Restauração" no painel admin: listar backups disponíveis, baixar, restaurar
- [ ] Botão "Fazer Backup Agora" para backup manual imediato
- [ ] Notificação ao admin quando backup falhar

## Sprint 45 — Dashboard Google Analytics no Painel Admin

- [ ] Integrar Google Analytics Data API (GA4) no backend
- [ ] Endpoint admin: buscar métricas (usuários ativos, pageviews, sessões, bounce rate, top páginas)
- [ ] Dashboard visual no painel admin com gráficos de linha e cards de métricas
- [ ] Filtro de período: hoje, 7 dias, 30 dias
- [ ] Top 10 artigos mais lidos (por pageviews do GA4)
- [ ] Usuários em tempo real (active users agora)
## Sprint 46 — Melhorias de UX e Admin (Sessão Atual)
- [x] Corrigir erros de TypeScript no backupService.ts (usar getDb() em vez de drizzleDb)
- [x] Adicionar funções de stats ricas no db.ts (getArticlesPerDay, getTopArticles, getCategoryDistribution)
- [x] Expandir endpoint stats.overview com dados ricos para o Dashboard
- [x] Reescrever DashboardTab com métricas ricas (cards, gráfico de artigos por dia, top artigos, distribuição por categoria)
- [x] Criar BackupTab no painel admin (backup manual, histórico de backups, informações)
- [x] Conectar BackupTab ao menu lateral do admin
- [x] Verificar AdminUsersTab — já estava completo com CRUD de usuários
- [x] Adicionar fontes regionais de Alagoas ao globalNewsFetcher (TNH1, Alagoas24h, Correio de Alagoas)
- [x] Melhorar RelatedPosts para grade 3x3 com 6 posts relacionados
- [x] Adicionar BackToTopButton flutuante na página do artigo
- [x] Implementar busca inline na home (campo de busca com dropdown de resultados em tempo real)
## Sprint 47 — Busca Mobile Otimizada
- [x] Criar overlay de busca mobile em tela cheia (fullscreen) com animação slide-up
- [x] Campo de busca proeminente com teclado virtual ativado automaticamente
- [x] Resultados em lista com thumbnail, título, categoria e timestamp
- [x] Botão de busca dedicado no header mobile (ícone de lupa)
- [x] Botão de busca no menu mobile lateral
- [x] Fechar busca com botão X ou swipe down
- [x] Estado vazio com sugestões de categorias populares
- [x] Estado "sem resultados" com mensagem amigável
- [x] Histórico de buscas recentes (localStorage)
- [x] Animações suaves (entrada/saída do overlay)
## Sprint 48 — Banner de Anúncio Global
- [x] Remover banner de anúncio abaixo do hero na Home
- [x] Adicionar banner de anúncio fixo no layout global (App.tsx) abaixo do header/ticker
- [x] Banner aparece em todas as páginas (Home, Artigo, Busca, Shorts, etc.)
- [x] Banner responsivo: 728x90 desktop, 320x50 mobile

## Sprint 49 — Reordenação do Topo
- [x] Mover barra ticker "De Última Hora" para o topo absoluto (acima da publicidade)

## Sprint 50 — Correções de UI
- [x] Remover ticker duplicado do ArticlePage.tsx
- [x] Shorts: clicar no card abre o artigo correspondente
- [x] Shorts: exibir breve resumo nos cards com link para o artigo

## Sprint 51 — Migração de Dados
- [x] Script de vinculação de shorts a artigos (link-shorts-to-articles.mjs)
- [x] Executar script e verificar resultados

## Sprint 51 — Migração de Dados
- [x] Script de vinculação de shorts a artigos (link-shorts-to-articles.mjs)
- [x] Executar script e verificar resultados

## Sprint 52 — Cron Job de Vinculação Automática
- [x] Criar serviço linkShortsToArticles.ts com lógica de correspondência
- [x] Integrar ao cron job do servidor (execução a cada 30 minutos)

## Sprint 53 — Pop-up, Trending Topics e Hero Carousel
- [ ] Pop-up de saída: exibir apenas uma vez por sessão (localStorage)
- [ ] Trending topics: integração Google Trends BR com métricas e publicação automática
- [ ] Hero carousel: setas de navegação anterior/próximo

## Sprint 54 — Deduplicação de Artigos
- [x] Script deduplicate-articles.mjs para remover artigos duplicados
- [x] Prevenção de duplicatas no globalNewsFetcher

## Sprint 55 — VLibras e Deduplicação Diária
- [x] Corrigir VLibras no site
- [x] Cron job diário de deduplicação de artigos no servidor

## Sprint 56 — Google Trends BR na seção Mais Lidas
- [x] Serviço trendingFetcher.ts para buscar e salvar trending topics do Google Trends BR
- [ ] Tabela trending_topics no banco de dados
- [x] Endpoint tRPC trends.getTopics
- [ ] Publicação automática de artigos sobre temas em alta
- [ ] UI da seção Mais Lidas atualizada com trending topics e métricas de buscas
- [x] Corrigir erro 'require is not defined' na página admin.cnnbra.com.br/admin
- [x] Setas de navegação no hero carousel (anterior/próximo, dots, pausa hover, swipe mobile)
