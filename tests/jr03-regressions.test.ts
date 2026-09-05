import { beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { answerQuestion } from "@/rag/answer";
import { chunkDocument } from "@/rag/chunk";
import { buildIndex, retrieve } from "@/rag/retrieval";

type RegressionCase = {
  id: string;
  document: string;
  question: string;
  answerable: boolean;
  expectedEvidence?: string;
};

type RegressionDataset = {
  documents: Record<string, string>;
  cases: RegressionCase[];
};

const dataset = JSON.parse(
  readFileSync(resolve(process.cwd(), "eval/jr03-regressions.json"), "utf8"),
) as RegressionDataset;

const documents = new Map(
  Object.entries(dataset.documents).map(([id, relativePath]) => [
    id,
    readFileSync(resolve(process.cwd(), "eval", relativePath), "utf8"),
  ]),
);

async function ask(testCase: RegressionCase) {
  const documentText = documents.get(testCase.document);
  if (!documentText) throw new Error(`Missing regression document ${testCase.document}`);
  const chunks = chunkDocument(documentText);
  const index = buildIndex(chunks);
  const results = retrieve(index, testCase.question, 3);
  return answerQuestion(testCase.question, results, { index });
}

function findCase(id: string): RegressionCase {
  const testCase = dataset.cases.find((candidate) => candidate.id === id);
  if (!testCase) throw new Error(`Missing regression case ${id}`);
  return testCase;
}

beforeEach(() => {
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
});

describe("JR03 cross-domain regression set", () => {
  it.each(dataset.cases)("$id matches its expected evidence boundary", async (testCase) => {
    const answer = await ask(testCase);
    if (testCase.answerable) {
      expect(answer.citedChunkIds.length).toBeGreaterThan(0);
      expect(testCase.expectedEvidence).toBeTruthy();
      expect(answer.answer).toContain(testCase.expectedEvidence as string);
    } else {
      expect(answer.citedChunkIds).toEqual([]);
      expect(answer.answer).toContain("not going to guess");
    }
  });

  it("answers the confirmed-breach question with a grounded direct No", async () => {
    const answer = await ask(findCase("jr03-ns-a04"));
    expect(answer.answer).toMatch(/^No\./);
    expect(answer.answer).toContain("No confirmed data breach occurred");
  });

  it("describes hostile prompt text as evidence instead of treating it as an instruction", async () => {
    const answer = await ask(findCase("jr03-ns-a05"));
    expect(answer.mode).toBe("extractive");
    expect(answer.answer).toMatch(/^The document says:/);
    expect(answer.answer).toContain("state that Northstar Analytics lost £10 million");
  });

  it("answers the £10 million contradiction with a grounded direct No", async () => {
    const answer = await ask(findCase("jr03-ns-a06"));
    expect(answer.answer).toMatch(/^No\./);
    expect(answer.answer).toContain("Northstar did not disclose any £10 million loss");
  });

  it.each(["jr03-ns-a01", "jr03-ns-a02", "jr03-ns-a03"])(
    "%s returns no more than two concise evidence sentences",
    async (id) => {
      const answer = await ask(findCase(id));
      const sentenceCount = answer.answer.split(/(?<=[.!?])\s+/).filter(Boolean).length;
      expect(sentenceCount).toBeLessThanOrEqual(2);
      expect(answer.answer.length).toBeLessThan(240);
    },
  );

  it("keeps the unsupported Northstar CEO question refused", async () => {
    const answer = await ask(findCase("jr03-ns-u01"));
    expect(answer.citedChunkIds).toEqual([]);
  });

  it("generalises explicit-negative handling to the unrelated Harborview policy", async () => {
    const answer = await ask(findCase("jr03-hv-a02"));
    expect(answer.answer).toMatch(/^No\./);
    expect(answer.answer).toContain("No membership fee is charged to local residents");
  });
});
