import { describe, it, expect } from "vitest";
import { chunkDocument } from "@/rag/chunk";

describe("chunkDocument", () => {
  it("splits multi-paragraph text into chunks", () => {
    const text = "Para one.\n\nPara two.\n\nPara three.";
    const chunks = chunkDocument(text);
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks[0].text).toContain("Para one");
  });

  it("hard-wraps a single giant paragraph", () => {
    const text = "word ".repeat(1000); // no blank lines, long
    const chunks = chunkDocument(text);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("returns empty array for empty input", () => {
    expect(chunkDocument("   ")).toEqual([]);
  });

  it("assigns sequential ids", () => {
    const text = "A".repeat(500) + "\n\n" + "B".repeat(500) + "\n\n" + "C".repeat(500);
    const chunks = chunkDocument(text);
    chunks.forEach((c, i) => expect(c.id).toBe(`chunk_${i}`));
  });
});
