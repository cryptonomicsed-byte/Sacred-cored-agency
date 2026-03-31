
/**
 * Neural Cache Service
 * Prevents API spam and token waste by storing prompt/response pairs.
 */
interface CacheEntry {
  response: string;
  timestamp: number;
  configHash: string;
}

class NeuralCache {
  private cache: Map<string, CacheEntry> = new Map();
  private MAX_AGE = 1000 * 60 * 60; // 1 Hour

  /**
   * Fast, Unicode-safe string hashing (cyrb53)
   * Replaces btoa() which fails on non-Latin1 characters.
   */
  private generateHash(prompt: string, config: any): string {
    const str = prompt + JSON.stringify(config);
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }

  public get(prompt: string, config: any): string | null {
    const hash = this.generateHash(prompt, config);
    const entry = this.cache.get(hash);

    if (entry && (Date.now() - entry.timestamp < this.MAX_AGE)) {
      console.log(`[Neural Cache] HIT: Serving cached response for key ${hash}`);
      return entry.response;
    }
    return null;
  }

  public set(prompt: string, config: any, response: string): void {
    const hash = this.generateHash(prompt, config);
    this.cache.set(hash, {
      response,
      timestamp: Date.now(),
      configHash: hash
    });
    
    // Prune old entries if cache grows too large
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const neuralCache = new NeuralCache();
