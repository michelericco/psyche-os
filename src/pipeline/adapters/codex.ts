import * as path from "node:path";
import { SourceDocumentSchema } from "../ingest.js";
import type { SourceAdapter } from "./types.js";

interface CodexPayload {
  id?: string;
  cwd?: string;
  timestamp?: string;
  cli_version?: string;
  type?: string;
  role?: string;
  content?: Array<{ type?: string; text?: string }>;
  message?: string;
}

interface CodexEntry {
  type?: string;
  timestamp?: string;
  payload?: CodexPayload;
  // Legacy flat format (from fixture/simple sessions)
  role?: string;
  content?: string;
}

function isMessage(entry: CodexEntry): boolean {
  // Real format: response_item with payload.type === "message"
  if (
    entry.type === "response_item" &&
    entry.payload?.type === "message" &&
    (entry.payload.role === "user" || entry.payload.role === "assistant")
  ) {
    return true;
  }
  // Legacy/simple format: type === "message" with direct role/content
  if (entry.type === "message" && entry.content) {
    return true;
  }
  return false;
}

function extractRole(entry: CodexEntry): string {
  return entry.payload?.role ?? entry.role ?? "unknown";
}

function extractText(entry: CodexEntry): string {
  // Real format: payload.content is array of { type, text }
  const payloadContent = entry.payload?.content;
  if (Array.isArray(payloadContent)) {
    return payloadContent
      .filter((block) => block.text)
      .map((block) => block.text!)
      .join("\n");
  }
  // Legacy flat format
  if (typeof entry.content === "string") return entry.content;
  return "";
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

    const metaEntry = entries.find((e) => e.type === "session_meta");
    const meta = metaEntry?.payload;
    const messages = entries.filter(isMessage);

    if (messages.length === 0) return [];

    const conversationText = messages
      .map((m) => {
        const role = extractRole(m);
        const text = extractText(m);
        return `[${role}] ${text}`;
      })
      .filter((line) => line.length > 12) // skip empty messages
      .join("\n\n");

    if (conversationText.trim().length === 0) return [];

    const sessionId = meta?.id ?? path.basename(filePath, ".jsonl");

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
          cwd: meta?.cwd,
          cliVersion: meta?.cli_version,
          firstMessage: timestamps[0],
          lastMessage: timestamps[timestamps.length - 1],
        },
      }),
    ];
  },
};
