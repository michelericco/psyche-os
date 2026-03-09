import type { SourceAdapter } from "./types.js";

/**
 * Registry that routes files to the correct source adapter
 * based on canHandle() checks.
 */
export class AdapterRegistry {
  private readonly adapters: SourceAdapter[] = [];

  register(adapter: SourceAdapter): void {
    this.adapters.push(adapter);
  }

  findAdapter(filePath: string): SourceAdapter | undefined {
    return this.adapters.find((a) => a.canHandle(filePath));
  }

  all(): readonly SourceAdapter[] {
    return this.adapters;
  }
}
