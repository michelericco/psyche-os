import { z } from "zod";
import type { ExtractionResult } from "./extract.js";

// ---------------------------------------------------------------------------
// Temporal window granularity
// ---------------------------------------------------------------------------

/**
 * Supported granularities for temporal stratification.
 *
 * - `day`     — 24-hour buckets; useful for high-frequency sources (Claude sessions)
 * - `week`    — ISO week buckets (Mon–Sun); good for behavioral rhythm detection
 * - `month`   — calendar month buckets; reveals seasonal or project-phase patterns
 * - `quarter` — 3-month buckets; useful for longitudinal trend analysis
 */
export const TemporalGranularity = [
  "day",
  "week",
  "month",
  "quarter",
] as const;

export type TemporalGranularity = (typeof TemporalGranularity)[number];

// ---------------------------------------------------------------------------
// Temporal window schema
// ---------------------------------------------------------------------------

/**
 * A single time bucket containing aggregated extraction data.
 *
 * Each window represents one slot at the chosen granularity and holds
 * the IDs of all source documents that fall within it, together with
 * derived aggregate metrics.
 */
export const TemporalWindowSchema = z.object({
  /** ISO 8601 label for the window start (e.g. "2026-03", "2026-W10"). */
  label: z.string(),
  /** Inclusive start of the window as ISO 8601 datetime. */
  start: z.string().datetime(),
  /** Exclusive end of the window as ISO 8601 datetime. */
  end: z.string().datetime(),
  /** IDs of ExtractionResults whose timestamp falls in this window. */
  sourceIds: z.array(z.string()),
  /** Number of documents in this window. */
  documentCount: z.number().int().nonnegative(),
  /**
   * Average emotional valence across all documents in the window.
   * Range [-1, 1]. Null when no emotional tone data is available.
   */
  avgValence: z.number().min(-1).max(1).nullable(),
  /**
   * Average emotional arousal across all documents in the window.
   * Range [0, 1]. Null when no emotional tone data is available.
   */
  avgArousal: z.number().min(0).max(1).nullable(),
  /**
   * The most frequently occurring cognitive pattern labels in this window,
   * ordered by frequency descending (up to 3).
   */
  dominantCognitivePatterns: z.array(z.string()),
  /**
   * The most frequently occurring theme labels in this window,
   * ordered by relevance-weighted frequency descending (up to 5).
   */
  dominantThemes: z.array(z.string()),
  /**
   * Relative activity density: documentCount / max(documentCount across all windows).
   * Range [0, 1]. Useful for visualising activity spikes.
   */
  density: z.number().min(0).max(1),
});

export type TemporalWindow = z.infer<typeof TemporalWindowSchema>;

// ---------------------------------------------------------------------------
// Temporal trend
// ---------------------------------------------------------------------------

/**
 * Direction of a temporal trend detected across windows.
 *
 * - `rising`      — metric increases monotonically or near-monotonically
 * - `falling`     — metric decreases monotonically or near-monotonically
 * - `stable`      — metric stays within a narrow band (±10% of mean)
 * - `oscillating` — metric alternates between high and low values
 * - `sparse`      — fewer than 3 data points; trend cannot be determined
 */
export const TemporalTrend = [
  "rising",
  "falling",
  "stable",
  "oscillating",
  "sparse",
] as const;

export type TemporalTrend = (typeof TemporalTrend)[number];

// ---------------------------------------------------------------------------
// Temporal pattern schema
// ---------------------------------------------------------------------------

/**
 * A pattern observed across multiple temporal windows.
 *
 * Temporal patterns describe *how* a signal evolves over time, not just
 * whether it exists. A pattern with high confidence that appeared 6 months
 * ago and is still rising is fundamentally different from one that peaked
 * and is now fading.
 */
export const TemporalPatternSchema = z.object({
  /** Stable identifier derived from the pattern label. */
  id: z.string(),
  /** Human-readable label (e.g. "Systematic Abstraction Descent"). */
  label: z.string(),
  /**
   * Category of the temporal pattern.
   *
   * - `recurring`  — appears in ≥ 2 non-adjacent windows with consistent confidence
   * - `emerging`   — appears for the first time in the most recent window(s)
   * - `fading`     — was present in earlier windows but absent in recent ones
   * - `persistent` — present in every window without interruption
   * - `episodic`   — appears in isolated bursts separated by long gaps
   */
  kind: z.enum(["recurring", "emerging", "fading", "persistent", "episodic"]),
  /** Direction of the confidence/frequency trend across windows. */
  trend: z.enum(TemporalTrend),
  /** ISO 8601 datetime of the first window in which this pattern appeared. */
  firstSeen: z.string().datetime(),
  /** ISO 8601 datetime of the most recent window in which this pattern appeared. */
  lastSeen: z.string().datetime(),
  /** Number of temporal windows in which this pattern was detected. */
  windowCount: z.number().int().positive(),
  /**
   * Fraction of all windows in which this pattern appears.
   * Range [0, 1]. A value of 1.0 means the pattern is present in every window.
   */
  prevalence: z.number().min(0).max(1),
  /**
   * Mean confidence score across all windows where the pattern was detected.
   * Range [0, 1].
   */
  avgConfidence: z.number().min(0).max(1),
  /**
   * Labels of the temporal windows in which this pattern was observed,
   * in chronological order.
   */
  presentInWindows: z.array(z.string()),
  /**
   * Optional cross-source note: whether this pattern appears across multiple
   * source types within the same windows (stronger signal).
   */
  crossSource: z.boolean().default(false),
});

export type TemporalPattern = z.infer<typeof TemporalPatternSchema>;

// ---------------------------------------------------------------------------
// Temporal layer schema
// ---------------------------------------------------------------------------

/**
 * The complete temporal stratification of a set of extraction results.
 *
 * A TemporalLayer is the primary output of `stratifyTemporally()`. It bundles
 * the ordered sequence of windows with the cross-window pattern analysis and
 * summary statistics about the overall temporal span.
 */
export const TemporalLayerSchema = z.object({
  /** Granularity used to build this layer. */
  granularity: z.enum(TemporalGranularity),
  /** Ordered sequence of temporal windows (chronological). */
  windows: z.array(TemporalWindowSchema),
  /** Cross-window temporal patterns detected. */
  patterns: z.array(TemporalPatternSchema),
  /** ISO 8601 datetime of the earliest document in the corpus. */
  corpusStart: z.string().datetime().nullable(),
  /** ISO 8601 datetime of the most recent document in the corpus. */
  corpusEnd: z.string().datetime().nullable(),
  /** Total number of documents with a usable timestamp. */
  timedDocumentCount: z.number().int().nonnegative(),
  /** Total number of documents without a usable timestamp (excluded from stratification). */
  untimedDocumentCount: z.number().int().nonnegative(),
  /** ISO 8601 datetime when this layer was computed. */
  computedAt: z.string().datetime(),
});

export type TemporalLayer = z.infer<typeof TemporalLayerSchema>;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Compute the window label and boundaries for a given timestamp and granularity.
 * Returns { label, start, end } where start is inclusive and end is exclusive.
 */
function getWindowBounds(
  ts: Date,
  granularity: TemporalGranularity
): { label: string; start: Date; end: Date } {
  const y = ts.getUTCFullYear();
  const m = ts.getUTCMonth(); // 0-indexed
  const d = ts.getUTCDate();

  switch (granularity) {
    case "day": {
      const start = new Date(Date.UTC(y, m, d));
      const end = new Date(Date.UTC(y, m, d + 1));
      const label = start.toISOString().slice(0, 10); // "YYYY-MM-DD"
      return { label, start, end };
    }

    case "week": {
      // ISO week: Monday = day 1
      const dow = ts.getUTCDay(); // 0=Sun
      const diff = dow === 0 ? -6 : 1 - dow; // offset to Monday
      const monday = new Date(Date.UTC(y, m, d + diff));
      const sunday = new Date(monday.getTime() + 7 * 86_400_000);
      // ISO week label: "YYYY-Www"
      const weekNum = getISOWeekNumber(monday);
      const weekYear = monday.getUTCFullYear();
      const label = `${weekYear}-W${String(weekNum).padStart(2, "0")}`;
      return { label, start: monday, end: sunday };
    }

    case "month": {
      const start = new Date(Date.UTC(y, m, 1));
      const end = new Date(Date.UTC(y, m + 1, 1));
      const label = `${y}-${String(m + 1).padStart(2, "0")}`; // "YYYY-MM"
      return { label, start, end };
    }

    case "quarter": {
      const q = Math.floor(m / 3); // 0-indexed quarter
      const start = new Date(Date.UTC(y, q * 3, 1));
      const end = new Date(Date.UTC(y, q * 3 + 3, 1));
      const label = `${y}-Q${q + 1}`;
      return { label, start, end };
    }
  }
}

/**
 * Compute ISO week number (1–53) for a Monday-anchored date.
 * Uses the standard ISO 8601 algorithm.
 */
function getISOWeekNumber(monday: Date): number {
  const jan4 = new Date(Date.UTC(monday.getUTCFullYear(), 0, 4));
  const startOfWeek1 = new Date(
    jan4.getTime() - (jan4.getUTCDay() === 0 ? 6 : jan4.getUTCDay() - 1) * 86_400_000
  );
  const diffMs = monday.getTime() - startOfWeek1.getTime();
  return Math.floor(diffMs / (7 * 86_400_000)) + 1;
}

/**
 * Compute the linear trend direction for an array of numeric values.
 * Uses a simple least-squares slope sign with a stability threshold.
 */
function computeTrend(values: number[]): TemporalTrend {
  if (values.length < 3) return "sparse";

  const n = values.length;
  const xs = Array.from({ length: n }, (_, i) => i);
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i]! - meanX) * (values[i]! - meanY);
    den += (xs[i]! - meanX) ** 2;
  }

  const slope = den === 0 ? 0 : num / den;
  const range = Math.max(...values) - Math.min(...values);

  // Stability threshold: 2% of mean (or 0.02 absolute minimum).
  // A tight threshold ensures gradual but consistent trends
  // (e.g. 0.85 → 0.88 → 0.92, slope ≈0.035) are classified as rising/falling
  // rather than stable.
  const stabilityThreshold = Math.max(0.02, 0.02 * (meanY === 0 ? 1 : Math.abs(meanY)));

  // Detect oscillation: high variance with low absolute slope
  if (range > 2 * stabilityThreshold && Math.abs(slope) < stabilityThreshold) {
    return "oscillating";
  }

  if (Math.abs(slope) <= stabilityThreshold) return "stable";
  return slope > 0 ? "rising" : "falling";
}

/**
 * Classify the kind of a temporal pattern based on its window presence vector.
 *
 * @param presentFlags - Boolean array: true if pattern was present in that window
 * @param totalWindows - Total number of windows
 */
function classifyPatternKind(
  presentFlags: boolean[],
  totalWindows: number
): TemporalPattern["kind"] {
  const presentCount = presentFlags.filter(Boolean).length;

  // Persistent: present in every window
  if (presentCount === totalWindows) return "persistent";

  // Emerging: only present in the last 1–2 windows and absent in all earlier ones
  const lastTwo = presentFlags.slice(-2);
  const beforeLastTwo = presentFlags.slice(0, Math.max(0, totalWindows - 2));
  if (lastTwo.some(Boolean) && !beforeLastTwo.some(Boolean)) return "emerging";

  // Fading: absent in the last window (and present in at least one earlier window)
  const lastFlag = presentFlags[presentFlags.length - 1];
  const anyEarlier = presentFlags.slice(0, -1).some(Boolean);
  if (!lastFlag && anyEarlier) return "fading";

  // Episodic: present in isolated windows with gaps ≥ 2 between occurrences
  let maxGap = 0;
  let currentGap = 0;
  for (const flag of presentFlags) {
    if (!flag) {
      currentGap++;
      maxGap = Math.max(maxGap, currentGap);
    } else {
      currentGap = 0;
    }
  }
  if (maxGap >= 2 && presentCount >= 2) return "episodic";

  return "recurring";
}

// ---------------------------------------------------------------------------
// Core stratification function
// ---------------------------------------------------------------------------

/**
 * Stratify a set of extraction results into temporal layers.
 *
 * The function groups documents by their timestamp into fixed-width windows
 * at the requested granularity, computes per-window aggregate metrics
 * (document density, emotional tone, dominant themes and cognitive patterns),
 * and then performs cross-window analysis to identify temporal patterns —
 * signals that are rising, fading, episodic, or persistently present.
 *
 * Documents without a usable timestamp are counted but excluded from
 * window assignment. They are reported in `untimedDocumentCount`.
 *
 * @param extractions - Array of ExtractionResults to stratify
 * @param granularity - Time bucket size (default: "month")
 * @returns A validated TemporalLayer
 *
 * @example
 * ```ts
 * const layer = stratifyTemporally(extractions, "week");
 * console.log(layer.windows.length);        // number of weeks covered
 * console.log(layer.patterns[0]?.trend);    // "rising" | "falling" | ...
 * ```
 */
export function stratifyTemporally(
  extractions: readonly ExtractionResult[],
  granularity: TemporalGranularity = "month"
): TemporalLayer {
  // ── 1. Partition extractions into timed / untimed ──────────────────────────
  const timed: Array<{ extraction: ExtractionResult; ts: Date }> = [];
  let untimedCount = 0;

  for (const ex of extractions) {
    const ts = new Date(ex.timestamp);
    if (isNaN(ts.getTime())) {
      untimedCount++;
    } else {
      timed.push({ extraction: ex, ts });
    }
  }

  if (timed.length === 0) {
    return TemporalLayerSchema.parse({
      granularity,
      windows: [],
      patterns: [],
      corpusStart: null,
      corpusEnd: null,
      timedDocumentCount: 0,
      untimedDocumentCount: untimedCount,
      computedAt: new Date().toISOString(),
    });
  }

  // ── 2. Sort chronologically ────────────────────────────────────────────────
  timed.sort((a, b) => a.ts.getTime() - b.ts.getTime());

  const corpusStart = timed[0]!.ts.toISOString();
  const corpusEnd = timed[timed.length - 1]!.ts.toISOString();

  // ── 3. Assign each extraction to a window ─────────────────────────────────
  const windowMap = new Map<
    string,
    {
      bounds: { label: string; start: Date; end: Date };
      items: Array<{ extraction: ExtractionResult; ts: Date }>;
    }
  >();

  for (const item of timed) {
    const bounds = getWindowBounds(item.ts, granularity);
    if (!windowMap.has(bounds.label)) {
      windowMap.set(bounds.label, { bounds, items: [] });
    }
    windowMap.get(bounds.label)!.items.push(item);
  }

  // ── 4. Compute per-window aggregates ──────────────────────────────────────
  const maxDocs = Math.max(...[...windowMap.values()].map((w) => w.items.length));

  const windows: TemporalWindow[] = [];

  for (const [, { bounds, items }] of windowMap) {
    const sourceIds = items.map((i) => i.extraction.sourceId);

    // Emotional tone averages
    const tones = items
      .map((i) => i.extraction.emotionalTone)
      .filter((t): t is NonNullable<typeof t> => t !== undefined);

    const avgValence =
      tones.length > 0
        ? tones.reduce((sum, t) => sum + t.valence, 0) / tones.length
        : null;
    const avgArousal =
      tones.length > 0
        ? tones.reduce((sum, t) => sum + t.arousal, 0) / tones.length
        : null;

    // Dominant cognitive patterns (top 3 by frequency)
    const cogFreq = new Map<string, number>();
    for (const { extraction } of items) {
      for (const cp of extraction.cognitivePatterns) {
        cogFreq.set(cp.label, (cogFreq.get(cp.label) ?? 0) + 1);
      }
    }
    const dominantCognitivePatterns = [...cogFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([label]) => label);

    // Dominant themes (top 5 by relevance-weighted frequency)
    const themeScore = new Map<string, number>();
    for (const { extraction } of items) {
      for (const theme of extraction.themes) {
        themeScore.set(
          theme.label,
          (themeScore.get(theme.label) ?? 0) + theme.relevance
        );
      }
    }
    const dominantThemes = [...themeScore.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label]) => label);

    windows.push(
      TemporalWindowSchema.parse({
        label: bounds.label,
        start: bounds.start.toISOString(),
        end: bounds.end.toISOString(),
        sourceIds,
        documentCount: items.length,
        avgValence,
        avgArousal,
        dominantCognitivePatterns,
        dominantThemes,
        density: maxDocs > 0 ? items.length / maxDocs : 0,
      })
    );
  }

  // Ensure chronological order
  windows.sort((a, b) => a.start.localeCompare(b.start));

  // ── 5. Cross-window temporal pattern detection ─────────────────────────────
  // Collect all unique cognitive pattern labels across all windows
  const allPatternLabels = new Set<string>();
  for (const win of windows) {
    for (const label of win.dominantCognitivePatterns) {
      allPatternLabels.add(label);
    }
  }

  // Also collect theme labels as temporal signals
  const allThemeLabels = new Set<string>();
  for (const win of windows) {
    for (const label of win.dominantThemes) {
      allThemeLabels.add(label);
    }
  }

  const temporalPatterns: TemporalPattern[] = [];

  // Helper to build a TemporalPattern from a label and its presence vector
  const buildPattern = (
    label: string,
    presentFlags: boolean[],
    confidenceValues: number[]
  ): TemporalPattern | null => {
    const presentIndices = presentFlags
      .map((f, i) => (f ? i : -1))
      .filter((i) => i >= 0);

    if (presentIndices.length === 0) return null;

    const presentInWindows = presentIndices.map((i) => windows[i]!.label);
    const firstWindow = windows[presentIndices[0]!]!;
    const lastWindow = windows[presentIndices[presentIndices.length - 1]!]!;

    const avgConfidence =
      confidenceValues.length > 0
        ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
        : 0.5;

    const trend = computeTrend(confidenceValues);
    const kind = classifyPatternKind(presentFlags, windows.length);
    const prevalence = presentIndices.length / windows.length;

    // Detect cross-source presence: check if pattern appears in multiple source dirs
    const sourceDirsInWindows = new Set<string>();
    for (const idx of presentIndices) {
      const win = windows[idx]!;
      for (const srcId of win.sourceIds) {
        const ex = extractions.find((e) => e.sourceId === srcId);
        if (ex) {
          // sourceId format from adapters: "<adapter>_<sessionId>_<timestamp>"
          const parts = srcId.split("_");
          if (parts[0]) sourceDirsInWindows.add(parts[0]);
        }
      }
    }
    const crossSource = sourceDirsInWindows.size > 1;

    // Stable identifier: lowercase slug of label
    const id = `tp_${label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;

    return TemporalPatternSchema.parse({
      id,
      label,
      kind,
      trend,
      firstSeen: firstWindow.start,
      lastSeen: lastWindow.start,
      windowCount: presentIndices.length,
      prevalence,
      avgConfidence,
      presentInWindows,
      crossSource,
    });
  };

  // Process cognitive patterns
  for (const label of allPatternLabels) {
    const presentFlags: boolean[] = [];
    const confidenceValues: number[] = [];

    for (const win of windows) {
      const present = win.dominantCognitivePatterns.includes(label);
      presentFlags.push(present);

      if (present) {
        // Find average confidence of this pattern across extractions in this window
        const windowExtractions = extractions.filter((e) =>
          win.sourceIds.includes(e.sourceId)
        );
        const confs = windowExtractions.flatMap((e) =>
          e.cognitivePatterns
            .filter((cp) => cp.label === label)
            .map((cp) => cp.confidence)
        );
        const avgConf =
          confs.length > 0
            ? confs.reduce((a, b) => a + b, 0) / confs.length
            : 0.5;
        confidenceValues.push(avgConf);
      }
    }

    const pattern = buildPattern(label, presentFlags, confidenceValues);
    if (pattern) temporalPatterns.push(pattern);
  }

  // Process themes as temporal signals (using relevance as confidence proxy)
  for (const label of allThemeLabels) {
    const presentFlags: boolean[] = [];
    const relevanceValues: number[] = [];

    for (const win of windows) {
      const present = win.dominantThemes.includes(label);
      presentFlags.push(present);

      if (present) {
        const windowExtractions = extractions.filter((e) =>
          win.sourceIds.includes(e.sourceId)
        );
        const rels = windowExtractions.flatMap((e) =>
          e.themes.filter((t) => t.label === label).map((t) => t.relevance)
        );
        const avgRel =
          rels.length > 0
            ? rels.reduce((a, b) => a + b, 0) / rels.length
            : 0.5;
        relevanceValues.push(avgRel);
      }
    }

    // Only include themes present in ≥ 2 windows to avoid noise
    const presentCount = presentFlags.filter(Boolean).length;
    if (presentCount < 2) continue;

    const pattern = buildPattern(label, presentFlags, relevanceValues);
    if (pattern) temporalPatterns.push(pattern);
  }

  // Sort patterns: persistent first, then by prevalence desc, then by avgConfidence desc
  const kindOrder: Record<TemporalPattern["kind"], number> = {
    persistent: 0,
    recurring: 1,
    episodic: 2,
    emerging: 3,
    fading: 4,
  };
  temporalPatterns.sort((a, b) => {
    const kindDiff = kindOrder[a.kind] - kindOrder[b.kind];
    if (kindDiff !== 0) return kindDiff;
    const prevDiff = b.prevalence - a.prevalence;
    if (Math.abs(prevDiff) > 0.01) return prevDiff;
    return b.avgConfidence - a.avgConfidence;
  });

  // ── 6. Assemble and validate the layer ────────────────────────────────────
  return TemporalLayerSchema.parse({
    granularity,
    windows,
    patterns: temporalPatterns,
    corpusStart,
    corpusEnd,
    timedDocumentCount: timed.length,
    untimedDocumentCount: untimedCount,
    computedAt: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Convenience: multi-granularity stratification
// ---------------------------------------------------------------------------

/**
 * Run stratification at multiple granularities simultaneously.
 *
 * Useful when you want both a coarse (monthly) and fine-grained (weekly)
 * view of the same corpus without re-sorting the data.
 *
 * @param extractions - Array of ExtractionResults to stratify
 * @param granularities - Granularities to compute (default: all four)
 * @returns Map from granularity to TemporalLayer
 */
export function stratifyMultiGranularity(
  extractions: readonly ExtractionResult[],
  granularities: readonly TemporalGranularity[] = [...TemporalGranularity]
): Map<TemporalGranularity, TemporalLayer> {
  const result = new Map<TemporalGranularity, TemporalLayer>();
  for (const g of granularities) {
    result.set(g, stratifyTemporally(extractions, g));
  }
  return result;
}
