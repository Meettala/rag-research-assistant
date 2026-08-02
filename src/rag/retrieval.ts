/** Explainable local TF-IDF retrieval with cosine similarity. */

import type { Chunk } from "./chunk";

const STOPWORDS = new Set([
  "the","a","an","and","or","but","is","are","was","were","be","been","being","to","of","in","on","at","for","with","by","from","as","that","this","it","its","these","those","i","you","he","she","we","they","what","which","who","whom","if","then","than","so","not","no","do","does","did","have","has","had","will","would","can","could","should","may","might",
]);

export function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
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
    for (const term of new Set(tokens)) documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
  }
  const idf = new Map<string, number>();
  for (const [term, count] of documentFrequency.entries()) {
    idf.set(term, Math.log((chunks.length + 1) / (count + 1)) + 1);
  }
  return {
    chunks: [...chunks],
    vocabulary: Array.from(documentFrequency.keys()).sort(),
    idf,
    vectors: tokenizedChunks.map((tokens) => vectorizeTokens(tokens, idf)),
  };
}

function vectorizeTokens(tokens: string[], idf: Map<string, number>): Map<string, number> {
  const vector = new Map<string, number>();
  if (tokens.length === 0) return vector;
  const termFrequency = new Map<string, number>();
  for (const term of tokens) termFrequency.set(term, (termFrequency.get(term) ?? 0) + 1);
  for (const [term, count] of termFrequency.entries()) {
    const inverseDocumentFrequency = idf.get(term);
    if (inverseDocumentFrequency !== undefined) vector.set(term, (count / tokens.length) * inverseDocumentFrequency);
  }
  return vector;
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dotProduct = 0;
  for (const [term, weight] of a.entries()) dotProduct += weight * (b.get(term) ?? 0);
  const norm = (v: Map<string, number>) => Math.sqrt(Array.from(v.values()).reduce((s, x) => s + x * x, 0));
  const denominator = norm(a) * norm(b);
  if (denominator === 0) return 0;
  const score = dotProduct / denominator;
  return Number.isFinite(score) ? score : 0;
}

export type RetrievalResult = { chunk: Chunk; score: number };

export function retrieve(index: VectorIndex, query: string, topK = 3): RetrievalResult[] {
  const limit = Number.isFinite(topK) ? Math.max(0, Math.floor(topK)) : 0;
  if (limit === 0 || index.chunks.length === 0) return [];
  const queryVector = vectorizeTokens(tokenize(query), index.idf);
  return index.chunks.map((chunk, position) => ({ chunk, score: cosineSimilarity(queryVector, index.vectors[position]) }))
    .sort((left, right) => right.score - left.score || left.chunk.index - right.chunk.index)
    .slice(0, limit);
}
