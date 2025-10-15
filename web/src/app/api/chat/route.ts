import { NextResponse } from "next/server";
import { Ollama } from "ollama";
import { retrieveRelevant } from "@/lib/rag";

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

    const ollamaHost = (process.env.OLLAMA_HOST ?? "http://localhost:11434").trim();
    const modelEnv = (process.env.OLLAMA_MODEL ?? "").trim();
    const model = modelEnv || "deepseek-r1:latest"; // fallback to your installed model

    if (!model) {
      console.error("OLLAMA_MODEL is empty after resolution. Falling back failed.");
      return NextResponse.json({ error: "Server configuration error: OLLAMA_MODEL is empty." }, { status: 500 });
    }

    console.log("Using Ollama config:", { ollamaHost, model });

    const ollama = new Ollama({ host: ollamaHost });

    // Prepend system prompt
    const chatMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map(m => ({ role: m.role as "user" | "assistant" | "system", content: m.content })),
    ];

    // Verify the model exists on the Ollama server before attempting chat
    try {
      const available = await ollama.list();
      const hasModel = available?.models?.some((m: any) => m?.model === model || m?.name === model);
      if (!hasModel) {
        console.error("Requested model not found on Ollama server", { requested: model, available: available?.models?.map((m: any) => m?.model || m?.name) });
        return NextResponse.json({ error: `Ollama model not found: ${model}. Please pull it (e.g., \"ollama pull ${model}\").` }, { status: 500 });
      }
    } catch (listErr) {
      console.warn("Could not list Ollama models (continuing to chat)", listErr);
    }

    // Do simple retrieval-augmented prompt stuffing
    const userQuestion = messages[messages.length - 1]?.content ?? "";
    let contextBlock = "";
    try {
      const docs = await retrieveRelevant(userQuestion, 6);
      if (docs?.length) {
        const formatted = docs.map((d, i) => `[[Doc ${i + 1}]]\n${d.content}`).join("\n\n");
        contextBlock = `\n\nUse the following retrieved context if relevant.\n---\n${formatted}\n---\n`;
      }
    } catch {}

    const response = await ollama.chat({
      model: model,
      messages: [
        ...chatMessages,
        { role: "system", content: `When answering, prefer information from CONTEXT when it clearly applies.${contextBlock}` },
      ],
      options: {
        temperature: 0.2,
      },
    });

    const reply = response.message?.content ?? "Sorry, I couldn't generate a response.";
    return NextResponse.json({ content: reply });
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: `Server error: ${err instanceof Error ? err.message : 'Unknown error'}` }, { status: 500 });
  }
}


