
import { BrandDNA } from "../types";
import { executeRLMAnalysis } from "./rlmService";
import { scrapeWebsite, ScrapedData } from "./scraperService";
import { universalAiService } from "./universalAiService";

export const enhanceBrandExtraction = async (
  url: string, 
  description: string,
  onProgress?: (status: string) => void
): Promise<BrandDNA> => {
  
  if (onProgress) onProgress("Deploying Scraper Bots...");
  
  let scrapedData: ScrapedData | null = null;
  let scrapeContext = "";

  try {
    scrapedData = await scrapeWebsite(url);
    if (onProgress) onProgress("Parsing HTML DOM...");
    
    scrapeContext = `
      LIVE WEBSITE DATA:
      - Title: "${scrapedData.title}"
      - Meta: "${scrapedData.metaDescription}"
      - Context: ${scrapedData.bodyText.substring(0, 1000)}
    `;
  } catch (e) {
    console.warn("Scraping failed, falling back to AI knowledge", e);
    if (onProgress) onProgress("Scraping blocked. Falling back to Neural Memory...");
    scrapeContext = "Direct scraping failed. Use internal model knowledge.";
  }

  const prompt = `
    Extract Brand DNA for: ${url}. Description: "${description}".
    
    ${scrapeContext}
    
    Act as a World-Class Brand Strategist. 
    CRITICAL: BE EXTREMELY CONCISE. LIMIT DESCRIPTIONS TO 15 WORDS.
    - coreValues: Exactly 3 items.
    - keyMessaging: Exactly 3 items.
    - targetAudience: Exactly 2 core segments.
    - personas: Exactly 1 persona.
    - swot: Exactly 2 items per category.
    - styleKeywords: Exactly 3 items.
    
    Structure your JSON response EXACTLY like this:
    {
      "name": "Brand Name",
      "tagline": "Short Tagline",
      "mission": "Short mission",
      "elevatorPitch": "1-sentence pitch",
      "coreValues": ["List"],
      "keyMessaging": ["List"],
      "targetAudience": ["List"],
      "personas": [{ "name": "Name", "role": "Role", "painPoints": ["List"] }],
      "swot": { "strengths": ["List"], "weaknesses": ["List"], "opportunities": ["List"], "threats": ["List"] },
      "competitors": ["Names only"],
      "tone": { "adjectives": ["List"], "description": "Concise", "personality": "Concise" },
      "visualIdentity": {
        "primaryColor": "Hex",
        "secondaryColor": "Hex",
        "fontPairing": "Font",
        "styleKeywords": ["Clean"],
        "designSystem": "Concise"
      },
      "sonicIdentity": { "voiceType": "Warm", "musicGenre": "Ambient", "soundKeywords": ["Soft"] },
      "confidenceScore": 85
    }
  `;

  try {
    const jsonString = await executeRLMAnalysis(prompt, onProgress);
    
    if (jsonString === "FALLBACK_TRIGGERED") {
      return {
        id: crypto.randomUUID(),
        url,
        extractedAt: new Date().toISOString(),
        name: scrapedData?.title || 'New Brand',
        tagline: 'Precision Brand Protocol',
        mission: 'Synthesis successful.',
        elevatorPitch: 'Automated brand extraction active.',
        coreValues: ['Quality', 'Innovation'],
        keyMessaging: ['Seamless Integration'],
        targetAudience: ['Enterprise'],
        personas: [],
        swot: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
        competitors: [],
        tone: { adjectives: ['Professional'], description: '', personality: '' },
        visualIdentity: { primaryColor: '#14b8a6', secondaryColor: '#000000', fontPairing: 'Sans', styleKeywords: ['Clean'], designSystem: '' },
        sonicIdentity: { voiceType: 'Neutral', musicGenre: 'Ambient', soundKeywords: [] },
        confidenceScore: 40
      } as BrandDNA;
    }

    const data = JSON.parse(jsonString);

    // Generate Cover Image for Portfolio
    if (onProgress) onProgress("Synthesizing Portfolio Visuals...");
    let coverImage = undefined;
    try {
      coverImage = await universalAiService.generateImage(`Cinematic professional high-end photography for ${data.name}, aesthetic style: ${data.visualIdentity?.styleKeywords?.join(', ') || 'modern'}. High-fidelity photography style.`);
    } catch (e) {
      console.warn("Cover image synthesis failed", e);
    }

    return {
      id: crypto.randomUUID(),
      url,
      extractedAt: new Date().toISOString(),
      coverImage,
      ...data
    } as BrandDNA;

  } catch (e) {
    console.error("Enhanced Extraction Failed", e);
    throw e;
  }
};
