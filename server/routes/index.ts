// API Routes Configuration

import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { categorize } from "./categorize.js";
import { insights } from "./insights.js";
import { mergeCategories } from "./merge-categories.js";
import { conversation } from "./conversation.js";
import { health } from "./health.js";
import { trendsSummary } from "./trends-summary.js";
import { mcp } from "./mcp.js";
import { mcpSync } from "./mcp-sync.js";

export default async function routes(
    fastify: FastifyInstance,
    _options: FastifyPluginOptions
): Promise<void> {
    fastify.post("/categorize", categorize);
    fastify.post("/insights", insights);
    fastify.post("/merge-categories", mergeCategories);
    fastify.post("/conversation", conversation);
    fastify.post("/trends-summary", trendsSummary);
    fastify.get("/health", health);

    // MCP routes
    fastify.post("/mcp", mcp);
    fastify.post("/mcp/sync", mcpSync);
}
