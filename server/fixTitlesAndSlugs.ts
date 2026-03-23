/**
 * Fix all article titles and slugs in the database.
 * 
 * Titles: Convert to ABNT-style sentence case (first letter of sentence uppercase,
 * rest lowercase, except acronyms).
 * 
 * Slugs: Regenerate from the corrected title (clean, no random suffixes).
 */

// Known acronyms that should stay uppercase
const ACRONYMS = new Set([
  "EUA", "ONU", "OMS", "PIB", "IBGE", "STF", "STJ", "TSE", "TST", "CPI",
  "PT", "PL", "PSDB", "MDB", "PP", "PSD", "PDT", "PSB", "PSOL", "PCdoB",
  "PMDB", "DEM", "PSC", "PV", "PROS", "NOVO", "PTB",
  "TV", "CNN", "BBC", "FBI", "CIA", "NASA", "AI", "IA", "MP", "PF",
  "CPF", "CNPJ", "INSS", "SUS", "FGTS", "CLT", "MEI", "PEC",
  "IPCA", "CDI", "SELIC", "BNDES", "BC", "FMI", "G7", "G20",
  "OTAN", "EU", "UE", "BRICS", "MERCOSUL", "FIFA", "COB", "COI",
  "SP", "RJ", "MG", "BA", "PR", "RS", "SC", "PE", "CE", "PA",
  "MA", "GO", "AM", "ES", "PB", "RN", "MT", "MS", "DF", "SE",
  "AL", "PI", "RO", "TO", "AC", "AP", "RR",
  "COVID", "HIV", "DNA", "RNA", "ONG", "LGPD", "LGBTQ",
  "USD", "BRL", "EUR", "GBP", "JPY",
  "NBA", "NFL", "UFC", "F1", "GP", "VAR",
  "FURIA", "MIBR", "CS2", "CS",
  "JHC", "TJ", "TCE", "TCU", "MPF", "MPE",
  "BRA",
]);

// Words that should stay lowercase (prepositions, articles, conjunctions) unless first word
const LOWERCASE_WORDS = new Set([
  "de", "da", "do", "das", "dos", "em", "no", "na", "nos", "nas",
  "por", "para", "com", "sem", "sob", "sobre", "entre", "até",
  "e", "ou", "mas", "que", "se", "a", "o", "as", "os", "um", "uma",
  "uns", "umas", "ao", "à", "aos", "às",
]);

/**
 * Convert a title to ABNT-style sentence case:
 * - First letter of the sentence uppercase
 * - Everything else lowercase
 * - Except: known acronyms stay UPPERCASE
 * - Remove ALL-CAPS prefixes like "MORADIA - " or "JUSTIÇA FISCAL: "
 */
export function abntTitle(title: string): string {
  if (!title) return title;

  // Step 1: Remove ALL-CAPS prefix patterns like "MORADIA - ", "FORÇA TAREFA: "
  // Match: one or more ALL-CAPS words followed by a separator (- – — :)
  let cleaned = title.replace(/^(?:[A-Z\u00C0-\u00DC]+\s+)*[A-Z\u00C0-\u00DC]+\s*[-\u2013\u2014:]\s*/, "");
  
  // If cleaning removed everything or left less than 10 chars, use original
  if (cleaned.length < 10) cleaned = title;

  // Step 2: Convert everything to lowercase first
  const lowered = cleaned.toLowerCase();

  // Step 3: Split into words and apply rules
  const words = lowered.split(/(\s+)/); // preserve whitespace

  let isFirstWord = true;
  const result = words.map((token) => {
    // Preserve whitespace tokens
    if (/^\s+$/.test(token)) return token;

    // Extract punctuation prefix/suffix
    const match = token.match(/^([^a-zà-ÿ0-9]*)(.*?)([^a-zà-ÿ0-9]*)$/);
    if (!match) return token;
    const [, prefix, core, suffix] = match;
    if (!core) return token;

    // Check if it's a known acronym (compare uppercase version)
    const upper = core.toUpperCase();
    if (ACRONYMS.has(upper) && core.length >= 2) {
      const wasFirst = isFirstWord;
      isFirstWord = false;
      return prefix + upper + suffix;
    }

    // Check for numbers mixed with letters (e.g., "80%", "9z")
    if (/\d/.test(core)) {
      isFirstWord = false;
      return token;
    }

    // First real word: capitalize first letter only
    if (isFirstWord) {
      isFirstWord = false;
      return prefix + core.charAt(0).toUpperCase() + core.slice(1) + suffix;
    }

    isFirstWord = false;
    // Everything else stays lowercase (already lowered)
    return token;
  });

  return result.join("");
}

/**
 * Generate a clean slug from a title (no random suffixes).
 * Uses the article ID as a unique suffix instead.
 */
export function cleanSlug(title: string, id: number): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
  return `${base}-${id}`;
}
