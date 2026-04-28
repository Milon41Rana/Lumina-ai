import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedFile } from "../types";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY as string 
});

const systemInstruction = `You are Lumina AI Studio v4, the core architectural logic of an autonomous Full-Stack IDE.
        
GOAL:
Develop 100% production-ready, ultra-minimalist, high-performance web applications.

ARCHITECTURE REQUIREMENTS:
1. Pure White Minimalist UI: Use Tailwind CSS, Inter font, and gray-900/white palette.
2. Semantic Structure: Valid HTML5, accessible components, and modern JS.
3. Virtual File Mapping: Generate a set of files that form a complete system.
4. Performance: Tiny bundles, optimized assets (via CDN), and clean code.

REQUIRED VIRTUAL OUTPUTS:
- index.html: EntryPoint with a cohesive style guide in the head.
- manifest.json: Standards-compliant PWA manifest.
- app.js: Modular, event-driven client logic.
- lib/utils.js: Helper functions.
- firebase-config.js: Template for Firebase/Auth integration.

OUTPUT FORMAT:
Strict JSON. Return two keys: 'explanation' and 'files' (array of {name, content}).
Return ONLY the JSON object.`;

export async function generateArchitecture(prompt: string, history: any[] = []): Promise<{ explanation: string, files: GeneratedFile[] }> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { role: 'user', parts: [{ text: `System Context: ${systemInstruction}` }] },
        ...history.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
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
