import { NextRequest, NextResponse } from "next/server";
import { chunkDocument } from "@/rag/chunk";
import { buildIndex, retrieve } from "@/rag/retrieval";
import { answerQuestion, llmAvailable } from "@/rag/answer";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { documentText, question } = body as { documentText?: string; question?: string };

  if (!documentText || typeof documentText !== "string") {
    return NextResponse.json({ error: "documentText is required" }, { status: 400 });
  }
  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }
  if (documentText.length > 200_000) {
    return NextResponse.json({ error: "documentText too large (max 200,000 chars)" }, { status: 413 });
  }

  const chunks = chunkDocument(documentText);
  if (chunks.length === 0) {
    return NextResponse.json({ error: "No content found in document" }, { status: 400 });
  }

  const index = buildIndex(chunks);
  const results = retrieve(index, question, 3);
  const answer = await answerQuestion(question, results);

  return NextResponse.json({
    ...answer,
    llmAvailable: llmAvailable(),
    chunkCount: chunks.length,
    retrievedChunks: results.map((r) => ({ id: r.chunk.id, score: Number(r.score.toFixed(3)) })),
  });
}
