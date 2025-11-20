// Conversation Route Handler

import { FastifyRequest, FastifyReply } from "fastify";
import { generateContent, isAIInitialized } from "../services/ai.js";
import { CONVERSATION_PROMPT } from "../prompts.js";

interface ConversationMessage {
    role: string;
    content: string;
}

interface ConversationBody {
    userMessage: string;
    conversationHistory?: ConversationMessage[];
    existingCategories?: string[];
}

export async function conversation(
    request: FastifyRequest<{ Body: ConversationBody }>,
    reply: FastifyReply
): Promise<void> {
    console.log("\n📨 Received conversation request", {
        userMessage: request.body.userMessage,
        historyLength: request.body.conversationHistory?.length || 0,
    });

    const {
        userMessage,
        conversationHistory = [],
        existingCategories = [],
    } = request.body;

    if (
        !userMessage ||
        typeof userMessage !== "string" ||
        userMessage.trim().length === 0
    ) {
        reply
            .code(400)
            .send({ error: "Missing or invalid userMessage field" });
        return;
    }

    if (!isAIInitialized()) {
        console.error("GEMINI_API_KEY not configured");
        reply.send({
            assistantMessage:
                "I'm sorry, I'm not configured properly. Please check the server setup.",
            needsFollowUp: false,
            readyToSave: false,
        });
        return;
    }

    try {
        const prompt = CONVERSATION_PROMPT(
            userMessage,
            conversationHistory,
            existingCategories
        );

        const responseText = await generateContent(prompt, {
            temperature: 0.7,
            maxOutputTokens: 200,
        });

        const parsed = JSON.parse(responseText);

        const response: {
            assistantMessage: string;
            needsFollowUp: boolean;
            readyToSave: boolean;
            quickOptions?: string[];
            activityToSave?: {
                text: string;
                category: string;
                broadCategory: string;
            };
        } = {
            assistantMessage: parsed.assistantMessage || "I see!",
            needsFollowUp: parsed.needsFollowUp || false,
            readyToSave: parsed.readyToSave || false,
        };        // If quick options are provided, include them
        if (parsed.quickOptions && Array.isArray(parsed.quickOptions)) {
            response.quickOptions = parsed.quickOptions;
        }

        // If ready to save, include the activity details
        if (parsed.readyToSave && parsed.activityText) {
            response.activityToSave = {
                text: parsed.activityText,
                category: parsed.subcategory || parsed.category || "General",
                broadCategory: parsed.broadCategory || "Other",
            };
        }

        reply.send(response);
    } catch (err) {
        console.error("Error in /api/conversation:", err);
        reply.code(500).send({
            error: "Failed to process conversation",
            assistantMessage:
                "I'm having trouble understanding. Could you rephrase that?",
            needsFollowUp: false,
            readyToSave: false,
        });
    }
}