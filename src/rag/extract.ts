/**
 * Narrows direct quantitative/time/ranking answers to at most the most relevant
 * two-sentence window. Other supported questions keep the retrieved evidence
 * chunk: lexical overlap is not strong enough evidence that a shorter sentence
 * contains the answer, and stripping context there can reduce correctness.
 */

import { normalizeTerm, questionContentTerms } from "./answerability";

const DEFAULT_CONTEXT_SENTENCES = 0;
const MAX_EVIDENCE_SENTENCES = 2;
const COMPACT_QUESTION = /\b(?:how many|how much|how long|how often|how late|how quickly|when|highest|lowest|largest|smallest|rate|average|mean|total|percent|percentage|cost|benefit|saving|time)\b/i;
const PERIOD_MARKER = "<period>";

function protectAbbreviations(text: string): string {
  return text
    .replace(/\b([ap])\.m\./gi, (_, marker: string) => `${marker}${PERIOD_MARKER}m${PERIOD_MARKER}`)
    .replace(/\b(i)\.e\./gi, (_, marker: string) => `${marker}${PERIOD_MARKER}e${PERIOD_MARKER}`)
    .replace(/\b(e)\.g\./gi, (_, marker: string) => `${marker}${PERIOD_MARKER}g${PERIOD_MARKER}`);
}

function restoreAbbreviations(text: string): string {
  return text.replaceAll(PERIOD_MARKER, ".");
}

export function splitSentences(text: string): string[] {
  return protectAbbreviations(text)
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map((sentence) => restoreAbbreviations(sentence.trim()))
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
  if (!COMPACT_QUESTION.test(question)) return passageText.trim();

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
