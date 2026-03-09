import * as path from "node:path";
import { SourceDocumentSchema } from "../ingest.js";
import type { SourceAdapter } from "./types.js";

interface ClaudeCodeEntry {
  type?: string;
  sessionId?: string;
  timestamp?: string;
  message?: {
    role?: string;
    content?: Array<{ type?: string; text?: string }> | string;
  };
}

function extractTextContent(
  content: Array<{ type?: string; text?: string }> | string | undefined
): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text!)
    .join("\n");
}

export const claudeCodeAdapter: SourceAdapter = {
  id: "claude-code",
  label: "Claude Code Sessions",
  sourceDir: "claude",
  filePatterns: ["*.jsonl"],

  canHandle(filePath: string): boolean {
    const parts = filePath.split(path.sep);
    const dirIndex = parts.findIndex((p) => p === "claude");
    return dirIndex !== -1 && filePath.endsWith(".jsonl");
  },

  parse(filePath: string, raw: string) {
    const lines = raw.split("\n").filter((l) => l.trim().length > 0);
    const entries: ClaudeCodeEntry[] = [];

    for (const line of lines) {
      try {
        entries.push(JSON.parse(line) as ClaudeCodeEntry);
      } catch {
        // skip malformed lines
      }
    }

    const messages = entries.filter(
      (e) => e.type === "user" || e.type === "assistant"
    );

    if (messages.length === 0) return [];

    const sessionId =
      messages[0]?.sessionId ?? path.basename(filePath, ".jsonl");

    const conversationText = messages
      .map((m) => {
        const role = m.message?.role ?? m.type ?? "unknown";
        const text = extractTextContent(m.message?.content);
        return `[${role}] ${text}`;
      })
      .join("\n\n");

    const timestamps = messages
      .map((m) => m.timestamp)
      .filter((t): t is string => t !== undefined)
      .sort();

    const id = `claude-code_${sessionId}_${Date.now()}`;

    return [
      SourceDocumentSchema.parse({
        id,
        sourcePath: filePath,
        sourceType: "json",
        sourceDir: "claude",
        content: conversationText,
        timestamp: timestamps[0],
        metadata: {
          adapter: "claude-code",
          sessionId,
          messageCount: messages.length,
          firstMessage: timestamps[0],
          lastMessage: timestamps[timestamps.length - 1],
        },
      }),
    ];
  },
};
