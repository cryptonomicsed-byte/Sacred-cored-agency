
import { LeadProfile, CloserPortfolio } from "../types";
import { universalAiService } from "./universalAiService";

export interface GroundedLeadResult {
  leads: LeadProfile[];
  sources: { title: string; uri: string }[];
}

export const huntLeads = async (
  industry: string, 
  location: string, 
  coords?: { lat: number; lng: number }
): Promise<GroundedLeadResult> => {
  const locationContext = coords 
    ? `near geographic coordinates ${coords.lat}, ${coords.lng} (${location})`
    : `in ${location}`;

  const prompt = `
    Find 5 REAL, currently active companies in the "${industry}" sector ${locationContext}.
    
    For each company:
    1. Identify their official website.
    2. Analyze their likely branding or marketing gaps.
    3. Determine how CoreDNA (an AI Brand Intelligence platform) would specifically help them scale or fix these issues.
    4. Estimate their size (headcount/revenue).
    5. Identify a key decision maker if possible.

    CRITICAL: You MUST use Search to find actual, existing businesses. Do not hallucinate names.
    
    Return a JSON object with this EXACT structure:
    {
      "leads": [
        {
          "companyName": "string",
          "industry": "string",
          "location": "string",
          "website": "string",
          "founderName": "string",
          "opportunityScore": number (0-100),
          "painPointDescription": "string",
          "vulnerabilities": ["string"],
          "techStack": ["string"],
          "estimatedRevenue": "string",
          "headcount": "string"
        }
      ]
    }
  `;

  try {
    // We use universalAiService. If provider is Gemini, we use tools.
    // If provider is something else, we fallback or use their native search if implemented.
    const text = await universalAiService.generateText({
      prompt,
      responseMimeType: 'application/json',
      featureId: 'lead-hunting',
      tools: [{ googleSearch: {} }] // Only recognized by Gemini but safe to pass to router
    });

    if (text === "FALLBACK_TRIGGERED") throw new Error("Neural search limit reached.");

    const data = JSON.parse(text || '{"leads":[]}');
    const leads = (data.leads || []).map((l: any) => ({
      ...l,
      id: crypto.randomUUID(),
      status: 'new',
      industry: l.industry || industry,
      location: l.location || location
    })) as LeadProfile[];

    // Since we don't have direct access to chunks here through generateText, 
    // we assume the model handled the grounding.
    return { leads, sources: [] };

  } catch (error) {
    console.error("Lead hunting failed", error);
    throw new Error("Neural search failed to index live targets. Please try a more specific sector or check provider status.");
  }
};

export const generateCloserPortfolio = async (lead: LeadProfile): Promise<CloserPortfolio> => {
  const prompt = `
    Act as a World-Class Sales Strategist for CoreDNA.
    Create a "Closer Portfolio" to pitch CoreDNA to ${lead.companyName}.
    
    Company Context: ${lead.painPointDescription}
    Vulnerabilities identified: ${lead.vulnerabilities.join(', ')}
    
    Goal: Show them how our AI Brand DNA extraction and autonomous forge can fix their specific problems.
    
    Return JSON:
    {
      "subjectLine": "string",
      "emailBody": "string",
      "closingScript": "string",
      "objections": [{ "objection": "string", "rebuttal": "string" }],
      "followUpSequence": ["string"]
    }
  `;

  try {
    const response = await universalAiService.generateText({
      prompt,
      responseMimeType: 'application/json',
      featureId: 'closer-portfolio'
    });

    if (response === "FALLBACK_TRIGGERED") throw new Error("Synthesis limit reached.");

    const data = JSON.parse(response || '{}');
    return data as CloserPortfolio;
  } catch (error) {
    console.error("Portfolio generation failed", error);
    return {
       subjectLine: `Strategic Growth Proposal for ${lead.companyName}`,
       emailBody: `Hi ${lead.founderName || 'Team'},\n\nI noticed some opportunities to leverage CoreDNA to solve the ${lead.vulnerabilities[0] || 'marketing friction'} you're facing.`,
       closingScript: "Establish CoreDNA as the neural backbone for expansion.",
       objections: [{ objection: "We have an internal team", rebuttal: "CoreDNA empowers them to produce 10x output." }],
       followUpSequence: ["Day 2: Capability Deck"]
    };
  }
};
