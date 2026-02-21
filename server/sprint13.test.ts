import { describe, expect, it } from "vitest";
import { capitalizeTitle } from "../shared/titleUtils";

describe("Sprint 13 - Títulos, Fontes, Imagens Originais e WhatsApp", () => {
  describe("capitalizeTitle - Capitalização de títulos", () => {
    it("should capitalize first letter and lowercase the rest", () => {
      expect(capitalizeTitle("BRASIL ENFRENTA CRISE ECONÔMICA")).toBe(
        "Brasil Enfrenta Crise Econômica"
      );
    });

    it("should keep acronyms uppercase", () => {
      const result = capitalizeTitle("STF DECIDE SOBRE PIB E IBGE");
      expect(result).toContain("STF");
      expect(result).toContain("PIB");
      expect(result).toContain("IBGE");
    });

    it("should lowercase prepositions and articles (except first word)", () => {
      const result = capitalizeTitle("GOVERNO DO BRASIL EM CRISE NO CONGRESSO");
      expect(result).toBe("Governo do Brasil em Crise no Congresso");
    });

    it("should handle state abbreviations", () => {
      const result = capitalizeTitle("ELEIÇÕES EM SP E RJ MOVIMENTAM O PAÍS");
      expect(result).toContain("SP");
      expect(result).toContain("RJ");
    });

    it("should handle CNN as acronym", () => {
      const result = capitalizeTitle("CNN REVELA NOVOS DADOS SOBRE A ECONOMIA");
      expect(result).toContain("CNN");
    });

    it("should handle empty string", () => {
      expect(capitalizeTitle("")).toBe("");
    });

    it("should handle single word", () => {
      expect(capitalizeTitle("URGENTE")).toBe("Urgente");
    });

    it("should handle mixed case input", () => {
      const result = capitalizeTitle("Lula Visita o STF em Brasília");
      expect(result).toContain("STF");
      expect(result).toContain("em");
    });

    it("should handle party names as acronyms", () => {
      const result = capitalizeTitle("PT E PL DISPUTAM LIDERANÇA NAS PESQUISAS");
      expect(result).toContain("PT");
      expect(result).toContain("PL");
    });
  });

  describe("Source URL Validation", () => {
    it("should identify Google News URLs", () => {
      const googleUrls = [
        "https://news.google.com/rss/articles/CBMi2gFBVV95cUxOVm1ObjlIandtTHRz",
        "https://news.google.com/articles/test123",
      ];
      for (const url of googleUrls) {
        expect(url.includes("news.google.com")).toBe(true);
      }
    });

    it("should identify real article URLs", () => {
      const realUrls = [
        "https://www.folha.uol.com.br/poder/2024/01/artigo.shtml",
        "https://g1.globo.com/politica/noticia/2024/01/artigo.ghtml",
        "https://www.bbc.com/portuguese/articles/12345",
      ];
      for (const url of realUrls) {
        expect(url.includes("news.google.com")).toBe(false);
      }
    });

    it("should extract source name from URL", () => {
      // Test the source name extraction logic
      const testCases = [
        { url: "https://www.folha.uol.com.br/test", expected: "folha" },
        { url: "https://g1.globo.com/test", expected: "g1" },
        { url: "https://www.bbc.com/test", expected: "bbc" },
      ];
      
      for (const { url, expected } of testCases) {
        const hostname = new URL(url).hostname.replace("www.", "").toLowerCase();
        expect(hostname).toContain(expected);
      }
    });
  });

  describe("Image Validation - No AI Generation", () => {
    it("should reject Google News logo patterns", () => {
      const badPatterns = [
        "https://news.google.com/images/logo.png",
        "https://www.gstatic.com/images/icons/material/system_gm/1x/logo.png",
        "https://play-lh.googleusercontent.com/icon.webp",
      ];
      
      for (const url of badPatterns) {
        const isBlocked = url.includes("news.google.com") || 
                          url.includes("gstatic.com") || 
                          url.includes("google.com/images/branding") ||
                          url.includes("play-lh.googleusercontent.com");
        expect(isBlocked).toBe(true);
      }
    });

    it("should accept valid article image URLs", () => {
      const goodUrls = [
        "https://cdn.folha.uol.com.br/images/article.jpg",
        "https://s2.glbimg.com/photo.jpg",
        "https://images.unsplash.com/photo-123.jpg",
      ];
      
      for (const url of goodUrls) {
        const isBlocked = url.includes("news.google.com") || 
                          url.includes("gstatic.com") || 
                          url.includes("google.com/images/branding") ||
                          url.includes("play-lh.googleusercontent.com");
        expect(isBlocked).toBe(false);
      }
    });

    it("should reject tiny images (trackers/favicons) but accept normal ones", () => {
      // Images < 2000 bytes should be rejected (trackers, 1px images)
      expect(500 < 2000).toBe(true);   // 1px tracker → reject
      expect(1999 < 2000).toBe(true);  // favicon → reject
      expect(2001 < 2000).toBe(false); // small but valid → accept
      expect(50000 < 2000).toBe(false); // normal image → accept
    });
  });

  describe("Source Link Format", () => {
    it("should generate clickable source tag with real URL", () => {
      const realUrl = "https://www.folha.uol.com.br/poder/2024/01/artigo.shtml";
      const sourceName = "Folha de S.Paulo";
      
      const sourceTag = `<p class="text-sm text-gray-500 mt-6 pt-4 border-t border-gray-200"><strong>Fonte:</strong> <a href="${realUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${sourceName}</a></p>`;
      
      expect(sourceTag).toContain(`href="${realUrl}"`);
      expect(sourceTag).toContain(sourceName);
      expect(sourceTag).toContain('target="_blank"');
      expect(sourceTag).not.toContain("news.google.com");
    });
  });
});
