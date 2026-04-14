import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Initialize Gemini once if API key is available at startup
const globalApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

// API route to handle AI responses
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    const apiKey = globalApiKey || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "API Key is missing. Please add GOOGLE_GENERATIVE_AI_API_KEY in Vercel Settings." });
    }

    const ai = new GoogleGenAI({ apiKey });
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
    if (!res.headersSent) {
      res.status(500).json({ error: "AI failed to respond", details: error.message });
    } else {
      res.end();
    }
  }
});

// Handle Frontend
if (process.env.NODE_ENV !== "production") {
  // Dynamic import for Vite only in development
  import("vite").then(({ createServer: createViteServer }) => {
    createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then((vite) => {
      app.use(vite.middlewares);
      const PORT = 3000;
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    });
  });
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

export default app;
