import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initializeAI } from "./lib/ai";
import { GEMINI_API_KEY } from "./ai-key";
import "./css/styles.css";
import "./lib/mcp-sync";
import { Keyboard } from "@capacitor/keyboard";

// Initialize Gemini AI with personal key (local only)
initializeAI(GEMINI_API_KEY);

// Add keyboard listeners for better mobile experience
Keyboard.addListener("keyboardWillShow", () => {
  document.body.classList.add("keyboard-open");
});

Keyboard.addListener("keyboardWillHide", () => {
  document.body.classList.remove("keyboard-open");
});

// Optional: Set resize mode (commented out as adjustResize in manifest handles it)
// Keyboard.setResizeMode({ mode: 'body' });

createRoot(document.getElementById("root")!).render(<App />);
