/**
 * WordPress WXR (WordPress eXtended RSS) XML Importer
 * Parses WordPress export files and imports posts into CNN BRA database
 */
import * as db from "./db";

interface WPPost {
  title: string;
  content: string;
  excerpt: string;
  status: string;
  category: string;
  imageUrl?: string;
  publishedAt?: Date;
  slug?: string;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function extractTagContent(xml: string, tag: string): string {
  // Handle CDATA sections
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i");
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  // Handle regular content
  const regularRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const regularMatch = xml.match(regularRegex);
  if (regularMatch) return decodeHtmlEntities(regularMatch[1].trim());

  return "";
}

function mapWPCategory(wpCategory: string): string {
  const categoryMap: Record<string, string> = {
    "política": "POLÍTICA",
    "politica": "POLÍTICA",
    "economia": "ECONOMIA",
    "esporte": "ESPORTES",
    "esportes": "ESPORTES",
    "tecnologia": "TECNOLOGIA",
    "saúde": "SAÚDE",
    "saude": "SAÚDE",
    "entretenimento": "ENTRETENIMENTO",
    "mundo": "MUNDO",
    "brasil": "BRASIL",
    "dia a dia": "DIA A DIA",
    "geral": "GERAL",
    "global": "GLOBAL",
  };
  const lower = wpCategory.toLowerCase();
  return categoryMap[lower] || wpCategory.toUpperCase() || "GERAL";
}

export async function parseWPXml(xmlContent: string): Promise<{
  imported: number;
  skipped: number;
  errors: number;
  posts: Array<{ title: string; status: string }>;
}> {
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const posts: Array<{ title: string; status: string }> = [];

  try {
    // Split XML into individual <item> blocks
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlContent)) !== null) {
      const itemXml = match[1];

      try {
        // Extract post type - only import posts
        const postType = extractTagContent(itemXml, "wp:post_type");
        if (postType && postType !== "post") {
          skipped++;
          continue;
        }

        // Extract post status
        const wpStatus = extractTagContent(itemXml, "wp:status");
        const status = wpStatus === "publish" ? "online" : "draft";

        // Extract title
        const title = extractTagContent(itemXml, "title");
        if (!title) {
          skipped++;
          continue;
        }

        // Extract content
        const content = extractTagContent(itemXml, "content:encoded");
        const excerpt = extractTagContent(itemXml, "excerpt:encoded");
        const slug = extractTagContent(itemXml, "wp:post_name");

        // Extract category
        const categoryMatch = itemXml.match(/<category domain="category"[^>]*><!?\[?CDATA\[?([^\]<>]*)\]?\]?>/i);
        const category = categoryMatch ? mapWPCategory(categoryMatch[1]) : "GERAL";

        // Extract featured image (from _thumbnail_id or wp:postmeta)
        let imageUrl: string | undefined;
        const imageUrlMatch = itemXml.match(/<wp:meta_key><!?\[CDATA\[_thumbnail_url\]\]><\/wp:meta_key>\s*<wp:meta_value><!?\[CDATA\[(.*?)\]\]>/);
        if (imageUrlMatch) imageUrl = imageUrlMatch[1];

        // Extract publish date
        let publishedAt: Date | undefined;
        const pubDateMatch = itemXml.match(/<pubDate>([^<]+)<\/pubDate>/);
        if (pubDateMatch) {
          const parsed = new Date(pubDateMatch[1]);
          if (!isNaN(parsed.getTime())) publishedAt = parsed;
        }

        // Check for duplicate by slug
        if (slug) {
          const existing = await db.getArticleBySlug(slug);
          if (existing) {
            skipped++;
            continue;
          }
        }

        // Create article
        await db.createArticle({
          title: title.substring(0, 499),
          slug: slug ? slug.substring(0, 599) : undefined,
          excerpt: excerpt ? excerpt.substring(0, 2000) : undefined,
          content: content || undefined,
          category,
          imageUrl: imageUrl || undefined,
          status: status as "online" | "draft",
          publishedAt: publishedAt || (status === "online" ? new Date() : undefined),
          isHero: false,
          isFeatured: false,
          isBreaking: false,
        } as any);

        imported++;
        posts.push({ title: title.substring(0, 80), status });
      } catch (itemErr) {
        console.error("[WP Import] Error importing item:", itemErr);
        errors++;
      }
    }
  } catch (err) {
    console.error("[WP Import] Fatal error:", err);
    errors++;
  }

  return { imported, skipped, errors, posts };
}
