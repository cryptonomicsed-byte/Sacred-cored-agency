
import { universalAiService } from "./universalAiService";

interface GenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Inference Engine Router
 * Routes prompts to the appropriate decoding strategy via universalAiService.
 * Respects global provider settings (OpenAI, Anthropic, Gemini, etc.)
 */
export const inferenceRouter = {
  
  /**
   * Standard fast generation (Direct Shot)
   */
  generateFast: async (prompt: string, options?: GenerationOptions) => {
    return await universalAiService.generateText({
      prompt,
      featureId: 'inference-fast'
    });
  },

  /**
   * Chain of Thought (CoT) - Forces the model to think step-by-step
   */
  generateWithReasoning: async (prompt: string) => {
    const reasoningPrompt = `
      Question: ${prompt}
      
      Let's think step by step.
      1. Analyze the user's intent.
      2. Break down the constraints.
      3. Formulate a solution.
      4. Review the solution for errors.
      
      Answer:
    `;

    return await universalAiService.generateText({
      prompt: reasoningPrompt,
      featureId: 'inference-reasoning'
    });
  },

  /**
   * Chain of Verification (CoVe) - Generates, then questions, then revises.
   */
  generateWithVerification: async (prompt: string) => {
    // 1. Baseline Generation
    const baselineText = await universalAiService.generateText({
      prompt,
      featureId: 'inference-verification-base'
    });

    // 2. Verification Questions
    const verificationText = await universalAiService.generateText({
      prompt: `
        Fact check this text: "${baselineText}"
        Identify potential hallucinations, logical errors, or brand inconsistencies.
        Output ONLY a list of specific errors or "No errors found".
      `,
      featureId: 'inference-verification-check'
    });

    if (verificationText.toLowerCase().includes("no errors found")) {
      return baselineText;
    }

    // 3. Final Revision
    return await universalAiService.generateText({
      prompt: `
        Original Prompt: ${prompt}
        Draft: "${baselineText}"
        Critique: "${verificationText}"
        
        Rewrite the draft to address the critique perfectly.
      `,
      featureId: 'inference-verification-final'
    });
  },

  /**
   * Self-Consistency - Generates multiple paths and selects best consensus.
   */
  generateSelfConsistency: async (prompt: string, samples = 2) => {
    const promises = Array(samples).fill(null).map((_, i) => 
      universalAiService.generateText({
        prompt: `${prompt} (Variation ${i+1})`,
        featureId: `inference-selfconsist-${i}`
      })
    );

    const texts = await Promise.all(promises);

    const selectorPrompt = `
      I have generated ${samples} variations for this prompt: "${prompt}"
      
      Option 1: ${texts[0]}
      Option 2: ${texts[1]}
      
      Select the best, most accurate option. Return ONLY the text of the best option.
    `;

    return await universalAiService.generateText({
      prompt: selectorPrompt,
      featureId: 'inference-selfconsist-final'
    });
  }
};
