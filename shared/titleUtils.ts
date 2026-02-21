/**
 * Capitalize title properly for Portuguese:
 * - First letter uppercase, rest lowercase
 * - Respect proper nouns, acronyms, and Portuguese rules
 */

// Known acronyms and proper nouns that should stay uppercase
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
]);

// Words that should stay lowercase (prepositions, articles, conjunctions) unless first word
const LOWERCASE_WORDS = new Set([
  "de", "da", "do", "das", "dos", "em", "no", "na", "nos", "nas",
  "por", "para", "com", "sem", "sob", "sobre", "entre", "até",
  "e", "ou", "mas", "que", "se", "a", "o", "as", "os", "um", "uma",
  "uns", "umas", "ao", "à", "aos", "às",
]);

export function capitalizeTitle(title: string): string {
  if (!title) return title;
  
  const words = title.split(/\s+/);
  
  const result = words.map((word, index) => {
    // Preserve words that are known acronyms
    const cleanWord = word.replace(/[^A-ZÀ-Úa-zà-ú0-9]/g, "");
    if (ACRONYMS.has(cleanWord.toUpperCase()) && cleanWord.length >= 2) {
      return word.replace(cleanWord, cleanWord.toUpperCase());
    }
    
    // Lowercase prepositions/articles (except first word)
    if (index > 0 && LOWERCASE_WORDS.has(word.toLowerCase())) {
      return word.toLowerCase();
    }
    
    // First word: always capitalize first letter
    if (index === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    
    // All uppercase word that's NOT an acronym — convert to title case
    if (/^[A-ZÀ-Ú]+$/.test(cleanWord) && cleanWord.length > 1) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    
    // Normal word: capitalize first letter
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
  
  return result.join(" ");
}
