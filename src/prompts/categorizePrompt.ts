// src/prompts/categorizePrompt.ts
import { CATEGORY_MAPPINGS } from '../lib/category-guidance';

export const CATEGORIZE_PROMPT = (
  text: string,
  existingCategories: string[],
  forceRecategorize = false
): string => {
  // Build category guidance from mappings
  const categoryGuidance = CATEGORY_MAPPINGS.map(mapping =>
    `${mapping.name}: ${mapping.description}\nExamples: ${mapping.examples.join(", ")}`
  ).join("\n\n");

  return `You are Activity AI, an agent that classifies freeform human activities into categories.

Category Rules:
- Return a single, specific category name (1-3 words)
- Prefer using existing categories ONLY if they truly match
- Create new specific categories when existing ones don't fit well
- Capitalize each word (e.g., "App Development", "Drinking Beverage")
- AVOID generic categories like "General", "Other", "Uncategorized"
- Be descriptive and meaningful

${forceRecategorize ? "IMPORTANT: This is a recategorization request. Be MORE SPECIFIC than a generic category. Review existing categories and either use a better match or create a more specific new category." : ""}

Category Guidance:
${categoryGuidance}


User activity: "${text}"
Existing categories: ${existingCategories.length > 0 ? existingCategories.join(", ") : "None yet"}

Return JSON only: { "category": "<category>" }`;
};
