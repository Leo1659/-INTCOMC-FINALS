import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";

let vectorStoreSingleton: MemoryVectorStore | null = null;
let embeddingsSingleton: OllamaEmbeddings | null = null;

export function getEmbeddings() {
  if (!embeddingsSingleton) {
    const host = (process.env.OLLAMA_HOST ?? "http://localhost:11434").trim();
    const model = (process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text").trim();
    embeddingsSingleton = new OllamaEmbeddings({ baseUrl: host, model });
  }
  return embeddingsSingleton;
}

export async function getVectorStore() {
  if (!vectorStoreSingleton) {
    vectorStoreSingleton = new MemoryVectorStore(getEmbeddings());
  }
  return vectorStoreSingleton;
}

export async function upsertDocuments(input: { namespace?: string; texts: string[] }) {
  const texts = (input?.texts ?? []).map(t => (t ?? "").toString()).filter(t => t.trim().length > 0);
  if (texts.length === 0) {
    throw new Error("texts must be a non-empty array of strings");
  }

  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 800, chunkOverlap: 120 });
  const allChunks: string[] = [];
  for (const t of texts) {
    const chunks = await splitter.splitText(t);
    allChunks.push(...chunks);
  }

  const store = await getVectorStore();
  await store.addDocuments(allChunks.map((c) => ({ pageContent: c, metadata: { namespace: input?.namespace ?? "default" } })));
  return { added: allChunks.length };
}

export async function retrieveRelevant(query: string, k = 5) {
  const store = await getVectorStore();
  const results = await store.similaritySearch(query, k);
  return results.map(r => ({ content: r.pageContent, metadata: r.metadata }));
}


