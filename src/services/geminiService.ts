import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("GEMINI_API_KEY is missing. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export interface AnalysisResult {
  summary: string;
  design: string[];
  seo: string[];
  content: string[];
  performance: string[];
  recommendations: string[];
}

export async function getWebsiteSuggestions(query: string): Promise<{ title: string; url: string }[]> {
  if (!query || query.length < 2) return [];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find the most relevant official websites for the search query: "${query}". Return only a JSON array of objects with "title" and "url" properties. Only include actual website URLs.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              url: { type: Type.STRING },
            },
            required: ["title", "url"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Failed to get suggestions:", error);
    return [];
  }
}

export async function generateReportSection(url: string, section: string, context: string): Promise<string> {
  const model = "gemini-3-flash-preview";
  const prompt = `You are a Senior Digital Strategy Consultant at a top-tier global agency.
  
  Generate a highly detailed, 2000-word deep-dive section for a comprehensive 10-page strategic audit of the website: ${url}
  
  SECTION TO GENERATE: ${section}
  
  CONTEXT FROM PREVIOUS ANALYSIS: ${context}
  
  ### REQUIREMENTS:
  - Use professional, high-level consulting language.
  - Include specific data points, industry benchmarks, and technical observations.
  - Use Markdown for formatting (bolding, lists, sub-headers).
  - Be extremely thorough. This is one part of a massive dossier.
  - If technical, mention specific tools (Lighthouse, Semrush, Ahrefs, Hotjar) and how they would be used.
  - Provide actionable, high-level strategic advice.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text || "Section generation failed.";
  } catch (error) {
    console.error(`Failed to generate section ${section}:`, error);
    return `Failed to generate ${section}. Please try again.`;
  }
}

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    agencyName: { type: Type.STRING },
    growthScore: { type: Type.NUMBER },
    marketAuthority: { type: Type.NUMBER },
    detailedAnalysis: { type: Type.STRING },
    kpis: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          current: { type: Type.NUMBER },
          target: { type: Type.NUMBER },
          explanation: { type: Type.STRING },
          calculation: { type: Type.STRING }
        },
        required: ["name", "current", "target", "explanation", "calculation"]
      }
    },
    trends: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          month: { type: Type.STRING },
          traffic: { type: Type.NUMBER },
          conversions: { type: Type.NUMBER },
          impressions: { type: Type.NUMBER }
        },
        required: ["month", "traffic", "conversions", "impressions"]
      }
    },
    trendInsights: { type: Type.STRING },
    revenueLeak: {
      type: Type.OBJECT,
      properties: {
        annualLoss: { type: Type.NUMBER },
        reason: { type: Type.STRING },
        calculation: { type: Type.STRING }
      },
      required: ["annualLoss", "reason", "calculation"]
    },
    competitors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          url: { type: Type.STRING },
          score: { type: Type.NUMBER },
          gap: { type: Type.STRING }
        },
        required: ["name", "url", "score", "gap"]
      }
    },
    roadmap: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phase: { type: Type.STRING },
          impact: { type: Type.STRING },
          tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["phase", "impact", "tasks"]
      }
    },
    roiSimulation: {
      type: Type.OBJECT,
      properties: {
        baseline: { type: Type.NUMBER },
        projected: { type: Type.NUMBER },
        factors: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["baseline", "projected", "factors"]
    },
    deepDive: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        content: { type: Type.STRING },
        metrics: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              value: { type: Type.STRING }
            },
            required: ["label", "value"]
          }
        }
      },
      required: ["title", "content", "metrics"]
    }
  },
  required: [
    "agencyName", "growthScore", "marketAuthority", "detailedAnalysis", 
    "kpis", "trends", "trendInsights", "revenueLeak", "competitors", 
    "roadmap", "roiSimulation", "deepDive"
  ]
};

export async function analyzeWebsite(url: string): Promise<string> {
  const model = "gemini-3-flash-preview";
  const prompt = `You are the Lead Strategist at "Apex Digital Strategy," a world-class digital agency.

Analyze the website at: ${url}

### OBJECTIVE:
Provide a high-impact, board-room ready strategic audit tailored specifically to this website's industry and content. Use industry best practices (e.g., Google's Core Web Vitals, HubSpot's Inbound Methodology, Nielsen Norman Group's UX principles).

### REPORT REQUIREMENTS:
1. **Executive Summary**: High-level brand positioning and market standing.
2. **Strategic Audit**: Concise analysis of Design/UX, SEO/Authority, and Performance.
3. **Strategic Deep Dive**: A specialized section tailored to the industry. 
4. **90-Day Roadmap**: Actionable phases with clear impact.

### DATA REQUIREMENTS:
Every metric must be REASONABLE for a site of this type. Provide clear explanations and calculation methods for all KPIs. 
Ensure competitor URLs are real and relevant to the site's domain.

### CONSTRAINTS:
- Tailor KPIs and insights strictly to the website's industry.
- Be authoritative and professional.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: analysisSchema
      },
    });

    if (!response.text) {
      throw new Error("Empty response from Gemini");
    }

    return response.text;
  } catch (error: any) {
    console.error("Analysis failed:", error);
    throw new Error("Failed to analyze website. Please check the URL and try again.");
  }
}
