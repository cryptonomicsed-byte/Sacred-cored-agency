
import { VideoEngine, UserTier, VideoJob } from "../types";
import { useStore } from "../store";

// Helper for calculating costs
export const getEngineCost = (engine: VideoEngine, tier: UserTier): number => {
  if (tier === 'agency') return 0; // Unlimited
  return 50; // 50 tokens for video
};

export const checkVideoLimits = (tier: UserTier, currentJobs: VideoJob[], engine: VideoEngine): { allowed: boolean; reason?: string } => {
  const monthlyCount = currentJobs.length; 
  
  if (tier === 'free') {
    if (monthlyCount >= 5) return { allowed: false, reason: "Free tier limit reached (5/mo)." };
  }
  
  if (tier === 'pro') {
    if (monthlyCount >= 50) return { allowed: false, reason: "Pro tier limit reached (50/mo)." };
  }

  return { allowed: true };
};

// --- Generation Logic ---

export const generateVideo = async (
  prompt: string, 
  engine: VideoEngine,
  onComplete: (url: string) => void
): Promise<void> => {
  const { tokens, deductTokens, customGeminiKey } = useStore.getState();

  if (!customGeminiKey && tokens < 50) {
    throw new Error("Insufficient tokens for video generation (50 tokens required).");
  }

  try {
    const response = await fetch('/api/ai/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, customKey: customGeminiKey }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Video generation failed");
    }

    const data = await response.json();
    
    if (!customGeminiKey) {
      deductTokens(data.tokensConsumed || 50);
    }
    
    // Simulation of polling for frontend UX
    onComplete("https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4");
  } catch (e) {
    console.error("Video Generation Error", e);
    throw e;
  }
};
