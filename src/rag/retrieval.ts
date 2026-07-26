/**
 * Explainable TF-IDF retrieval with cosine similarity.
 *
 * This module is deterministic, local and provider-independent. It treats
 * document and question text as inert data and never evaluates either input.
 */

import type { Chunk } from "./chunk";

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "to",
  "of",
  "in",
  "on",
  "at",
  "for",
  "with",
  "by",
  "from",
  "as",
  "that",
  "this",
  "it",
  "its",
  "these",
  "those",
  "i",
  "you",
  "he",
  "she",
  "we",
  "they",
  "what",
  "which",
  "who",
  "whom",
  "if",
  "then",
  "than",
  "so",
  "not",
  "no",
  "do",
  "does",
  "did",
  "have",
  "has",
  "had",
  "will",
  "would",
  "can",
  "could",
  "should",
  "may",
  "might",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

export type VectorIndex = {
  chunks: Chunk[];
  vocabulary: string[];
  idf: Map<string, number>;
  vectors: Map<string, number>[];
};

export function buildIndex(chunks: Chunk[]): VectorIndex {
  const tokenizedChunks = chunks.map((chunk) => tokenize(chunk.text));
  const documentFrequency = new Map<string, number>();

  for (const tokens of tokenizedChunks) {
    for (const term of new Set(tokens)) {
      documentFrequency.set(
        term,
        (documentFrequency.get(term) ?? 0) + 1,
      );
    }
  }

  const documentCount = chunks.length;
  const idf = new Map<string, number>();
  for (const [term, count] of documentFrequency.entries()) {
    idf.set(term, Math.log((documentCount + 1) / (count + 1)) + 1);
  }

  const vectors = tokenizedChunks.map((tokens) => vectorizeTokens(tokens, idf));

  return {
    chunks: [...chunks],
    vocabulary: Array.from(documentFrequency.keys()).sort(),
    idf,
    vectors,
  };
}

function vectorizeTokens(
  tokens: string[],
  idf: Map<string, number>,
): Map<string, number> {
  const vector = new Map<string, number>();
  if (tokens.length === 0) return vector;

  const termFrequency = new Map<string, number>();
  for (const term of tokens) {
    termFrequency.set(term, (termFrequency.get(term) ?? 0) + 1);
  }

  for (const [term, count] of termFrequency.entries()) {
    const inverseDocumentFrequency = idf.get(term);
    if (inverseDocumentFrequency !== undefined) {
      vector.set(term, (count / tokens.length) * inverseDocumentFrequency);
    }
  }

  return vector;
}

function vectorizeQuery(
  query: string,
  idf: Map<string, number>,
): Map<string, number> {
  return vectorizeTokens(tokenize(query), idf);
}

function cosineSimilarity(
  a: Map<string, number>,
  b: Map<string, number>,
): number {
  let dotProduct = 0;
  for (const [term, weight] of a.entries()) {
    dotProduct += weight * (b.get(term) ?? 0);
  }

  const normA = vectorNorm(a);
  const normB = vectorNorm(b);
  if (normA === 0 || normB === 0) return 0;

  const score = dotProduct / (normA * normB);
  return Number.isFinite(score) ? score : 0;
}

function vectorNorm(vector: Map<string, number>): number {
  return Math.sqrt(
    Array.from(vector.values()).reduce(
      (sum, value) => sum + value * value,
      0,
    ),
  );
}

export type RetrievalResult = {
  chunk: Chunk;
  score: number;
};

export function retrieve(
  index: VectorIndex,
  query: string,
  topK = 3,
): RetrievalResult[] {
  const limit = Number.isFinite(topK) ? Math.max(0, Math.floor(topK)) : 0;
  if (limit === 0 || index.chunks.length === 0) return [];

  const queryVector = vectorizeQuery(query, index.idf);
  return index.chunks
    .map((chunk, indexPosition) => ({
      chunk,
      score: cosineSimilarity(queryVector, index.vectors[indexPosition]),
    }))
    .sort((left, right) => {
      const scoreDifference = right.score - left.score;
      return scoreDifference !== 0
        ? scoreDifference
        : left.chunk.index - right.chunk.index;
    })
    .slice(0, limit);
}
