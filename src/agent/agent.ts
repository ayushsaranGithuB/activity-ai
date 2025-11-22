import { callModel, ModelResponse } from './model';
import {
    toolDefinitions,
    dbInsert,
    dbQuery,
    dbUpdate,
    dbEnsureSchema,
    trendCompute,
    backupCreate,
    backupRestore,
    initDB
} from './tools';
import { CATEGORIZE_PROMPT } from '../prompts/categorizePrompt';
import { systemPrompt } from './prompt';
import { Capacitor } from '@capacitor/core';

export interface AgentResponse {
    content: string;
}

interface CategoryResult {
    broadCategory?: string;
    subcategory?: string;
}

let isInitialized = false;

let conversationContext:
    | {
        type: 'activity_followup';
        activity: string;
        category?: string;
        logged?: boolean;
        activityId?: number;
    }
    | null = null;

export async function initializeAgent() {
    if (!isInitialized) {
        await initDB();
        isInitialized = true;
    }
}

/** -------------------------------------------------------
 *  NEW & IMPROVED ACTIVITY DETECTION (99% LLM-DRIVEN)
 * -------------------------------------------------------- */
async function detectActivity(
    message: string
): Promise<{ description: string; category?: string; subcategory?: string } | null> {
    const trimmed = message.trim();

    // Hard filters
    if (trimmed.length > 300) return null;
    if (isQuestion(trimmed)) return null;

    // STEP 1 — Ask Gemini directly: "Is this an activity?"
    const activityCheckPrompt = `
In one word ("yes" or "no"):
Is the user describing something they are doing or just did?
Message: "${trimmed}"
`;
    try {
        const act = await callModel(activityCheckPrompt, [{ role: 'user', content: trimmed }], toolDefinitions);
        const answer = act?.content?.trim().toLowerCase();

        if (answer !== 'yes') {
            return null; // LLM says it's not an activity → trust it.
        }
    } catch {
        // If model fails, fallback to weak heuristic
        if (trimmed.split(/\s+/).length < 4) {
            return { description: trimmed }; // treat as activity
        }
    }

    // STEP 2 — Category Classification
    try {
        let existingCategories: string[] = [];
        try {
            const rows = await dbQuery('SELECT name FROM categories');
            if (Array.isArray(rows)) {
                existingCategories = rows.map((r: { name?: string }) => r.name).filter(Boolean);
            }
        } catch {
            existingCategories = [];
        }

        const categorizePrompt = CATEGORIZE_PROMPT(trimmed, existingCategories);
        const parsed = await callModelExpectJson(categorizePrompt, trimmed);

        if (parsed && parsed.broadCategory) {
            const bc = parsed.broadCategory.trim().toLowerCase();
            if (bc === 'other' || bc === 'unknown') {
                return { description: trimmed, subcategory: parsed.subcategory };
            }
            return {
                description: trimmed,
                category: parsed.broadCategory,
                subcategory: parsed.subcategory
            };
        }
    } catch (error) {
        console.error('Categorization failed:', error);
    }

    // STEP 3 — Minimal fallback
    return { description: trimmed };
}

/** -------------------------------------------------------
 *  FOLLOW-UP QUESTION
 * -------------------------------------------------------- */
async function askFollowupQuestion(
    activity: string,
    _broadCategory?: string,
    _subcategory?: string
): Promise<string> {
    const prompt = `You're a friendly assistant. The user said: "${activity}". 
Ask one short, casual follow-up question that feels natural and human. 
Return only the question.`;
    try {
        const resp = await callModel(prompt, [{ role: 'user', content: activity }], toolDefinitions);
        return resp?.content?.trim() || "That's interesting — want to share a bit more?";
    } catch {
        return "That's interesting — want to share a bit more?";
    }
}

/** -------------------------------------------------------
 *  HELPER: JSON PARSER WITH RETRIES
 * -------------------------------------------------------- */
async function callModelExpectJson(
    prompt: string,
    userContent: string,
    retries = 1
): Promise<CategoryResult | null> {
    try {
        const resp = await callModel(prompt, [{ role: 'user', content: userContent }], toolDefinitions);
        const text = resp?.content?.trim();
        if (!text) return null;

        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('JSON parse error:', e);
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                try {
                    return JSON.parse(match[0]);
                } catch {
                    console.error('JSON parse failed on matched content.');
                }
            }
        }

        if (retries > 0) {
            const strictPrompt =
                prompt +
                `\n\nIMPORTANT: Return valid JSON only. Example: { "broadCategory": "Food", "subcategory": "Meals" }`;
            return await callModelExpectJson(strictPrompt, userContent, retries - 1);
        }
    } catch (err) {
        console.error('callModelExpectJson error:', err);
    }
    return null;
}

/** -------------------------------------------------------
 *  FOLLOW-UP CONVERSATION
 * -------------------------------------------------------- */
async function handleFollowupConversation(userMessage: string): Promise<AgentResponse | null> {
    if (!conversationContext) return null;

    // Don't log questions
    if (isQuestion(userMessage)) {
        const fallback = await styleResponse(
            "Hmm, that's a question — could you rephrase what you did or how it went?"
        );
        return { content: fallback };
    }

    const fullActivity = `${conversationContext.activity}: ${userMessage}`;

    try {
        if (conversationContext.activityId) {
            await dbUpdate('activities', { description: fullActivity }, { id: conversationContext.activityId });
        } else {
            await logActivity(fullActivity, conversationContext.category);
        }
    } catch (err) {
        console.error('Error updating activity:', err);
    }

    const raw = await generateNaturalResponse(conversationContext.activity, userMessage);
    const styled = await styleResponse(raw);

    conversationContext = null;

    await saveMessage('user', userMessage);
    await saveMessage('agent', styled);

    return { content: styled };
}

/** -------------------------------------------------------
 *  NATURAL RESPONSE GENERATION
 * -------------------------------------------------------- */
async function generateNaturalResponse(activity: string, details: string): Promise<string> {
    const prompt = `
You're a friendly, witty assistant.
Rewrite the following into ONE short, natural, upbeat reply.
- Only ONE version
- Keep it conversational, warm, and human
- 1–2 sentences max
- A tiny hint of humor is ok
- No lists, no bullets, no multiple options

Activity: "${activity}"
Details: "${details}"
`;
    try {
        const resp = await callModel(prompt, [{ role: 'user', content: `${activity}\n${details}` }], toolDefinitions);
        const text = resp?.content?.trim();
        if (text) return text;
    } catch {
        console.error('Error generating natural response.');
    }

    return `${details.trim()} — nice!`;
}



/** -------------------------------------------------------
 *  LOG ACTIVITY
 * -------------------------------------------------------- */
async function logActivity(description: string, categoryName?: string): Promise<number | undefined> {
    try {
        if (!Capacitor.isNativePlatform()) {
            // Web: do not log activities, just return a dummy id
            return Date.now();
        }

        // Native (SQLite)
        let categoryId = undefined;

        if (categoryName) {
            const existing = await dbQuery('SELECT id FROM categories WHERE name = ?', [categoryName]);
            if (existing?.length) {
                categoryId = existing[0].id;
            } else {
                const result = await dbInsert('categories', {
                    name: categoryName,
                    description: `Activities related to ${categoryName.toLowerCase()}`
                });
                categoryId = result?.id;
            }
        }

        const insertResult = await dbInsert('activities', {
            description,
            category_id: categoryId
        });

        return insertResult?.id;
    } catch (err) {
        console.error('Error logging activity:', err);
        return undefined;
    }
}

/** -------------------------------------------------------
 *  MAIN PROCESS MESSAGE LOOP
 * -------------------------------------------------------- */
export async function processMessage(userMessage: string): Promise<AgentResponse> {
    await initializeAgent();

    if (conversationContext) {
        const result = await handleFollowupConversation(userMessage);
        if (result) return result;
    }

    const activityMatch = await detectActivity(userMessage);
    if (activityMatch) {
        conversationContext = {
            type: 'activity_followup',
            activity: activityMatch.description,
            category: activityMatch.category,
            logged: false
        };

        try {
            const activityId = await logActivity(activityMatch.description, activityMatch.category);
            if (activityId) conversationContext.activityId = activityId;
        } catch (err) {
            console.error('Error logging activity:', err);
        }

        const followup = await askFollowupQuestion(
            activityMatch.description,
            activityMatch.category,
            activityMatch.subcategory
        );
        const styledFollowup = await styleResponse(followup);

        await saveMessage('user', userMessage);
        await saveMessage('agent', styledFollowup);

        return { content: styledFollowup };
    }

    // GENERAL CHAT MODE
    const history = await loadConversationHistory();
    history.push({ role: 'user', content: userMessage });

    let response: ModelResponse;
    let attempts = 0;

    do {
        const prompt =
            systemPrompt +
            '\n\nConversation:\n' +
            history.map((h) => `${h.role}: ${h.content}`).join('\n');

        response = await callModel(prompt, history, toolDefinitions);

        if (response.toolCalls?.length) {
            for (const toolCall of response.toolCalls) {
                let result: unknown;
                switch (toolCall.name) {
                    case 'dbInsert':
                        result = await dbInsert(
                            toolCall.arguments.table,
                            toolCall.arguments.data
                        );
                        break;
                    case 'dbQuery':
                        result = await dbQuery(
                            toolCall.arguments.sql,
                            toolCall.arguments.params
                        );
                        break;
                    case 'dbUpdate':
                        result = await dbUpdate(
                            toolCall.arguments.table,
                            toolCall.arguments.data,
                            toolCall.arguments.where
                        );
                        break;
                    case 'dbEnsureSchema':
                        result = await dbEnsureSchema();
                        break;
                    case 'trendCompute':
                        result = await trendCompute(toolCall.arguments.period);
                        break;
                    case 'backupCreate':
                        result = await backupCreate();
                        break;
                    case 'backupRestore':
                        result = await backupRestore(toolCall.arguments.filename);
                        break;
                    default:
                        result = { error: 'Unknown tool' };
                }
                history.push({
                    role: 'assistant',
                    content: `Tool call: ${toolCall.name}\nResult: ${JSON.stringify(
                        result
                    )}`
                });
            }
        } else {
            break;
        }

        attempts++;
    } while (attempts < 5);

    let finalResponse = response.content;

    try {
        finalResponse = await styleResponse(finalResponse);
    } catch {
        /* fallback to raw */
    }

    await saveMessage('user', userMessage);
    await saveMessage('agent', finalResponse);

    return { content: finalResponse };
}

/** -------------------------------------------------------
 *  HELPERS
 * -------------------------------------------------------- */
async function loadConversationHistory(): Promise<{ role: string; content: string }[]> {
    const rows = (await dbQuery(
        'SELECT role, content FROM messages ORDER BY timestamp DESC LIMIT 20'
    )) as Array<{ role: string; content: string }>;
    return rows.reverse();
}

async function saveMessage(role: string, content: string) {
    await dbInsert('messages', { role, content });
}

function isQuestion(text: string): boolean {
    if (!text) return false;
    const t = text.trim();
    if (t.endsWith('?')) return true;
    return /^(what|how|why|when|where|who|do you|can you|should|is|are|did)\b/i.test(t);
}

/** -------------------------------------------------------
 *  STYLE LAYER — TONE + PERSONALITY
 * -------------------------------------------------------- */
async function styleResponse(raw: string): Promise<string> {
    const stylePrompt = `
Rewrite the assistant message below.

REQUIREMENTS:
- Output ONLY ONE rewritten sentence (no lists, no options)
- Keep the meaning exactly the same
- Make it friendly, peppy, modern, and lightly humorous if natural
- 1-2 sentences max
- No bullet points, no multiple choices
- Do not add examples or variations

Message:
"${raw}"
`;

    try {
        const resp = await callModel(stylePrompt, [{ role: 'assistant', content: raw }], toolDefinitions);
        return resp?.content?.trim() || raw;
    } catch {
        return raw;
    }
}
