import { createRoot } from "react-dom/client";
import { initializeAI } from "./lib/ai";
import "./css/styles.css";
import { Capacitor } from "@capacitor/core";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { initDB } from "./db/initialize";

// Initialize Gemini AI with API key from environment variables
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY environment variable is not set");
} else {
  initializeAI(apiKey);
}

// Add keyboard listeners for better mobile experience (only on native platforms)
if (Capacitor.isNativePlatform()) {
  // Ensure SQLite DB is initialized early on native platforms
  (async () => {
    try {
      await initDB();
      console.debug("SQLite DB initialized");
    } catch (e) {
      console.error("Failed to initialize SQLite DB on startup:", e);
    }
  })();
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

createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);
