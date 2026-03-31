
import { BrandDNA, BattleReport } from "../types";
import { universalAiService } from "./universalAiService";

/**
 * Ensures the AI response contains all required nested fields to prevent UI crashes.
 */
const validateReport = (raw: any, brandA: BrandDNA, brandB: BrandDNA): BattleReport => {
  const safeData = raw || {};
  return {
    id: safeData.id || crypto.randomUUID(),
    brandAId: brandA.id,
    brandBId: brandB.id,
    analyzedAt: safeData.analyzedAt || new Date().toISOString(),
    visualAnalysis: {
      summary: safeData.visualAnalysis?.summary || "Analysis pending.",
      winner: safeData.visualAnalysis?.winner || 'Tie'
    },
    messagingAnalysis: {
      summary: safeData.messagingAnalysis?.summary || "Analysis pending.",
      winner: safeData.messagingAnalysis?.winner || 'Tie'
    },
    marketPositioning: {
      overlap: safeData.marketPositioning?.overlap || 'Medium',
      differentiation: safeData.marketPositioning?.differentiation || "Unique brand footprints."
    },
    scores: {
      brandA: safeData.scores?.brandA || 50,
      brandB: safeData.scores?.brandB || 50,
      breakdown: Array.isArray(safeData.scores?.breakdown) ? safeData.scores.breakdown : [
        { category: "Market Resonance", scoreA: 50, scoreB: 50 }
      ]
    },
    gapAnalysis: {
      brandAMissing: Array.isArray(safeData.gapAnalysis?.brandAMissing) ? safeData.gapAnalysis.brandAMissing : ["No major gaps detected"],
      brandBMissing: Array.isArray(safeData.gapAnalysis?.brandBMissing) ? safeData.gapAnalysis.brandBMissing : ["No major gaps detected"]
    },
    critique: safeData.critique || "A strategic assessment is ongoing."
  };
};

export const generateBattleReport = async (brandA: BrandDNA, brandB: BrandDNA): Promise<BattleReport> => {
  const prompt = `
    Act as a Ruthless Brand Strategist. Compare these two brands head-to-head.
    BRAND A: ${brandA.name} (${brandA.mission})
    BRAND B: ${brandB.name} (${brandB.mission})
    
    Output a JSON object with this EXACT structure:
    {
      "visualAnalysis": { "summary": "string", "winner": "A|B|Tie" },
      "messagingAnalysis": { "summary": "string", "winner": "A|B|Tie" },
      "marketPositioning": { "overlap": "High|Medium|Low", "differentiation": "string" },
      "scores": { 
        "brandA": number, 
        "brandB": number, 
        "breakdown": [{ "category": "string", "scoreA": number, "scoreB": number }] 
      },
      "gapAnalysis": { "brandAMissing": ["string"], "brandBMissing": ["string"] },
      "critique": "string"
    }
  `;

  try {
    const response = await universalAiService.generateText({
      prompt,
      responseMimeType: 'application/json',
      featureId: 'battle-mode'
    });

    if (response === "FALLBACK_TRIGGERED") {
      return validateReport({}, brandA, brandB);
    }

    const data = JSON.parse(response || '{}');
    return validateReport(data, brandA, brandB);
  } catch (error) {
    console.error("Battle analysis failed, using safe fallback", error);
    return validateReport({}, brandA, brandB);
  }
};
