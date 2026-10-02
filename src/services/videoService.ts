
import { VideoEngine, UserTier, VideoJob } from "../types";
import { useStore } from "../store";
import { useTokenStore } from "../store/tokenStore";
import { TOKEN_COSTS } from "../lib/tokenCosts";
import { auth } from "../firebase";

// Helper for calculating costs
export const getEngineCost = (engine: VideoEngine, tier: UserTier): number => {
  if (tier === 'agency') return 0; // Unlimited
  return TOKEN_COSTS.VOICE_GENERATION;
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
  const { customGeminiKey } = useStore.getState();
  const { balance, deductOptimistic, rollback } = useTokenStore.getState();
  const cost = TOKEN_COSTS.VOICE_GENERATION;

  if (!customGeminiKey && balance < cost) {
    throw new Error(`Insufficient tokens for video generation (${cost} tokens required).`);
  }

  if (!customGeminiKey) {
    deductOptimistic(cost);
  }

  try {
    const user = auth.currentUser;
    const idToken = user ? await user.getIdToken() : null;

    const response = await fetch('/api/ai/generate-video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({ prompt, customKey: customGeminiKey }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Video generation failed");
    }

    const data = await response.json();

    if (data.tokensRemaining !== undefined) {
      useTokenStore.getState().setBalance(data.tokensRemaining);
      useStore.setState({ tokens: data.tokensRemaining });
    }

    // Simulation of polling for frontend UX
    onComplete("https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4");
  } catch (e) {
    if (!customGeminiKey) {
      rollback(cost);
    }
    console.error("Video Generation Error", e);
    throw e;
  }
};
