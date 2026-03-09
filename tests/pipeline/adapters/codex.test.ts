import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { codexAdapter } from "../../../src/pipeline/adapters/codex.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = readFileSync(
  resolve(__dirname, "../../fixtures/codex-sample.jsonl"),
  "utf-8"
);

describe("codexAdapter", () => {
  it("has correct id and sourceDir", () => {
    expect(codexAdapter.id).toBe("codex");
    expect(codexAdapter.sourceDir).toBe("codex");
  });

  it("canHandle files in codex/ directory with .jsonl extension", () => {
    expect(codexAdapter.canHandle("/sources/codex/session.jsonl")).toBe(true);
    expect(codexAdapter.canHandle("/sources/claude/session.jsonl")).toBe(false);
  });

  it("parses session JSONL with metadata", () => {
    const docs = codexAdapter.parse("/sources/codex/session-019cc546.jsonl", fixture);
    expect(docs).toHaveLength(1);
    expect(docs[0]!.metadata!["adapter"]).toBe("codex");
    expect(docs[0]!.metadata!["sessionId"]).toBe("019cc546");
    expect(docs[0]!.metadata!["messageCount"]).toBe(2);
    expect(docs[0]!.metadata!["cliVersion"]).toBe("0.111.0");
  });

  it("extracts conversation content without metadata", () => {
    const docs = codexAdapter.parse("/sources/codex/session.jsonl", fixture);
    const content = docs[0]!.content;
    expect(content).toContain("ottimizzare");
    expect(content).toContain("indice");
    expect(content).not.toContain("session_meta");
  });
});
