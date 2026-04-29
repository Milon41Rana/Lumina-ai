import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// API route to handle Gemini generation for VFS mapping
const systemInstruction = `You are Lumina AI Studio v4 Architect.
        
CORE PROTOCOL:
Generate 100% production-ready systems using "Virtual File Mapping" (VFS).
Every response must be a cohesive project structure.

VFS RULES:
1. "index.html" must be the root entry point.
2. Code must be minimalist, white-themed, and use Tailwind CSS.
3. Logic should be modular and documented.
4. If a user asks for a feature, update ALL relevant files in the mapping.

OUTPUT SPECIFICATION:
Return a JSON object with:
- "explanation": Brief architectural overview.
- "files": Array of { "name": string, "content": string }.

MODEL BEHAVIOR:
Focus on UI craftsmanship and system integrity. No placeholders.`;

app.post("/api/generate", async (req, res) => {
  try {
    const { prompt, history } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (!apiKey || apiKey === "") {
      console.error("CRITICAL: API Key is missing from environment variables.");
      return res.status(500).json({ 
        error: "API Key is not configured.",
        suggestion: "Please add GEMINI_API_KEY to your project environment."
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    let mappedHistory = (history || []).map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    // Ensure history starts with 'user' role
    while (mappedHistory.length > 0 && mappedHistory[0].role !== 'user') {
      mappedHistory.shift();
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: mappedHistory.length > 0 ? [...mappedHistory, { role: "user", parts: [{ text: prompt }] }] : [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction
      }
    });

    let text = response.text || "";
    
    // Clean JSON from potential markdown tags
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch (parseError) {
      console.error("Parse Error:", text);
      res.status(500).json({ error: "Failed to parse AI response as JSON", raw: text });
    }
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "Architect server online", model: "Gemini 3.1 Flash Lite" });
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

// In some environments, we don't call listen, or it's handled by the platform
if (process.env.NODE_ENV === "production" && !process.env.VERCEL) {
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Production server running on port ${PORT}`);
  });
}

export default app;
