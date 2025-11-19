# Activity AI — Backend API Specification

This document defines how the frontend communicates with the backend AI server.

The frontend sends freeform activity text.  
The backend responds with a category.

---

# 📌 Base URL

```
http://localhost:3000
```

(Production may differ.)

---

# 🟦 POST /api/categorize

Categorizes an activity string using the AI agent.

### Request

```http
POST /api/categorize
Content-Type: application/json
```

### Body

```json
{
  "text": "Making breakfast"
}
```

### Successful Response

```json
{
  "category": "Meals"
}
```

### Error Response

```json
{
  "category": "Uncategorized",
  "error": "AI service unreachable"
}
```

# 🟦 POST /api/insights (Optional Future Feature)

Generates insights about user trends.

### Body

```json
{
  "history": [ ... ],
  "categories": [ ... ],
  "weeklyTotals": {},
  "monthlyTotals": {},
  "yearlyTotals": {}
}
```

### Response

```json
{
  "insight": "You spent more time on Work this week."
}
```

# 🟦 POST /api/merge-categories (Optional)

Suggests which categories should be merged.

### Body

```json
{
  "categories": ["Running", "Jogging", "Exercise"]
}
```

### Response

```json
{
  "merges": [{ "from": "Jogging", "into": "Exercise" }]
}
```

# 🏗 Tech Notes

- Uses Express.js
- Uses a single route for categorization
- AI model can be:
  - OpenAI GPT-4o-mini
  - OpenAI GPT-3.5
  - Gemini Pro
  - Any LLM with a basic completion/chat endpoint
- The server is intentionally minimal and can be extended later.

---

# Activity AI — Storage Model

This document describes the client-side storage architecture for the Activity AI project. Storage can use **IndexedDB** (recommended for MVP) or **SQLite** (recommended for production).

---

# 📚 Overview

We store three main kinds of data:

1. **Activities** — each freeform user entry
2. **Categories** — AI-generated or user-inferred categories
3. **Aggregates** — weekly/monthly/yearly totals (for trends)

---

# 🗄 Activity Table

| Field     | Type               | Description                    |
| --------- | ------------------ | ------------------------------ |
| id        | integer (auto)     | Primary key                    |
| text      | string             | Original user-entered activity |
| category  | string             | AI-assigned category           |
| createdAt | number (timestamp) | When the activity was logged   |
| meta      | object (optional)  | AI metadata, embeddings, etc   |

### Example

```json
{
  "id": 42,
  "text": "Morning run",
  "category": "Exercise",
  "createdAt": 1715083200000
}
```

# 🏷 Category Table

Field Type Description name string Category name (primary key) description string Optional totalMinutes number Accumulated duration createdAt number First appearance

### Example

```json
{
  "name": "Meals",
  "description": "Food-related activities",
  "totalMinutes": 320,
  "createdAt": 1715000000000
}
```

# 📊 Aggregate Table

Supports:

- weekly totals
- monthly totals
- yearly totals

Field Type Description category string Foreign key reference period "week" / "month" / "year" Time period type periodStart number (timestamp) Beginning of period totalMinutes number Total minutes inside that period

### Example

```json
{
  "category": "Exercise",
  "period": "month",
  "periodStart": 1714521600000,
  "totalMinutes": 210
}
```

# 🧩 Future Extensions

### Embeddings Table (for AI clustering)

```
id            (activity id)
vector        (Float32Array or JSON)
categoryGuess (string)
```

### Category Merge Table

Used when the AI refactors categories.

# ⚙ Recommended Storage Engines

### MVP

**IndexedDB**

- Zero setup
- Can handle freeform data easily

### Production

**SQLite (via Capacitor SQLite)**

Best for:

- large datasets
- trend computation
- analytics
- embedding search

---

# ✔ Summary

This model supports:

- Freeform user input
- AI-driven categorization
- Automatic evolution of categories
- Weekly/monthly/yearly insights
- Future ML capabilities (embeddings, clustering)

It is simple, scalable, and designed for an AI-first UX.
