import { describe, expect, it } from "vitest";
import {
  InvalidQueryRequest,
  MAX_DOCUMENT_CHARS,
  MAX_QUESTION_CHARS,
  parseQueryRequest,
} from "@/rag/request";

describe("parseQueryRequest", () => {
  it("trims valid document and question text", () => {
    expect(
      parseQueryRequest({
        documentText: "  Evidence paragraph.  ",
        question: "  What is stated?  ",
      }),
    ).toEqual({
      documentText: "Evidence paragraph.",
      question: "What is stated?",
    });
  });

  it.each([
    null,
    [],
    "body",
    {},
    { documentText: "", question: "Question" },
    { documentText: "Document", question: "   " },
    { documentText: 123, question: "Question" },
    { documentText: "Document", question: false },
  ])("rejects invalid request input: %j", (value) => {
    expect(() => parseQueryRequest(value)).toThrow(InvalidQueryRequest);
  });

  it("rejects oversized documents with status 413", () => {
    try {
      parseQueryRequest({
        documentText: "a".repeat(MAX_DOCUMENT_CHARS + 1),
        question: "Question",
      });
      throw new Error("Expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidQueryRequest);
      expect((error as InvalidQueryRequest).status).toBe(413);
    }
  });

  it("rejects oversized questions with status 413", () => {
    try {
      parseQueryRequest({
        documentText: "Document",
        question: "q".repeat(MAX_QUESTION_CHARS + 1),
      });
      throw new Error("Expected validation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidQueryRequest);
      expect((error as InvalidQueryRequest).status).toBe(413);
    }
  });
});
