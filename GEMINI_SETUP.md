# Switching to Gemini API

## Setup Instructions

1. **Get a Gemini API Key:**

   - Visit: https://makersuite.google.com/app/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the key

2. **Update your `.env` file:**

   ```
   GEMINI_API_KEY=your_key_here
   ```

3. **Build and start:**

   ```bash
   npm run build
   npm run server
   ```

4. **Access the app:** Open http://localhost:3000

## What Changed

- ✅ Switched from OpenAI to **Google Gemini (gemini-1.5-flash)**
- ✅ **IndexedDB storage** now working with full CRUD operations
- ✅ Activities are saved locally in your browser
- ✅ Categories are tracked and reused
- ✅ **Trends component** shows real data from the database
- ✅ Weekly/Monthly/Yearly trend aggregation

## Testing the Database

You can test the database directly by running:

```bash
npm run dev
# Then open the browser console and run:
# import { testDatabase } from './src/test-db'
# testDatabase()
```

## API Changes

All three endpoints now use Gemini:

- `/api/categorize` - Uses gemini-1.5-flash
- `/api/insights` - Uses gemini-1.5-flash
- `/api/merge-categories` - Uses gemini-1.5-flash

## Storage Features

The IndexedDB storage includes:

- **Activities table** - All logged activities with auto-increment IDs
- **Categories table** - Category stats (count, minutes, last used)
- **Aggregates table** - Pre-computed weekly/monthly/yearly totals
- **Search** - Full-text search across activities
- **Filtering** - By category, date range, time period
- **Merging** - Combine similar categories
