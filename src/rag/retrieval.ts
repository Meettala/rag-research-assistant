/**
 * TF-IDF + cosine similarity retrieval. A real, explainable vector-search
 * technique that needs zero API key and zero external service — so
 * retrieval always works, even before an LLM key is configured (see
 * answer.ts for how the retrieved chunks are then turned into an answer).
 */

import type { Chunk } from "./chunk";

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "be",
  "been", "being", "to", "of", "in", "on", "at", "for", "with", "by",
  "from", "as", "that", "this", "it", "its", "these", "those", "i", "you",
  "he", "she", "we", "they", "what", "which", "who", "whom", "if", "then",
  "than", "so", "not", "no", "do", "does", "did", "have", "has", "had",
  "will", "would", "can", "could", "should", "may", "might",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

export type VectorIndex = {
  chunks: Chunk[];
  vocabulary: string[];
  idf: Map<string, number>;
  vectors: Map<string, number>[]; // one per chunk
};

export function buildIndex(chunks: Chunk[]): VectorIndex {
  const tokenizedChunks = chunks.map((c) => tokenize(c.text));
  const df = new Map<string, number>();

  for (const tokens of tokenizedChunks) {
    const seen = new Set(tokens);
    for (const term of seen) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }

  const N = chunks.length;
  const idf = new Map<string, number>();
  for (const [term, count] of df.entries()) {
    idf.set(term, Math.log((N + 1) / (count + 1)) + 1);
  }

  const vectors = tokenizedChunks.map((tokens) => {
    const tf = new Map<string, number>();
    for (const term of tokens) {
      tf.set(term, (tf.get(term) ?? 0) + 1);
    }
    const vec = new Map<string, number>();
    for (const [term, count] of tf.entries()) {
      vec.set(term, (count / tokens.length) * (idf.get(term) ?? 0));
    }
    return vec;
  });

  return { chunks, vocabulary: Array.from(df.keys()), idf, vectors };
}

function vectorizeQuery(query: string, idf: Map<string, number>): Map<string, number> {
  const tokens = tokenize(query);
  const tf = new Map<string, number>();
  for (const term of tokens) {
    tf.set(term, (tf.get(term) ?? 0) + 1);
  }
  const vec = new Map<string, number>();
  for (const [term, count] of tf.entries()) {
    if (idf.has(term)) {
      vec.set(term, (count / tokens.length) * (idf.get(term) ?? 0));
    }
  }
  return vec;
}

function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  for (const [term, weight] of a.entries()) {
    const other = b.get(term);
    if (other) dot += weight * other;
  }
  const normA = Math.sqrt(Array.from(a.values()).reduce((s, v) => s + v * v, 0));
  const normB = Math.sqrt(Array.from(b.values()).reduce((s, v) => s + v * v, 0));
  if (normA === 0 || normB === 0) return 0;
  return dot / (normA * normB);
}

export type RetrievalResult = {
  chunk: Chunk;
  score: number;
};

export function retrieve(index: VectorIndex, query: string, topK = 3): RetrievalResult[] {
  const queryVec = vectorizeQuery(query, index.idf);
  const scored = index.chunks.map((chunk, i) => ({
    chunk,
    score: cosineSimilarity(queryVec, index.vectors[i]),
  }));
  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}
