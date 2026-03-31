
export interface ProviderStatus {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'down' | 'unauthorized' | 'quota_exceeded';
  latency: number;
}

export const healthCheckService = {
  async checkGemini(): Promise<ProviderStatus> {
    const start = Date.now();
    try {
      // We check our own server's health which proxies to Gemini
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error();
      return { id: 'gemini', name: 'Google Gemini', status: 'operational', latency: Date.now() - start };
    } catch {
      return { id: 'gemini', name: 'Google Gemini', status: 'down', latency: 0 };
    }
  }
};
