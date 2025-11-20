import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./css/styles.css";
import "./lib/mcp-sync";

createRoot(document.getElementById("root")!).render(<App />);
