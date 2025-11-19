import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import modules
import { initializeAI } from "./services/ai.js";
import { setupCORS } from "./middleware/cors.js";
import { config, setDistPath } from "./config.js";
import apiRoutes from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize AI service
const aiInitialized = initializeAI(process.env.GEMINI_API_KEY);

// Setup Express app
const app = express();
app.use(bodyParser.json());

// Serve static files from the dist directory
const distPath = path.join(__dirname, "..", "dist");
setDistPath(distPath);
app.use(express.static(distPath));

// Apply middleware
app.use(setupCORS);

// Mount API routes
app.use("/api", apiRoutes);

// Start server
const PORT = config.port;
const server = app.listen(PORT, () => {
  console.log(`AI API server running at http://localhost:${PORT}`);
  console.log(`Serving frontend from: ${distPath}`);
  console.log(
    `Gemini API Key: ${aiInitialized ? "✓ Configured" : "✗ Missing"}`
  );
});

// Handle server errors
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
