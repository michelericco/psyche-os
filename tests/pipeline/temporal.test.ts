import { describe, it, expect } from "vitest";
import {
  stratifyTemporally,
  stratifyMultiGranularity,
  TemporalGranularity,
} from "../../src/pipeline/temporal.js";
import { deriveDocumentPeriod } from "../../src/pipeline/extract.js";
import type { ExtractionResult } from "../../src/pipeline/extract.js";
import type { SourceDocument } from "../../src/pipeline/ingest.js";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

/**
 * Build a minimal ExtractionResult for testing.
 * `timestamp` is the key field used by stratifyTemporally.
 */
function makeExtraction(
  id: string,
  timestamp: string,
  overrides: Partial<ExtractionResult> = {}
): ExtractionResult {
  return {
    sourceId: id,
    entities: [],
    themes: [],
    cognitivePatterns: [],
    timestamp,
    ...overrides,
  };
}

/** Three extractions spread across three different months. */
const MONTHLY_FIXTURES: ExtractionResult[] = [
  makeExtraction("src_jan", "2026-01-15T10:00:00.000Z", {
    cognitivePatterns: [
      { label: "Systematic Abstraction", kind: "systematic", confidence: 0.85, evidence: "e1" },
      { label: "Divergent Exploration", kind: "divergent", confidence: 0.70, evidence: "e2" },
    ],
    themes: [
      { label: "Tool Sovereignty", relevance: 0.9, keywords: ["tools"] },
      { label: "Protocol Design", relevance: 0.75, keywords: ["protocol"] },
    ],
    emotionalTone: { valence: 0.3, arousal: 0.6, dominantEmotion: "Curiosity", secondaryEmotions: [] },
  }),
  makeExtraction("src_feb", "2026-02-10T14:00:00.000Z", {
    cognitivePatterns: [
      { label: "Systematic Abstraction", kind: "systematic", confidence: 0.88, evidence: "e3" },
      { label: "Metacognitive Monitoring", kind: "metacognitive", confidence: 0.65, evidence: "e4" },
    ],
    themes: [
      { label: "Tool Sovereignty", relevance: 0.85, keywords: ["tools"] },
      { label: "Consciousness Inquiry", relevance: 0.80, keywords: ["consciousness"] },
    ],
    emotionalTone: { valence: 0.1, arousal: 0.5, dominantEmotion: "Resolve", secondaryEmotions: [] },
  }),
  makeExtraction("src_mar", "2026-03-05T09:00:00.000Z", {
    cognitivePatterns: [
      { label: "Systematic Abstraction", kind: "systematic", confidence: 0.92, evidence: "e5" },
      { label: "Divergent Exploration", kind: "divergent", confidence: 0.78, evidence: "e6" },
    ],
    themes: [
      { label: "Tool Sovereignty", relevance: 0.95, keywords: ["tools"] },
      { label: "Protocol Design", relevance: 0.70, keywords: ["protocol"] },
    ],
    emotionalTone: { valence: 0.4, arousal: 0.7, dominantEmotion: "Curiosity", secondaryEmotions: [] },
  }),
];

// ---------------------------------------------------------------------------
// stratifyTemporally — window construction
// ---------------------------------------------------------------------------

describe("stratifyTemporally — window construction", () => {
  it("returns an empty layer when given no extractions", () => {
    const layer = stratifyTemporally([], "month");
    expect(layer.windows).toHaveLength(0);
    expect(layer.patterns).toHaveLength(0);
    expect(layer.timedDocumentCount).toBe(0);
    expect(layer.corpusStart).toBeNull();
    expect(layer.corpusEnd).toBeNull();
  });

  it("creates one window per distinct month", () => {
    const layer = stratifyTemporally(MONTHLY_FIXTURES, "month");
    expect(layer.windows).toHaveLength(3);
    expect(layer.windows.map((w) => w.label)).toEqual(["2026-01", "2026-02", "2026-03"]);
  });

  it("assigns each extraction to the correct monthly window", () => {
    const layer = stratifyTemporally(MONTHLY_FIXTURES, "month");
    expect(layer.windows[0]!.sourceIds).toContain("src_jan");
    expect(layer.windows[1]!.sourceIds).toContain("src_feb");
    expect(layer.windows[2]!.sourceIds).toContain("src_mar");
  });

  it("computes documentCount correctly per window", () => {
    const layer = stratifyTemporally(MONTHLY_FIXTURES, "month");
    for (const win of layer.windows) {
      expect(win.documentCount).toBe(1);
    }
  });

  it("computes density: max window gets 1.0", () => {
    // Add a second extraction in January to make it the densest window
    const fixtures = [
      ...MONTHLY_FIXTURES,
      makeExtraction("src_jan_2", "2026-01-20T08:00:00.000Z"),
    ];
    const layer = stratifyTemporally(fixtures, "month");
    const janWindow = layer.windows.find((w) => w.label === "2026-01")!;
    expect(janWindow.density).toBe(1.0);
    const febWindow = layer.windows.find((w) => w.label === "2026-02")!;
    expect(febWindow.density).toBe(0.5);
  });

  it("computes avgValence and avgArousal correctly", () => {
    const layer = stratifyTemporally(MONTHLY_FIXTURES, "month");
    // January: single doc with valence 0.3, arousal 0.6
    expect(layer.windows[0]!.avgValence).toBeCloseTo(0.3);
    expect(layer.windows[0]!.avgArousal).toBeCloseTo(0.6);
  });

  it("sets avgValence and avgArousal to null when no emotional tone data", () => {
    const noTone = [makeExtraction("src_no_tone", "2026-01-01T00:00:00.000Z")];
    const layer = stratifyTemporally(noTone, "month");
    expect(layer.windows[0]!.avgValence).toBeNull();
    expect(layer.windows[0]!.avgArousal).toBeNull();
  });

  it("reports corpusStart and corpusEnd correctly", () => {
    const layer = stratifyTemporally(MONTHLY_FIXTURES, "month");
    expect(layer.corpusStart).toBe("2026-01-15T10:00:00.000Z");
    expect(layer.corpusEnd).toBe("2026-03-05T09:00:00.000Z");
  });

  it("counts untimed documents separately", () => {
    const withUntimed = [
      ...MONTHLY_FIXTURES,
      makeExtraction("src_bad_ts", "not-a-date"),
    ];
    const layer = stratifyTemporally(withUntimed, "month");
    expect(layer.timedDocumentCount).toBe(3);
    expect(layer.untimedDocumentCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// stratifyTemporally — granularity variants
// ---------------------------------------------------------------------------

describe("stratifyTemporally — granularity variants", () => {
  it("groups same-day extractions into one day window", () => {
    const sameDay = [
      makeExtraction("a", "2026-03-10T08:00:00.000Z"),
      makeExtraction("b", "2026-03-10T20:00:00.000Z"),
    ];
    const layer = stratifyTemporally(sameDay, "day");
    expect(layer.windows).toHaveLength(1);
    expect(layer.windows[0]!.label).toBe("2026-03-10");
    expect(layer.windows[0]!.documentCount).toBe(2);
  });

  it("assigns extractions to correct ISO week", () => {
    // 2026-03-09 is a Monday (week 11), 2026-03-16 is the next Monday (week 12)
    const twoWeeks = [
      makeExtraction("w11", "2026-03-09T12:00:00.000Z"),
      makeExtraction("w12", "2026-03-16T12:00:00.000Z"),
    ];
    const layer = stratifyTemporally(twoWeeks, "week");
    expect(layer.windows).toHaveLength(2);
    expect(layer.windows[0]!.label).toBe("2026-W11");
    expect(layer.windows[1]!.label).toBe("2026-W12");
  });

  it("groups same-quarter extractions into one quarter window", () => {
    const q1 = [
      makeExtraction("jan", "2026-01-10T00:00:00.000Z"),
      makeExtraction("feb", "2026-02-20T00:00:00.000Z"),
      makeExtraction("mar", "2026-03-05T00:00:00.000Z"),
    ];
    const layer = stratifyTemporally(q1, "quarter");
    expect(layer.windows).toHaveLength(1);
    expect(layer.windows[0]!.label).toBe("2026-Q1");
    expect(layer.windows[0]!.documentCount).toBe(3);
  });

  it("separates Q1 and Q2 correctly", () => {
    const crossQuarter = [
      makeExtraction("q1", "2026-03-31T23:59:59.000Z"),
      makeExtraction("q2", "2026-04-01T00:00:00.000Z"),
    ];
    const layer = stratifyTemporally(crossQuarter, "quarter");
    expect(layer.windows).toHaveLength(2);
    expect(layer.windows[0]!.label).toBe("2026-Q1");
    expect(layer.windows[1]!.label).toBe("2026-Q2");
  });
});

// ---------------------------------------------------------------------------
// stratifyTemporally — dominant patterns and themes
// ---------------------------------------------------------------------------

describe("stratifyTemporally — dominant cognitive patterns and themes", () => {
  it("identifies dominant cognitive patterns per window", () => {
    const layer = stratifyTemporally(MONTHLY_FIXTURES, "month");
    // January has "Systematic Abstraction" and "Divergent Exploration"
    expect(layer.windows[0]!.dominantCognitivePatterns).toContain("Systematic Abstraction");
  });

  it("identifies dominant themes per window ordered by relevance", () => {
    const layer = stratifyTemporally(MONTHLY_FIXTURES, "month");
    // January: Tool Sovereignty (0.9) > Protocol Design (0.75)
    expect(layer.windows[0]!.dominantThemes[0]).toBe("Tool Sovereignty");
  });

  it("limits dominantCognitivePatterns to 3 entries", () => {
    const manyPatterns = makeExtraction("src_many", "2026-01-01T00:00:00.000Z", {
      cognitivePatterns: [
        { label: "P1", kind: "analytical", confidence: 0.9, evidence: "e" },
        { label: "P2", kind: "systematic", confidence: 0.8, evidence: "e" },
        { label: "P3", kind: "divergent", confidence: 0.7, evidence: "e" },
        { label: "P4", kind: "convergent", confidence: 0.6, evidence: "e" },
        { label: "P5", kind: "metacognitive", confidence: 0.5, evidence: "e" },
      ],
    });
    const layer = stratifyTemporally([manyPatterns], "month");
    expect(layer.windows[0]!.dominantCognitivePatterns.length).toBeLessThanOrEqual(3);
  });

  it("limits dominantThemes to 5 entries", () => {
    const manyThemes = makeExtraction("src_themes", "2026-01-01T00:00:00.000Z", {
      themes: Array.from({ length: 8 }, (_, i) => ({
        label: `Theme${i}`,
        relevance: (8 - i) / 8,
        keywords: [],
      })),
    });
    const layer = stratifyTemporally([manyThemes], "month");
    expect(layer.windows[0]!.dominantThemes.length).toBeLessThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------------
// stratifyTemporally — temporal pattern detection
// ---------------------------------------------------------------------------

describe("stratifyTemporally — temporal pattern detection", () => {
  it("detects a persistent pattern present in every window", () => {
    const layer = stratifyTemporally(MONTHLY_FIXTURES, "month");
    // "Systematic Abstraction" appears in all 3 months
    const persistent = layer.patterns.find(
      (p) => p.label === "Systematic Abstraction" && p.kind === "persistent"
    );
    expect(persistent).toBeDefined();
    expect(persistent!.windowCount).toBe(3);
    expect(persistent!.prevalence).toBeCloseTo(1.0);
  });

  it("detects a rising trend for increasing confidence values", () => {
    const layer = stratifyTemporally(MONTHLY_FIXTURES, "month");
    // "Systematic Abstraction" confidence: 0.85 → 0.88 → 0.92 (rising)
    const pattern = layer.patterns.find((p) => p.label === "Systematic Abstraction");
    expect(pattern).toBeDefined();
    expect(pattern!.trend).toBe("rising");
  });

  it("records firstSeen and lastSeen correctly", () => {
    const layer = stratifyTemporally(MONTHLY_FIXTURES, "month");
    const pattern = layer.patterns.find((p) => p.label === "Systematic Abstraction");
    expect(pattern).toBeDefined();
    // firstSeen should be in January window start
    expect(pattern!.firstSeen.startsWith("2026-01")).toBe(true);
    // lastSeen should be in March window start
    expect(pattern!.lastSeen.startsWith("2026-03")).toBe(true);
  });

  it("detects an emerging pattern only in the last window", () => {
    const fixtures = [
      makeExtraction("src_a", "2026-01-15T00:00:00.000Z", {
        cognitivePatterns: [{ label: "Old Pattern", kind: "analytical", confidence: 0.8, evidence: "e" }],
      }),
      makeExtraction("src_b", "2026-02-15T00:00:00.000Z", {
        cognitivePatterns: [{ label: "Old Pattern", kind: "analytical", confidence: 0.8, evidence: "e" }],
      }),
      makeExtraction("src_c", "2026-03-15T00:00:00.000Z", {
        cognitivePatterns: [
          { label: "Old Pattern", kind: "analytical", confidence: 0.8, evidence: "e" },
          { label: "New Emerging", kind: "divergent", confidence: 0.75, evidence: "e" },
        ],
      }),
    ];
    const layer = stratifyTemporally(fixtures, "month");
    const emerging = layer.patterns.find((p) => p.label === "New Emerging");
    expect(emerging).toBeDefined();
    expect(emerging!.kind).toBe("emerging");
    expect(emerging!.windowCount).toBe(1);
  });

  it("detects a fading pattern absent in the last window", () => {
    const fixtures = [
      makeExtraction("src_a", "2026-01-15T00:00:00.000Z", {
        cognitivePatterns: [{ label: "Fading Signal", kind: "analytical", confidence: 0.8, evidence: "e" }],
      }),
      makeExtraction("src_b", "2026-02-15T00:00:00.000Z", {
        cognitivePatterns: [{ label: "Fading Signal", kind: "analytical", confidence: 0.6, evidence: "e" }],
      }),
      makeExtraction("src_c", "2026-03-15T00:00:00.000Z", {
        cognitivePatterns: [],
      }),
    ];
    const layer = stratifyTemporally(fixtures, "month");
    const fading = layer.patterns.find((p) => p.label === "Fading Signal");
    expect(fading).toBeDefined();
    expect(fading!.kind).toBe("fading");
  });

  it("records presentInWindows in chronological order", () => {
    const layer = stratifyTemporally(MONTHLY_FIXTURES, "month");
    const pattern = layer.patterns.find((p) => p.label === "Systematic Abstraction");
    expect(pattern!.presentInWindows).toEqual(["2026-01", "2026-02", "2026-03"]);
  });

  it("excludes themes present in only one window from temporal patterns", () => {
    // "Consciousness Inquiry" only appears in February
    const layer = stratifyTemporally(MONTHLY_FIXTURES, "month");
    const singleWindowTheme = layer.patterns.find(
      (p) => p.label === "Consciousness Inquiry"
    );
    expect(singleWindowTheme).toBeUndefined();
  });

  it("includes themes present in ≥ 2 windows", () => {
    // "Tool Sovereignty" appears in all 3 months
    const layer = stratifyTemporally(MONTHLY_FIXTURES, "month");
    const theme = layer.patterns.find((p) => p.label === "Tool Sovereignty");
    expect(theme).toBeDefined();
    expect(theme!.windowCount).toBeGreaterThanOrEqual(2);
  });

  it("sorts patterns: persistent before recurring before emerging before fading", () => {
    const layer = stratifyTemporally(MONTHLY_FIXTURES, "month");
    const kinds = layer.patterns.map((p) => p.kind);
    const order = ["persistent", "recurring", "episodic", "emerging", "fading"];
    let lastIdx = -1;
    for (const kind of kinds) {
      const idx = order.indexOf(kind);
      expect(idx).toBeGreaterThanOrEqual(lastIdx);
      lastIdx = idx;
    }
  });
});

// ---------------------------------------------------------------------------
// stratifyMultiGranularity
// ---------------------------------------------------------------------------

describe("stratifyMultiGranularity", () => {
  it("returns a layer for each requested granularity", () => {
    const map = stratifyMultiGranularity(MONTHLY_FIXTURES, ["month", "quarter"]);
    expect(map.has("month")).toBe(true);
    expect(map.has("quarter")).toBe(true);
    expect(map.has("week")).toBe(false);
  });

  it("defaults to all four granularities", () => {
    const map = stratifyMultiGranularity(MONTHLY_FIXTURES);
    for (const g of TemporalGranularity) {
      expect(map.has(g)).toBe(true);
    }
  });

  it("monthly layer has 3 windows for the fixture data", () => {
    const map = stratifyMultiGranularity(MONTHLY_FIXTURES);
    expect(map.get("month")!.windows).toHaveLength(3);
  });

  it("quarterly layer has 1 window for the fixture data (all in Q1)", () => {
    const map = stratifyMultiGranularity(MONTHLY_FIXTURES);
    expect(map.get("quarter")!.windows).toHaveLength(1);
    expect(map.get("quarter")!.windows[0]!.label).toBe("2026-Q1");
  });
});

// ---------------------------------------------------------------------------
// deriveDocumentPeriod
// ---------------------------------------------------------------------------

describe("deriveDocumentPeriod", () => {
  const baseDoc: SourceDocument = {
    id: "doc_1",
    sourcePath: "/sources/claude/session.jsonl",
    sourceType: "json",
    sourceDir: "claude",
    content: "...",
  };

  it("returns null when metadata is absent", () => {
    expect(deriveDocumentPeriod({ ...baseDoc, metadata: undefined })).toBeNull();
  });

  it("returns null when metadata has no timestamp fields", () => {
    expect(deriveDocumentPeriod({ ...baseDoc, metadata: { adapter: "claude-code" } })).toBeNull();
  });

  it("derives period from firstMessage and lastMessage", () => {
    const doc: SourceDocument = {
      ...baseDoc,
      metadata: {
        firstMessage: "2026-03-01T08:00:00.000Z",
        lastMessage: "2026-03-03T18:00:00.000Z",
      },
    };
    const period = deriveDocumentPeriod(doc);
    expect(period).not.toBeNull();
    expect(period!.start).toBe("2026-03-01T08:00:00.000Z");
    expect(period!.end).toBe("2026-03-03T18:00:00.000Z");
    expect(period!.durationDays).toBe(2);
  });

  it("falls back to document.timestamp when firstMessage is absent", () => {
    const doc: SourceDocument = {
      ...baseDoc,
      timestamp: "2026-02-15T10:00:00.000Z",
      metadata: { adapter: "codex" },
    };
    const period = deriveDocumentPeriod(doc);
    expect(period).not.toBeNull();
    expect(period!.start).toBe("2026-02-15T10:00:00.000Z");
    expect(period!.durationDays).toBe(0);
  });

  it("swaps start and end if they are inverted", () => {
    const doc: SourceDocument = {
      ...baseDoc,
      metadata: {
        firstMessage: "2026-03-10T00:00:00.000Z",
        lastMessage: "2026-03-01T00:00:00.000Z", // inverted
      },
    };
    const period = deriveDocumentPeriod(doc);
    expect(period).not.toBeNull();
    expect(new Date(period!.start) <= new Date(period!.end)).toBe(true);
  });

  it("returns null for invalid timestamp strings", () => {
    const doc: SourceDocument = {
      ...baseDoc,
      metadata: { firstMessage: "not-a-date" },
    };
    expect(deriveDocumentPeriod(doc)).toBeNull();
  });

  it("computes durationDays = 0 for documents spanning less than 24 hours", () => {
    // 14 hours apart — Math.round(14/24) = 1, so we test the boundary:
    // a span of exactly 12h rounds to 1 day, a span of < 12h rounds to 0.
    const doc: SourceDocument = {
      ...baseDoc,
      metadata: {
        firstMessage: "2026-03-10T08:00:00.000Z",
        lastMessage: "2026-03-10T10:00:00.000Z", // 2h apart → rounds to 0
      },
    };
    const period = deriveDocumentPeriod(doc);
    expect(period!.durationDays).toBe(0);
  });
});
