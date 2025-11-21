import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initializeAI } from "./lib/ai";
import { GEMINI_API_KEY } from "./ai-key";
import "./css/styles.css";
import "./lib/mcp-sync";

// Initialize Gemini AI with personal key (local only)
initializeAI(GEMINI_API_KEY);

createRoot(document.getElementById("root")!).render(<App />);
