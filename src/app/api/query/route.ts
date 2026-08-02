import { NextRequest, NextResponse } from "next/server";
import { answerQuestion, llmAvailable } from "@/rag/answer";
import { chunkDocument } from "@/rag/chunk";
import { buildIndex, retrieve } from "@/rag/retrieval";
import { InvalidQueryRequest, parseQueryRequest } from "@/rag/request";

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    const { documentText, question } = parseQueryRequest(body);
    const chunks = chunkDocument(documentText);
    if (chunks.length === 0) {
      return NextResponse.json({ error: "No usable content was found in the document" }, { status: 400 });
    }
    const index = buildIndex(chunks);
    const results = retrieve(index, question, 3);
    const answer = await answerQuestion(question, results, { index });
    return NextResponse.json({
      ...answer,
      llmAvailable: llmAvailable(),
      chunkCount: chunks.length,
      retrievedChunks: results.map((result) => ({ id: result.chunk.id, score: Number(result.score.toFixed(3)) })),
    });
  } catch (error) {
    if (error instanceof InvalidQueryRequest) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must contain valid JSON" }, { status: 400 });
    }
    console.error("[query] Request processing failed");
    return NextResponse.json({ error: "The request could not be processed. Please try again." }, { status: 500 });
  }
}
