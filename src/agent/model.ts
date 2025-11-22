import { GoogleGenAI } from '@google/genai';

const genAI = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export interface ToolCall {
    name: string;
    arguments: Record<string, unknown>;
}

export interface ModelResponse {
    content: string;
    toolCalls?: ToolCall[];
}

export async function callModel(prompt: string, history: Array<{ role: string; content: string }>, _tools: Array<{ name: string; description: string; parameters: unknown }>): Promise<ModelResponse> {
    const chat = await genAI.chats.create({
        model: 'gemini-2.5-flash-lite',
        history: history.map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }],
        })),
    });

    const result = await chat.sendMessage({
        message: [{ text: prompt }],
    });
    const response = result;

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const functionCalls = response.candidates?.[0]?.content?.parts?.filter(part => part.functionCall)?.map(part => part.functionCall);

    return {
        content: text,
        toolCalls: functionCalls?.map(call => ({
            name: call.name,
            arguments: call.args as Record<string, unknown>,
        })),
    };
}