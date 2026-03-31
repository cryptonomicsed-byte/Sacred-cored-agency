
import { universalAiService } from "./universalAiService";

/**
 * Strategy Executor
 * Performs a high-fidelity single-shot analysis.
 * Removed recursive phases to prevent token truncation.
 */
export const executeRLMAnalysis = async (
  prompt: string, 
  onStep?: (step: string) => void
): Promise<string> => {
  
  if (onStep) onStep("Synthesizing Single-Shot Intelligence...");
  
  // Single pass synthesis for maximum reliability
  return await universalAiService.generateText({
    prompt: `Act as a Senior Strategist. Complete the following task in a single, high-fidelity response. 
    Ensure the JSON is complete and valid. 
    Task: ${prompt}`,
    responseMimeType: 'application/json',
    featureId: 'direct-synthesis'
  });
};
