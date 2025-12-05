import { GoogleGenAI, Type } from "@google/genai";
import { EmployeeType, ParsedEmployee } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const parseBulkEmployeeData = async (text: string): Promise<ParsedEmployee[]> => {
  const ai = getAiClient();
  if (!ai) throw new Error("API Key is not configured.");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Parse the following text and extract employee details. 
      The text might contain names, designations (like Driver, Conductor), PEN numbers (ids), phone numbers, and status (permanent or badali).
      If status is unclear, default to Permanent.
      If PEN/ID is missing, leave it null.
      
      Text to parse:
      "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              designation: { type: Type.STRING },
              type: { type: Type.STRING, enum: [EmployeeType.PERMANENT, EmployeeType.BADALI] },
              phone: { type: Type.STRING },
              email: { type: Type.STRING },
              pen: { type: Type.STRING }
            },
            required: ["name", "type"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ParsedEmployee[];
    }
    return [];
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw new Error("Failed to parse employee data using AI.");
  }
};
