/**
 * Decides whether retrieved evidence actually supports answering the question,
 * as opposed to merely being about the same subject.
 *
 * Motivation is measured, not assumed. On the golden set in eval/, the top
 * cosine score distributions for answerable and unanswerable questions overlap
 * almost completely, so no threshold on similarity alone can separate them —
 * see docs/evaluation.md. Similarity measures topical relatedness, and a
 * question the document cannot answer is usually still about the document's
 * topic.
 *
 * The signal used instead is evidence coverage: how much of the question's
 * information-bearing content is actually present in the retrieved passage.
 * "Who is the CEO of Northstar Analytics?" scores highly on similarity against
 * a Northstar document, but the term carrying the entire question — "ceo" —
 * appears nowhere in it.
 *
 * This is a deterministic lexical check. It runs with no API key, adds no
 * dependency, and cannot itself hallucinate.
 */

import { tokenize, type RetrievalResult, type VectorIndex } from "./retrieval";

export const EVIDENCE_COVERAGE_THRESHOLD = 0.5;
export const NO_ANSWER_THRESHOLD = 0.08;

const QUESTION_STOPWORDS = new Set([
  "how", "much", "many", "long", "often", "when", "where", "why", "whose",
  "any", "there", "about", "kind", "sort", "type",
  // Analytical framing terms describe how to compare evidence rather than the
  // business fact that must appear in the passage. Keeping them out prevents
  // questions such as "Which department had the highest adoption?" from
  // requiring the literal word "department" when the passage directly states
  // that engineers had 91% adoption.
  "highest", "lowest", "largest", "smallest", "most", "least", "top", "bottom",
  "department", "departments", "team", "teams", "group", "groups", "category",
  "categories",
]);

export function normalizeTerm(term: string): string {
  if (term.length > 4 && term.endsWith("ies")) return `${term.slice(0, -3)}y`;
  if (term.length > 4 && term.endsWith("ing")) return term.slice(0, -3);
  if (term.length > 4 && term.endsWith("ed")) return term.slice(0, -2);
  if (term.length > 3 && term.endsWith("es")) return term.slice(0, -2);
  if (term.length > 3 && term.endsWith("s") && !term.endsWith("ss")) return term.slice(0, -1);
  return term;
}

export function questionContentTerms(text: string): string[] {
  return tokenize(text).filter((term) => !QUESTION_STOPWORDS.has(term)).map(normalizeTerm);
}

function contentTerms(text: string): string[] {
  return questionContentTerms(text);
}

export type AnswerabilitySignals = {
  topScore: number;
  evidenceCoverage: number;
  scoreMargin: number;
};

export type AnswerabilityDecision = {
  answerable: boolean;
  reason: "supported" | "no_relevant_chunk" | "insufficient_evidence";
  selectedIndex: number;
  signals: AnswerabilitySignals;
};

function unseenTermWeight(normalizedIdf: Map<string, number>): number {
  let maximum = 1;
  for (const value of normalizedIdf.values()) if (value > maximum) maximum = value;
  return maximum;
}

export function buildNormalizedIdf(index: VectorIndex): Map<string, number> {
  const normalized = new Map<string, number>();
  for (const [term, weight] of index.idf.entries()) {
    const key = normalizeTerm(term);
    const existing = normalized.get(key);
    if (existing === undefined || weight > existing) normalized.set(key, weight);
  }
  return normalized;
}

export function keyTermCovered(
  question: string,
  passageText: string,
  normalizedIdf: Map<string, number>,
): boolean {
  const questionTerms = [...new Set(contentTerms(question))];
  if (questionTerms.length === 0) return true;
  const unseenWeight = unseenTermWeight(normalizedIdf);
  const weightOf = (term: string) => normalizedIdf.get(term) ?? unseenWeight;
  let keyTerm = questionTerms[0];
  for (const term of questionTerms) if (weightOf(term) > weightOf(keyTerm)) keyTerm = term;
  return new Set(contentTerms(passageText)).has(keyTerm);
}

export function evidenceCoverage(
  question: string,
  passageText: string,
  index: VectorIndex,
  normalizedIdf: Map<string, number> = buildNormalizedIdf(index),
): number {
  const questionTerms = new Set(contentTerms(question));
  if (questionTerms.size === 0) return 0;
  const passageTerms = new Set(contentTerms(passageText));
  const unseenWeight = unseenTermWeight(normalizedIdf);
  let totalWeight = 0;
  let coveredWeight = 0;
  for (const term of questionTerms) {
    const weight = normalizedIdf.get(term) ?? unseenWeight;
    totalWeight += weight;
    if (passageTerms.has(term)) coveredWeight += weight;
  }
  return totalWeight === 0 ? 0 : coveredWeight / totalWeight;
}

export function assessAnswerability(
  question: string,
  results: RetrievalResult[],
  index: VectorIndex,
  coverageThreshold: number = EVIDENCE_COVERAGE_THRESHOLD,
): AnswerabilityDecision {
  const topScore = results[0]?.score ?? 0;
  const scoreMargin = topScore - (results[1]?.score ?? 0);
  if (!results[0] || topScore < NO_ANSWER_THRESHOLD) {
    return {
      answerable: false,
      reason: "no_relevant_chunk",
      selectedIndex: 0,
      signals: { topScore, evidenceCoverage: 0, scoreMargin },
    };
  }
  const normalizedIdf = buildNormalizedIdf(index);
  let selectedIndex = 0;
  let bestCoverage = -1;
  for (let position = 0; position < results.length; position += 1) {
    const coverage = evidenceCoverage(question, results[position].chunk.text, index, normalizedIdf);
    if (coverage > bestCoverage) {
      bestCoverage = coverage;
      selectedIndex = position;
    }
  }
  const signals: AnswerabilitySignals = { topScore, evidenceCoverage: bestCoverage, scoreMargin };
  const keyTermPresent = keyTermCovered(question, results[selectedIndex].chunk.text, normalizedIdf);
  if (bestCoverage < coverageThreshold || !keyTermPresent) {
    return { answerable: false, reason: "insufficient_evidence", selectedIndex, signals };
  }
  return { answerable: true, reason: "supported", selectedIndex, signals };
}
