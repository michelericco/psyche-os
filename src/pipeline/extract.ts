import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as url from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { SourceDocument } from "./ingest.js";

// ---------------------------------------------------------------------------
// Extraction result schemas
// ---------------------------------------------------------------------------

export const ExtractedEntitySchema = z.object({
  name: z.string(),
  kind: z.enum(["Person", "Concept", "Tool", "Place", "Project"]),
  mentions: z.number().int().nonnegative(),
});

export type ExtractedEntity = z.infer<typeof ExtractedEntitySchema>;

export const ThemeSchema = z.object({
  label: z.string(),
  relevance: z.number().min(0).max(1),
  keywords: z.array(z.string()),
});

export type Theme = z.infer<typeof ThemeSchema>;

export const EmotionalToneSchema = z.object({
  valence: z.number().min(-1).max(1),
  arousal: z.number().min(0).max(1),
  dominantEmotion: z.string(),
  secondaryEmotions: z.array(z.string()),
});

export type EmotionalTone = z.infer<typeof EmotionalToneSchema>;

export const CognitivePatternSchema = z.object({
  label: z.string(),
  kind: z.enum([
    "analytical",
    "intuitive",
    "systematic",
    "divergent",
    "convergent",
    "metacognitive",
  ]),
  confidence: z.number().min(0).max(1),
  evidence: z.string(),
});

export type CognitivePattern = z.infer<typeof CognitivePatternSchema>;

export const ExtractionResultSchema = z.object({
  sourceId: z.string(),
  entities: z.array(ExtractedEntitySchema),
  themes: z.array(ThemeSchema),
  emotionalTone: EmotionalToneSchema.optional(),
  cognitivePatterns: z.array(CognitivePatternSchema),
  rawAnalysis: z.string().optional(),
  timestamp: z.string().datetime(),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function toEntityKind(raw: string): ExtractedEntity["kind"] {
  const v = raw.trim();
  if (v === "Person") return "Person";
  if (v === "Tool" || v === "Technology") return "Tool";
  if (v === "Place") return "Place";
  if (v === "Project" || v === "Organization") return "Project";
  return "Concept";
}

function toCognitiveKind(raw: string): CognitivePattern["kind"] {
  const v = raw.toLowerCase().trim();
  const kinds = [
    "analytical",
    "intuitive",
    "systematic",
    "divergent",
    "convergent",
    "metacognitive",
  ] as const;
  return kinds.find((k) => v.includes(k)) ?? "analytical";
}

async function loadExtractionPrompt(): Promise<string> {
  const base = path.resolve(url.fileURLToPath(import.meta.url), "../../..");
  const candidates = [
    path.join(base, "scripts/_prompt-extraction.txt"),
    path.join(base, "web/src/prompts/extraction.txt"),
  ];
  for (const p of candidates) {
    try {
      return await fs.readFile(p, "utf-8");
    } catch {
      // try next candidate
    }
  }
  throw new Error("Extraction prompt not found. Run: npm run sync-prompts");
}

// ---------------------------------------------------------------------------
// Secret redaction
// ---------------------------------------------------------------------------

/** Redacts common secret patterns before sending content to the LLM. */
function redactSecrets(text: string): { redacted: string; count: number } {
  type PatternEntry = [string, RegExp];
  const patterns: PatternEntry[] = [
    ["API_KEY_SK",    /sk-[A-Za-z0-9_-]{20,}/g],
    ["ANTHROPIC_KEY", /sk-ant-[A-Za-z0-9_-]{20,}/g],
    ["AWS_AKID",      /AKIA[A-Z0-9]{16}/g],
    ["GCP_API_KEY",   /AIza[0-9A-Za-z_-]{35}/g],
    ["GH_TOKEN",      /ghp_[A-Za-z0-9]{36}/g],
    ["GH_TOKEN_SVC",  /ghs_[A-Za-z0-9]{36}/g],
    ["SLACK_TOKEN",   /xox[baprs]-[A-Za-z0-9-]{10,}/g],
    ["BEARER",        /Bearer[ \t]+[A-Za-z0-9._~+/=-]+/gi],
    ["AUTH_HEADER",   /Authorization[ \t]*:[ \t]*[^\n\r]+/gi],
    ["PEM_KEY",       /-----BEGIN [A-Z ]+ KEY-----[\s\S]*?-----END [A-Z ]+ KEY-----/g],
    ["URL_CRED",      /https?:\/\/[A-Za-z0-9._~%-]+:[A-Za-z0-9._~%@!-]+@[^\s]+/g],
  ];
  let redacted = text;
  let count = 0;
  const found: string[] = [];
  for (const [label, re] of patterns) {
    let localCount = 0;
    redacted = redacted.replace(re, () => { localCount++; return `[REDACTED_${label}]`; });
    if (localCount > 0) { found.push(`${localCount} ${label}`); count += localCount; }
  }
  if (count > 0) {
    console.warn(`[extract] Redacted ${count} secret(s) before LLM: ${found.join(", ")}`);
  }
  return { redacted, count };
}

// ---------------------------------------------------------------------------
// Extraction function
// ---------------------------------------------------------------------------

export async function extractSemantics(
  document: SourceDocument,
  apiKey?: string
): Promise<ExtractionResult> {
  const key = apiKey ?? process.env["ANTHROPIC_API_KEY"];

  if (!key) {
    console.warn(`[extract] No API key — skipping ${document.id}`);
    return ExtractionResultSchema.parse({
      sourceId: document.id,
      entities: [],
      themes: [],
      cognitivePatterns: [],
      timestamp: new Date().toISOString(),
    });
  }

  const systemPrompt = await loadExtractionPrompt();
  const { redacted: safeContent } = redactSecrets(document.content.slice(0, 80_000));
  const userMessage = `Source family: ${document.sourceDir}\n\n---\n\n${safeContent}`;

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
      `[extract] Claude API error for ${document.id}:`,
      err instanceof Error ? err.message : String(err)
    );
    return ExtractionResultSchema.parse({
      sourceId: document.id,
      entities: [],
      themes: [],
      cognitivePatterns: [],
      timestamp: new Date().toISOString(),
    });
  }

  // Strip markdown fences if present
  const jsonText = rawText
    .replace(/^```json?\s*\n?/m, "")
    .replace(/\n?```\s*$/m, "")
    .trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonText) as Record<string, unknown>;
  } catch {
    console.error(`[extract] JSON parse failed for ${document.id}`);
    return ExtractionResultSchema.parse({
      sourceId: document.id,
      entities: [],
      themes: [],
      cognitivePatterns: [],
      rawAnalysis: rawText.slice(0, 2000),
      timestamp: new Date().toISOString(),
    });
  }

  // Map entities
  const rawEntities =
    (parsed["entities"] as Array<Record<string, unknown>>) ?? [];
  const entities = rawEntities
    .map((e) => ({
      name: String(e["name"] ?? "").trim(),
      kind: toEntityKind(String(e["kind"] ?? "")),
      mentions: Math.max(1, Number(e["mentions"] ?? 1)),
    }))
    .filter((e) => e.name.length > 0)
    .slice(0, 100);

  // Map themes
  const rawThemes =
    (parsed["themes"] as Array<Record<string, unknown>>) ?? [];
  const themes = rawThemes
    .map((t) => ({
      label: String(t["label"] ?? "").trim(),
      relevance: Math.min(1, Math.max(0, Number(t["relevance"] ?? 0.5))),
      keywords: (
        (t["keywords"] ?? t["relatedConcepts"] ?? []) as unknown[]
      )
        .map(String)
        .slice(0, 10),
    }))
    .filter((t) => t.label.length > 0)
    .slice(0, 20);

  // Map cognitive patterns — try array first, then cognitiveGenomeEvidence map
  let cognitivePatterns: CognitivePattern[] = [];
  const rawCognitive = parsed[
    "cognitivePatterns"
  ] as Array<Record<string, unknown>> | undefined;

  if (Array.isArray(rawCognitive) && rawCognitive.length > 0) {
    cognitivePatterns = rawCognitive
      .map((c) => ({
        label: String(c["label"] ?? "").trim(),
        kind: toCognitiveKind(String(c["kind"] ?? c["type"] ?? "")),
        confidence: Math.min(1, Math.max(0, Number(c["confidence"] ?? 0.5))),
        evidence: String(c["evidence"] ?? c["description"] ?? "").slice(0, 500),
      }))
      .filter((c) => c.label.length > 0)
      .slice(0, 10);
  } else {
    const genome = parsed["cognitiveGenomeEvidence"] as
      | Record<string, Record<string, unknown>>
      | undefined;
    if (genome) {
      cognitivePatterns = Object.entries(genome)
        .filter(([, v]) => Number(v["score"]) > 0.4)
        .map(([name, v]) => ({
          label: name,
          kind: toCognitiveKind(name),
          confidence: Math.min(1, Math.max(0, Number(v["score"] ?? 0.5))),
          evidence: String(v["evidence"] ?? "").slice(0, 500),
        }))
        .slice(0, 10);
    }
  }

  // Derive emotional tone from dimensionalScores.Psychological if present
  let emotionalTone: ExtractionResult["emotionalTone"];
  const dimScores = parsed["dimensionalScores"] as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (dimScores?.["Psychological"]) {
    const psych = dimScores["Psychological"];
    const depth = Math.min(1, Math.max(0, Number(psych["depth"] ?? 0.5)));
    const keyFindings = Array.isArray(psych["keyFindings"])
      ? (psych["keyFindings"] as unknown[]).map(String)
      : [];
    emotionalTone = {
      valence: depth > 0.6 ? 0.2 : -0.1,
      arousal: depth,
      dominantEmotion: keyFindings[0] ?? "neutral",
      secondaryEmotions: keyFindings.slice(1, 4),
    };
  }

  return ExtractionResultSchema.parse({
    sourceId: document.id,
    entities,
    themes,
    emotionalTone,
    cognitivePatterns,
    rawAnalysis: jsonText.slice(0, 3000),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Extract semantics from multiple documents in batch.
 */
export async function extractBatch(
  documents: readonly SourceDocument[],
  apiKey?: string
): Promise<ExtractionResult[]> {
  const results: ExtractionResult[] = [];

  for (const doc of documents) {
    try {
      const result = await extractSemantics(doc, apiKey);
      results.push(result);
    } catch (err) {
      console.error(
        `[extract] Failed to extract from ${doc.id}:`,
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  return results;
}
