/**
 * Decides whether retrieved evidence actually supports answering the question,
 * as opposed to merely being about the same subject.
 *
 * Similarity measures topical relatedness, not answerability. The default gate
 * therefore requires lexical evidence coverage plus a key-term match. JR03 adds
 * two deliberately narrow support modes without lowering that default gate:
 * explicit negative evidence for positive yes/no questions, and metalinguistic
 * questions that ask what an instruction/sentence says rather than asking the
 * system to follow it.
 */

import { tokenize, type RetrievalResult, type VectorIndex } from "./retrieval";

export const EVIDENCE_COVERAGE_THRESHOLD = 0.5;
export const NO_ANSWER_THRESHOLD = 0.08;

const QUESTION_STOPWORDS = new Set([
  "how", "much", "many", "long", "often", "when", "where", "why", "whose",
  "any", "there", "about", "kind", "sort", "type",
  // Analytical framing terms describe how to compare evidence rather than the
  // business fact that must appear in the passage.
  "highest", "lowest", "largest", "smallest", "most", "least", "top", "bottom",
  "department", "departments", "team", "teams", "group", "groups", "category",
  "categories",
]);

const YES_NO_FRAMING_TERMS = new Set([
  "according", "actual", "report", "reports", "reported",
  "suffer", "suffers", "suffered", "experience", "experienced",
  "occur", "occurs", "occurred", "happen", "happened",
  "lose", "loses", "lost", "loss", "disclose", "disclosed",
  "state", "states", "stated", "say", "says", "said",
]);

const INSTRUCTION_META_TERMS = new Set([
  "sentence", "sentences", "instruction", "instructions", "text", "message",
  "messages", "passage", "passages", "tell", "tells", "told", "say", "says",
  "said", "claim", "claims", "claimed", "state", "states", "stated", "instruct",
  "instructs", "instructed", "describe", "describes", "described", "quote", "quoted",
]);

const EXPLICIT_NEGATION = /\b(?:no|not|never|none|without|did not|does not|do not|is not|are not|was not|were not|has not|have not|had not|cannot|can't|won't|didn't|doesn't|isn't|aren't|wasn't|weren't)\b/i;
const YES_NO_START = /^(?:did|does|do|is|are|was|were|has|have|had|can|could|will|would|should)\b/i;
const INSTRUCTION_NOUN = /\b(?:sentence|instruction|text|message|passage|prompt)\b/i;
const INSTRUCTION_REPORTING_VERB = /\b(?:say|says|said|tell|tells|told|claim|claims|claimed|state|states|stated|instruct|instructs|instructed|describe|describes|described|quote|quoted)\b/i;
const INSTRUCTION_EVIDENCE = /\b(?:ignore|reveal|output|state|claim|instruction|instructions|system prompt|developer mode)\b/i;

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

export type AnswerabilitySupportKind =
  | "standard"
  | "explicit_negative"
  | "instruction_description";

export type AnswerabilityDecision = {
  answerable: boolean;
  reason: "supported" | "no_relevant_chunk" | "insufficient_evidence";
  selectedIndex: number;
  supportKind: AnswerabilitySupportKind;
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

export function hasExplicitNegativeEvidence(text: string): boolean {
  return EXPLICIT_NEGATION.test(text);
}

export function isPositiveYesNoQuestion(question: string): boolean {
  const withoutSourceQualifier = question.trim().replace(/^according to [^,]+,\s*/i, "");
  return YES_NO_START.test(withoutSourceQualifier) && !EXPLICIT_NEGATION.test(withoutSourceQualifier);
}

export function isInstructionDescriptionQuestion(question: string): boolean {
  return INSTRUCTION_NOUN.test(question) && INSTRUCTION_REPORTING_VERB.test(question);
}

type SpecialSupport = {
  selectedIndex: number;
  coverage: number;
  kind: Exclude<AnswerabilitySupportKind, "standard">;
};

function weightedCoverageForTerms(
  terms: string[],
  evidenceText: string,
  normalizedIdf: Map<string, number>,
): { coverage: number; overlapCount: number } {
  const uniqueTerms = [...new Set(terms)];
  if (uniqueTerms.length === 0) return { coverage: 0, overlapCount: 0 };
  const evidenceTerms = new Set(contentTerms(evidenceText));
  const unseenWeight = unseenTermWeight(normalizedIdf);
  let totalWeight = 0;
  let coveredWeight = 0;
  let overlapCount = 0;
  for (const term of uniqueTerms) {
    const weight = normalizedIdf.get(term) ?? unseenWeight;
    totalWeight += weight;
    if (evidenceTerms.has(term)) {
      coveredWeight += weight;
      overlapCount += 1;
    }
  }
  return {
    coverage: totalWeight === 0 ? 0 : coveredWeight / totalWeight,
    overlapCount,
  };
}

function yesNoPropositionTerms(question: string): string[] {
  return tokenize(question)
    .filter((term) => !QUESTION_STOPWORDS.has(term) && !YES_NO_FRAMING_TERMS.has(term))
    .map(normalizeTerm);
}

function instructionDescriptionTerms(question: string): string[] {
  return tokenize(question)
    .filter((term) => !QUESTION_STOPWORDS.has(term) && !INSTRUCTION_META_TERMS.has(term))
    .map(normalizeTerm);
}

function splitEvidenceSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function findExplicitNegativeSupport(
  question: string,
  results: RetrievalResult[],
  normalizedIdf: Map<string, number>,
): SpecialSupport | undefined {
  if (!isPositiveYesNoQuestion(question)) return undefined;
  const propositionTerms = yesNoPropositionTerms(question);
  if (propositionTerms.length === 0) return undefined;
  const minimumOverlap = propositionTerms.length > 1 ? 2 : 1;
  let best: SpecialSupport | undefined;

  for (let position = 0; position < results.length; position += 1) {
    if (results[position].score < NO_ANSWER_THRESHOLD) continue;
    for (const sentence of splitEvidenceSentences(results[position].chunk.text)) {
      if (!hasExplicitNegativeEvidence(sentence)) continue;
      const match = weightedCoverageForTerms(propositionTerms, sentence, normalizedIdf);
      if (match.overlapCount < minimumOverlap || match.coverage < 0.6) continue;
      if (!best || match.coverage > best.coverage) {
        best = { selectedIndex: position, coverage: match.coverage, kind: "explicit_negative" };
      }
    }
  }
  return best;
}

function findInstructionDescriptionSupport(
  question: string,
  results: RetrievalResult[],
  normalizedIdf: Map<string, number>,
): SpecialSupport | undefined {
  if (!isInstructionDescriptionQuestion(question)) return undefined;
  const descriptiveTerms = instructionDescriptionTerms(question);
  let best: SpecialSupport | undefined;

  for (let position = 0; position < results.length; position += 1) {
    const result = results[position];
    if (result.score < NO_ANSWER_THRESHOLD || !INSTRUCTION_EVIDENCE.test(result.chunk.text)) continue;
    const match = weightedCoverageForTerms(descriptiveTerms, result.chunk.text, normalizedIdf);
    const supported = descriptiveTerms.length === 0
      ? true
      : match.overlapCount >= 1 && match.coverage >= 0.5;
    if (!supported) continue;
    if (!best || match.coverage > best.coverage) {
      best = { selectedIndex: position, coverage: match.coverage, kind: "instruction_description" };
    }
  }
  return best;
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
      supportKind: "standard",
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

  const negativeSupport = findExplicitNegativeSupport(question, results, normalizedIdf);
  if (negativeSupport) {
    return {
      answerable: true,
      reason: "supported",
      selectedIndex: negativeSupport.selectedIndex,
      supportKind: negativeSupport.kind,
      signals: {
        topScore,
        evidenceCoverage: Math.max(bestCoverage, negativeSupport.coverage),
        scoreMargin,
      },
    };
  }

  const instructionSupport = findInstructionDescriptionSupport(question, results, normalizedIdf);
  if (instructionSupport) {
    return {
      answerable: true,
      reason: "supported",
      selectedIndex: instructionSupport.selectedIndex,
      supportKind: instructionSupport.kind,
      signals: {
        topScore,
        evidenceCoverage: Math.max(bestCoverage, instructionSupport.coverage),
        scoreMargin,
      },
    };
  }

  const signals: AnswerabilitySignals = { topScore, evidenceCoverage: bestCoverage, scoreMargin };
  const keyTermPresent = keyTermCovered(question, results[selectedIndex].chunk.text, normalizedIdf);
  if (bestCoverage < coverageThreshold || !keyTermPresent) {
    return {
      answerable: false,
      reason: "insufficient_evidence",
      selectedIndex,
      supportKind: "standard",
      signals,
    };
  }
  return {
    answerable: true,
    reason: "supported",
    selectedIndex,
    supportKind: "standard",
    signals,
  };
}
