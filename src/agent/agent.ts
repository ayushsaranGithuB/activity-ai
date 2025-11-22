import { callModel, ModelResponse } from './model';
import { toolDefinitions, dbInsert, dbQuery, dbUpdate, dbEnsureSchema, trendCompute, backupCreate, backupRestore, initDB } from './tools';
import { systemPrompt } from './prompt';

export interface AgentResponse {
    content: string;
}

let isInitialized = false;

export async function initializeAgent() {
    if (!isInitialized) {
        await initDB();
        isInitialized = true;
    }
}

export async function processMessage(userMessage: string): Promise<AgentResponse> {
    await initializeAgent();

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