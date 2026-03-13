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

/**
 * Optional temporal span of the source document itself.
 * Distinct from `timestamp` (which is when extraction ran):
 * `documentPeriod` describes the time range the document *covers*.
 */
export const DocumentPeriodSchema = z.object({
  /** ISO 8601 datetime of the earliest content in the source document. */
  start: z.string().datetime(),
  /** ISO 8601 datetime of the latest content in the source document. */
  end: z.string().datetime(),
  /**
   * Number of distinct calendar days spanned by the document.
   * Useful for normalising activity density across sources of different lengths.
   */
  durationDays: z.number().int().nonnegative(),
});

export type DocumentPeriod = z.infer<typeof DocumentPeriodSchema>;

export const ExtractionResultSchema = z.object({
  sourceId: z.string(),
  entities: z.array(ExtractedEntitySchema),
  themes: z.array(ThemeSchema),
  emotionalTone: EmotionalToneSchema.optional(),
  cognitivePatterns: z.array(CognitivePatternSchema),
  rawAnalysis: z.string().optional(),
  /**
   * Temporal span of the source document content.
   * Populated when the adapter or extractor can determine the document's
   * own time range (e.g. first/last message timestamps in a session file).
   * Used by the temporal stratification layer to place the extraction
   * at the correct point in the timeline.
   */
  documentPeriod: DocumentPeriodSchema.optional(),
  timestamp: z.string().datetime(),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

// ---------------------------------------------------------------------------
// Extraction function
// ---------------------------------------------------------------------------

/**
 * Extract semantic content from a source document using Claude API.
 *
 * This is a stub that returns an empty extraction result.
 * Future implementation will call the Claude API with a structured prompt
 * and validate the response against ExtractionResultSchema.
 *
 * @param document - The source document to analyze
 * @param _apiKey - Claude API key (unused in stub)
 * @returns Structured extraction result
 */
export async function extractSemantics(
  document: SourceDocument,
  _apiKey?: string
): Promise<ExtractionResult> {
  // TODO: Implement Claude API call with structured output
  // The prompt should ask Claude to:
  // 1. Identify entities (people, concepts, tools, places, projects)
  // 2. Extract themes with relevance scores
  // 3. Assess emotional tone (valence, arousal, dominant emotion)
  // 4. Detect cognitive patterns with evidence

  // Derive documentPeriod from adapter metadata when available.
  // Adapters (e.g. claude-code, codex) store firstMessage / lastMessage
  // timestamps in document.metadata; we use those to build the period.
  const documentPeriod = deriveDocumentPeriod(document);

  return ExtractionResultSchema.parse({
    sourceId: document.id,
    entities: [],
    themes: [],
    cognitivePatterns: [],
    ...(documentPeriod ? { documentPeriod } : {}),
    // Use the document's own start timestamp when available so that the
    // temporal stratification layer places this extraction correctly in time.
    timestamp: documentPeriod?.start ?? document.timestamp ?? new Date().toISOString(),
  });
}

/**
 * Attempt to derive a DocumentPeriod from a SourceDocument's metadata.
 *
 * Adapters that store `firstMessage` and `lastMessage` ISO strings in
 * `document.metadata` (e.g. claude-code, codex) will produce a valid period.
 * Returns null when the metadata does not contain usable timestamps.
 *
 * @param document - The source document to inspect
 * @returns A DocumentPeriod or null
 */
export function deriveDocumentPeriod(
  document: SourceDocument
): DocumentPeriod | null {
  const meta = document.metadata;
  if (!meta) return null;

  const rawStart =
    (meta["firstMessage"] as string | undefined) ??
    (meta["firstTimestamp"] as string | undefined) ??
    document.timestamp;

  const rawEnd =
    (meta["lastMessage"] as string | undefined) ??
    (meta["lastTimestamp"] as string | undefined) ??
    rawStart;

  if (!rawStart) return null;

  const start = new Date(rawStart);
  const end = new Date(rawEnd ?? rawStart);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

  // Ensure start <= end
  const [s, e] = start <= end ? [start, end] : [end, start];

  const durationDays = Math.max(
    0,
    Math.round((e!.getTime() - s!.getTime()) / 86_400_000)
  );

  return DocumentPeriodSchema.parse({
    start: s!.toISOString(),
    end: e!.toISOString(),
    durationDays,
  });
}

/**
 * Extract semantics from multiple documents in batch.
 * @param documents - Array of source documents
 * @param apiKey - Claude API key
 * @returns Array of extraction results
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
