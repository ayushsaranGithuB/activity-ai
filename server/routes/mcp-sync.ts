/**
 * MCP Sync Route
 * Allows the client to sync data for MCP queries
 */

import { FastifyRequest, FastifyReply } from "fastify";
import { mcpStorage } from "../services/mcp-storage.js";

interface SyncRequest {
    activities: Array<{
        id: number;
        text: string;
        category: string;
        createdAt: number;
    }>;
    categories: Array<{
        name: string;
        description?: string;
        broadCategory?: string;
        totalMinutes: number;
        activityCount: number;
        createdAt: number;
        lastUsedAt: number;
    }>;
}

export async function mcpSync(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    try {
        // Data is now always loaded from SQLite, so syncing is not needed
        reply.send({
            success: true,
            synced: null,
            message: 'MCPStorage now uses SQLite. No sync needed.'
        });
    } catch (error) {
        console.error("MCP sync error:", error);
        reply.status(500).send({
            error: "Failed to sync data for MCP",
            details: error instanceof Error ? error.message : String(error),
        });
    }
}
