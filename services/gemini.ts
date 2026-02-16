
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartInsights = async (contextData: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `As an AI analyst for Doel Express Ltd. (a bus service company), analyze the following data and provide 3 brief strategic insights or warnings. Data: ${JSON.stringify(contextData)}`,
      config: {
        systemInstruction: "You are a professional business analyst. Provide short, bulleted, actionable insights in English.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Unable to load AI insights at this time.";
  }
};
