import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini with the requested environment variable
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || "";
  const ai = new GoogleGenAI({ apiKey });

  // API route to handle AI responses
  app.post("/api/chat", async (req, res) => {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    try {
      // Set headers for streaming
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Transfer-Encoding", "chunked");

      const chat = ai.chats.create({
        model: "gemini-3-flash-preview", // Switched from 3.1 Pro to 3 Flash to avoid quota issues
        config: {
          systemInstruction: "You are Z-Assistant, a professional research partner who analyzes text and YouTube videos.",
        },
        history: history || [],
      });

      const result = await chat.sendMessageStream({ message });

      for await (const chunk of result) {
        if (chunk.text) {
          res.write(chunk.text);
        }
      }
      res.end();
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      
      let errorMessage = "Failed to generate AI response";
      let statusCode = 500;

      // Check for quota exceeded error (429)
      if (error.status === 429 || (error.message && error.message.includes("429"))) {
        statusCode = 429;
        errorMessage = "The AI is currently busy (rate limit exceeded). Please try again in a few seconds.";
      }

      if (!res.headersSent) {
        res.status(statusCode).json({ error: errorMessage });
      } else {
        // If we already started streaming, we can't change the status code
        // but we can write the error message to the stream
        res.write(`\n\n[Error: ${errorMessage}]`);
        res.end();
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
