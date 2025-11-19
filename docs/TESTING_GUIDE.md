# Testing Guide - Activity AI Database

## Quick Start

### 1. Start the Development Server

Open a terminal and run:

```bash
npm run dev
```

This starts the Vite dev server (usually on http://localhost:5173)

### 2. Start the API Server

Open **another terminal** and run:

```bash
npm run server
```

This starts the Express API server on http://localhost:3000

> **Important**: Make sure you have a `.env` file with `GEMINI_API_KEY` set for the AI categorization to work.

---

## Testing the Database

### Method 1: Using the Test Button in the UI

1. Open the app in your browser (http://localhost:5173)
2. Go to the **Log** screen
3. Click the **🧪 Test Database** button
4. Open the browser console (F12 → Console tab)
5. You'll see detailed output of all database operations

The test will:

- Initialize the database
- Add 3 sample activities
- Create sample categories
- Test search functionality
- Test category filtering
- Display database statistics

### Method 2: Using Browser Console

Open the browser console (F12) and run:

```javascript
// Import and run the test
import { testDatabase } from "./src/test-db";
await testDatabase();
```

Or use the storage API directly:

```javascript
import { storage } from "./src/lib/storage";

// Initialize
await storage.init();

// Add an activity
const activity = await storage.addActivity({
  text: "Testing the database",
  category: "Development",
  createdAt: Date.now(),
});
console.log("Added:", activity);

// Get all activities
const all = await storage.getAllActivities();
console.log("All activities:", all);

// Get stats
const stats = await storage.getStats();
console.log("Database stats:", stats);
```

---

## Using the Log Screen

### Features Available:

#### 1. **Add Activities**

- Type your activity in the input field
- Press Enter or click "Save"
- The AI will categorize it automatically
- It will appear in the activity log below

#### 2. **View Activity Log**

- See all saved activities
- Each shows:
  - Activity text
  - Category (color-coded)
  - Timestamp (e.g., "2h ago", "3d ago")
  - Unique ID

#### 3. **Search Activities**

- Use the search box to filter by text or category
- Results update in real-time

#### 4. **Filter by Category**

- Use the dropdown to filter by specific category
- Shows "All Categories" by default

#### 5. **Delete Activities**

- Click the "Delete" button on any activity
- Confirms before deletion

#### 6. **Clear All Data**

- Click "🗑️ Clear All Data" button
- Confirms before clearing everything
- Use this to reset your database

---

## Manual Testing Checklist

- [ ] Add a new activity and verify it appears in the log
- [ ] Add multiple activities with different categories
- [ ] Search for activities by text
- [ ] Filter activities by category
- [ ] Delete an activity
- [ ] Verify activities persist after page refresh
- [ ] Run the database test and check console output
- [ ] Clear all data and verify everything is removed

---

## Common Issues

### Issue: "Failed to save activity"

**Solution**: Make sure the API server is running on port 3000 (`npm run server`)

### Issue: Activities don't persist after refresh

**Solution**: Check browser console for IndexedDB errors. Try clearing browser data and reloading.

### Issue: Database test button doesn't work

**Solution**: Open browser console to see error details. Make sure `test-db.ts` is properly imported.

### Issue: No categories showing

**Solution**: Add at least one activity first. Categories are created when activities are added.

---

## Database Operations Reference

### View Database in Browser DevTools

1. Open DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Expand **IndexedDB** → **ActivityAI**
4. You can inspect:
   - `activities` - All logged activities
   - `categories` - Category metadata
   - `aggregates` - Time-based aggregations

### Programmatic Access

```javascript
// In browser console:
import { storage } from "./src/lib/storage";

// Get all activities
await storage.getAllActivities();

// Search activities
await storage.searchActivities("breakfast");

// Get activities by category
await storage.getActivitiesByCategory("Exercise");

// Get database statistics
await storage.getStats();

// Clear everything
await storage.clearAllData();
```

---

## Next Steps

Once the database is working:

1. Add more activities to build up your log
2. Check the **Trends** tab to see aggregated insights
3. Test the AI categorization with various activity types
4. Explore the merge categories feature for duplicate categories

Happy testing! 🎉
