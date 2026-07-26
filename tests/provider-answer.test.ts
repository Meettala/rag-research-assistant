import { afterEach, describe, expect, it, vi } from "vitest";
import {
  answerQuestion,
  InvalidProviderAnswer,
  parseProviderAnswer,
} from "@/rag/answer";
import type { RetrievalResult } from "@/rag/retrieval";

const RESULTS: RetrievalResult[] = [
  {
    chunk: {
      id: "chunk_0",
      index: 0,
      text: "The verified source states that the launch occurred in 1969.",
    },
    score: 0.8,
  },
];

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
});

describe("parseProviderAnswer", () => {
  const allowed = new Set(["chunk_0", "chunk_1"]);

  it("accepts valid grounded JSON", () => {
    const result = parseProviderAnswer(
      '{"answer":"It launched in 1969.","cited_chunk_ids":["chunk_0"]}',
      allowed,
    );

    expect(result.answer).toBe("It launched in 1969.");
    expect(result.cited_chunk_ids).toEqual(["chunk_0"]);
  });

  it.each([
    "not json",
    "[]",
    "{}",
    '{"answer":"","cited_chunk_ids":["chunk_0"]}',
    '{"answer":"Claim","cited_chunk_ids":[]}',
    '{"answer":"Claim","cited_chunk_ids":[123]}',
    '{"answer":"Claim","cited_chunk_ids":["chunk_0"],"code":"run"}',
  ])("rejects malformed or unsupported output: %s", (raw) => {
    expect(() => parseProviderAnswer(raw, allowed)).toThrow(
      InvalidProviderAnswer,
    );
  });

  it("rejects citations outside the retrieved allow-list", () => {
    expect(() =>
      parseProviderAnswer(
        '{"answer":"Unsupported claim","cited_chunk_ids":["chunk_99"]}',
        allowed,
      ),
    ).toThrow("unavailable chunk");
  });
});

describe("provider fallback", () => {
  it("falls back to extractive mode after a provider HTTP failure", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("provider unavailable", { status: 503 }),
      ),
    );

    const result = await answerQuestion("When did it launch?", RESULTS);

    expect(result.mode).toBe("extractive");
    expect(result.answer).toContain("1969");
    expect(result.answer).not.toContain("503");
  });

  it("falls back when provider JSON cites an unavailable chunk", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          choices: [
            {
              message: {
                content:
                  '{"answer":"Invented","cited_chunk_ids":["chunk_99"]}',
              },
            },
          ],
        }),
      ),
    );

    const result = await answerQuestion("When did it launch?", RESULTS);

    expect(result.mode).toBe("extractive");
    expect(result.citedChunkIds).toEqual(["chunk_0"]);
  });
});
