import { describe, expect, it } from "vitest";
import { buildNormalizedIdf } from "@/rag/answerability";
import { chunkDocument } from "@/rag/chunk";
import { selectAnswerSpan, splitSentences } from "@/rag/extract";
import { buildIndex } from "@/rag/retrieval";

describe("concise extractive spans", () => {
  it("splits only at sentence or paragraph boundaries", () => {
    expect(splitSentences("First sentence. Second sentence!\n\nThird sentence?")).toEqual([
      "First sentence.",
      "Second sentence!",
      "Third sentence?",
    ]);
  });

  it("keeps the evidence and removes distant unrelated text", () => {
    const passage = [
      "This introduction describes the organisation.",
      "Engineers recorded 91% adoption during the six-month programme.",
      "The finance team recorded lower adoption.",
      "A distant paragraph discusses office catering and travel bookings.",
      "Another unrelated sentence describes meeting rooms.",
    ].join(" ");
    const index = buildIndex(chunkDocument(passage));
    const answer = selectAnswerSpan(
      "What adoption did engineers record?",
      passage,
      buildNormalizedIdf(index),
      0,
    );
    expect(answer).toContain("Engineers recorded 91% adoption");
    expect(answer).not.toContain("meeting rooms");
  });

  it("falls back safely when the passage carries no matching terms", () => {
    const passage = "One sentence. Another sentence.";
    const index = buildIndex(chunkDocument(passage));
    expect(selectAnswerSpan("unmatched vocabulary", passage, buildNormalizedIdf(index))).toBe(passage);
  });
});
