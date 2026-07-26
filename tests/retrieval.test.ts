import { describe, expect, it } from "vitest";
import { chunkDocument } from "@/rag/chunk";
import { buildIndex, retrieve } from "@/rag/retrieval";

const DOC = `The Apollo 11 mission launched on July 16, 1969, carrying astronauts Neil Armstrong, Buzz Aldrin, and Michael Collins.

Armstrong became the first person to step onto the Moon, famously saying "That's one small step for man."

The mission returned to Earth on July 24, 1969, splashing down in the Pacific Ocean.`;

describe("retrieval", () => {
  it("retrieves the most relevant chunk for a targeted question", () => {
    const chunks = chunkDocument(DOC);
    const index = buildIndex(chunks);
    const results = retrieve(index, "Who was the first person on the Moon?", 3);

    expect(results[0].chunk.text).toContain("Armstrong");
    expect(results[0].score).toBeGreaterThan(0);
  });

  it("returns low scores for unrelated questions", () => {
    const chunks = chunkDocument(DOC);
    const index = buildIndex(chunks);
    const results = retrieve(index, "What is the capital of France?", 3);

    expect(results[0].score).toBeLessThan(0.15);
  });

  it("respects topK", () => {
    const index = buildIndex(chunkDocument(DOC));
    expect(retrieve(index, "mission", 2)).toHaveLength(2);
  });

  it("returns no results for an empty corpus", () => {
    expect(retrieve(buildIndex([]), "question", 3)).toEqual([]);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "returns no results for invalid topK %s",
    (topK) => {
      const index = buildIndex(chunkDocument(DOC));
      expect(retrieve(index, "mission", topK)).toEqual([]);
    },
  );

  it("returns finite zero scores for stopword-only questions", () => {
    const index = buildIndex(chunkDocument(DOC));
    const results = retrieve(index, "the and of", 3);

    expect(results.every((result) => result.score === 0)).toBe(true);
    expect(results.every((result) => Number.isFinite(result.score))).toBe(true);
  });

  it("uses chunk order as a deterministic tie-breaker", () => {
    const chunks = chunkDocument("Alpha topic.\n\nBeta topic.");
    const results = retrieve(buildIndex(chunks), "unknown term", 2);

    expect(results.map((result) => result.chunk.index)).toEqual([0]);
  });
});
