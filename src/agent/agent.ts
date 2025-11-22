import { callModel, ModelResponse } from './model';
import { toolDefinitions, dbInsert, dbQuery, dbUpdate, dbEnsureSchema, trendCompute, backupCreate, backupRestore, initDB } from './tools';
import { systemPrompt } from './prompt';
import { Capacitor } from '@capacitor/core';

export interface AgentResponse {
    content: string;
}

let isInitialized = false;
let conversationContext: { type: 'activity_followup'; activity: string; category?: string } | null = null;

export async function initializeAgent() {
    if (!isInitialized) {
        await initDB();
        isInitialized = true;
    }
}

function detectActivity(message: string): { description: string; category?: string } | null {
    const lowerMessage = message.toLowerCase().trim();

    // Common activity indicators
    const activityPatterns = [
        /^working on (.+)$/i,
        /^just finished (.+)$/i,
        /^finished (.+)$/i,
        /^doing (.+)$/i,
        /^coding (.+)$/i,
        /^writing (.+)$/i,
        /^reading (.+)$/i,
        /^eating (.+)$/i,
        /^watching (.+)$/i,
        /^playing (.+)$/i,
        /^learning (.+)$/i,
        /^studying (.+)$/i,
        /^exercising$/i,
        /^running$/i,
        /^walking$/i,
        /^sleeping$/i,
        /^meeting with (.+)$/i,
        /^attending (.+)$/i,
        /^shopping$/i,
        /^cleaning$/i,
        /^cooking (.+)$/i,
    ];

    for (const pattern of activityPatterns) {
        const match = lowerMessage.match(pattern);
        if (match) {
            // For patterns with capture groups, use the full message
            // For patterns without capture groups, use the matched text
            const description = message.trim();
            return { description, category: guessCategory(description) };
        }
    }

    // If message is short and looks like an activity (no question marks, etc.)
    if (lowerMessage.length < 50 &&
        !lowerMessage.includes('?') &&
        !lowerMessage.includes('what') &&
        !lowerMessage.includes('how') &&
        !lowerMessage.includes('can you') &&
        !lowerMessage.includes('please')) {
        return { description: message.trim(), category: guessCategory(message) };
    }

    return null;
}

function generateFollowupQuestion(activity: string): string {
    const lowerActivity = activity.toLowerCase();

    if (lowerActivity.includes('eat') || lowerActivity.includes('ate') || lowerActivity.includes('eating')) {
        return "Great! What did you eat?";
    }
    if (lowerActivity.includes('drink') || lowerActivity.includes('drank') || lowerActivity.includes('drinking')) {
        return "Nice! What did you drink?";
    }
    if (lowerActivity.includes('work') || lowerActivity.includes('working') || lowerActivity.includes('coding')) {
        return "Cool! What are you working on?";
    }
    if (lowerActivity.includes('read') || lowerActivity.includes('reading')) {
        return "Awesome! What are you reading?";
    }
    if (lowerActivity.includes('watch') || lowerActivity.includes('watching')) {
        return "Sounds good! What are you watching?";
    }
    if (lowerActivity.includes('exercise') || lowerActivity.includes('running') || lowerActivity.includes('walking')) {
        return "Great job staying active! What kind of exercise?";
    }
    if (lowerActivity.includes('play') || lowerActivity.includes('playing') || lowerActivity.includes('game')) {
        return "Fun! What game are you playing?";
    }
    if (lowerActivity.includes('learn') || lowerActivity.includes('learning') || lowerActivity.includes('study')) {
        return "Learning is great! What are you learning about?";
    }

    return "That's interesting! Can you tell me more about it?";
}

async function handleFollowupConversation(userMessage: string): Promise<AgentResponse | null> {
    if (!conversationContext || conversationContext.type !== 'activity_followup') {
        return null;
    }

    // This is a follow-up response, combine with original activity
    const fullActivity = `${conversationContext.activity}: ${userMessage}`;
    await logActivity(fullActivity, conversationContext.category);

    // Generate a natural response
    const response = generateNaturalResponse(conversationContext.activity, userMessage);

    // Clear the context
    conversationContext = null;

    // Save the conversation to history
    await saveMessage('user', userMessage);
    await saveMessage('agent', response);

    return { content: response };
}

function generateNaturalResponse(activity: string, details: string): string {
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

function guessCategory(description: string): string | undefined {
    const lowerDesc = description.toLowerCase();

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
    if (lowerDesc.includes('sleep') || lowerDesc.includes('rest')) {
        return 'Rest';
    }
    if (lowerDesc.includes('meeting') || lowerDesc.includes('call') || lowerDesc.includes('social')) {
        return 'Social';
    }

    return undefined;
}

async function logActivity(description: string, categoryName?: string) {
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
            return;
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
                // Get the new category ID
                const newCategories = await dbQuery('SELECT id FROM categories WHERE name = ?', [categoryName]);
                if (newCategories && newCategories.length > 0) {
                    categoryId = newCategories[0].id;
                }
            }
        }

        // Insert the activity
        await dbInsert('activities', {
            description,
            category_id: categoryId
        });
    } catch (error) {
        console.error('Error logging activity:', error);
    }
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

    // Check if this looks like an activity description
    const activityMatch = detectActivity(userMessage);
    if (activityMatch) {
        // Start a conversational follow-up instead of immediately logging
        conversationContext = {
            type: 'activity_followup',
            activity: activityMatch.description,
            category: activityMatch.category
        };

        const followupQuestion = generateFollowupQuestion(activityMatch.description);

        // Save the conversation
        await saveMessage('user', userMessage);
        await saveMessage('agent', followupQuestion);

        return { content: followupQuestion };
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

    const finalResponse = response.content;

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