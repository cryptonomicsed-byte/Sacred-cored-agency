import { GoogleGenAI } from '@google/genai';

export async function generateJingle(params: {
  prompt: string;
  companyName?: string;
  tone?: string;
  values?: string[];
  type: 'clip' | 'pro';
}): Promise<Buffer> {
  const model = params.type === 'pro'
    ? 'lyria-3-pro-preview'
    : 'lyria-3-clip-preview';

  const enhancedPrompt = params.companyName
    ? `${params.companyName} brand music. Tone: ${params.tone || 'professional'}. ${params.prompt}. Professional, brand-appropriate, instrumental.`
    : params.prompt;

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
  });

  const response = await ai.models.generateContent({
    model,
    contents: enhancedPrompt,
    config: {
      responseModalities: ['AUDIO', 'TEXT'],
    },
  });

  // CRITICAL: iterate all parts — audio is NOT always the first part
  const parts = response.candidates?.[0]?.content?.parts || [];

  let audioData: string | null = null;
  for (const part of parts) {
    if (part.inlineData?.mimeType?.startsWith('audio/')) {
      audioData = part.inlineData.data!;
      break;
    }
  }

  if (!audioData) {
    throw new Error('Lyria returned no audio');
  }

  return Buffer.from(audioData, 'base64');
}
