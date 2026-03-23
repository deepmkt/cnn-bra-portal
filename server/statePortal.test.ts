import { describe, it, expect } from "vitest";
import { detectState, getStateByUF, getStatesByRegion, getAllUFs, BRAZIL_STATES } from "@shared/brazilStates";

describe("brazilStates reference data", () => {
  it("should have all 27 states", () => {
    expect(BRAZIL_STATES).toHaveLength(27);
  });

  it("should have unique UF codes", () => {
    const ufs = BRAZIL_STATES.map(s => s.uf);
    expect(new Set(ufs).size).toBe(27);
  });

  it("getAllUFs returns 27 codes", () => {
    expect(getAllUFs()).toHaveLength(27);
  });

  it("getStateByUF finds AL", () => {
    const al = getStateByUF("AL");
    expect(al).toBeDefined();
    expect(al!.name).toBe("Alagoas");
    expect(al!.capital).toBe("Maceió");
    expect(al!.highlights).toContain("Maceió");
    expect(al!.highlights).toContain("Arapiraca");
  });

  it("getStateByUF is case-insensitive", () => {
    expect(getStateByUF("al")?.uf).toBe("AL");
    expect(getStateByUF("sp")?.uf).toBe("SP");
  });

  it("getStateByUF returns undefined for invalid code", () => {
    expect(getStateByUF("XX")).toBeUndefined();
  });

  it("getStatesByRegion groups correctly", () => {
    const grouped = getStatesByRegion();
    expect(Object.keys(grouped)).toContain("Nordeste");
    expect(Object.keys(grouped)).toContain("Sudeste");
    expect(Object.keys(grouped)).toContain("Sul");
    expect(Object.keys(grouped)).toContain("Norte");
    expect(Object.keys(grouped)).toContain("Centro-Oeste");
    // Nordeste should have 9 states
    expect(grouped["Nordeste"]).toHaveLength(9);
  });
});

describe("detectState", () => {
  it("detects Alagoas from title mentioning Maceió", () => {
    expect(detectState("Prefeito de Maceió anuncia novo programa social")).toBe("AL");
  });

  it("detects Alagoas from tags", () => {
    expect(detectState("alagoas,nordeste,política")).toBe("AL");
  });

  it("detects Alagoas from Arapiraca mention", () => {
    expect(detectState("Feira em Arapiraca atrai milhares de visitantes")).toBe("AL");
  });

  it("detects São Paulo from title", () => {
    expect(detectState("Governo de São Paulo investe em transporte público")).toBe("SP");
  });

  it("detects Rio de Janeiro from carioca keyword", () => {
    expect(detectState("Cultura carioca é destaque em festival internacional")).toBe("RJ");
  });

  it("detects Minas Gerais from mineiro keyword", () => {
    expect(detectState("Produtor mineiro bate recorde de exportação de café")).toBe("MG");
  });

  it("detects Bahia from Salvador mention", () => {
    expect(detectState("Carnaval de Salvador terá 7 dias de festa")).toBe("BA");
  });

  it("detects Distrito Federal from Brasília", () => {
    expect(detectState("Congresso Nacional aprova nova lei em Brasília")).toBe("DF");
  });

  it("returns null for generic national news", () => {
    expect(detectState("Inflação sobe 0,5% em março no Brasil")).toBeNull();
  });

  it("returns null for empty text", () => {
    expect(detectState("")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(detectState(null as any)).toBeNull();
  });

  it("does not false-positive 'para' as Pará in common words", () => {
    // "para" as preposition should not match Pará
    const result = detectState("Governo anuncia medidas para combater inflação");
    expect(result).not.toBe("PA");
  });

  it("detects Rio Grande do Sul correctly (not just 'rio')", () => {
    expect(detectState("Enchentes no Rio Grande do Sul causam estragos")).toBe("RS");
  });

  it("detects Paraná from Curitiba", () => {
    expect(detectState("Temperatura em Curitiba cai para 5 graus")).toBe("PR");
  });

  it("detects Ceará from cearense keyword", () => {
    expect(detectState("Artista cearense ganha prêmio internacional")).toBe("CE");
  });
});
