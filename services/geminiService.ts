
import { GoogleGenAI } from "@google/genai";

/**
 * Fetches a motivational scout tip from Gemini API to help fantasy managers.
 */
export const getAISuggestion = async () => {
  // Always initialize with the process.env.API_KEY in a named parameter.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'Dai un consiglio rapido e motivante (massimo 15 parole) per un manager di fantacalcio che deve decidere la formazione oggi.',
      config: {
        systemInstruction: 'Sei un esperto scout di fantacalcio italiano, cinico ma competente.',
      },
    });

    // Extract the text using the property (not method).
    return response.text?.trim() || "Schiera chi ha la partita più facile in casa.";
  } catch (error) {
    console.error("Gemini AI Service Error:", error);
    return "Controlla sempre i ballottaggi dell'ultimo minuto!";
  }
};
