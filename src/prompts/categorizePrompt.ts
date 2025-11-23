// src/prompts/categorizePrompt.ts
import { CATEGORY_MAPPINGS } from '../lib/category-guidance';

export const CATEGORIZE_PROMPT = (
  text: string,
  existingCategories: string[],
  forceRecategorize = false
): string => {
  // Build category guidance from mappings
  const mainCategories = CATEGORY_MAPPINGS.map(m => m.name).join(", ");
  const categoryGuidance = CATEGORY_MAPPINGS.map(mapping =>
    `${mapping.name}: ${mapping.description}\nExamples: ${mapping.examples.join(", ")}`
  ).join("\n\n");

  return `You are Activity AI, an agent that classifies freeform human activities into categories.

Category Rules:
- Choose from these main categories: ${mainCategories}
- If none of the main categories fit well, create a new specific category (1-3 words)
- DO NOT use example names as categories - use the main category names instead
- Capitalize each word (e.g., "Work", "Food", "Exercise")
- Be descriptive and meaningful for new categories
- Also provide a specific sub-category (1-3 words) that describes the activity more precisely

${forceRecategorize ? "IMPORTANT: This is a recategorization request. Choose the BEST main category from the list above. Only create a new category if absolutely necessary." : ""}

Category Guidance:
${categoryGuidance}

User activity: "${text}"
Existing categories: ${existingCategories.length > 0 ? existingCategories.join(", ") : "None yet"}

Return JSON only: { "category": "<main_category>", "sub_category": "<specific_sub_category>" }`;
};

export const BATCH_CATEGORIZE_PROMPT = (
  texts: string[],
  existingCategories: string[],
  forceRecategorize = false
): string => {
  // Build category guidance from mappings
  const mainCategories = CATEGORY_MAPPINGS.map(m => m.name).join(", ");
  const categoryGuidance = CATEGORY_MAPPINGS.map(mapping =>
    `${mapping.name}: ${mapping.description}\nExamples: ${mapping.examples.join(", ")}`
  ).join("\n\n");

  const activities = texts.map((text, index) => `${index + 1}. "${text}"`).join("\n");

  return `You are Activity AI, an agent that classifies freeform human activities into categories.

Category Rules:
- For each activity, choose from these main categories: ${mainCategories}
- If none of the main categories fit well, create a new specific category (1-3 words)
- DO NOT use example names as categories - use the main category names instead
- Capitalize each word (e.g., "Work", "Food", "Exercise")
- Be descriptive and meaningful for new categories
- Also provide a specific sub-category (1-3 words) that describes the activity more precisely

${forceRecategorize ? "IMPORTANT: This is a recategorization request. Choose the BEST main category from the list above. Only create a new category if absolutely necessary." : ""}

Category Guidance:
${categoryGuidance}

Activities to categorize:
${activities}

Existing categories: ${existingCategories.length > 0 ? existingCategories.join(", ") : "None yet"}

Return JSON array only: [{ "category": "<main1>", "sub_category": "<specific1>" }, { "category": "<main2>", "sub_category": "<specific2>" }, ...]`;
};
