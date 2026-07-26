export const MAX_DOCUMENT_CHARS = 200_000;
export const MAX_QUESTION_CHARS = 2_000;

export type QueryRequest = {
  documentText: string;
  question: string;
};

export class InvalidQueryRequest extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "InvalidQueryRequest";
    this.status = status;
  }
}

export function parseQueryRequest(value: unknown): QueryRequest {
  if (!isRecord(value)) {
    throw new InvalidQueryRequest("Request body must be a JSON object");
  }

  const documentText = requireTrimmedString(value.documentText, "documentText");
  const question = requireTrimmedString(value.question, "question");

  if (documentText.length > MAX_DOCUMENT_CHARS) {
    throw new InvalidQueryRequest(
      `documentText is too large (maximum ${MAX_DOCUMENT_CHARS.toLocaleString()} characters)`,
      413,
    );
  }

  if (question.length > MAX_QUESTION_CHARS) {
    throw new InvalidQueryRequest(
      `question is too large (maximum ${MAX_QUESTION_CHARS.toLocaleString()} characters)`,
      413,
    );
  }

  return { documentText, question };
}

function requireTrimmedString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new InvalidQueryRequest(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
