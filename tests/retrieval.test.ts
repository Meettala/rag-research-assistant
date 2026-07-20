import { describe, it, expect } from "vitest";
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
    const chunks = chunkDocument(DOC);
    const index = buildIndex(chunks);
    const results = retrieve(index, "mission", 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });
});
