/**
 * Reference data for all 27 Brazilian states.
 * Used by the state portal pages to filter articles and display state-specific content.
 */

export interface BrazilState {
  uf: string;           // Two-letter code (e.g., "AL")
  name: string;         // Full name (e.g., "Alagoas")
  capital: string;      // Capital city
  highlights: string[]; // Cities to highlight in the portal
  region: string;       // Geographic region
  keywords: string[];   // Keywords to match articles to this state
}

export const BRAZIL_STATES: BrazilState[] = [
  { uf: "AC", name: "Acre", capital: "Rio Branco", highlights: ["Rio Branco", "Cruzeiro do Sul"], region: "Norte", keywords: ["acre", "rio branco", "cruzeiro do sul"] },
  { uf: "AL", name: "Alagoas", capital: "Maceió", highlights: ["Maceió", "Arapiraca"], region: "Nordeste", keywords: ["alagoas", "maceió", "maceio", "arapiraca", "penedo", "rio largo", "palmeira dos índios", "marechal deodoro", "alagoano", "alagoana", "alagoanos"] },
  { uf: "AP", name: "Amapá", capital: "Macapá", highlights: ["Macapá", "Santana"], region: "Norte", keywords: ["amapá", "amapa", "macapá", "macapa", "santana"] },
  { uf: "AM", name: "Amazonas", capital: "Manaus", highlights: ["Manaus", "Parintins"], region: "Norte", keywords: ["amazonas", "manaus", "parintins", "zona franca"] },
  { uf: "BA", name: "Bahia", capital: "Salvador", highlights: ["Salvador", "Feira de Santana"], region: "Nordeste", keywords: ["bahia", "salvador", "feira de santana", "baiano", "baiana"] },
  { uf: "CE", name: "Ceará", capital: "Fortaleza", highlights: ["Fortaleza", "Juazeiro do Norte"], region: "Nordeste", keywords: ["ceará", "ceara", "fortaleza", "juazeiro do norte", "cearense"] },
  { uf: "DF", name: "Distrito Federal", capital: "Brasília", highlights: ["Brasília", "Taguatinga"], region: "Centro-Oeste", keywords: ["distrito federal", "brasília", "brasilia", "planalto", "congresso nacional"] },
  { uf: "ES", name: "Espírito Santo", capital: "Vitória", highlights: ["Vitória", "Vila Velha"], region: "Sudeste", keywords: ["espírito santo", "espirito santo", "vitória", "vitoria", "vila velha", "capixaba"] },
  { uf: "GO", name: "Goiás", capital: "Goiânia", highlights: ["Goiânia", "Aparecida de Goiânia"], region: "Centro-Oeste", keywords: ["goiás", "goias", "goiânia", "goiania", "goiano"] },
  { uf: "MA", name: "Maranhão", capital: "São Luís", highlights: ["São Luís", "Imperatriz"], region: "Nordeste", keywords: ["maranhão", "maranhao", "são luís", "sao luis", "imperatriz", "maranhense"] },
  { uf: "MT", name: "Mato Grosso", capital: "Cuiabá", highlights: ["Cuiabá", "Rondonópolis"], region: "Centro-Oeste", keywords: ["mato grosso", "cuiabá", "cuiaba", "rondonópolis", "mato-grossense"] },
  { uf: "MS", name: "Mato Grosso do Sul", capital: "Campo Grande", highlights: ["Campo Grande", "Dourados"], region: "Centro-Oeste", keywords: ["mato grosso do sul", "campo grande", "dourados", "sul-mato-grossense"] },
  { uf: "MG", name: "Minas Gerais", capital: "Belo Horizonte", highlights: ["Belo Horizonte", "Uberlândia"], region: "Sudeste", keywords: ["minas gerais", "belo horizonte", "uberlândia", "mineiro", "mineira"] },
  { uf: "PA", name: "Pará", capital: "Belém", highlights: ["Belém", "Ananindeua"], region: "Norte", keywords: ["pará", "belém", "belem", "ananindeua", "paraense"] },
  { uf: "PB", name: "Paraíba", capital: "João Pessoa", highlights: ["João Pessoa", "Campina Grande"], region: "Nordeste", keywords: ["paraíba", "paraiba", "joão pessoa", "joao pessoa", "campina grande", "paraibano"] },
  { uf: "PR", name: "Paraná", capital: "Curitiba", highlights: ["Curitiba", "Londrina"], region: "Sul", keywords: ["paraná", "parana", "curitiba", "londrina", "paranaense"] },
  { uf: "PE", name: "Pernambuco", capital: "Recife", highlights: ["Recife", "Olinda"], region: "Nordeste", keywords: ["pernambuco", "recife", "olinda", "pernambucano"] },
  { uf: "PI", name: "Piauí", capital: "Teresina", highlights: ["Teresina", "Parnaíba"], region: "Nordeste", keywords: ["piauí", "piaui", "teresina", "parnaíba", "piauiense"] },
  { uf: "RJ", name: "Rio de Janeiro", capital: "Rio de Janeiro", highlights: ["Rio de Janeiro", "Niterói"], region: "Sudeste", keywords: ["rio de janeiro", "niterói", "niteroi", "carioca", "fluminense"] },
  { uf: "RN", name: "Rio Grande do Norte", capital: "Natal", highlights: ["Natal", "Mossoró"], region: "Nordeste", keywords: ["rio grande do norte", "natal", "mossoró", "mossoro", "potiguar"] },
  { uf: "RS", name: "Rio Grande do Sul", capital: "Porto Alegre", highlights: ["Porto Alegre", "Caxias do Sul"], region: "Sul", keywords: ["rio grande do sul", "porto alegre", "caxias do sul", "gaúcho", "gaucho"] },
  { uf: "RO", name: "Rondônia", capital: "Porto Velho", highlights: ["Porto Velho", "Ji-Paraná"], region: "Norte", keywords: ["rondônia", "rondonia", "porto velho", "ji-paraná"] },
  { uf: "RR", name: "Roraima", capital: "Boa Vista", highlights: ["Boa Vista"], region: "Norte", keywords: ["roraima", "boa vista"] },
  { uf: "SC", name: "Santa Catarina", capital: "Florianópolis", highlights: ["Florianópolis", "Joinville"], region: "Sul", keywords: ["santa catarina", "florianópolis", "florianopolis", "joinville", "catarinense"] },
  { uf: "SP", name: "São Paulo", capital: "São Paulo", highlights: ["São Paulo", "Campinas"], region: "Sudeste", keywords: ["são paulo", "sao paulo", "campinas", "paulista", "paulistano"] },
  { uf: "SE", name: "Sergipe", capital: "Aracaju", highlights: ["Aracaju", "Nossa Senhora do Socorro"], region: "Nordeste", keywords: ["sergipe", "aracaju", "sergipano"] },
  { uf: "TO", name: "Tocantins", capital: "Palmas", highlights: ["Palmas", "Araguaína"], region: "Norte", keywords: ["tocantins", "palmas", "araguaína", "araguaina", "tocantinense"] },
];

/** Lookup a state by its UF code (case-insensitive) */
export function getStateByUF(uf: string): BrazilState | undefined {
  return BRAZIL_STATES.find(s => s.uf === uf.toUpperCase());
}

/** Get all UF codes */
export function getAllUFs(): string[] {
  return BRAZIL_STATES.map(s => s.uf);
}

/** Group states by region */
export function getStatesByRegion(): Record<string, BrazilState[]> {
  const grouped: Record<string, BrazilState[]> = {};
  for (const state of BRAZIL_STATES) {
    if (!grouped[state.region]) grouped[state.region] = [];
    grouped[state.region].push(state);
  }
  return grouped;
}

/**
 * Detect the Brazilian state from article text (title + tags + excerpt).
 * Returns the UF code if a match is found, or null otherwise.
 * Matches the FIRST state whose keywords appear in the text.
 * Priority order: longer keywords first to avoid false positives
 * (e.g., "rio grande do sul" before "rio").
 */
export function detectState(text: string): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();

  // Sort states by longest keyword first to avoid partial matches
  const sorted = [...BRAZIL_STATES].sort((a, b) => {
    const maxA = Math.max(...a.keywords.map(k => k.length));
    const maxB = Math.max(...b.keywords.map(k => k.length));
    return maxB - maxA;
  });

  for (const state of sorted) {
    for (const keyword of state.keywords) {
      // Use word boundary check to avoid partial matches
      // e.g., "para" should not match "parabéns"
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|\\s|,|;|\\.|\\(|\\-)${escaped}(?:$|\\s|,|;|\\.|\\)|\\-)`, 'i');
      if (regex.test(` ${lower} `)) {
        return state.uf;
      }
    }
  }

  return null;
}
