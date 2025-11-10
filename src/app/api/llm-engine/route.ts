import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const { systemPrompt, prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const fullPrompt = `${systemPrompt ?? "You are a helpful assistant that can answer questions and help with tasks."}\n\n${prompt}`;

    const completion: any = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: fullPrompt,
    });

    return NextResponse.json({
      result: completion?.text ?? "",
    });
  } catch (error) {
    console.error("Error in LLM engine:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}
