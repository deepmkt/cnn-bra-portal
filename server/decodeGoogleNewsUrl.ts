/**
 * Decode Google News URL to get the real article URL.
 * Parses the Google News page HTML to extract the actual article link.
 */

import * as cheerio from "cheerio";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function decodeGoogleNewsUrl(sourceUrl: string): Promise<string> {
  try {
    if (!sourceUrl.includes("news.google.com")) {
      return sourceUrl;
    }
    
    // Fetch the Google News page and parse the HTML to find the real article link
    const realUrl = await extractRealUrlFromGoogleNews(sourceUrl);
    
    // Verify we got a real URL (not Google News)
    if (realUrl && !realUrl.includes("news.google.com") && realUrl.startsWith("http")) {
      console.log(`[GoogleNews] Resolved: ${sourceUrl.substring(0, 60)}... -> ${realUrl.substring(0, 80)}`);
      return realUrl;
    }
    
    console.warn(`[GoogleNews] Failed to resolve, using original: ${sourceUrl.substring(0, 80)}...`);
    return sourceUrl;
  } catch (err) {
    console.error(`[GoogleNews] Decode error:`, err);
    return sourceUrl;
  }
}

/**
 * Fetch Google News page and extract the real article URL from HTML
 */
async function extractRealUrlFromGoogleNews(googleUrl: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(googleUrl, {
      method: "GET",
      headers: { 
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    
    if (!response.ok) {
      return googleUrl;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Strategy 1: Look for canonical link
    const canonical = $('link[rel="canonical"]').attr("href");
    if (canonical && !canonical.includes("news.google.com")) {
      return canonical;
    }
    
    // Strategy 2: Look for og:url
    const ogUrl = $('meta[property="og:url"]').attr("content");
    if (ogUrl && !ogUrl.includes("news.google.com")) {
      return ogUrl;
    }
    
    // Strategy 3: Look for the "Go to article" link or similar
    const articleLink = $('a[href]:contains("article"), a[href]:contains("source"), a.VDXfz').first().attr("href");
    if (articleLink && articleLink.startsWith("http") && !articleLink.includes("news.google.com")) {
      return articleLink;
    }
    
    // Strategy 4: Look for any external link in the page (first non-Google link)
    const allLinks = $("a[href]");
    for (let i = 0; i < allLinks.length; i++) {
      const href = $(allLinks[i]).attr("href");
      if (href && href.startsWith("http") && !href.includes("google.com") && !href.includes("youtube.com")) {
        return href;
      }
    }
    
    // Strategy 5: Try to extract from the URL itself (base64 decode)
    // Google News URLs often have the pattern: /articles/CBM...?oc=5
    // The CBM part is base64-encoded and contains the real URL
    const match = googleUrl.match(/\/articles\/([A-Za-z0-9_-]+)/);
    if (match && match[1]) {
      try {
        const base64Part = match[1];
        // Try to decode (this is a simplified approach)
        const decoded = Buffer.from(base64Part, "base64").toString("utf-8");
        // Look for URLs in the decoded string
        const urlMatch = decoded.match(/https?:\/\/[^\s"'<>]+/);
        if (urlMatch && !urlMatch[0].includes("google.com")) {
          return urlMatch[0];
        }
      } catch {}
    }
    
    return googleUrl;
  } catch (err) {
    console.error(`[GoogleNews] Extract error:`, err);
    return googleUrl;
  }
}
