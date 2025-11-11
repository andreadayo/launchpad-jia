import { GoogleGenAI } from "@google/genai";

const messages: any = [{ role: "system", content: "You are a helpful assistant." }];

export async function POST(req: Request) {
  const { text } = await req.json();

  messages.push({
    role: "user",
    content: text,
  });

  const ai = new GoogleGenAI({ apiKey: process.env.GENAI_API_KEY });

  // Convert messages array to a single prompt string for Gemini
  const prompt = messages.map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");

  const chatResponse: any = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: prompt,
  });

  const assistantText = chatResponse?.text ?? "";

  messages.push({
    role: "assistant",
    content: assistantText,
  });

  return new Response(assistantText);
}
