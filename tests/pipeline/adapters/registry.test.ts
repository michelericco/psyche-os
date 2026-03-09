import { describe, it, expect } from "vitest";
import { AdapterRegistry } from "../../../src/pipeline/adapters/registry.js";
import type { SourceAdapter } from "../../../src/pipeline/adapters/types.js";

const stubAdapter: SourceAdapter = {
  id: "test-adapter",
  label: "Test Adapter",
  sourceDir: "test-source",
  filePatterns: ["*.jsonl"],
  canHandle(filePath) {
    return filePath.includes("/test-source/") && filePath.endsWith(".jsonl");
  },
  parse(_filePath, raw) {
    return [
      {
        id: "test-1",
        sourcePath: _filePath,
        sourceType: "json",
        sourceDir: "test-source",
        content: raw,
        metadata: { adapter: "test-adapter" },
      },
    ];
  },
};

describe("AdapterRegistry", () => {
  it("registers and retrieves an adapter by sourceDir", () => {
    const registry = new AdapterRegistry();
    registry.register(stubAdapter);
    const found = registry.findAdapter("/sources/test-source/data.jsonl");
    expect(found).toBe(stubAdapter);
  });

  it("returns undefined for unknown paths", () => {
    const registry = new AdapterRegistry();
    registry.register(stubAdapter);
    const found = registry.findAdapter("/sources/unknown/file.md");
    expect(found).toBeUndefined();
  });

  it("lists all registered adapters", () => {
    const registry = new AdapterRegistry();
    registry.register(stubAdapter);
    expect(registry.all()).toHaveLength(1);
    expect(registry.all()[0]!.id).toBe("test-adapter");
  });
});
