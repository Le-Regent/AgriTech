import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { productName } = await req.json();

    if (!productName) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured on server' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A high-quality, professional food photography of fresh ${productName} on a wooden table, natural lighting, rustic style.` }]
      },
      config: {
        imageConfig: { aspectRatio: "4:3" }
      }
    });
    
    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (imagePart?.inlineData) {
      return NextResponse.json({ 
        image: `data:image/png;base64,${imagePart.inlineData.data}` 
      });
    } else {
      throw new Error('AI failed to generate an image.');
    }
  } catch (error: any) {
    console.error('AI Image Generation API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error during image generation' }, { status: 500 });
  }
}
