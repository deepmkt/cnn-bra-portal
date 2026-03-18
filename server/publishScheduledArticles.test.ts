/**
 * Tests for the scheduled articles publisher module.
 *
 * We mock the database layer to avoid needing a live DB connection.
 * Uses vi.hoisted() to ensure mock variables are available before vi.mock() hoisting.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Hoist mock variables so they are available inside vi.mock factories ────────
const { mockSelect, mockUpdate, mockGetDb } = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockUpdate = vi.fn();
  const mockGetDb = vi.fn();
  return { mockSelect, mockUpdate, mockGetDb };
});

// ── Mock the db module ────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: mockGetDb,
}));

// ── Mock drizzle-orm operators ────────────────────────────────────────────────
vi.mock("drizzle-orm", async (importOriginal) => {
  const original = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...original,
    eq: vi.fn((_col: any, val: any) => ({ type: "eq", val })),
    and: vi.fn((...args: any[]) => ({ type: "and", args })),
    lte: vi.fn((_col: any, val: any) => ({ type: "lte", val })),
    isNotNull: vi.fn((_col: any) => ({ type: "isNotNull" })),
  };
});

// ── Mock the schema ───────────────────────────────────────────────────────────
vi.mock("../drizzle/schema", () => ({
  articles: {
    id: "id",
    title: "title",
    status: "status",
    scheduledAt: "scheduledAt",
    publishedAt: "publishedAt",
  },
}));

// ── Import the module under test AFTER mocks are set up ───────────────────────
import { publishScheduledArticles } from "./publishScheduledArticles";

// ── Helper: build a chainable query builder stub ──────────────────────────────
function makeSelectChain(rows: any[]) {
  const chain: any = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(rows),
  };
  return chain;
}

function makeUpdateChain() {
  const chain: any = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue({ affectedRows: 1 }),
  };
  return chain;
}

// ─────────────────────────────────────────────────────────────────────────────

describe("publishScheduledArticles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: DB is available
    mockGetDb.mockResolvedValue({ select: mockSelect, update: mockUpdate });
  });

  it("returns zero counts when no articles are due", async () => {
    mockSelect.mockReturnValue(makeSelectChain([]));

    const result = await publishScheduledArticles();

    expect(result.published).toBe(0);
    expect(result.errors).toBe(0);
    expect(result.ids).toEqual([]);
  });

  it("publishes a single due article and returns its id", async () => {
    const dueArticle = {
      id: 42,
      title: "Artigo de Teste",
      scheduledAt: new Date(Date.now() - 5_000),
    };

    mockSelect.mockReturnValue(makeSelectChain([dueArticle]));
    mockUpdate.mockReturnValue(makeUpdateChain());

    const result = await publishScheduledArticles();

    expect(result.published).toBe(1);
    expect(result.errors).toBe(0);
    expect(result.ids).toContain(42);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it("publishes multiple due articles", async () => {
    const dueArticles = [
      { id: 1, title: "Artigo 1", scheduledAt: new Date(Date.now() - 10_000) },
      { id: 2, title: "Artigo 2", scheduledAt: new Date(Date.now() - 20_000) },
      { id: 3, title: "Artigo 3", scheduledAt: new Date(Date.now() - 30_000) },
    ];

    mockSelect.mockReturnValue(makeSelectChain(dueArticles));
    mockUpdate.mockReturnValue(makeUpdateChain());

    const result = await publishScheduledArticles();

    expect(result.published).toBe(3);
    expect(result.errors).toBe(0);
    expect(result.ids).toEqual([1, 2, 3]);
    expect(mockUpdate).toHaveBeenCalledTimes(3);
  });

  it("counts errors when individual article update fails", async () => {
    const dueArticles = [
      { id: 10, title: "Artigo OK", scheduledAt: new Date(Date.now() - 1_000) },
      { id: 11, title: "Artigo Falha", scheduledAt: new Date(Date.now() - 2_000) },
    ];

    mockSelect.mockReturnValue(makeSelectChain(dueArticles));

    const goodChain = makeUpdateChain();
    const badChain: any = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockRejectedValue(new Error("DB error")),
    };
    mockUpdate
      .mockReturnValueOnce(goodChain)
      .mockReturnValueOnce(badChain);

    const result = await publishScheduledArticles();

    expect(result.published).toBe(1);
    expect(result.errors).toBe(1);
    expect(result.ids).toEqual([10]);
  });

  it("returns zero counts when database is unavailable", async () => {
    mockGetDb.mockResolvedValueOnce(null);

    const result = await publishScheduledArticles();

    expect(result.published).toBe(0);
    expect(result.errors).toBe(0);
    expect(mockSelect).not.toHaveBeenCalled();
  });
});
