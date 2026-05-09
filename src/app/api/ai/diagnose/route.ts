import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { image, cropType, weatherContext } = await req.json();

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured on server' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-flash-latest";

    const prompt = `Analyze this ${cropType} leaf image for diseases or health issues. 
    ${weatherContext || ''}
    Provide a detailed report in JSON format.
    IMPORTANT: For all "icon" fields, use ONLY valid Material Symbol names (e.g., 'content_cut' for scissors, 'water_drop' for rain, 'thermostat' for temperature, 'eco' for plants, 'bug_report' for pests, 'science' for chemicals). Do NOT use generic words like 'scissor' or 'rain' if they are not exact Material Symbol identifiers.`;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: image
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diseaseName: { type: Type.STRING },
            scientificName: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            status: { type: Type.STRING, enum: ["healthy", "warning", "critical"] },
            description: { type: Type.STRING },
            symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.STRING },
            treatmentSteps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  desc: { type: Type.STRING },
                  icon: { type: Type.STRING }
                },
                required: ["title", "desc", "icon"]
              }
            },
            causes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  desc: { type: Type.STRING }
                },
                required: ["title", "desc"]
              }
            },
            preventions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  desc: { type: Type.STRING }
                },
                required: ["title", "desc"]
              }
            },
            environmentalContext: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                  status: { type: Type.STRING },
                  color: { type: Type.STRING },
                  icon: { type: Type.STRING }
                },
                required: ["label", "value", "status", "color", "icon"]
              }
            }
          },
          required: ["diseaseName", "confidence", "status", "description", "symptoms", "recommendations", "treatmentSteps", "causes", "preventions", "environmentalContext"]
        }
      }
    });

    if (!response.text) {
      throw new Error('AI returned an empty response.');
    }

    return NextResponse.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error('AI Diagnosis API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error during analysis' }, { status: 500 });
  }
}
