import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedFile } from "../types";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY as string 
});

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

export async function generateArchitecture(prompt: string, history: any[] = []): Promise<{ explanation: string, files: GeneratedFile[] }> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: [
        ...history.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            files: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: { 
                  name: { type: Type.STRING }, 
                  content: { type: Type.STRING } 
                },
                required: ["name", "content"]
              }
            }
          },
          required: ["explanation", "files"]
        }
      }
    });

    const data = JSON.parse(response.text);
    return data;
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
}
