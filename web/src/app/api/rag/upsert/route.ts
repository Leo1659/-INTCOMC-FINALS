import { NextResponse } from "next/server";
import { upsertDocuments } from "@/src/lib/rag";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { texts, namespace } = body ?? {};
    const result = await upsertDocuments({ texts: Array.isArray(texts) ? texts : [], namespace });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}


