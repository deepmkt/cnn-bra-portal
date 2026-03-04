/**
 * CNN Shorts Automation
 * - Busca vídeos virais de notícias no YouTube (sem API key, usando RSS público)
 * - Gera shorts automáticos a partir de artigos recentes via IA
 * - Ambas as fontes são publicadas como "online" automaticamente
 */

import * as db from "./db";
import { invokeLLM } from "./_core/llm";

// ===== YouTube RSS (sem API key) =====
// Usa o feed RSS público do YouTube para canais de notícias brasileiras
const YOUTUBE_NEWS_CHANNELS = [
  // Canais de notícias brasileiras no YouTube
  { channelId: "UCCLMi4bDDOkzIFMkVFGMbkw", name: "CNN Brasil" },
  { channelId: "UCo_IB5YEnoPHgGGmQj9GKBA", name: "Jovem Pan News" },
  { channelId: "UCbSqpFMqWDMBKhGpNqLpVEQ", name: "Record News" },
  { channelId: "UCVFbpBZGMEBzEBpFnzrJbVA", name: "Band Jornalismo" },
  { channelId: "UCpMHZVTlvkqPQTWFQDDhvmg", name: "SBT News" },
  { channelId: "UCnUYZLuoy1rq1aVMwx4aTzw", name: "GloboNews" },
];

// Busca RSS do YouTube de um canal específico
async function fetchYouTubeChannelRSS(channelId: string): Promise<any[]> {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseYouTubeRSS(xml);
  } catch {
    return [];
  }
}

function parseYouTubeRSS(xml: string): any[] {
  const entries: any[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    const videoId = (entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/) || [])[1];
    const title = (entry.match(/<title>(.*?)<\/title>/) || [])[1];
    const published = (entry.match(/<published>(.*?)<\/published>/) || [])[1];
    const thumbnail = (entry.match(/url="(https:\/\/i[0-9]\.ytimg\.com[^"]+)"/) || [])[1];
    const description = (entry.match(/<media:description>([\s\S]*?)<\/media:description>/) || [])[1];
    const views = (entry.match(/views="(\d+)"/) || [])[1];
    if (videoId && title) {
      entries.push({
        videoId,
        title: decodeXMLEntities(title),
        published: published ? new Date(published) : new Date(),
        thumbnail: thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        description: description ? decodeXMLEntities(description).substring(0, 300) : "",
        views: views ? parseInt(views) : 0,
      });
    }
  }
  return entries;
}

function decodeXMLEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

// Mapeia título do canal para categoria CNN BRA
function mapChannelToCategory(channelName: string, title: string): string {
  const titleLower = title.toLowerCase();
  if (titleLower.includes("esport") || titleLower.includes("futebol") || titleLower.includes("copa") || titleLower.includes("campeonat")) return "ESPORTES";
  if (titleLower.includes("polít") || titleLower.includes("governo") || titleLower.includes("congresso") || titleLower.includes("eleição")) return "POLÍTICA";
  if (titleLower.includes("econom") || titleLower.includes("mercado") || titleLower.includes("bolsa") || titleLower.includes("inflação")) return "ECONOMIA";
  if (titleLower.includes("mundo") || titleLower.includes("internacional") || titleLower.includes("guerra") || titleLower.includes("eua")) return "GLOBAL";
  return "DIA A DIA";
}

// Verifica se um short com esse youtubeId já existe
async function youtubeShortExists(youtubeId: string): Promise<boolean> {
  try {
    const existing = await db.getShorts({ limit: 500 });
    return existing.some((s: any) => s.youtubeId === youtubeId);
  } catch {
    return false;
  }
}

// ===== Buscar e importar vídeos do YouTube =====
export async function fetchYouTubeShorts(maxPerChannel = 3): Promise<{ imported: number; errors: number }> {
  let imported = 0;
  let errors = 0;

  for (const channel of YOUTUBE_NEWS_CHANNELS) {
    try {
      const videos = await fetchYouTubeChannelRSS(channel.channelId);
      // Pegar os mais recentes (últimas 48h)
      const cutoff = Date.now() - 48 * 60 * 60 * 1000;
      const recent = videos
        .filter(v => v.published.getTime() > cutoff)
        .slice(0, maxPerChannel);

      for (const video of recent) {
        if (await youtubeShortExists(video.videoId)) continue;

        const category = mapChannelToCategory(channel.name, video.title);
        const videoUrl = `https://www.youtube.com/embed/${video.videoId}?autoplay=1&mute=1&loop=1&playlist=${video.videoId}`;

        await db.createShort({
          title: video.title.substring(0, 280),
          description: video.description || `Vídeo de ${channel.name}`,
          videoUrl,
          thumbnailUrl: video.thumbnail,
          category,
          duration: 60,
          status: "online",
          authorName: channel.name,
          youtubeId: video.videoId,
          sourceType: "youtube",
          publishedAt: new Date(),
        } as any);
        imported++;
        console.log(`[Shorts] YouTube imported: ${video.title.substring(0, 60)} (${channel.name})`);
      }
    } catch (err) {
      console.error(`[Shorts] YouTube channel error (${channel.name}):`, err);
      errors++;
    }
  }

  return { imported, errors };
}

// ===== Gerar shorts via IA a partir de artigos recentes =====
export async function generateAIShorts(maxToGenerate = 3): Promise<{ generated: number; errors: number }> {
  let generated = 0;
  let errors = 0;

  try {
    // Buscar artigos recentes com imagem (últimas 6h) que ainda não viraram short
    const recentArticles = await db.getArticles({ status: "online", limit: 50 });
    const cutoff = Date.now() - 6 * 60 * 60 * 1000;
    const candidates = recentArticles
      .filter((a: any) => a.imageUrl && a.publishedAt && new Date(a.publishedAt).getTime() > cutoff)
      .slice(0, maxToGenerate * 3); // pegar mais para ter margem

    // Verificar quais já têm short
    const existingShorts = await db.getShorts({ limit: 500 });
    const existingArticleIds = new Set(existingShorts.filter((s: any) => s.articleId).map((s: any) => s.articleId));

    const toProcess = candidates.filter((a: any) => !existingArticleIds.has(a.id)).slice(0, maxToGenerate);

    for (const article of toProcess) {
      try {
        // Gerar descrição curta via IA (estilo short/reel)
        const aiResponse = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `Você é um editor de vídeos curtos de notícias (estilo Reels/TikTok). 
Crie uma descrição curta e impactante para um short de notícia, em português brasileiro.
Máximo 120 caracteres. Use linguagem dinâmica, direta e envolvente. 
Não use hashtags. Não use emojis. Apenas o texto do short.`,
            },
            {
              role: "user",
              content: `Título: ${article.title}\nResumo: ${article.excerpt || article.content?.substring(0, 200) || ""}`,
            },
          ],
        });

        const rawContent = aiResponse?.choices?.[0]?.message?.content;
        const shortDescription = (typeof rawContent === "string" ? rawContent.trim() : "") || article.excerpt || "";

        await db.createShort({
          title: article.title.substring(0, 280),
          description: shortDescription.substring(0, 300),
          videoUrl: article.imageUrl!, // imagem será usada com efeito Ken Burns no frontend
          thumbnailUrl: article.imageUrl!,
          category: article.category || "GERAL",
          duration: 30,
          status: "online",
          authorName: "CNN BRA",
          articleId: article.id,
          sourceType: "ai",
          publishedAt: new Date(),
        } as any);
        generated++;
        console.log(`[Shorts] AI generated: ${article.title.substring(0, 60)}`);
      } catch (err) {
        console.error(`[Shorts] AI generation error for article ${article.id}:`, err);
        errors++;
      }
    }
  } catch (err) {
    console.error("[Shorts] AI shorts batch error:", err);
    errors++;
  }

  return { generated, errors };
}

// ===== Ciclo completo de automação de shorts =====
export async function runShortsAutomation(): Promise<{ youtubeImported: number; aiGenerated: number; errors: number }> {
  console.log("[Shorts] Running automation cycle...");

  const [ytResult, aiResult] = await Promise.allSettled([
    fetchYouTubeShorts(2),
    generateAIShorts(3),
  ]);

  const youtubeImported = ytResult.status === "fulfilled" ? ytResult.value.imported : 0;
  const aiGenerated = aiResult.status === "fulfilled" ? aiResult.value.generated : 0;
  const errors =
    (ytResult.status === "fulfilled" ? ytResult.value.errors : 1) +
    (aiResult.status === "fulfilled" ? aiResult.value.errors : 1);

  console.log(`[Shorts] Cycle complete: ${youtubeImported} YouTube, ${aiGenerated} AI generated, ${errors} errors`);
  return { youtubeImported, aiGenerated, errors };
}
