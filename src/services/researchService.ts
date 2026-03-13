import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export async function researchCompetitors() {
  const prompt = `Research the top website analysis tools (like SEMrush, Ahrefs, PageSpeed Insights, GTmetrix, SimilarWeb). 
  Find common user complaints and "missing features" that digital marketing agencies wish they had. 
  Specifically look for feedback from agency owners and CMOs.
  Return a summary of:
  1. What they hate about generic tools.
  2. What features would make a tool "Board Room Ready".
  3. Innovative ideas for a premium agency-focused analyzer.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text;
  } catch (error) {
    console.error("Research failed:", error);
    return "Could not complete research.";
  }
}
