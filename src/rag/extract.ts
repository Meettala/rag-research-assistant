/**
 * Narrows an extractive answer from a whole retrieved chunk to the shortest
 * contiguous run of sentences that still carries the question's evidence.
 */

import { normalizeTerm, questionContentTerms } from "./answerability";

const CONTEXT_SENTENCES = 2;

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function coveredWeight(
  sentence: string,
  questionTerms: Set<string>,
  normalizedIdf: Map<string, number>,
  unseenWeight: number,
): number {
  const sentenceTerms = new Set(questionContentTerms(sentence).map(normalizeTerm));
  let weight = 0;
  for (const term of questionTerms) {
    if (sentenceTerms.has(term)) weight += normalizedIdf.get(term) ?? unseenWeight;
  }
  return weight;
}

export function selectAnswerSpan(
  question: string,
  passageText: string,
  normalizedIdf: Map<string, number>,
  contextSentences: number = CONTEXT_SENTENCES,
): string {
  const sentences = splitSentences(passageText);
  if (sentences.length <= 1) return passageText.trim();
  const questionTerms = new Set(questionContentTerms(question).map(normalizeTerm));
  if (questionTerms.size === 0) return passageText.trim();
  let unseenWeight = 1;
  for (const value of normalizedIdf.values()) if (value > unseenWeight) unseenWeight = value;
  const sentenceWeights = sentences.map((sentence) =>
    coveredWeight(sentence, questionTerms, normalizedIdf, unseenWeight),
  );
  const totalWeight = sentenceWeights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight <= 0) return passageText.trim();
  let bestStart = 0;
  let bestLength = sentences.length;
  for (let start = 0; start < sentences.length; start += 1) {
    let weight = 0;
    for (let end = start; end < sentences.length; end += 1) {
      weight += sentenceWeights[end];
      if (weight >= totalWeight) {
        const length = end - start + 1;
        if (length < bestLength) {
          bestLength = length;
          bestStart = start;
        }
        break;
      }
    }
  }
  const paddedStart = Math.max(0, bestStart - contextSentences);
  const paddedEnd = Math.min(sentences.length, bestStart + bestLength + contextSentences);
  return sentences.slice(paddedStart, paddedEnd).join(" ");
}
