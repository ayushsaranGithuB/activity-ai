import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initializeAI } from "./lib/ai";
import "./css/styles.css";
import "./lib/mcp-sync";
import { Capacitor } from "@capacitor/core";

// Initialize Gemini AI with API key from environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY environment variable is not set");
} else {
  initializeAI(apiKey);
}

// Add keyboard listeners for better mobile experience (only on native platforms)
if (Capacitor.isNativePlatform()) {
  import("@capacitor/keyboard")
    .then(({ Keyboard }) => {
      Keyboard.addListener("keyboardWillShow", () => {
        const inputSection = document.querySelector(
          ".input-section"
        ) as HTMLElement;
        if (inputSection) {
          inputSection.style.bottom = "60px";
        }
      });

      Keyboard.addListener("keyboardWillHide", () => {
        const inputSection = document.querySelector(
          ".input-section"
        ) as HTMLElement;
        if (inputSection) {
          inputSection.style.bottom = "0";
        }
      });
    })
    .catch((error) => {
      console.warn("Keyboard plugin not available:", error);
    });
}

createRoot(document.getElementById("root")!).render(<App />);
