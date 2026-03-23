import { describe, it, expect } from "vitest";
import { abntTitle, cleanSlug } from "./fixTitlesAndSlugs";

describe("abntTitle", () => {
  it("removes ALL-CAPS prefix with dash separator and applies sentence case", () => {
    const result = abntTitle("MORADIA - Com trabalho de Arthur Lira, habitação avança em Rio Largo");
    expect(result).toBe("Com trabalho de arthur lira, habitação avança em rio largo");
  });

  it("removes ALL-CAPS prefix with colon separator", () => {
    const result = abntTitle("FORÇA TAREFA: Desaparecimento de jovem mobiliza forças de segurança");
    expect(result).toBe("Desaparecimento de jovem mobiliza forças de segurança");
  });

  it("preserves known acronyms like STF, PIB, CPI", () => {
    const result = abntTitle("STF decide sobre CPI e impacto no PIB do país");
    expect(result).toBe("STF decide sobre CPI e impacto no PIB do país");
  });

  it("preserves CNN BRA", () => {
    const result = abntTitle("CNN BRA lança nova cobertura sobre economia");
    expect(result).toBe("CNN BRA lança nova cobertura sobre economia");
  });

  it("converts ALL-CAPS non-acronym words to lowercase", () => {
    const result = abntTitle("APOIO MACIÇO: Mais de 80% dos prefeitos alagoanos endossam Arthur Lira ao Senado");
    expect(result).toBe("Mais de 80% dos prefeitos alagoanos endossam arthur lira ao senado");
  });

  it("converts Title Case to sentence case", () => {
    const result = abntTitle("Francisco Cerúndolo Surpreende E Elimina Daniil Medvedev No Masters 1000 De Miami");
    expect(result).toBe("Francisco cerúndolo surpreende e elimina daniil medvedev no masters 1000 de miami");
  });

  it("handles already-lowercase titles without changes", () => {
    const result = abntTitle("Confiança em alta: copa do brasil 2026 e a expectativa por um futuro promissor");
    expect(result).toBe("Confiança em alta: copa do brasil 2026 e a expectativa por um futuro promissor");
  });

  it("preserves state abbreviations like AL", () => {
    const result = abntTitle("Governo de AL anuncia investimentos em infraestrutura");
    expect(result).toContain("AL");
  });

  it("preserves NBA and sports acronyms", () => {
    const result = abntTitle("Morre Marquinhos Abdalla, Pioneiro Brasileiro No Draft Da NBA");
    expect(result).toContain("NBA");
  });

  it("handles empty string", () => {
    expect(abntTitle("")).toBe("");
  });

  it("handles short title that would be emptied by prefix removal", () => {
    const result = abntTitle("URGENTE - Alerta");
    // "Alerta" is only 6 chars, less than 10, so original is used with sentence case
    expect(result.length).toBeGreaterThan(0);
  });

  it("first word is always capitalized", () => {
    const result = abntTitle("governo anuncia medidas econômicas");
    expect(result.charAt(0)).toBe("G");
  });
});

describe("cleanSlug", () => {
  it("generates slug from title with article ID", () => {
    const result = cleanSlug("Governo de AL anuncia investimentos", 12345);
    expect(result).toBe("governo-de-al-anuncia-investimentos-12345");
  });

  it("removes accents and special characters", () => {
    const result = cleanSlug("Diagnóstico precoce eleva chances de cura para câncer", 100);
    expect(result).toBe("diagnostico-precoce-eleva-chances-de-cura-para-cancer-100");
  });

  it("handles long titles by truncating to 150 chars", () => {
    const longTitle = "A".repeat(200);
    const result = cleanSlug(longTitle, 1);
    // 150 chars of 'a' + '-1' = 152 chars
    expect(result.length).toBeLessThanOrEqual(155);
    expect(result.endsWith("-1")).toBe(true);
  });

  it("removes leading and trailing dashes", () => {
    const result = cleanSlug("  - Título com espaços -  ", 5);
    expect(result).toBe("titulo-com-espacos-5");
  });
});
