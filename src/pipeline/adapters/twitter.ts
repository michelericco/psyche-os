import * as path from "node:path";
import { SourceDocumentSchema } from "../ingest.js";
import type { SourceAdapter } from "./types.js";

export const twitterAdapter: SourceAdapter = {
  id: "twitter",
  label: "Twitter/X Bookmarks",
  sourceDir: "twitter",
  filePatterns: ["*.md"],

  canHandle(filePath: string): boolean {
    const parts = filePath.split(path.sep);
    return parts.includes("twitter") && filePath.endsWith(".md");
  },

  parse(filePath: string, raw: string) {
    const bookmarkPattern = /^- \[.+?\]\(https?:\/\/.+?\)/gm;
    const topicPattern = /^## (.+?) \((\d+) bookmarks?\)/gm;

    const bookmarks = raw.match(bookmarkPattern) ?? [];
    const topics: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = topicPattern.exec(raw)) !== null) {
      topics.push(match[1]!);
    }

    const id = `twitter_${path.basename(filePath, ".md")}_${Date.now()}`;

    return [
      SourceDocumentSchema.parse({
        id,
        sourcePath: filePath,
        sourceType: "markdown",
        sourceDir: "twitter",
        content: raw,
        metadata: {
          adapter: "twitter",
          bookmarkCount: bookmarks.length,
          topics,
          fileName: path.basename(filePath),
        },
      }),
    ];
  },
};
