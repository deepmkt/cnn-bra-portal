/**
 * Decode Google News URL to get the real article URL.
 *
 * Google News RSS items have URLs like:
 *   https://news.google.com/rss/articles/CBMi...?oc=5
 *
 * Since July 2024, Google News uses a new encoding format ("AU_yqL" prefix)
 * that requires fetching a signature and timestamp from the article page,
 * then calling the batchexecute API with those parameters.
 *
 * Algorithm based on:
 * https://github.com/SSujitX/google-news-url-decoder
 * https://gist.github.com/huksley/bc3cb046157a99cd9d1517b32f91a99e
 */

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

/**
 * Main entry point: decode a Google News URL to get the real article URL.
 */
export async function decodeGoogleNewsUrl(sourceUrl: string): Promise<string> {
  try {
    if (!sourceUrl.includes("news.google.com")) {
      return sourceUrl;
    }

    // Extract base64 ID from URL path
    const base64Id = extractBase64Id(sourceUrl);
    if (!base64Id) {
      console.warn(`[GoogleNews] Could not extract base64 from: ${sourceUrl.substring(0, 80)}`);
      return sourceUrl;
    }

    // Strategy 1: Old-style encoding (pre-July 2024) — decode offline without network
    const oldDecoded = decodeOldStyle(base64Id);
    if (oldDecoded && oldDecoded.startsWith("http") && !oldDecoded.includes("google.com")) {
      console.log(`[GoogleNews] Decoded (old-style): ${oldDecoded.substring(0, 80)}`);
      return oldDecoded;
    }

    // Strategy 2: New-style encoding (post-July 2024) — requires network calls
    // Step 2a: Fetch signature and timestamp from Google News article page
    const params = await getDecodingParams(base64Id);
    if (!params) {
      console.warn(`[GoogleNews] Could not get decoding params for: ${base64Id.substring(0, 30)}...`);
      return sourceUrl;
    }

    // Step 2b: Call batchexecute API with signature and timestamp
    const decoded = await decodeViaApi(base64Id, params.signature, params.timestamp);
    if (decoded && decoded.startsWith("http") && !decoded.includes("news.google.com")) {
      console.log(`[GoogleNews] Decoded (API): ${decoded.substring(0, 80)}`);
      return decoded;
    }

    console.warn(`[GoogleNews] All strategies failed for: ${sourceUrl.substring(0, 80)}`);
    return sourceUrl;
  } catch (err) {
    console.error(`[GoogleNews] Decode error:`, err);
    return sourceUrl;
  }
}

/**
 * Extract the base64 ID from a Google News URL path.
 */
function extractBase64Id(googleUrl: string): string | null {
  try {
    const url = new URL(googleUrl);
    const path = url.pathname.split("/");
    if (
      url.hostname === "news.google.com" &&
      path.length > 1 &&
      (path[path.length - 2] === "articles" || path[path.length - 2] === "read")
    ) {
      return path[path.length - 1];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Old-style decode (pre-July 2024).
 * The base64 payload directly contains the URL after a fixed prefix.
 *
 * Format: <prefix 0x08,0x13,0x22> <len byte(s)> <URL bytes> [<suffix 0xd2,0x01,0x00>]
 */
function decodeOldStyle(base64Id: string): string | null {
  try {
    const standard = base64Id.replace(/-/g, "+").replace(/_/g, "/");
    const padded = standard + "=".repeat((4 - (standard.length % 4)) % 4);
    let str = Buffer.from(padded, "base64").toString("binary");

    const prefix = Buffer.from([0x08, 0x13, 0x22]).toString("binary");
    if (str.startsWith(prefix)) {
      str = str.substring(prefix.length);
    }

    const suffix = Buffer.from([0xd2, 0x01, 0x00]).toString("binary");
    if (str.endsWith(suffix)) {
      str = str.substring(0, str.length - suffix.length);
    }

    // Read length byte(s) and extract URL
    const bytes = Uint8Array.from(str, (c) => c.charCodeAt(0));
    const len = bytes[0];
    if (len >= 0x80) {
      str = str.substring(2, len + 2);
    } else {
      str = str.substring(1, len + 1);
    }

    // If it starts with "AU_yqL", it's the new-style encoding — can't decode offline
    if (str.startsWith("AU_yqL")) {
      return null;
    }

    return str;
  } catch {
    return null;
  }
}

interface DecodingParams {
  signature: string;
  timestamp: string;
}

/**
 * Fetch signature and timestamp from the Google News article page.
 * These are stored as data attributes (data-n-a-sg, data-n-a-ts) on a c-wiz element.
 */
async function getDecodingParams(base64Id: string): Promise<DecodingParams | null> {
  const urlsToTry = [
    `https://news.google.com/articles/${base64Id}`,
    `https://news.google.com/rss/articles/${base64Id}`,
  ];

  for (const url of urlsToTry) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) continue;

      const html = await response.text();

      // Look for data-n-a-sg (signature) and data-n-a-ts (timestamp)
      const sigMatch = html.match(/data-n-a-sg="([^"]+)"/);
      const tsMatch = html.match(/data-n-a-ts="([^"]+)"/);

      if (sigMatch && tsMatch) {
        return { signature: sigMatch[1], timestamp: tsMatch[1] };
      }

      // Try single quotes
      const sigMatchSq = html.match(/data-n-a-sg='([^']+)'/);
      const tsMatchSq = html.match(/data-n-a-ts='([^']+)'/);
      if (sigMatchSq && tsMatchSq) {
        return { signature: sigMatchSq[1], timestamp: tsMatchSq[1] };
      }
    } catch {
      // Continue to next URL
    }
  }

  return null;
}

/**
 * Call Google's batchexecute API with signature and timestamp to get the real URL.
 */
async function decodeViaApi(
  base64Id: string,
  signature: string,
  timestamp: string
): Promise<string | null> {
  try {
    const payload = [
      "Fbv4je",
      `["garturlreq",[["X","X",["X","X"],null,null,1,1,"US:en",null,1,null,null,null,null,null,0,1],"X","X",1,[1,1,1],1,1,null,0,0,null,0],"${base64Id}",${timestamp},"${signature}"]`,
    ];

    const body = `f.req=${encodeURIComponent(JSON.stringify([[payload]]))}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      "https://news.google.com/_/DotsSplashUi/data/batchexecute",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent": USER_AGENT,
          "Referer": "https://news.google.com/",
        },
        body: body,
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    const text = await response.text();

    // Parse the response: split by double newline, then parse JSON
    const parts = text.split("\n\n");
    if (parts.length < 2) return null;

    const parsed = JSON.parse(parts[1]);
    const trimmed = parsed.slice(0, -2);
    const decoded = JSON.parse(trimmed[0][2])[1];

    if (typeof decoded === "string" && decoded.startsWith("http")) {
      return decoded;
    }

    return null;
  } catch {
    return null;
  }
}
