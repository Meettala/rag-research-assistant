import { describe, it, expect } from "vitest";
import { chunkDocument } from "@/rag/chunk";
import { buildIndex, retrieve } from "@/rag/retrieval";
import { answerQuestion, llmAvailable } from "@/rag/answer";

const DOC = `The Eiffel Tower was completed in 1889 for the World's Fair in Paris. It stands 330 meters tall and was designed by engineer Gustave Eiffel.`;

describe("answerQuestion", () => {
  it("returns extractive answer with no API key configured", async () => {
    expect(llmAvailable()).toBe(false);
    const chunks = chunkDocument(DOC);
    const index = buildIndex(chunks);
    const results = retrieve(index, "When was the Eiffel Tower completed?", 3);
    const result = await answerQuestion("When was the Eiffel Tower completed?", results);
    expect(result.mode).toBe("extractive");
    expect(result.answer).toContain("1889");
    expect(result.citedChunkIds.length).toBeGreaterThan(0);
  });

  it("declines to answer when nothing relevant is retrieved", async () => {
    const chunks = chunkDocument(DOC);
    const index = buildIndex(chunks);
    const results = retrieve(index, "What is the population of Mars?", 3);
    const result = await answerQuestion("What is the population of Mars?", results);
    expect(result.answer.toLowerCase()).toContain("doesn't appear to cover");
    expect(result.citedChunkIds).toEqual([]);
  });
});
