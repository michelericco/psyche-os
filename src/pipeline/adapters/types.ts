import type { SourceDocument } from "../ingest.js";

/**
 * A source adapter understands the semantics of a specific data source.
 * Unlike generic file parsers, adapters extract meaningful metadata
 * (session IDs, message counts, timestamps, topics) from the raw content.
 */
export interface SourceAdapter {
  /** Unique adapter identifier, e.g. "claude-code" */
  readonly id: string;
  /** Human-readable label, e.g. "Claude Code Sessions" */
  readonly label: string;
  /** Directory name this adapter handles, e.g. "claude" */
  readonly sourceDir: string;
  /** Glob patterns for matching files, e.g. ["*.jsonl"] */
  readonly filePatterns: readonly string[];
  /** Quick check: can this adapter handle the given file path? */
  canHandle(filePath: string): boolean;
  /** Parse raw file content into validated SourceDocuments. Pure function. */
  parse(filePath: string, raw: string): SourceDocument[];
}
