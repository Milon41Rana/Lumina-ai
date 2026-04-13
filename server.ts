import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// API route to handle AI responses
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;

  // Check for API key inside the request to be safe
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("ERROR: API Key is missing!");
    return res.status(500).json({ 
      error: "API Key is missing in Vercel environment variables. Please add GOOGLE_GENERATIVE_AI_API_KEY in Vercel settings." 
    });
  }

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Set headers for streaming
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
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

    if (error.status === 429 || (error.message && error.message.includes("429"))) {
      statusCode = 429;
      errorMessage = "Rate limit exceeded. Please try again in a few seconds.";
    }

    if (!res.headersSent) {
      res.status(statusCode).json({ error: errorMessage, details: error.message });
    } else {
      res.write(`\n\n[Error: ${errorMessage}]`);
      res.end();
    }
  }
});

// Vite middleware for development vs static for production
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
  
  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

export default app;
