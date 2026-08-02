import { describe, expect, it } from "vitest";
import { answerQuestion } from "@/rag/answer";
import { assessAnswerability } from "@/rag/answerability";
import { chunkDocument } from "@/rag/chunk";
import { buildIndex, retrieve } from "@/rag/retrieval";

const document = [
  "The organisation has 240 employees.",
  "Engineers had 91% adoption and product managers had 88% adoption.",
  "The programme produced a net benefit of £214,000.",
  "No confirmed security breach occurred.",
].join(" ");

function pipeline(question: string) {
  const index = buildIndex(chunkDocument(document));
  const results = retrieve(index, question, 3);
  return { index, results };
}

describe("evidence coverage answerability", () => {
  it("declines an unsupported leadership-name question despite topical similarity", async () => {
    const question = "What is the name of the organisation's most senior leader?";
    const { index, results } = pipeline(question);
    const decision = assessAnswerability(question, results, index);
    expect(decision.answerable).toBe(false);
    expect(decision.reason).toBe("insufficient_evidence");
    const answer = await answerQuestion(question, results, { index });
    expect(answer.citedChunkIds).toEqual([]);
    expect(answer.answer).toContain("not going to guess");
  });

  it("answers a supported adoption question", async () => {
    const question = "Which group had 91% adoption?";
    const { index, results } = pipeline(question);
    const answer = await answerQuestion(question, results, { index });
    expect(answer.answer).toContain("Engineers had 91% adoption");
    expect(answer.citedChunkIds.length).toBe(1);
  });

  it("declines a completely unrelated question", async () => {
    const question = "What is the weather on another planet?";
    const { index, results } = pipeline(question);
    const answer = await answerQuestion(question, results, { index });
    expect(answer.reason).toBe("no_relevant_chunk");
  });
});
