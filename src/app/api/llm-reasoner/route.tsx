import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const { corePrompt } = await request.json();

    if (!corePrompt) {
      return NextResponse.json({ error: "corePrompt is required" }, { status: 400 });
    }

    const completion: any = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: corePrompt,
    });

    return NextResponse.json({
      result: completion?.text ?? "",
    });
  } catch (error) {
    console.error("Error in LLM reasoner:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
