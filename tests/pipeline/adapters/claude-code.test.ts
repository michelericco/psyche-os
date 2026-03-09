import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { claudeCodeAdapter } from "../../../src/pipeline/adapters/claude-code.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = readFileSync(
  resolve(__dirname, "../../fixtures/claude-code-sample.jsonl"),
  "utf-8"
);

describe("claudeCodeAdapter", () => {
  it("has correct id and sourceDir", () => {
    expect(claudeCodeAdapter.id).toBe("claude-code");
    expect(claudeCodeAdapter.sourceDir).toBe("claude");
  });

  it("canHandle files in claude/ directory with .jsonl extension", () => {
    expect(claudeCodeAdapter.canHandle("/sources/claude/session.jsonl")).toBe(true);
    expect(claudeCodeAdapter.canHandle("/sources/codex/session.jsonl")).toBe(false);
    expect(claudeCodeAdapter.canHandle("/sources/claude/readme.md")).toBe(false);
  });

  it("parses JSONL into SourceDocuments with session metadata", () => {
    const docs = claudeCodeAdapter.parse("/sources/claude/abc-123.jsonl", fixture);
    expect(docs).toHaveLength(1);
    expect(docs[0]!.sourceDir).toBe("claude");
    expect(docs[0]!.sourceType).toBe("json");
    expect(docs[0]!.metadata).toBeDefined();
    expect(docs[0]!.metadata!["adapter"]).toBe("claude-code");
    expect(docs[0]!.metadata!["sessionId"]).toBe("abc-123");
    expect(docs[0]!.metadata!["messageCount"]).toBe(2);
    expect(docs[0]!.timestamp).toBe("2026-03-08T12:22:42.404Z");
  });

  it("extracts conversation text content only", () => {
    const docs = claudeCodeAdapter.parse("/sources/claude/abc-123.jsonl", fixture);
    const content = docs[0]!.content;
    expect(content).toContain("pattern adapter");
    expect(content).not.toContain("hook_progress");
  });
});
