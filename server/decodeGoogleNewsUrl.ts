/**
 * Decode Google News URL to get the real article URL.
 * Uses redirect-following as the primary method (most reliable).
 */

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function decodeGoogleNewsUrl(sourceUrl: string): Promise<string> {
  try {
    if (!sourceUrl.includes("news.google.com")) {
      return sourceUrl;
    }
    
    // Use redirect-following as primary method (most reliable)
    const realUrl = await resolveGoogleNewsUrl(sourceUrl);
    
    // Verify we got a real URL (not Google News)
    if (realUrl && !realUrl.includes("news.google.com") && realUrl.startsWith("http")) {
      console.log(`[GoogleNews] Resolved: ${sourceUrl.substring(0, 80)}... -> ${realUrl.substring(0, 80)}...`);
      return realUrl;
    }
    
    console.warn(`[GoogleNews] Failed to resolve: ${sourceUrl.substring(0, 80)}...`);
    return sourceUrl;
  } catch (err) {
    console.error(`[GoogleNews] Decode error:`, err);
    return sourceUrl;
  }
}

/**
 * Fetch and follow Google News redirect to get the real article URL
 */
async function resolveGoogleNewsUrl(googleUrl: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(googleUrl, {
      method: "GET",
      headers: { "User-Agent": USER_AGENT },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response.url || googleUrl;
  } catch {
    return googleUrl;
  }
}
