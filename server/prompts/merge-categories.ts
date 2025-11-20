export const MERGE_CATEGORIES_PROMPT = (categories: string[]): string => `You help refine categories by identifying redundant or overlapping labels.

Given the following category list: ${categories.join(", ")}

Suggest merges only if categories describe the same thing or are very closely related.

Examples:
- "Running" and "Jogging" → merge "Jogging" into "Running"
- "Gym" and "Exercise" → merge "Gym" into "Exercise"
- "Breakfast" and "Meals" → merge "Breakfast" into "Meals"

Return JSON:
{ "merges": [ { "from": "<old>", "into": "<new>" } ] }

If no merges are needed, return:
{ "merges": [] }`;
