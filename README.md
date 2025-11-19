# Activity AI — TypeScript + React + Vite + Capacitor

A minimal, local-first activity logging app that uses **AI to categorize user activities**.  
Built with **React + TypeScript + Vite**, packaged for mobile with **Capacitor**, and powered by an **Express AI API backend**.

---

## 🚀 Features

- **Freeform activity input** — users type "what they're up to"
- **AI-powered categorization** using OpenAI (gpt-3.5 / gpt-4o-mini / any model you choose)
- **React + TypeScript** frontend
- **Capacitor Android app support**
- **Modular components** (`ActivityInput`, `Trends`)
- **Simple CSS with easy extension points**
- Clean and structured file layout
- Ready for:
  - Offline storage (IndexedDB or SQLite)
  - Trend analytics
  - Integration with charts, embeddings, vector search, etc.

---

## 📦 Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- Capacitor (Android target)

### Backend (local server)

- Express
- OpenAI API via fetch

### AI

- Uses the OpenAI Completion API (can easily switch to Chat Completions)

---

## 📁 Folder Structure

activity-ai-ts/ │ ├── index.html ├── package.json ├── tsconfig.json ├── vite.config.ts ├── capacitor.config.json │ ├── src/ │ ├── main.tsx │ ├── App.tsx │ ├── styles.css │ └── components/ │ ├── ActivityInput.tsx │ └── Trends.tsx │ └── server/ └── index.js

---

## 🧪 Running the Project

### 1. Install dependencies

```bash
npm install
```

2. Start the AI backend (Express)

Set your API key:

export OPENAI_API_KEY="your-key-here"

Start server:

npm run server

The server runs at:

http://localhost:3000

3. Start the frontend npm run dev

Visit:

http://localhost:5173

📱 Building the Android App

After running a production build:

npm run build

Sync Capacitor:

npm run cap:sync

Open Android Studio:

npm run cap:open-android

From there, you can:

Build a debug APK

Build a release APK

Run directly on a device

🤖 AI Endpoint

The frontend sends:

POST /api/categorize

Body:

{ "text": "Going for a run" }

Response:

{ "category": "Exercise" }

You can upgrade this endpoint later to:

Use embeddings

Store categories persistently

Generate insights

Auto-discover new categories

🔮 Future Improvements (Optional)

Persistent storage (IndexedDB/SQLite)

Weekly/monthly/yearly trends

Sparkline mini-charts

On-device AI models (Gemini Nano, Llama Edge)

PWA support

Export/import user data

📄 License

MIT — free to use and extend.
