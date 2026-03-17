import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as url from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { ArchetypeKind, DimensionKind } from "../ontology/types.js";
import type { ExtractionResult } from "./extract.js";
import type { PatternDetectionResult } from "./patterns.js";

// ---------------------------------------------------------------------------
// Archetype mapping schemas
// ---------------------------------------------------------------------------

export const ArchetypeMappingSchema = z.object({
  archetype: z.enum(ArchetypeKind),
  strength: z.number().min(0).max(1),
  evidence: z.array(z.string()),
  manifestations: z.array(z.string()),
});

export type ArchetypeMapping = z.infer<typeof ArchetypeMappingSchema>;

export const DimensionScoreSchema = z.object({
  dimension: z.enum(DimensionKind),
  coverage: z.number().min(0).max(1),
  dominantMetrics: z.array(z.string()),
  gaps: z.array(z.string()),
});

export type DimensionScore = z.infer<typeof DimensionScoreSchema>;

export const ArchetypeSynthesisSchema = z.object({
  archetypeMappings: z.array(ArchetypeMappingSchema),
  dimensionScores: z.array(DimensionScoreSchema),
  dominantArchetype: z.enum(ArchetypeKind).optional(),
  shadowElements: z.array(z.string()),
  growthVectors: z.array(z.string()),
  timestamp: z.string().datetime(),
});

export type ArchetypeSynthesis = z.infer<typeof ArchetypeSynthesisSchema>;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toArchetypeKind(
  raw: string
): (typeof ArchetypeKind)[number] | undefined {
  const v = raw.trim();
  return (ArchetypeKind as readonly string[]).includes(v)
    ? (v as (typeof ArchetypeKind)[number])
    : undefined;
}

function toDimensionKind(
  raw: string
): (typeof DimensionKind)[number] | undefined {
  const v = raw.trim();
  return (DimensionKind as readonly string[]).includes(v)
    ? (v as (typeof DimensionKind)[number])
    : undefined;
}

async function loadSynthesisPrompt(): Promise<string> {
  const base = path.resolve(url.fileURLToPath(import.meta.url), "../../..");
  const candidates = [
    path.join(base, "scripts/_prompt-synthesis.txt"),
    path.join(base, "web/src/prompts/synthesis.txt"),
  ];
  for (const p of candidates) {
    try {
      return await fs.readFile(p, "utf-8");
    } catch {
      // try next candidate
    }
  }
  throw new Error("Synthesis prompt not found. Run: npm run sync-prompts");
}

// ---------------------------------------------------------------------------
// Synthesis function
// ---------------------------------------------------------------------------

export async function synthesizeArchetypes(
  extractions: readonly ExtractionResult[],
  patterns: PatternDetectionResult
): Promise<ArchetypeSynthesis> {
  const key = process.env["ANTHROPIC_API_KEY"];

  if (!key || extractions.length === 0) {
    console.warn("[synthesize] No API key or no extractions — returning empty synthesis");
    return ArchetypeSynthesisSchema.parse({
      archetypeMappings: [],
      dimensionScores: [],
      shadowElements: [],
      growthVectors: [],
      timestamp: new Date().toISOString(),
    });
  }

  const systemPrompt = await loadSynthesisPrompt();

  // Build compact input for Claude
  const inputData = {
    extractions: extractions.map((e) => ({
      sourceId: e.sourceId,
      entities: e.entities.slice(0, 30),
      themes: e.themes,
      cognitivePatterns: e.cognitivePatterns,
      rawAnalysis: e.rawAnalysis?.slice(0, 2000),
    })),
    patterns: {
      sabotageIndicators: patterns.sabotageIndicators,
      projections: patterns.projections,
      cycles: patterns.cycles,
    },
  };

  const userMessage = `Here are the extraction and pattern detection results to synthesize:\n\n${JSON.stringify(inputData, null, 2)}`;

  const client = new Anthropic({ apiKey: key });
  let rawText: string;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    rawText = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
  } catch (err) {
    console.error(
      "[synthesize] Claude API error:",
      err instanceof Error ? err.message : String(err)
    );
    return ArchetypeSynthesisSchema.parse({
      archetypeMappings: [],
      dimensionScores: [],
      shadowElements: [],
      growthVectors: [],
      timestamp: new Date().toISOString(),
    });
  }

  const jsonText = rawText
    .replace(/^```json?\s*\n?/m, "")
    .replace(/\n?```\s*$/m, "")
    .trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    console.error("[synthesize] JSON parse failed");
    return ArchetypeSynthesisSchema.parse({
      archetypeMappings: [],
      dimensionScores: [],
      shadowElements: [],
      growthVectors: [],
      timestamp: new Date().toISOString(),
    });
  }

  // Map archetypeMapping (dominant/secondary/emergent/goldenShadow) → archetypeMappings[]
  const archetypeMappings: ArchetypeMapping[] = [];
  const archetypeMapping = parsed["archetypeMapping"] as
    | Record<string, Record<string, unknown>>
    | undefined;

  if (archetypeMapping) {
    for (const [role, entry] of Object.entries(archetypeMapping)) {
      const kind = toArchetypeKind(String(entry["archetype"] ?? ""));
      if (!kind) continue;
      archetypeMappings.push({
        archetype: kind,
        strength: Math.min(1, Math.max(0, Number(entry["confidence"] ?? 0.5))),
        evidence: entry["evidence"]
          ? [String(entry["evidence"])]
          : [role],
        manifestations: entry["manifestation"]
          ? [String(entry["manifestation"])]
          : [],
      });
    }
  }

  // Map unifiedDimensionalScores → dimensionScores[]
  const dimensionScores: DimensionScore[] = [];
  const dimScores = parsed["unifiedDimensionalScores"] as
    | Record<string, Record<string, unknown>>
    | undefined;

  if (dimScores) {
    for (const [dimName, dimData] of Object.entries(dimScores)) {
      const kind = toDimensionKind(dimName);
      if (!kind) continue;
      const keyFindings = Array.isArray(dimData["keyFindings"])
        ? (dimData["keyFindings"] as unknown[]).map(String)
        : [];
      const blindSpot = dimData["blindSpot"] ? [String(dimData["blindSpot"])] : [];
      dimensionScores.push({
        dimension: kind,
        coverage: Math.min(1, Math.max(0, Number(dimData["score"] ?? dimData["depth"] ?? 0.5))),
        dominantMetrics: keyFindings.slice(0, 5),
        gaps: blindSpot,
      });
    }
  }

  // Extract shadow elements from sabotage indicators and projections
  const shadowElements: string[] = [];
  const crossValidated = parsed["crossValidatedPatterns"] as
    | Array<Record<string, unknown>>
    | undefined;
  if (crossValidated) {
    for (const p of crossValidated) {
      if (p["counterPressure"]) shadowElements.push(String(p["counterPressure"]));
    }
  }

  // Extract growth vectors from topPotentials or directionalVector
  const growthVectors: string[] = [];
  const topPotentials = parsed["topPotentials"] as
    | Array<Record<string, unknown>>
    | undefined;
  if (topPotentials) {
    for (const p of topPotentials) {
      if (p["actionable"]) growthVectors.push(String(p["actionable"]));
      else if (p["label"]) growthVectors.push(String(p["label"]));
    }
  }
  const directionalVector = parsed["directionalVector"] as
    | Record<string, unknown>
    | undefined;
  if (directionalVector?.["summary"]) {
    growthVectors.unshift(String(directionalVector["summary"]));
  }

  // Dominant archetype is the first mapping with highest strength
  const dominantArchetype =
    archetypeMappings.length > 0
      ? archetypeMappings.sort((a, b) => b.strength - a.strength)[0]!.archetype
      : undefined;

  return ArchetypeSynthesisSchema.parse({
    archetypeMappings,
    dimensionScores,
    dominantArchetype,
    shadowElements: shadowElements.slice(0, 10),
    growthVectors: growthVectors.slice(0, 10),
    timestamp: new Date().toISOString(),
  });
}
