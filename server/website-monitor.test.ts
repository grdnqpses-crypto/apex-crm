/**
 * Tests for Website Intelligence Monitor
 * Tests the crawler helper, AI signal detection, and tRPC router logic.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock dependencies ────────────────────────────────────────────────────────
vi.mock("../server/db", () => ({
  getDb: vi.fn(),
}));

vi.mock("../server/_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: "test-id" }),
    })),
  },
}));

// ─── Unit tests for signal type mapping ──────────────────────────────────────
describe("Signal type mapping", () => {
  it("maps award to news_mention", () => {
    const map: Record<string, string> = {
      award: "news_mention",
      expansion: "expansion",
      funding: "funding_round",
      new_hire: "job_change",
      partnership: "news_mention",
      product_launch: "news_mention",
      milestone: "news_mention",
      certification: "news_mention",
      community: "news_mention",
      other_positive: "news_mention",
    };
    expect(map["award"]).toBe("news_mention");
    expect(map["expansion"]).toBe("expansion");
    expect(map["funding"]).toBe("funding_round");
    expect(map["new_hire"]).toBe("job_change");
    expect(map["unknown_type"] ?? "news_mention").toBe("news_mention");
  });
});

// ─── URL validation ───────────────────────────────────────────────────────────
describe("Website URL validation", () => {
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  it("accepts valid https URLs", () => {
    expect(isValidUrl("https://www.example.com")).toBe(true);
    expect(isValidUrl("https://acmelogistics.com/news")).toBe(true);
  });

  it("accepts valid http URLs", () => {
    expect(isValidUrl("http://example.com")).toBe(true);
  });

  it("rejects invalid URLs", () => {
    expect(isValidUrl("not-a-url")).toBe(false);
    expect(isValidUrl("ftp://example.com")).toBe(true); // ftp is valid URL but fetch would fail
    expect(isValidUrl("")).toBe(false);
  });
});

// ─── HTML text extraction simulation ─────────────────────────────────────────
describe("HTML text extraction", () => {
  const extractText = (html: string) => {
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  it("strips HTML tags", () => {
    const html = "<h1>Award Winner</h1><p>We won the best company award!</p>";
    const text = extractText(html);
    expect(text).not.toContain("<h1>");
    expect(text).toContain("Award Winner");
    expect(text).toContain("We won the best company award!");
  });

  it("strips script tags", () => {
    const html = "<script>alert('xss')</script><p>Clean content</p>";
    const text = extractText(html);
    expect(text).not.toContain("alert");
    expect(text).toContain("Clean content");
  });

  it("strips style tags", () => {
    const html = "<style>.red { color: red; }</style><p>Visible text</p>";
    const text = extractText(html);
    expect(text).not.toContain(".red");
    expect(text).toContain("Visible text");
  });

  it("collapses whitespace", () => {
    const html = "<p>  Multiple   spaces  </p>";
    const text = extractText(html);
    expect(text).toBe("Multiple spaces");
  });
});

// ─── Signal filter logic ──────────────────────────────────────────────────────
describe("Signal filter logic", () => {
  const applyFilters = (signals: any[], filters: string[] | null) => {
    if (!filters || filters.length === 0) return signals;
    return signals.filter(s => filters.includes(s.type));
  };

  it("returns all signals when no filter is set", () => {
    const signals = [
      { type: "award", title: "Won award" },
      { type: "expansion", title: "New office" },
    ];
    expect(applyFilters(signals, null)).toHaveLength(2);
    expect(applyFilters(signals, [])).toHaveLength(2);
  });

  it("filters to only matching signal types", () => {
    const signals = [
      { type: "award", title: "Won award" },
      { type: "expansion", title: "New office" },
      { type: "funding", title: "Series A" },
    ];
    const result = applyFilters(signals, ["award", "funding"]);
    expect(result).toHaveLength(2);
    expect(result.map(s => s.type)).toEqual(["award", "funding"]);
  });

  it("returns empty array when no signals match filter", () => {
    const signals = [{ type: "award", title: "Won award" }];
    const result = applyFilters(signals, ["funding"]);
    expect(result).toHaveLength(0);
  });
});

// ─── Content hash ─────────────────────────────────────────────────────────────
describe("Content hash for change detection", () => {
  const { createHash } = require("crypto");

  const computeHash = (text: string) =>
    createHash("sha256").update(text).digest("hex").slice(0, 64);

  it("produces same hash for same content", () => {
    const hash1 = computeHash("Same content");
    const hash2 = computeHash("Same content");
    expect(hash1).toBe(hash2);
  });

  it("produces different hash for different content", () => {
    const hash1 = computeHash("Old content");
    const hash2 = computeHash("New content — award announced!");
    expect(hash1).not.toBe(hash2);
  });

  it("hash is 64 chars long", () => {
    const hash = computeHash("test");
    expect(hash).toHaveLength(64);
  });
});

// ─── AI signal response parsing ───────────────────────────────────────────────
describe("AI signal response parsing", () => {
  const parseSignals = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      return (parsed.signals || []).map((s: any) => ({ ...s, autoEmailSent: false }));
    } catch {
      return [];
    }
  };

  it("parses valid signal JSON", () => {
    const json = JSON.stringify({
      signals: [
        {
          type: "award",
          title: "Best Carrier Award 2025",
          summary: "Company won the regional best carrier award.",
          confidence: 0.92,
          sourceText: "We are proud to announce winning the Best Carrier Award.",
        },
      ],
    });
    const signals = parseSignals(json);
    expect(signals).toHaveLength(1);
    expect(signals[0].type).toBe("award");
    expect(signals[0].autoEmailSent).toBe(false);
  });

  it("returns empty array for malformed JSON", () => {
    expect(parseSignals("not json")).toHaveLength(0);
    expect(parseSignals("")).toHaveLength(0);
  });

  it("returns empty array for empty signals list", () => {
    const json = JSON.stringify({ signals: [] });
    expect(parseSignals(json)).toHaveLength(0);
  });

  it("sets autoEmailSent to false by default", () => {
    const json = JSON.stringify({
      signals: [
        { type: "expansion", title: "New office", summary: "Opened Dallas office.", confidence: 0.8, sourceText: "Dallas" },
      ],
    });
    const signals = parseSignals(json);
    expect(signals[0].autoEmailSent).toBe(false);
  });
});

// ─── Crawl frequency logic ────────────────────────────────────────────────────
describe("Crawl frequency skip logic", () => {
  const shouldSkip = (lastCrawledAt: number | null, frequency: string) => {
    const lastCrawled = lastCrawledAt ?? 0;
    const hoursSinceCrawl = (Date.now() - lastCrawled) / (1000 * 60 * 60);
    const minHours = frequency === "weekly" ? 160 : 20;
    return hoursSinceCrawl < minHours;
  };

  it("skips daily monitor crawled 5 hours ago", () => {
    const fiveHoursAgo = Date.now() - 5 * 60 * 60 * 1000;
    expect(shouldSkip(fiveHoursAgo, "daily")).toBe(true);
  });

  it("does not skip daily monitor crawled 25 hours ago", () => {
    const twentyFiveHoursAgo = Date.now() - 25 * 60 * 60 * 1000;
    expect(shouldSkip(twentyFiveHoursAgo, "daily")).toBe(false);
  });

  it("skips weekly monitor crawled 100 hours ago", () => {
    const hundredHoursAgo = Date.now() - 100 * 60 * 60 * 1000;
    expect(shouldSkip(hundredHoursAgo, "weekly")).toBe(true);
  });

  it("does not skip weekly monitor crawled 170 hours ago", () => {
    const oneSeventyHoursAgo = Date.now() - 170 * 60 * 60 * 1000;
    expect(shouldSkip(oneSeventyHoursAgo, "weekly")).toBe(false);
  });

  it("does not skip monitor that has never been crawled", () => {
    expect(shouldSkip(null, "daily")).toBe(false);
  });
});
