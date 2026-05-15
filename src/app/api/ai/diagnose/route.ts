import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from "@google/genai";
import { logger } from '@/lib/logger';
import { handleRateLimit } from '@/lib/security/rateLimit';
import { diagnoseSchema } from '@/lib/validations/ai';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResponse = handleRateLimit(ip, 10, 60000); // 10 diagnoses per minute
    if (rateLimitResponse) {
      logger.warn('Rate limit exceeded for diagnose API', { ip });
      return rateLimitResponse;
    }

    const body = await req.json();
    const validation = diagnoseSchema.safeParse(body);
    
    if (!validation.success) {
      logger.warn('Validation failed for diagnose API', { errors: validation.error.format() });
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.format() 
      }, { status: 400 });
    }

    const { image, cropType, weatherContext } = validation.data;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.error('Gemini API key is not configured');
      return NextResponse.json({ error: 'Gemini API key is not configured on server' }, { status: 500 });
    }

    logger.info('Initiating AI diagnosis', { cropType });

    const ai = new GoogleGenAI({ apiKey });
    const model = "gemini-1.5-flash"; // Using flash-latest or similar

    const prompt = `Analyze this ${cropType} leaf image for diseases or health issues. 
    ${weatherContext || ''}
    Provide a detailed report in JSON format.
    IMPORTANT: For all "icon" fields, use ONLY valid Material Symbol names.`;

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

    logger.info('AI diagnosis completed successfully', { diseaseName: JSON.parse(response.text).diseaseName });
    return NextResponse.json(JSON.parse(response.text));
  } catch (error: any) {
    logger.error('AI Diagnosis API Error', error);
    return NextResponse.json({ error: error.message || 'Internal server error during analysis' }, { status: 500 });
  }
}
