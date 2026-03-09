import * as path from "node:path";
import { SourceDocumentSchema } from "../ingest.js";
import type { SourceAdapter } from "./types.js";

interface CodexEntry {
  type?: string;
  timestamp?: string;
  role?: string;
  content?: string;
  payload?: {
    id?: string;
    cwd?: string;
    timestamp?: string;
    cli_version?: string;
    originator?: string;
  };
}

export const codexAdapter: SourceAdapter = {
  id: "codex",
  label: "Codex CLI Sessions",
  sourceDir: "codex",
  filePatterns: ["*.jsonl"],

  canHandle(filePath: string): boolean {
    const parts = filePath.split(path.sep);
    return parts.includes("codex") && filePath.endsWith(".jsonl");
  },

  parse(filePath: string, raw: string) {
    const lines = raw.split("\n").filter((l) => l.trim().length > 0);
    const entries: CodexEntry[] = [];

    for (const line of lines) {
      try {
        entries.push(JSON.parse(line) as CodexEntry);
      } catch {
        // skip malformed lines
      }
    }

    const meta = entries.find((e) => e.type === "session_meta");
    const messages = entries.filter((e) => e.type === "message" && e.content);

    if (messages.length === 0) return [];

    const sessionId = meta?.payload?.id ?? path.basename(filePath, ".jsonl");

    const conversationText = messages
      .map((m) => `[${m.role ?? "unknown"}] ${m.content ?? ""}`)
      .join("\n\n");

    const timestamps = entries
      .map((e) => e.timestamp ?? e.payload?.timestamp)
      .filter((t): t is string => t !== undefined)
      .sort();

    const id = `codex_${sessionId}_${Date.now()}`;

    return [
      SourceDocumentSchema.parse({
        id,
        sourcePath: filePath,
        sourceType: "json",
        sourceDir: "codex",
        content: conversationText,
        timestamp: timestamps[0],
        metadata: {
          adapter: "codex",
          sessionId,
          messageCount: messages.length,
          cwd: meta?.payload?.cwd,
          cliVersion: meta?.payload?.cli_version,
          firstMessage: timestamps[0],
          lastMessage: timestamps[timestamps.length - 1],
        },
      }),
    ];
  },
};
