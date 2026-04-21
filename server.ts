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

// API route to handle AI responses for Lumina Studio VFS Generation
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    
    // Support multiple variable names for better compatibility
    const apiKey = process.env.GEMINI_API_KEY || 
                   process.env.GOOGLE_API_KEY || 
                   process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    
    if (!apiKey) {
      console.error("ENVIRONMENT ERROR: No API Key found in process.env");
      return res.status(500).json({ 
        error: "Missing API Key", 
        details: "Please add GEMINI_API_KEY or GOOGLE_API_KEY in your Vercel Environment Variables." 
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            explanation: { type: "STRING" },
            files: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: { 
                  name: { type: "STRING" }, 
                  content: { type: "STRING" } 
                },
                required: ["name", "content"]
              }
            }
          },
          required: ["explanation", "files"]
        },
        systemInstruction: `You are Lumina AI Studio, a Full-Stack Meta-Builder.
        
        TASK:
        Generate a "Virtual File System" (VFS) based on user instructions.
        
        MANDATORY FILES (Must always be included);
        1. 'index.html': Standard entry point using Tailwind CDN.
        2. 'manifest.json': PWA configuration.
        3. 'firebase.ts': Setup and initialization code.
        4. 'firestore.rules': Security rules if Firestore is being structured.

        STRICT RULES:
        - For 'firestore.rules', ensure standard secure patterns (auth != null).
        - Output strictly valid JSON.`,
      }
    });

    const data = JSON.parse(response.text.trim());
    res.json(data);
  } catch (error: any) {
    console.error("Gemini Server Error:", error);
    res.status(500).json({ error: "Architecture synchronization failed", details: error.message });
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
