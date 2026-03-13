import { z } from "zod";
import type { ExtractionResult } from "./extract.js";
import {
  stratifyTemporally,
  TemporalLayerSchema,
  type TemporalGranularity,
  type TemporalLayer,
} from "./temporal.js";

// ---------------------------------------------------------------------------
// Pattern detection result schemas
// ---------------------------------------------------------------------------

export const SabotageIndicatorSchema = z.object({
  pattern: z.string(),
  trigger: z.string(),
  consequence: z.string(),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string()),
});

export type SabotageIndicator = z.infer<typeof SabotageIndicatorSchema>;

export const ProjectionAnalysisSchema = z.object({
  projectedTrait: z.string(),
  targetEntity: z.string(),
  projectionType: z.enum(["shadow", "golden_shadow", "anima", "persona"]),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string()),
});

export type ProjectionAnalysis = z.infer<typeof ProjectionAnalysisSchema>;

export const CycleDetectionSchema = z.object({
  label: z.string(),
  kind: z.enum(["Growth", "Sabotage", "Creative", "Avoidance"]),
  phases: z.array(z.string()),
  frequency: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export type CycleDetection = z.infer<typeof CycleDetectionSchema>;

export const PatternDetectionResultSchema = z.object({
  sourceIds: z.array(z.string()),
  sabotageIndicators: z.array(SabotageIndicatorSchema),
  projections: z.array(ProjectionAnalysisSchema),
  cycles: z.array(CycleDetectionSchema),
  /**
   * Temporal stratification at monthly granularity (default view).
   * Provides a time-layered view of how patterns evolve across the corpus.
   * Use `temporalLayers` for access to all granularities.
   */
  temporalLayer: TemporalLayerSchema,
  /**
   * Temporal stratification at all four granularities (day, week, month, quarter).
   * Keyed by granularity string. Serialised as a plain object for JSON compatibility.
   */
  temporalLayers: z.record(z.string(), TemporalLayerSchema),
  timestamp: z.string().datetime(),
});

export type PatternDetectionResult = z.infer<
  typeof PatternDetectionResultSchema
>;

// ---------------------------------------------------------------------------
// Pattern detection functions
// ---------------------------------------------------------------------------

/**
 * Detect self-sabotage patterns across extraction results.
 *
 * Stub implementation: returns empty indicators.
 * Future versions will use Claude to cross-reference behavioral patterns
 * with outcomes to identify recurring self-defeating cycles.
 *
 * @param extractions - Array of extraction results to analyze
 * @returns Array of sabotage indicators
 */
export async function detectSelfSabotage(
  _extractions: readonly ExtractionResult[]
): Promise<readonly SabotageIndicator[]> {
  // TODO: Implement cross-referencing of behavioral patterns with negative outcomes
  return [];
}

/**
 * Analyze projection patterns in extraction results.
 *
 * Stub implementation: returns empty analysis.
 * Future versions will identify when traits are attributed to others
 * that may reflect unintegrated aspects of the self.
 *
 * @param extractions - Array of extraction results to analyze
 * @returns Array of projection analyses
 */
export async function analyzeProjections(
  _extractions: readonly ExtractionResult[]
): Promise<readonly ProjectionAnalysis[]> {
  // TODO: Implement projection detection via entity sentiment analysis
  return [];
}

/**
 * Detect recurring psychological cycles across extraction results.
 *
 * Stub implementation: returns empty cycles.
 * Future versions will identify temporal patterns of behavior
 * that repeat with recognizable triggers and outcomes.
 *
 * @param extractions - Array of extraction results to analyze
 * @returns Array of detected cycles
 */
export async function detectCycles(
  _extractions: readonly ExtractionResult[]
): Promise<readonly CycleDetection[]> {
  // TODO: Implement Claude-based cycle detection
  return [];
}

/**
 * Run all pattern detection analyses on a set of extraction results.
 *
 * Includes temporal stratification at all four granularities (day, week,
 * month, quarter). The default `temporalLayer` field uses monthly granularity
 * as the primary view; `temporalLayers` exposes all four.
 *
 * @param extractions - The extraction results to analyze
 * @param temporalGranularity - Primary granularity for `temporalLayer` (default: "month")
 * @returns Combined pattern detection result with temporal layers
 */
export async function detectAllPatterns(
  extractions: readonly ExtractionResult[],
  temporalGranularity: TemporalGranularity = "month"
): Promise<PatternDetectionResult> {
  const [sabotageIndicators, projections, cycles] = await Promise.all([
    detectSelfSabotage(extractions),
    analyzeProjections(extractions),
    detectCycles(extractions),
  ]);

  // Compute temporal stratification at all granularities
  const granularities: TemporalGranularity[] = ["day", "week", "month", "quarter"];
  const temporalLayers: Record<string, TemporalLayer> = {};
  for (const g of granularities) {
    temporalLayers[g] = stratifyTemporally(extractions, g);
  }

  const temporalLayer = temporalLayers[temporalGranularity]!;

  return PatternDetectionResultSchema.parse({
    sourceIds: extractions.map((e) => e.sourceId),
    sabotageIndicators: [...sabotageIndicators],
    projections: [...projections],
    cycles: [...cycles],
    temporalLayer,
    temporalLayers,
    timestamp: new Date().toISOString(),
  });
}
