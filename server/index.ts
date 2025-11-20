import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyCors from "@fastify/cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import modules
import { initializeAI } from "./services/ai.js";
import { config, setDistPath } from "./config.js";
import apiRoutes from "./routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize AI service
const aiInitialized = initializeAI(process.env.GEMINI_API_KEY);

// Setup Fastify app
const fastify = Fastify({
    logger: false,
});

// Setup CORS
await fastify.register(fastifyCors, {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
});

// Serve static files from the dist directory
const distPath = path.join(__dirname, "..", "dist");
setDistPath(distPath);

await fastify.register(fastifyStatic, {
    root: distPath,
    prefix: "/",
});

// Register API routes
await fastify.register(apiRoutes, { prefix: "/api" });

// Start server
const PORT = config.port;

try {
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`AI API server running at http://localhost:${PORT}`);
    console.log(`Serving frontend from: ${distPath}`);
    console.log(
        `Gemini API Key: ${aiInitialized ? "✓ Configured" : "✗ Missing"}`
    );
} catch (err) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use`);
    } else {
        console.error("Server error:", err);
    }
    process.exit(1);
}

// Graceful shutdown
const closeGracefully = async (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down server...`);
    await fastify.close();
    console.log("Server closed");
    process.exit(0);
};

process.on("SIGINT", () => closeGracefully("SIGINT"));
process.on("SIGTERM", () => closeGracefully("SIGTERM"));
