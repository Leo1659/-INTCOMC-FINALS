import { NextResponse } from "next/server";
import OpenAI from "openai";

const systemPrompt = `You are an AI legal information assistant focused on Philippine law.
Goals:
- Provide accessible explanations of Philippine laws, rights, and procedures using plain language.
- When users have grievances, outline practical options, steps, agencies to contact, and documentation needed.
- Always cite the relevant law or regulation name and, when possible, the section/article.

Critical rules:
- You are NOT a lawyer and do NOT provide legal representation. Include a short disclaimer when a response might be interpreted as legal advice.
- Encourage users to consult a licensed Philippine lawyer for complex or urgent matters.
- If the question is outside Philippine jurisdiction, state the limitation and ask clarifying questions.
- If information may be outdated or varies by LGU/agency, say so and suggest verifying with the appropriate office.

Tone:
- Respectful, concise, and structured with bullet points where helpful.
- Use Filipino/Tagalog terms sparingly for clarity, but default to English unless the user writes in Filipino.
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body as { messages: Array<{ role: string; content: string }>; };

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid payload: messages[] required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Server missing OPENAI_API_KEY" }, { status: 500 });
    }

    const client = new OpenAI({ apiKey });

    // Prepend system prompt
    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map(m => ({ role: m.role as "user" | "assistant" | "system", content: m.content })),
    ];

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatMessages,
      temperature: 0.2,
    });

    const reply = completion.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a response.";
    return NextResponse.json({ content: reply });
  } catch (err) {
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}


