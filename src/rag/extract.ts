/**
 * Narrows an extractive answer from a retrieved chunk to at most the most
 * relevant two-sentence window. A neighbouring sentence is retained when it
 * preserves the same evidence coverage, which avoids stripping away the
 * answer-bearing sentence from short question/answer-style paragraphs while
 * still removing the old +/-2-sentence padding.
 */

import { normalizeTerm, questionContentTerms } from "./answerability";

const DEFAULT_CONTEXT_SENTENCES = 0;
const MAX_EVIDENCE_SENTENCES = 2;

export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

function termSet(text: string): Set<string> {
  return new Set(questionContentTerms(text).map(normalizeTerm));
}

function unseenTermWeight(normalizedIdf: Map<string, number>): number {
  let maximum = 1;
  for (const value of normalizedIdf.values()) if (value > maximum) maximum = value;
  return maximum;
}

function coveredWeight(
  sentences: string[],
  questionTerms: Set<string>,
  normalizedIdf: Map<string, number>,
  unseenWeight: number,
): number {
  const windowTerms = new Set<string>();
  for (const sentence of sentences) {
    for (const term of termSet(sentence)) windowTerms.add(term);
  }
  let weight = 0;
  for (const term of questionTerms) {
    if (windowTerms.has(term)) weight += normalizedIdf.get(term) ?? unseenWeight;
  }
  return weight;
}

export function selectAnswerSpan(
  question: string,
  passageText: string,
  normalizedIdf: Map<string, number>,
  contextSentences: number = DEFAULT_CONTEXT_SENTENCES,
): string {
  const sentences = splitSentences(passageText);
  if (sentences.length <= 1) return passageText.trim();

  const rawQuestionTerms = new Set(questionContentTerms(question).map(normalizeTerm));
  if (rawQuestionTerms.size === 0) return passageText.trim();

  const passageTerms = termSet(passageText);
  const questionTerms = new Set(
    [...rawQuestionTerms].filter((term) => passageTerms.has(term)),
  );
  if (questionTerms.size === 0) return passageText.trim();

  const unseenWeight = unseenTermWeight(normalizedIdf);
  let bestStart = 0;
  let bestLength = 1;
  let bestWeight = -1;
  let bestChars = Number.POSITIVE_INFINITY;
  const maxLength = Math.min(MAX_EVIDENCE_SENTENCES, sentences.length);

  for (let length = 1; length <= maxLength; length += 1) {
    for (let start = 0; start + length <= sentences.length; start += 1) {
      const window = sentences.slice(start, start + length);
      const weight = coveredWeight(window, questionTerms, normalizedIdf, unseenWeight);
      const chars = window.join(" ").length;
      if (
        weight > bestWeight ||
        (weight === bestWeight && length > bestLength) ||
        (weight === bestWeight && length === bestLength && chars < bestChars)
      ) {
        bestWeight = weight;
        bestStart = start;
        bestLength = length;
        bestChars = chars;
      }
    }
  }

  if (bestWeight <= 0) return passageText.trim();

  const padding = Math.max(0, Math.floor(contextSentences));
  const paddedStart = Math.max(0, bestStart - padding);
  const paddedEnd = Math.min(sentences.length, bestStart + bestLength + padding);
  return sentences.slice(paddedStart, paddedEnd).join(" ");
}
