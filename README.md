# Activity AI — TypeScript + React + Vite + Capacitor

A local-first activity logging app that uses **AI to categorize and analyze user activities**.  
Built with **React + TypeScript + Vite**, packaged for mobile with **Capacitor**, and powered by **Google Gemini AI**.

---

## 🚀 Features

- **Conversational AI interface** — Chat with the AI to log activities naturally
- **AI-powered categorization** using Google Gemini (gemini-2.5-flash-lite)
- **Activity logging and management** with persistent local storage
- **Trend analysis** — View weekly, monthly, and yearly activity trends
- **React + TypeScript** frontend with TanStack Router
- **Capacitor Android app support**
- **Modular components** and screens (Chat, Logs, Settings, Trends)
- **Local SQLite storage** for offline functionality
- **Notification system** for activity reminders
- Ready for:
  - Advanced analytics and insights
  - Data export/import
  - PWA support

---

## 📦 Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- TanStack Router
- Capacitor (Android target)
- Tailwind CSS + shadcn/ui components

### AI

- Google Gemini AI (gemini-2.5-flash-lite)

### Storage

- SQLite (via Capacitor SQLite plugin)
- Local file system for backups

---

## 📁 Folder Structure

```
activity-ai/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── capacitor.config.json
├── tailwind.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── router.tsx
│   ├── agent/
│   │   ├── agent.ts
│   │   ├── model.ts
│   │   ├── prompt.ts
│   │   └── tools.ts
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── logs/
│   │   └── dummyData/
│   ├── css/
│   ├── db/
│   │   └── migrations/
│   ├── lib/
│   │   ├── ai.ts
│   │   ├── db.ts
│   │   └── utils.ts
│   ├── prompts/
│   ├── screens/
│   │   ├── Chat.tsx
│   │   ├── Logs.tsx
│   │   ├── Settings.tsx
│   │   └── Trends.tsx
│   ├── types/
│   └── utils/
├── android/
├── public/
└── scripts/
```

---

## 🧪 Running the Project

### Prerequisites

- Node.js 18+
- Google Gemini API key (get from [Google AI Studio](https://makersuite.google.com/app/apikey))

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

Create a `.env` file in the root directory:

```
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Start the development server

```bash
npm run dev
```

Visit: http://localhost:5173

### 📱 Building the Android App

1. Build for production:

```bash
npm run build
```

2. Sync with Capacitor:

```bash
npm run cap:sync
```

3. Open in Android Studio:

```bash
npm run cap:open-android
```

From Android Studio, you can:
- Build a debug APK
- Build a release APK
- Run directly on a device

---

## 🤖 AI Integration

The app uses Google Gemini AI for:
- Activity categorization
- Conversational responses
- Trend summaries
- Intelligent activity detection from natural language

AI calls are made directly from the frontend using the `@google/genai` library.

---

## 🔮 Key Components

- **Chat Screen**: Conversational interface with the AI agent
- **Logs Screen**: View and manage logged activities
- **Trends Screen**: Analyze activity patterns over time
- **Settings Screen**: Configure notifications, data management, and app preferences

---

## 📄 License

MIT — free to use and extend.
