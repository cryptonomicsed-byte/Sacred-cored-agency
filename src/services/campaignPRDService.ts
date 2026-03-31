
import { BrandDNA, CampaignPRD, CampaignOverview } from "../types";
import { generateAdvancedPRD } from "./geminiService";

/**
 * Strategy Blueprint Service
 * Initiates the multi-channel campaign PRD synthesis.
 */
export const createCampaignPRD = async (
  brand: BrandDNA,
  overview: CampaignOverview,
  channels: string[]
): Promise<CampaignPRD> => {
  console.log(`[FORGE] Initiating Strategy Blueprint for: ${brand.name}`);
  return await generateAdvancedPRD(brand, overview, channels);
};
