# Activity AI MCP Integration

Your Fastify server now includes MCP (Model Context Protocol) support, allowing you to query your activities through AI assistants like Claude.

## How It Works

1. **Auto-Sync**: When you load the app, it automatically syncs your IndexedDB data to the server
2. **MCP Queries**: The server exposes MCP tools that can query your activities, categories, and trends
3. **HTTP-Based**: Uses HTTP POST requests for MCP protocol communication

## Setup in Claude Desktop

Add this to your Claude Desktop configuration file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json` **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "activity-ai": {
      "command": "curl",
      "args": [
        "-X",
        "POST",
        "http://localhost:3001/api/mcp",
        "-H",
        "Content-Type: application/json",
        "-d"
      ],
      "transport": "stdio"
    }
  }
}
```

## Alternative: Using the MCP Web Interface

Since this is HTTP-based, you can also query directly:

```bash
# List available tools
curl -X POST http://localhost:3001/api/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/list"}'

# Get activity stats
curl -X POST http://localhost:3001/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "get_activity_stats"
    }
  }'

# Query activities
curl -X POST http://localhost:3001/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "method": "tools/call",
    "params": {
      "name": "query_activities",
      "arguments": {
        "category": "Coding",
        "limit": 10
      }
    }
  }'
```

## Available MCP Tools

1. **query_activities** - Search and filter activities

   - Filter by category, date range
   - Pagination support

2. **get_activity_stats** - Get overall statistics

   - Total activities and categories
   - Top categories
   - Broad category breakdown
   - Date ranges

3. **query_categories** - Get category information

   - Filter by broad category
   - Minimum activity threshold

4. **get_trends** - Time-based trend analysis

   - Week, month, or year periods
   - Activity counts and time spent

5. **search_activities** - Full-text search

   - Search across activity text and categories

6. **get_recent_activities** - Get latest activities

   - Configurable limit

7. **get_category_breakdown** - Detailed category analysis
   - Time spent per category
   - Percentage calculations
   - Date range filtering

## Usage Examples

Once set up, you can ask Claude:

- "What activities have I logged in the past week?"
- "Show me my top 5 categories"
- "How much time have I spent on Work activities this month?"
- "Search for activities about meetings"
- "What are my recent activities?"
- "What's my activity breakdown by category?"
- "Show me trends for the last year"

## Manual Sync

The app auto-syncs on page load, but you can also manually trigger a sync:

```javascript
import { syncToMCP } from "./lib/mcp-sync";

// Trigger sync
await syncToMCP();
```

## Development

The MCP integration consists of:

- **Server Routes**:

  - `/api/mcp` - MCP protocol handler
  - `/api/mcp/sync` - Data sync endpoint

- **Client**:

  - `src/lib/mcp-sync.ts` - Auto-sync utility

- **Server Services**:
  - `server/services/mcp-storage.ts` - In-memory storage for queries
  - `server/routes/mcp.ts` - MCP request handler
  - `server/routes/mcp-sync.ts` - Sync endpoint

## Notes

- Data is synced to server memory (not persistent)
- Restart the server to clear synced data
- Auto-syncs on every page load to keep data fresh
- All timestamps are Unix milliseconds
- Activity duration is assumed to be 5 minutes each
