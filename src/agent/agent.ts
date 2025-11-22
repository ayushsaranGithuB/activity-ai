import { callModel, ModelResponse } from './model';
import { toolDefinitions, dbInsert, dbQuery, dbUpdate, dbEnsureSchema, trendCompute, backupCreate, backupRestore, initDB } from './tools';
import { CATEGORIZE_PROMPT } from '../prompts/categorizePrompt';
import { systemPrompt } from './prompt';
import { Capacitor } from '@capacitor/core';

export interface AgentResponse {
    content: string;
}

let isInitialized = false;
let conversationContext: { type: 'activity_followup'; activity: string; category?: string; logged?: boolean; activityId?: number } | null = null;

export async function initializeAgent() {
    if (!isInitialized) {
        await initDB();
        isInitialized = true;
    }
}

async function detectActivity(message: string): Promise<{ description: string; category?: string; subcategory?: string } | null> {
    const lowerMessage = message.toLowerCase().trim();

    // If it's very long, don't treat as a single activity
    if (lowerMessage.length > 400) return null;

    // Ask the LLM to categorize the message using the categorize prompt.
    try {
        // Fetch existing categories to provide as existing subcategories to the model
        let existingCategories: string[] = [];
        try {
            const rows = await dbQuery('SELECT name FROM categories');
            if (rows && Array.isArray(rows)) {
                existingCategories = rows.map((r: any) => r.name).filter(Boolean);
            }
        } catch (e) {
            // ignore DB errors, we'll pass empty list
            existingCategories = [];
        }

        const categorizePrompt = CATEGORIZE_PROMPT(message, existingCategories);
        // Use robust JSON-parsing wrapper (retry with stricter instruction if needed)
        const parsed = await callModelExpectJson(categorizePrompt, message);
        if (parsed && parsed.broadCategory && parsed.broadCategory.toLowerCase() !== 'other') {
            return { description: message.trim(), category: parsed.broadCategory, subcategory: parsed.subcategory };
        }
    } catch (error) {
        console.error('Error classifying activity via model:', error);
    }

    // If model didn't return a clear category, apply a lighter heuristic:
    // - If it's a direct question, do not log
    // - If it's short and action-like, treat as activity
    const questionLike = /\?$/.test(message.trim()) || /^(what|how|why|when|where|do you|can you)\b/i.test(message.trim());
    if (questionLike) return null;

    // Short and action-like heuristic: look for common verb forms or gerunds
    if (lowerMessage.length < 100) {
        const actionWords = [
            'work', 'working', 'code', 'coding', 'nap', 'napping', 'sleep', 'sleeping', 'eat', 'eating', 'ate', 'drink', 'drinking', 'read', 'reading',
            'watch', 'watching', 'play', 'playing', 'study', 'studying', 'run', 'running', 'walk', 'walking', 'cook', 'cooking', 'clean', 'cleaning',
            'meeting', 'call', 'shopping', 'shop', 'stretch', 'stretched', 'exercise', 'exercising'
        ];
        for (const w of actionWords) {
            if (lowerMessage.includes(w)) {
                const cat = await guessCategory(message);
                return { description: message.trim(), category: cat };
            }
        }
        // If the message is one or two words (action-like), treat as activity
        if (message.trim().split(/\s+/).length <= 2) {
            const cat = await guessCategory(message);
            return { description: message.trim(), category: cat };
        }
    }

    return null;

    return null;
}

async function askFollowupQuestion(activity: string, broadCategory?: string, subcategory?: string): Promise<string> {
    const prompt = `You're a friendly assistant. The user said: "${activity}". \nAsk one short, casual follow-up question that feels natural.\nIt should sound curious, friendly, and human — not robotic.\nReturn only the question.`;
    try {
        const resp = await callModel(prompt, [{ role: 'user', content: activity }], toolDefinitions);
        return (resp && resp.content) ? resp.content.trim() : "That's interesting! Can you tell me more about it?";
    } catch (err) {
        console.error('Error generating follow-up via model:', err);
        return "That's interesting! Can you tell me more about it?";
    }
}

// Wrapper: call model and expect JSON output; retry once with a stricter instruction if parsing fails
async function callModelExpectJson(prompt: string, userContent: string, retries = 1): Promise<any | null> {
    try {
        const resp = await callModel(prompt, [{ role: 'user', content: userContent }], toolDefinitions);
        const text = (resp && resp.content) ? resp.content.trim() : '';
        if (!text) return null;
        try {
            return JSON.parse(text);
        } catch (e) {
            // try extract JSON substring
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                try { return JSON.parse(match[0]); } catch (e) { /* fallthrough */ }
            }
        }
        // Retry once with strict JSON instruction
        if (retries > 0) {
            const strictPrompt = prompt + '\n\nIMPORTANT: Return valid JSON only — nothing else. Example: { "broadCategory": "Food", "subcategory": "Meals" }';
            return await callModelExpectJson(strictPrompt, userContent, retries - 1);
        }
    } catch (err) {
        console.error('callModelExpectJson error:', err);
    }
    return null;
}


async function handleFollowupConversation(userMessage: string): Promise<AgentResponse | null> {
    if (!conversationContext || conversationContext.type !== 'activity_followup') {
        return null;
    }

    // This is a follow-up response, combine with original activity
    const fullActivity = `${conversationContext.activity}: ${userMessage}`;
    // If we logged an initial activity, update that record with follow-up details.
    if (conversationContext.activityId) {
        try {
            // Update existing activity description
            await dbUpdate('activities', { description: fullActivity }, { id: conversationContext.activityId });
        } catch (e) {
            // Fallback: insert if update fails
            await logActivity(fullActivity, conversationContext.category);
        }
    } else {
        // No existing activity recorded yet — insert now
        await logActivity(fullActivity, conversationContext.category);
    }

    // Generate a natural response (LLM-driven)
    const response = await generateNaturalResponse(conversationContext.activity, userMessage);
    // Apply style layer to keep voice consistent
    const styledResponse = await styleResponse(response);

    // Clear the context
    conversationContext = null;

    // Save the conversation to history
    await saveMessage('user', userMessage);
    await saveMessage('agent', styledResponse);

    return { content: styledResponse };
}

async function generateNaturalResponse(activity: string, details: string): Promise<string> {
    const prompt = `
You're a friendly, witty assistant. 
The user said they were doing: "${activity}".
They added: "${details}".
Reply with one short, natural, upbeat message.
Feel free to add a tiny bit of humor or personality.
Avoid formality or robotic tone.
Do NOT mention logging or data.
One or two sentences max.
`;
    try {
        const resp = await callModel(prompt, [{ role: 'user', content: `${activity}\n${details}` }], toolDefinitions);
        const text = (resp && resp.content) ? resp.content.trim() : '';
        if (text) return text;
    } catch (err) {
        console.error('Error generating natural response via model:', err);
    }

    // Fallback heuristic (previous behavior)
    const lowerActivity = activity.toLowerCase();
    const lowerDetails = details.toLowerCase();

    if (lowerActivity.includes('eat') || lowerActivity.includes('ate')) {
        if (lowerDetails.includes('egg')) {
            return "Eggs are nutritious! Good choice for breakfast!";
        }
        if (lowerDetails.includes('fruit') || lowerDetails.includes('banana') || lowerDetails.includes('apple')) {
            return "Fruits are a healthy choice! Great job!";
        }
        if (lowerDetails.includes('cereal') || lowerDetails.includes('oat')) {
            return "Whole grains are excellent for sustained energy!";
        }
        return `${details} sounds like a good choice!`;
    }

    if (lowerActivity.includes('drink') || lowerActivity.includes('drank')) {
        if (lowerDetails.includes('water')) {
            return "Staying hydrated is so important!";
        }
        if (lowerDetails.includes('coffee') || lowerDetails.includes('tea')) {
            return "A nice warm drink to start the day!";
        }
        return `${details} sounds refreshing!`;
    }

    if (lowerActivity.includes('work') || lowerActivity.includes('working')) {
        return `Working on ${details} sounds productive!`;
    }

    if (lowerActivity.includes('read') || lowerActivity.includes('reading')) {
        return `Reading ${details} sounds interesting!`;
    }

    if (lowerActivity.includes('exercise') || lowerActivity.includes('running') || lowerActivity.includes('walking')) {
        return `${details} is a great way to stay healthy!`;
    }

    return `Thanks for sharing! "${details}" sounds great!`;
}

async function guessCategory(description: string): Promise<string | undefined> {
    const lowerDesc = description.toLowerCase();

    // First try to use the LLM to classify into a broad category (use categorize prompt without forcing recategorize)
    try {
        let existingCategories: string[] = [];
        try {
            const rows = await dbQuery('SELECT name FROM categories');
            if (rows && Array.isArray(rows)) existingCategories = rows.map((r: any) => r.name).filter(Boolean);
        } catch (e) {
            existingCategories = [];
        }
        const categorizePrompt = CATEGORIZE_PROMPT(description, existingCategories, true);
        const parsed = await callModelExpectJson(categorizePrompt, description);
        if (parsed && parsed.broadCategory) return parsed.broadCategory;
    } catch (err) {
        console.error('Error asking model for category:', err);
    }

    // Fallback heuristics
    if (lowerDesc.includes('work') || lowerDesc.includes('coding') || lowerDesc.includes('programming') || lowerDesc.includes('app')) {
        return 'Work';
    }
    if (lowerDesc.includes('exercise') || lowerDesc.includes('running') || lowerDesc.includes('walking') || lowerDesc.includes('gym')) {
        return 'Exercise';
    }
    if (lowerDesc.includes('eat') || lowerDesc.includes('food') || lowerDesc.includes('lunch') || lowerDesc.includes('dinner') || lowerDesc.includes('cooking')) {
        return 'Food';
    }
    if (lowerDesc.includes('read') || lowerDesc.includes('book') || lowerDesc.includes('study') || lowerDesc.includes('learning')) {
        return 'Learning';
    }
    if (lowerDesc.includes('watch') || lowerDesc.includes('movie') || lowerDesc.includes('tv') || lowerDesc.includes('entertainment')) {
        return 'Entertainment';
    }
    if (lowerDesc.includes('sleep') || lowerDesc.includes('rest') || lowerDesc.includes('nap') || lowerDesc.includes('napping')) {
        return 'Rest';
    }
    if (lowerDesc.includes('meeting') || lowerDesc.includes('call') || lowerDesc.includes('social')) {
        return 'Social';
    }

    return undefined;
}

async function logActivity(description: string, categoryName?: string): Promise<number | undefined> {
    try {
        // For browser environment, we'll use localStorage as a fallback
        if (!Capacitor.isNativePlatform()) {
            const activities = JSON.parse(localStorage.getItem('activities') || '[]');
            const categories = JSON.parse(localStorage.getItem('categories') || '[]');

            let categoryId = undefined;
            if (categoryName) {
                // Try to find existing category
                const existingCategory = categories.find((c: any) => c.name === categoryName);
                if (existingCategory) {
                    categoryId = existingCategory.id;
                } else {
                    // Create new category
                    const newCategory = {
                        id: Date.now(),
                        name: categoryName,
                        description: `Activities related to ${categoryName.toLowerCase()}`,
                        created_at: new Date().toISOString()
                    };
                    categories.push(newCategory);
                    categoryId = newCategory.id;
                    localStorage.setItem('categories', JSON.stringify(categories));
                }
            }

            // Insert the activity
            const newActivity = {
                id: Date.now(),
                description,
                category_id: categoryId,
                timestamp: new Date().toISOString()
            };
            activities.push(newActivity);
            localStorage.setItem('activities', JSON.stringify(activities));
            return newActivity.id;
        }

        // Native environment - use SQLite
        // First, ensure category exists or create it
        let categoryId = undefined;
        if (categoryName) {
            // Try to find existing category
            const existingCategories = await dbQuery('SELECT id FROM categories WHERE name = ?', [categoryName]);
            if (existingCategories && existingCategories.length > 0) {
                categoryId = existingCategories[0].id;
            } else {
                // Create new category
                const result = await dbInsert('categories', {
                    name: categoryName,
                    description: `Activities related to ${categoryName.toLowerCase()}`
                });
                if (result && (result as any).id) {
                    categoryId = (result as any).id;
                } else {
                    // Fallback: query the category id
                    const newCategories = await dbQuery('SELECT id FROM categories WHERE name = ?', [categoryName]);
                    if (newCategories && newCategories.length > 0) {
                        categoryId = newCategories[0].id;
                    }
                }
            }
        }

        // Insert the activity and return the inserted id when available
        const insertResult = await dbInsert('activities', {
            description,
            category_id: categoryId
        });
        if (insertResult && (insertResult as any).id) {
            return (insertResult as any).id;
        }
    } catch (error) {
        console.error('Error logging activity:', error);
    }
    return undefined;
}

export async function processMessage(userMessage: string): Promise<AgentResponse> {
    await initializeAgent();

    // Check if we're in a follow-up conversation
    if (conversationContext) {
        const response = await handleFollowupConversation(userMessage);
        if (response) {
            return response;
        }
    }

    // Check if this looks like an activity description (classification via LLM)
    const activityMatch = await detectActivity(userMessage);
    if (activityMatch) {
        // Start a conversational follow-up. Also attempt to immediately log the activity.
        conversationContext = {
            type: 'activity_followup',
            activity: activityMatch.description,
            category: activityMatch.category,
            logged: false,
        };

        // Immediately log the activity to satisfy the system prompt requirement
        try {
            const activityId = await logActivity(activityMatch.description, activityMatch.category);
            if (activityId) conversationContext.activityId = activityId;
            conversationContext.logged = true;
        } catch (err) {
            console.error('Failed to log activity immediately:', err);
        }

        // Ask LLM for a targeted follow-up (falls back inside askFollowupQuestion)
        const followupQuestion = await askFollowupQuestion(activityMatch.description, activityMatch.category, activityMatch.subcategory);

        // Style the follow-up so tone is consistent
        const styledFollowup = await styleResponse(followupQuestion);

        // Save the conversation
        await saveMessage('user', userMessage);
        await saveMessage('agent', styledFollowup);

        return { content: styledFollowup };
    }

    // Load conversation history
    const history = await loadConversationHistory();

    // Add user message to history
    history.push({ role: 'user', content: userMessage });

    let response: ModelResponse;
    let attempts = 0;
    const maxAttempts = 5;

    do {
        const prompt = systemPrompt + '\n\nConversation:\n' + history.map(h => `${h.role}: ${h.content}`).join('\n');
        response = await callModel(prompt, history, toolDefinitions);

        if (response.toolCalls && response.toolCalls.length > 0) {
            for (const toolCall of response.toolCalls) {
                let result;
                switch (toolCall.name) {
                    case 'dbInsert':
                        result = await dbInsert(toolCall.arguments.table as string, toolCall.arguments.data as Record<string, unknown>);
                        break;
                    case 'dbQuery':
                        result = await dbQuery(toolCall.arguments.sql as string, toolCall.arguments.params as unknown[]);
                        break;
                    case 'dbUpdate':
                        result = await dbUpdate(toolCall.arguments.table as string, toolCall.arguments.data as Record<string, unknown>, toolCall.arguments.where as Record<string, unknown>);
                        break;
                    case 'dbEnsureSchema':
                        result = await dbEnsureSchema();
                        break;
                    case 'trendCompute':
                        result = await trendCompute(toolCall.arguments.period as 'day' | 'week' | 'month' | 'year');
                        break;
                    case 'backupCreate':
                        result = await backupCreate();
                        break;
                    case 'backupRestore':
                        result = await backupRestore(toolCall.arguments.filename as string);
                        break;
                    default:
                        result = { error: 'Unknown tool' };
                }
                history.push({ role: 'assistant', content: `Tool call: ${toolCall.name}\nResult: ${JSON.stringify(result)}` });
            }
        } else {
            break;
        }
        attempts++;
    } while (attempts < maxAttempts);

    let finalResponse = response.content;

    // Run final styling pass to enforce voice/tone
    try {
        finalResponse = await styleResponse(finalResponse);
    } catch (e) {
        // ignore styling failures and fallback to original
    }

    // Save messages
    await saveMessage('user', userMessage);
    await saveMessage('agent', finalResponse);

    return { content: finalResponse };
}

async function loadConversationHistory(): Promise<{ role: string; content: string }[]> {
    // Load last 10 messages or so
    const result = (await dbQuery('SELECT role, content FROM messages ORDER BY timestamp DESC LIMIT 20')) as Array<{ role: string; content: string }>;
    return result.reverse().map((row) => ({ role: row.role, content: row.content }));
}

async function saveMessage(role: string, content: string) {
    await dbInsert('messages', { role, content });
}

// Style layer: rewrites assistant messages to a friendly, peppy voice without changing meaning
async function styleResponse(raw: string): Promise<string> {
    const stylePrompt = `
Rewrite the following assistant message to sound:
- friendly
- peppy
- lightly humorous (if appropriate)
- modern and natural
- concise (1 - 2 sentences)
- human, not robotic
- never formal
- do NOT change the meaning

Message to rewrite:
"${raw}"
`;

    try {
        const resp = await callModel(stylePrompt, [{ role: 'assistant', content: raw }], toolDefinitions);
        const text = resp?.content?.trim();
        return text || raw;
    } catch (e) {
        return raw; // fallback
    }
}