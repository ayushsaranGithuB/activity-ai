/**
 * MCP Route
 * Handles MCP protocol requests over HTTP POST
 */

import { FastifyRequest, FastifyReply } from "fastify";
import { mcpStorage } from "../services/mcp-storage.js";

interface MCPRequest {
    method: string;
    params?: {
        name?: string;
        arguments?: any;
    };
}

interface MCPToolCall {
    name: string;
    arguments?: any;
}

const TOOLS = [
    {
        name: "query_activities",
        description: "Query activities with optional filters. Returns activities matching the criteria.",
        inputSchema: {
            type: "object",
            properties: {
                category: {
                    type: "string",
                    description: "Filter by category name",
                },
                startDate: {
                    type: "number",
                    description: "Filter activities after this timestamp (Unix milliseconds)",
                },
                endDate: {
                    type: "number",
                    description: "Filter activities before this timestamp (Unix milliseconds)",
                },
                limit: {
                    type: "number",
                    description: "Maximum number of activities to return (default: 50)",
                },
                offset: {
                    type: "number",
                    description: "Offset for pagination (default: 0)",
                },
            },
        },
    },
    {
        name: "get_activity_stats",
        description: "Get overall statistics about logged activities including total count, categories, date ranges, and top categories.",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "query_categories",
        description: "Get information about categories including activity counts, time spent, and broad category groupings.",
        inputSchema: {
            type: "object",
            properties: {
                broadCategory: {
                    type: "string",
                    description: "Filter by broad category (Work, Food, Physical Activity, Entertainment, Home & Household, Health, Social, Learning & Education, Other)",
                },
                minActivities: {
                    type: "number",
                    description: "Only return categories with at least this many activities",
                },
            },
        },
    },
    {
        name: "get_trends",
        description: "Get time-based trend analysis for a specific period (week, month, or year).",
        inputSchema: {
            type: "object",
            properties: {
                period: {
                    type: "string",
                    enum: ["week", "month", "year"],
                    description: "Time period for trend analysis",
                },
                startDate: {
                    type: "number",
                    description: "Start of period (Unix milliseconds). If not provided, uses current period.",
                },
            },
            required: ["period"],
        },
    },
    {
        name: "search_activities",
        description: "Full-text search across activity text and categories. Returns matching activities.",
        inputSchema: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "Search query text",
                },
                limit: {
                    type: "number",
                    description: "Maximum number of results (default: 50)",
                },
            },
            required: ["query"],
        },
    },
    {
        name: "get_recent_activities",
        description: "Get the most recently logged activities.",
        inputSchema: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Number of recent activities to return (default: 20)",
                },
            },
        },
    },
    {
        name: "get_category_breakdown",
        description: "Get a detailed breakdown of activities by category with time spent and percentages.",
        inputSchema: {
            type: "object",
            properties: {
                startDate: {
                    type: "number",
                    description: "Start date for analysis (Unix milliseconds)",
                },
                endDate: {
                    type: "number",
                    description: "End date for analysis (Unix milliseconds)",
                },
            },
        },
    },
];

async function handleToolCall(toolCall: MCPToolCall): Promise<any> {
    const { name, arguments: args } = toolCall;

    switch (name) {
        case "query_activities": {
            const activities = mcpStorage.queryActivities({
                category: args?.category,
                startDate: args?.startDate,
                endDate: args?.endDate,
                limit: args?.limit || 50,
                offset: args?.offset || 0,
            });
            return { activities, count: activities.length };
        }

        case "get_activity_stats": {
            return mcpStorage.getStats();
        }

        case "query_categories": {
            const categories = mcpStorage.queryCategories({
                broadCategory: args?.broadCategory,
                minActivities: args?.minActivities,
            });
            return { categories, count: categories.length };
        }

        case "get_trends": {
            return mcpStorage.getTrends({
                period: args?.period,
                startDate: args?.startDate,
            });
        }

        case "search_activities": {
            const results = mcpStorage.searchActivities(
                args?.query,
                args?.limit || 50
            );
            return { results, count: results.length };
        }

        case "get_recent_activities": {
            const activities = mcpStorage.getRecentActivities(args?.limit || 20);
            return { activities, count: activities.length };
        }

        case "get_category_breakdown": {
            const breakdown = mcpStorage.getCategoryBreakdown({
                startDate: args?.startDate,
                endDate: args?.endDate,
            });
            return { breakdown };
        }

        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}

export async function mcp(
    request: FastifyRequest,
    reply: FastifyReply
): Promise<void> {
    try {
        const mcpRequest = request.body as MCPRequest;

        // Handle different MCP methods
        switch (mcpRequest.method) {
            case "tools/list":
                reply.send({
                    tools: TOOLS,
                });
                break;

            case "tools/call":
                if (!mcpRequest.params?.name) {
                    reply.status(400).send({ error: "Tool name is required" });
                    return;
                }

                const result = await handleToolCall({
                    name: mcpRequest.params.name,
                    arguments: mcpRequest.params.arguments,
                });

                reply.send({
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                });
                break;

            case "initialize":
                reply.send({
                    protocolVersion: "2024-11-05",
                    capabilities: {
                        tools: {},
                    },
                    serverInfo: {
                        name: "activity-ai",
                        version: "1.0.0",
                    },
                });
                break;

            default:
                reply.status(400).send({
                    error: `Unknown MCP method: ${mcpRequest.method}`,
                });
        }
    } catch (error) {
        console.error("MCP error:", error);
        reply.status(500).send({
            error: "MCP request failed",
            details: error instanceof Error ? error.message : String(error),
        });
    }
}
