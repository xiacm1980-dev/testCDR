import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const analyzeFileContent = async (
  filename: string, 
  base64Data: string, 
  mimeType: string
): Promise<string> => {
  const client = getClient();
  if (!client) return "Analysis unavailable: API Key missing.";

  try {
    const modelId = mimeType.startsWith('image') ? 'gemini-2.5-flash-image' : 'gemini-2.5-flash';
    
    const prompt = `
      You are a cybersecurity analyst in a Content Disarm and Reconstruction (CDR) system.
      The user has uploaded a file named "${filename}".
      
      Your task is NOT to execute code, but to inspect the *content* structure conceptually.
      
      1. If it's an image, describe if it contains hidden text, steganography risks, or complex metadata structures (conceptually).
      2. If it's text/document, identify potential macro keywords (conceptually) or risky patterns.
      3. Provide a brief "Threat Surface Analysis" in 2 sentences.
      
      Output plain text only.
    `;

    const response = await client.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          },
          { text: prompt }
        ]
      }
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return "Analysis skipped due to processing error.";
  }
};