import { GoogleGenerativeAI } from "@google/generative-ai";
import { STADIUM_LORE } from "../src/utils/constants";
import { VENUE_LOCATIONS } from "../utils/directions";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env._VITE_GEMINI_API_KEY;
const genAI = API_KEY && API_KEY !== 'your_gemini_api_key_here' ? new GoogleGenerativeAI(API_KEY) : null;

// Rate limiter state - 8 seconds to be safe
let lastCallTime = 0;
const COOLDOWN_MS = 8000;

export const getGeminiResponse = async (userMessage, context, history = []) => {
  console.log('🔥 AI thinking with context and memory...');
  
  // Rate limiter to save quota
  const now = Date.now();
  if (now - lastCallTime < COOLDOWN_MS) {
    return "Whoa, that's fast! Give me a second to catch my breath... 🏃💨 (Try again in a few moments)";
  }
  lastCallTime = now;

  if (!genAI) {
    console.warn("Gemini API key missing. Check VITE_GEMINI_API_KEY.");
    return "AI Concierge is currently offline (API key not configured). Please check the environment settings.";
  }

  try {
    // List of models to try in order of preference (2026 Latest)
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
      "gemini-3-flash-preview",
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-pro"
    ];

    let lastError = null;
    let model;

    // Try each model until one works
    for (const modelName of modelsToTry) {
      try {
        console.log(`🤖 Consulting: ${modelName}...`);
        model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: `You are VenIQ — the elite AI Concierge for ${STADIUM_LORE.venue}.
You are smart, witty, and PROACTIVE. 

--- LORE & KNOWLEDGE ---
- NICKNAMES: ${STADIUM_LORE.nicknames.join(", ")}
- NOTABLE SPOTS: ${STADIUM_LORE.notable_spots.join(" ")}
- FOOD: ${STADIUM_LORE.food_highlights}
- STATE: Match status is ${context.matchStatus || 'unknown'}.
- LOCATION: User is at ${context.userZone ? context.userZone.name : 'Unknown'}.

--- RULES ---
- Refer back to previous parts of this conversation where helpful.
- Be concise (2 sentences max).
- Politeness is key. Stay stadium-focused.`,
        });

        const chat = model.startChat({ 
          history: history,
          generationConfig: { maxOutputTokens: 800 }
        });
        
        const result = await chat.sendMessage(userMessage);
        return result.response.text();

      } catch (err) {
        lastError = err;
        console.warn(`${modelName} failed, trying next...`, err.message);
        continue;
      }
    }
    throw lastError;

  } catch (error) {
    const msg = error.message || '';
    const status = error.status || error.code || '';
    console.error("Gemini API Error:", status, msg);
    if (msg.includes('404') || msg.includes('not found') || msg.includes('NOT_FOUND'))
      return "⚠️ AI model not available. Please contact support.";
    if (msg.includes('API_KEY') || msg.includes('API key') || msg.includes('invalid key'))
      return "⚠️ Invalid API key. Check VITE_GEMINI_API_KEY and restart the dev server.";
    if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429') || msg.includes('quota'))
      return "⚠️ API quota exceeded — please wait a few minutes and try again!";
    return "Having trouble connecting right now. Please try again in a moment! 🙏";
  }
};

export const getGeminiDirections = async (fromLoc, toLoc) => {
  if (!API_KEY || API_KEY === 'your_gemini_api_key_here' || !genAI) return null;
  
  // Rate limiter for directions too
  const now = Date.now();
  if (now - lastCallTime < COOLDOWN_MS) {
    console.warn("Gemini directions throttled");
    return null; 
  }
  lastCallTime = now;

  try {
    const modelsToTry = [
      "gemini-2.0-flash",
      "gemini-2.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash",
      "gemini-pro"
    ];
    
    const prompt = `You are the core pathfinding AI for the VenIQ stadium app.
Your task is to create highly precise, realistic walking directions from "${fromLoc}" to "${toLoc}".

Stadium Map Context:
- Central pitch is restricted. You must route users along the circular concourse ring.
- NORTH: Gate 1 (Main Entrance), Block A, North Concourse Shops, Official Merchandise Store.
- EAST: Block B, Block C, Block D, East Restrooms, Primary Medical Center.
- SOUTH: Gate 2 (Pavilion), Block E, Block F, South Pavilion Shops, Emergency Support Unit.
- WEST: Block G, Block H, West Restrooms.
- Distance around the entire ring is ~600m.

Rules:
- Provide 3 to 5 highly detailed steps.
- Mention specific concourses (North/East/South/West) and landmarks to walk past.
- Assume an average walking speed to estimate time and distance.
- Return exactly and ONLY this JSON format (no markdown tags, no extra words). Format:
{"time":"~X mins","dist":"~Y m","steps":["Step 1...","Step 2...","Step 3..."]}`;

    let lastError = null;
    for (const modelName of modelsToTry) {
      try {
        console.log(`🤖 Directions AI trying: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json|```/g, '').trim();
        return JSON.parse(text);
      } catch (err) {
        lastError = err;
        console.warn(`Directions AI ${modelName} failed, trying next...`);
      }
    }
    throw lastError;
  } catch (e) {
    console.error("Gemini Router Error:", e);
    return null;
  }
};
