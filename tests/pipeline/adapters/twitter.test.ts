import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { twitterAdapter } from "../../../src/pipeline/adapters/twitter.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = readFileSync(
  resolve(__dirname, "../../fixtures/twitter-bookmarks-sample.md"),
  "utf-8"
);

describe("twitterAdapter", () => {
  it("has correct id and sourceDir", () => {
    expect(twitterAdapter.id).toBe("twitter");
    expect(twitterAdapter.sourceDir).toBe("twitter");
  });

  it("canHandle markdown files in twitter/ directory", () => {
    expect(twitterAdapter.canHandle("/sources/twitter/bookmarks-by-topic.md")).toBe(true);
    expect(twitterAdapter.canHandle("/sources/twitter/process_bookmarks.py")).toBe(false);
    expect(twitterAdapter.canHandle("/sources/youtube/playlists.md")).toBe(false);
  });

  it("parses bookmarks with topic and count metadata", () => {
    const docs = twitterAdapter.parse("/sources/twitter/bookmarks-by-topic.md", fixture);
    expect(docs).toHaveLength(1);
    expect(docs[0]!.metadata!["adapter"]).toBe("twitter");
    expect(docs[0]!.metadata!["bookmarkCount"]).toBe(5);
    expect(docs[0]!.metadata!["topics"]).toEqual(["AI/ML", "Philosophy"]);
  });

  it("preserves readable content", () => {
    const docs = twitterAdapter.parse("/sources/twitter/bookmarks-by-topic.md", fixture);
    expect(docs[0]!.content).toContain("multi-agent architectures");
    expect(docs[0]!.content).toContain("Baudrillard");
  });
});
