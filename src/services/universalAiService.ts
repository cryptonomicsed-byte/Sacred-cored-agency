
import { useStore } from "../store";
import { neuralCache } from "./neuralCache";
import { GoogleGenAI } from "@google/genai";

export interface TextGenerationParams {
  systemInstruction?: string;
  prompt: string;
  responseMimeType?: string;
  responseSchema?: any;
  featureId?: string;
  bypassCache?: boolean;
  tools?: any[];
  modelOverride?: string;
}

export class AiServiceError extends Error {
  constructor(public message: string, public code?: string | number, public status?: string) {
    super(message);
    this.name = 'AiServiceError';
  }
}

/**
 * Robustly repairs truncated JSON by balancing braces and brackets.
 * Essential for models that hit token limits or cut off mid-response.
 */
const repairTruncatedJson = (json: string): string => {
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < json.length; i++) {
    const char = json[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') openBraces++;
      else if (char === '}') openBraces--;
      else if (char === '[') openBrackets++;
      else if (char === ']') openBrackets--;
    }
  }

  let repaired = json.trim();
  // If we're stuck inside a string, close it
  if (inString) repaired += '"';
  
  // Close open brackets and braces in reverse order
  while (openBrackets > 0) {
    repaired += ']';
    openBrackets--;
  }
  while (openBraces > 0) {
    repaired += '}';
    openBraces--;
  }
  
  return repaired;
};

/**
 * Robust JSON extraction for noisy LLM outputs
 */
const cleanJsonResponse = (text: string): string => {
  if (!text) return '{}';
  
  // Remove markdown code blocks
  const cleaned = text.replace(/```json\n?|```\n?/gi, '').trim();
  
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  
  let start = -1;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket;
  }

  if (start !== -1) {
    const candidate = cleaned.substring(start);
    return repairTruncatedJson(candidate);
  }

  return cleaned.startsWith('{') || cleaned.startsWith('[') ? repairTruncatedJson(cleaned) : '{}';
};

export const universalAiService = {
  async generateText(params: TextGenerationParams): Promise<string> {
    const { providers, tokens, deductTokens, customGeminiKey } = useStore.getState();
    const { activeLLM } = providers;
    
    if (!params.bypassCache) {
      const cached = neuralCache.get(params.prompt, { activeLLM, sys: params.systemInstruction });
      if (cached) return cached;
    }

    // --- Direct Client-Side Inference ---
    const apiKey = customGeminiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new AiServiceError("Gemini API key not found. Please provide a custom key in settings.", "AUTH_ERROR");
    }

    if (tokens < 1) {
      throw new AiServiceError("Insufficient tokens. Please top up.", "QUOTA_EXCEEDED");
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContent({
        model: params.modelOverride || 'gemini-3-flash-preview',
        contents: params.prompt,
        config: {
          systemInstruction: params.systemInstruction,
          responseMimeType: params.responseMimeType,
          responseSchema: params.responseSchema,
          temperature: 0.2,
        }
      });

      let processedResult = result.text || '';
      
      if (params.responseMimeType === 'application/json') {
        processedResult = cleanJsonResponse(processedResult);
        try {
          JSON.parse(processedResult);
        } catch (e) {
          console.warn("[AI Service] Initial JSON parse failed, attempting repair...");
          processedResult = repairTruncatedJson(processedResult);
          try {
            JSON.parse(processedResult);
          } catch (e2) {
            console.error("[AI Service] JSON repair failed, returning raw text with fallback flag");
            return params.featureId ? "FALLBACK_TRIGGERED" : "{}";
          }
        }
      }

      if (!params.bypassCache && processedResult !== "FALLBACK_TRIGGERED") {
        neuralCache.set(params.prompt, { activeLLM, sys: params.systemInstruction }, processedResult);
      }

      deductTokens(1);
      return processedResult;
    } catch (error: any) {
      console.error("[AI Service] Generation error:", error);
      const msg = error.message || String(error);
      const isQuota = /429|quota|limit|balance|insufficient|RESOURCE_EXHAUSTED/i.test(msg);
      if (isQuota && params.featureId) return "FALLBACK_TRIGGERED";
      if (isQuota) throw new AiServiceError(`Neural Quota Exhausted for ${activeLLM}.`, "QUOTA_EXCEEDED");
      throw new AiServiceError(msg);
    }
  },

  async generateImage(prompt: string): Promise<string> {
    const { tokens, deductTokens, customGeminiKey } = useStore.getState();
    
    const apiKey = customGeminiKey || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("Gemini API key not found. Please provide a custom key in settings.");
    }

    if (tokens < 10) {
      throw new Error("Insufficient tokens for image generation (10 tokens required).");
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({ 
        model: 'gemini-2.5-flash-image', 
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      });

      let imageData = null;
      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageData = { mimeType: part.inlineData.mimeType, data: part.inlineData.data };
            break;
          }
        }
      }
      
      if (imageData) {
        deductTokens(10);
        return `data:${imageData.mimeType};base64,${imageData.data}`;
      }
      
      throw new Error("No image data found in response");
    } catch (e: any) {
      console.error("Image generation failed:", e);
      return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80";
    }
  }
};
