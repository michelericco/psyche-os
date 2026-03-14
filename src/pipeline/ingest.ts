import { z } from "zod";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { defaultRegistry } from "./adapters/index.js";

// ---------------------------------------------------------------------------
// Source Document schema
// ---------------------------------------------------------------------------

export const SourceDocumentSchema = z.object({
  id: z.string(),
  sourcePath: z.string(),
  sourceType: z.enum(["markdown", "json", "text", "unknown"]),
  sourceDir: z.string(),
  content: z.string(),
  timestamp: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type SourceDocument = z.infer<typeof SourceDocumentSchema>;

// ---------------------------------------------------------------------------
// Parser interface and registry
// ---------------------------------------------------------------------------

/** A parser transforms raw file content into a partial SourceDocument. */
interface Parser {
  readonly extensions: readonly string[];
  parse(content: string, filePath: string): Omit<SourceDocument, "id">;
}

/** Registry of parsers keyed by file extension. */
const parserRegistry = new Map<string, Parser>();

/**
 * Register a parser for its supported extensions.
 * @param parser - The parser to register
 */
export function registerParser(parser: Parser): void {
  for (const ext of parser.extensions) {
    parserRegistry.set(ext.toLowerCase(), parser);
  }
}

/**
 * Retrieve the parser for a given file extension.
 * @param ext - File extension including the dot (e.g. ".md")
 */
function getParser(ext: string): Parser | undefined {
  return parserRegistry.get(ext.toLowerCase());
}

// ---------------------------------------------------------------------------
// Built-in parsers
// ---------------------------------------------------------------------------

const markdownParser: Parser = {
  extensions: [".md", ".mdx"],
  parse(content, filePath) {
    return {
      sourcePath: filePath,
      sourceType: "markdown",
      sourceDir: path.basename(path.dirname(filePath)),
      content,
      metadata: { lineCount: content.split("\n").length },
    };
  },
};

const jsonParser: Parser = {
  extensions: [".json"],
  parse(content, filePath) {
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Store raw content if JSON is invalid
    }
    return {
      sourcePath: filePath,
      sourceType: "json",
      sourceDir: path.basename(path.dirname(filePath)),
      content: parsed !== null ? JSON.stringify(parsed, null, 2) : content,
      metadata: { validJson: parsed !== null },
    };
  },
};

const textParser: Parser = {
  extensions: [".txt", ".text", ".log"],
  parse(content, filePath) {
    return {
      sourcePath: filePath,
      sourceType: "text",
      sourceDir: path.basename(path.dirname(filePath)),
      content,
      metadata: { lineCount: content.split("\n").length },
    };
  },
};

const jsonlParser: Parser = {
  extensions: [".jsonl"],
  parse(content, filePath) {
    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    return {
      sourcePath: filePath,
      sourceType: "json",
      sourceDir: path.basename(path.dirname(filePath)),
      content,
      metadata: { entryCount: lines.length, format: "jsonl" },
    };
  },
};

const baseParser: Parser = {
  extensions: [".base"],
  parse(content, filePath) {
    return {
      sourcePath: filePath,
      sourceType: "text",
      sourceDir: path.basename(path.dirname(filePath)),
      content,
      metadata: { lineCount: content.split("\n").length },
    };
  },
};

// Register built-in parsers
registerParser(markdownParser);
registerParser(jsonParser);
registerParser(jsonlParser);
registerParser(textParser);
registerParser(baseParser);

// ---------------------------------------------------------------------------
// Discovery and ingestion
// ---------------------------------------------------------------------------

/** Known source directories in unified-memory. */
const SOURCE_DIRS = [
  "claude",
  "codex",
  "twitter",
  "youtube",
  "openclaw-local",
  "openclaw-m1",
] as const;

/**
 * Recursively walk a directory, resolving symlinks so that
 * symlinked subdirectories are traversed correctly.
 * Only follows symlinks whose resolved target falls within allowedBase,
 * to prevent traversal outside the intended sources directory.
 */
async function walkDir(dirPath: string, allowedBase: string): Promise<string[]> {
  const results: string[] = [];

  let resolvedPath: string;
  try {
    resolvedPath = await fs.realpath(dirPath);
  } catch {
    return results;
  }

  let names: string[];
  try {
    names = await fs.readdir(resolvedPath);
  } catch {
    return results;
  }

  for (const name of names) {
    const fullPath = path.join(resolvedPath, name);
    const stat = await fs.lstat(fullPath);
    const entry = { name, isFile: () => stat.isFile(), isDirectory: () => stat.isDirectory(), isSymbolicLink: () => stat.isSymbolicLink() };

    if (entry.isFile()) {
      results.push(fullPath);
    } else if (entry.isDirectory()) {
      const nested = await walkDir(fullPath, allowedBase);
      results.push(...nested);
    } else if (entry.isSymbolicLink()) {
      // Resolve symlink and reject targets outside the allowed base
      try {
        const realTarget = await fs.realpath(fullPath);
        if (realTarget !== allowedBase && !realTarget.startsWith(allowedBase + path.sep)) {
          console.warn(`[ingest] Symlink rejected (outside base): ${fullPath} → ${realTarget}`);
          continue;
        }
        const stat = await fs.stat(realTarget);
        if (stat.isFile()) {
          results.push(realTarget);
        } else if (stat.isDirectory()) {
          const nested = await walkDir(realTarget, allowedBase);
          results.push(...nested);
        }
      } catch {
        // Broken symlink; skip
      }
    }
  }

  return results;
}

/**
 * Discover all ingestible files within a base sources directory.
 * Scans known subdirectories for supported file types.
 * Follows symlinks only when their resolved target stays within basePath.
 * @param basePath - Root path to the sources directory
 * @returns Array of absolute file paths
 */
export async function discoverSources(basePath: string): Promise<string[]> {
  const discovered: string[] = [];

  // Resolve once so symlink boundary checks use canonical paths.
  let resolvedBase: string;
  try {
    resolvedBase = await fs.realpath(basePath);
  } catch {
    return discovered;
  }

  for (const dir of SOURCE_DIRS) {
    const dirPath = path.join(resolvedBase, dir);
    const files = await walkDir(dirPath, resolvedBase);
    discovered.push(...files);
  }

  return discovered;
}

/**
 * Ingest a single file into SourceDocument(s).
 * Tries source-aware adapters first, falls back to generic parsers.
 * @param filePath - Absolute path to the file
 * @returns Array of validated SourceDocuments
 */
export async function ingestFile(filePath: string): Promise<SourceDocument[]> {
  const raw = await fs.readFile(filePath, "utf-8");

  // Try source-aware adapter first
  const adapter = defaultRegistry.findAdapter(filePath);
  if (adapter) {
    return adapter.parse(filePath, raw);
  }

  // Fall back to generic parser
  const ext = path.extname(filePath);
  const parser = getParser(ext);
  const id = `src_${path.basename(filePath, ext)}_${Date.now()}`;

  if (parser) {
    const partial = parser.parse(raw, filePath);
    return [SourceDocumentSchema.parse({ id, ...partial })];
  }

  return [
    SourceDocumentSchema.parse({
      id,
      sourcePath: filePath,
      sourceType: "unknown",
      sourceDir: path.basename(path.dirname(filePath)),
      content: raw,
    }),
  ];
}

/**
 * Ingest all files from the sources directory.
 * @param basePath - Root path to the sources directory
 * @returns Array of validated SourceDocuments
 */
export async function ingestAll(basePath: string): Promise<SourceDocument[]> {
  const files = await discoverSources(basePath);
  const results: SourceDocument[] = [];
  const errors: Array<{ file: string; error: string }> = [];

  for (const file of files) {
    try {
      const docs = await ingestFile(file);
      results.push(...docs);
    } catch (err) {
      errors.push({
        file,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (errors.length > 0) {
    console.error(
      `[ingest] Failed to process ${errors.length} file(s):`,
      errors
    );
  }

  return results;
}
