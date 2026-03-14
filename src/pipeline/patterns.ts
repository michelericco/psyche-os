import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { ExtractionResult } from "./extract.js";

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
  timestamp: z.string().datetime(),
});

export type PatternDetectionResult = z.infer<
  typeof PatternDetectionResultSchema
>;

// ---------------------------------------------------------------------------
// Internal: single Claude call for all three pattern types
// ---------------------------------------------------------------------------

interface AllPatterns {
  sabotageIndicators: SabotageIndicator[];
  projections: ProjectionAnalysis[];
  cycles: CycleDetection[];
}

async function detectAllPatternsFromClaude(
  extractions: readonly ExtractionResult[]
): Promise<AllPatterns> {
  const key = process.env["ANTHROPIC_API_KEY"];
  if (!key || extractions.length === 0) {
    return { sabotageIndicators: [], projections: [], cycles: [] };
  }

  // Build a compact summary of the extractions to send as context
  const summary = extractions.map((e) => ({
    sourceId: e.sourceId,
    themes: e.themes.map((t) => t.label),
    entities: e.entities.slice(0, 20).map((en) => `${en.name} (${en.kind})`),
    cognitivePatterns: e.cognitivePatterns.map((c) => c.label),
    rawAnalysis: e.rawAnalysis?.slice(0, 1000),
  }));

  const prompt = `You are performing cross-source behavioral pattern detection for PSYCHE/OS.

Given these extraction summaries, identify:
1. Self-sabotage patterns: recurring behaviors that undermine the subject's stated goals
2. Projections: traits attributed to external entities that likely reflect unintegrated internal aspects
3. Psychological cycles: recurring sequences of behavior with recognizable triggers, phases, and outcomes

Extraction data:
${JSON.stringify(summary, null, 2)}

Respond with ONLY a JSON object in this exact format (no markdown fencing):
{
  "sabotageIndicators": [
    {
      "pattern": "Name of the pattern",
      "trigger": "What triggers this behavior",
      "consequence": "What happens as a result",
      "confidence": 0.7,
      "evidence": ["specific evidence from the data", "..."]
    }
  ],
  "projections": [
    {
      "projectedTrait": "The trait being projected",
      "targetEntity": "Name of entity receiving the projection",
      "projectionType": "shadow|golden_shadow|anima|persona",
      "confidence": 0.6,
      "evidence": ["evidence from extraction data"]
    }
  ],
  "cycles": [
    {
      "label": "Name of the cycle",
      "kind": "Growth|Sabotage|Creative|Avoidance",
      "phases": ["phase 1", "phase 2", "phase 3"],
      "frequency": "weekly|monthly|episodic|unclear",
      "confidence": 0.65
    }
  ]
}

Guidelines:
- Only report patterns with confidence >= 0.4
- Prefer evidence-backed inferences over speculation
- Use the full confidence range (0.4–0.85)
- Return empty arrays if insufficient evidence exists`;

  const client = new Anthropic({ apiKey: key });
  let rawText: string;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
    rawText = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
  } catch (err) {
    console.error(
      "[patterns] Claude API error:",
      err instanceof Error ? err.message : String(err)
    );
    return { sabotageIndicators: [], projections: [], cycles: [] };
  }

  const jsonText = rawText
    .replace(/^```json?\s*\n?/m, "")
    .replace(/\n?```\s*$/m, "")
    .trim();

  try {
    const parsed = JSON.parse(jsonText) as Record<string, unknown>;

    const sabotageIndicators = (
      (parsed["sabotageIndicators"] as Array<Record<string, unknown>>) ?? []
    )
      .map((s) =>
        SabotageIndicatorSchema.safeParse({
          pattern: String(s["pattern"] ?? ""),
          trigger: String(s["trigger"] ?? ""),
          consequence: String(s["consequence"] ?? ""),
          confidence: Number(s["confidence"] ?? 0.5),
          evidence: ((s["evidence"] ?? []) as unknown[]).map(String),
        })
      )
      .filter((r) => r.success)
      .map((r) => r.data as SabotageIndicator);

    const projections = (
      (parsed["projections"] as Array<Record<string, unknown>>) ?? []
    )
      .map((p) =>
        ProjectionAnalysisSchema.safeParse({
          projectedTrait: String(p["projectedTrait"] ?? ""),
          targetEntity: String(p["targetEntity"] ?? ""),
          projectionType: p["projectionType"] ?? "shadow",
          confidence: Number(p["confidence"] ?? 0.5),
          evidence: ((p["evidence"] ?? []) as unknown[]).map(String),
        })
      )
      .filter((r) => r.success)
      .map((r) => r.data as ProjectionAnalysis);

    const cycles = (
      (parsed["cycles"] as Array<Record<string, unknown>>) ?? []
    )
      .map((c) =>
        CycleDetectionSchema.safeParse({
          label: String(c["label"] ?? ""),
          kind: c["kind"] ?? "Growth",
          phases: ((c["phases"] ?? []) as unknown[]).map(String),
          frequency: c["frequency"] ? String(c["frequency"]) : undefined,
          confidence: Number(c["confidence"] ?? 0.5),
        })
      )
      .filter((r) => r.success)
      .map((r) => r.data as CycleDetection);

    return { sabotageIndicators, projections, cycles };
  } catch {
    console.error("[patterns] JSON parse failed");
    return { sabotageIndicators: [], projections: [], cycles: [] };
  }
}

// Module-level cache so all three functions share one API call per batch
let _cachedPatterns: AllPatterns | null = null;
let _cachedSourceIds: string[] = [];

async function getOrFetchPatterns(
  extractions: readonly ExtractionResult[]
): Promise<AllPatterns> {
  const ids = extractions.map((e) => e.sourceId).sort();
  if (
    _cachedPatterns &&
    JSON.stringify(ids) === JSON.stringify(_cachedSourceIds)
  ) {
    return _cachedPatterns;
  }
  _cachedPatterns = await detectAllPatternsFromClaude(extractions);
  _cachedSourceIds = ids;
  return _cachedPatterns;
}

// ---------------------------------------------------------------------------
// Exported pattern detection functions
// ---------------------------------------------------------------------------

export async function detectSelfSabotage(
  extractions: readonly ExtractionResult[]
): Promise<readonly SabotageIndicator[]> {
  const { sabotageIndicators } = await getOrFetchPatterns(extractions);
  return sabotageIndicators;
}

export async function analyzeProjections(
  extractions: readonly ExtractionResult[]
): Promise<readonly ProjectionAnalysis[]> {
  const { projections } = await getOrFetchPatterns(extractions);
  return projections;
}

export async function detectCycles(
  extractions: readonly ExtractionResult[]
): Promise<readonly CycleDetection[]> {
  const { cycles } = await getOrFetchPatterns(extractions);
  return cycles;
}

/**
 * Run all pattern detection analyses. Uses a single Claude call internally.
 */
export async function detectAllPatterns(
  extractions: readonly ExtractionResult[]
): Promise<PatternDetectionResult> {
  const { sabotageIndicators, projections, cycles } =
    await getOrFetchPatterns(extractions);

  return PatternDetectionResultSchema.parse({
    sourceIds: extractions.map((e) => e.sourceId),
    sabotageIndicators,
    projections,
    cycles,
    timestamp: new Date().toISOString(),
  });
}
