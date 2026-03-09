import { describe, it, expect } from "vitest";
import { ingestAll } from "../../src/pipeline/ingest.js";
import * as path from "node:path";
import * as fs from "node:fs/promises";

const SOURCES_PATH = path.resolve(
  import.meta.dirname ?? ".",
  "..",
  "..",
  "..",
  "sources"
);

describe("E2E: real sources ingestion", () => {
  it("sources directory exists and is accessible", async () => {
    const stat = await fs.stat(SOURCES_PATH);
    expect(stat.isDirectory()).toBe(true);
  });

  it("ingests all real sources with adapter metadata", async () => {
    const docs = await ingestAll(SOURCES_PATH);

    expect(docs.length).toBeGreaterThan(100);

    // Group by adapter
    const byAdapter: Record<string, number> = {};
    const bySourceDir: Record<string, number> = {};
    for (const doc of docs) {
      const adapter =
        (doc.metadata?.["adapter"] as string) ?? "generic-fallback";
      byAdapter[adapter] = (byAdapter[adapter] ?? 0) + 1;
      bySourceDir[doc.sourceDir] = (bySourceDir[doc.sourceDir] ?? 0) + 1;
    }

    console.log("\n=== Documents by Adapter ===");
    for (const [k, v] of Object.entries(byAdapter).sort(
      (a, b) => b[1] - a[1]
    )) {
      console.log(`  ${k}: ${v}`);
    }

    console.log("\n=== Documents by Source Dir ===");
    for (const [k, v] of Object.entries(bySourceDir).sort(
      (a, b) => b[1] - a[1]
    )) {
      console.log(`  ${k}: ${v}`);
    }

    // Verify adapters are actually being used (not all generic)
    const adapterNames = Object.keys(byAdapter);
    expect(adapterNames).toContain("claude-code");
    expect(adapterNames).toContain("twitter");
    expect(adapterNames).toContain("youtube");
    expect(adapterNames).toContain("openclaw");
  });

  it("every document passes Zod validation", async () => {
    const docs = await ingestAll(SOURCES_PATH);

    for (const doc of docs) {
      expect(doc.id).toBeTruthy();
      expect(doc.sourcePath).toBeTruthy();
      expect(["markdown", "json", "text", "unknown"]).toContain(
        doc.sourceType
      );
      expect(doc.sourceDir).toBeTruthy();
      expect(doc.content.length).toBeGreaterThan(0);
    }
  });

  it("adapter-processed docs have enriched metadata", async () => {
    const docs = await ingestAll(SOURCES_PATH);

    const adapterDocs = docs.filter((d) => d.metadata?.["adapter"]);

    expect(adapterDocs.length).toBeGreaterThan(0);

    for (const doc of adapterDocs) {
      expect(doc.metadata).toBeDefined();
      expect(doc.metadata!["adapter"]).toBeTruthy();
    }

    // Claude Code docs should have sessionId
    const claudeDocs = adapterDocs.filter(
      (d) => d.metadata?.["adapter"] === "claude-code"
    );
    for (const doc of claudeDocs) {
      expect(doc.metadata!["sessionId"]).toBeTruthy();
      expect(doc.metadata!["messageCount"]).toBeDefined();
    }

    // Twitter docs should have bookmarkCount
    const twitterDocs = adapterDocs.filter(
      (d) => d.metadata?.["adapter"] === "twitter"
    );
    for (const doc of twitterDocs) {
      expect(doc.metadata!["bookmarkCount"]).toBeDefined();
    }

    // OpenClaw docs should have headings
    const openclawDocs = adapterDocs.filter(
      (d) => d.metadata?.["adapter"] === "openclaw"
    );
    for (const doc of openclawDocs) {
      expect(doc.metadata!["headings"]).toBeDefined();
      expect(doc.metadata!["variant"]).toBeTruthy();
    }
  });

  it("prints sample document per adapter for review", async () => {
    const docs = await ingestAll(SOURCES_PATH);

    const seen = new Set<string>();
    console.log("\n=== Sample per Adapter ===");
    for (const doc of docs) {
      const adapter =
        (doc.metadata?.["adapter"] as string) ?? "generic-fallback";
      if (!seen.has(adapter)) {
        seen.add(adapter);
        console.log(`\n[${adapter}] ${doc.sourcePath}`);
        console.log(
          `  sourceType: ${doc.sourceType}, sourceDir: ${doc.sourceDir}`
        );
        console.log(`  content: ${doc.content.length} chars`);
        const safeMeta = { ...doc.metadata };
        delete safeMeta["firstMessage"];
        delete safeMeta["lastMessage"];
        console.log(`  metadata: ${JSON.stringify(safeMeta)}`);
        console.log(
          `  preview: ${doc.content.slice(0, 120).replace(/\n/g, " ")}...`
        );
      }
    }
  });
});
