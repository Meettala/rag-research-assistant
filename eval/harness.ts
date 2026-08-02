/**
 * Deterministic evaluation harness.
 *
 * This runs the real production pipeline (chunk -> index -> retrieve ->
 * answer) over a labelled golden set and reports retrieval and abstention
 * metrics. It uses no LLM judge and no API key, so results are reproducible
 * byte-for-byte and can gate CI.
 *
 * Retrieval labels are expressed as evidence substrings rather than chunk
 * ids, so the dataset stays valid when chunking strategy changes.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { answerQuestion } from "../src/rag/answer";
import { chunkDocument, type ChunkOptions } from "../src/rag/chunk";
import { buildIndex, retrieve } from "../src/rag/retrieval";

/** Mirrors the value used by src/app/api/query/route.ts. */
export const RETRIEVAL_TOP_K = 3;

const EVAL_DIR = dirname(fileURLToPath(import.meta.url));

export type EvalCase = {
  id: string;
  document: string;
  question: string;
  answerable: boolean;
  expectedEvidence?: string;
  note?: string;
};

export type EvalDataset = {
  version: string;
  description: string;
  documents: Record<string, string>;
  cases: EvalCase[];
};

export type CaseOutcome = {
  id: string;
  question: string;
  answerable: boolean;
  /** True when the system declined to answer. */
  abstained: boolean;
  /** 1-based rank of the chunk containing the expected evidence, or 0. */
  evidenceRank: number;
  /** Answerable case that was answered and whose answer carried the evidence. */
  answeredWithEvidence: boolean;
  topScore: number;
  /** Character length of the returned answer, 0 when declined. */
  answerChars: number;
  /** True when the system behaved correctly for this case. */
  correct: boolean;
};

export type EvalMetrics = {
  totalCases: number;
  answerableCases: number;
  unanswerableCases: number;
  hitAtOne: number;
  hitAtThree: number;
  mrr: number;
  answerAccuracy: number;
  overRefusalRate: number;
  abstentionRecall: number;
  abstentionPrecision: number;
  falseAnswerRate: number;
  overallAccuracy: number;
  meanAnswerChars: number;
};

export type EvalReport = {
  metrics: EvalMetrics;
  outcomes: CaseOutcome[];
  failures: CaseOutcome[];
};

export function loadDataset(): EvalDataset {
  const raw = readFileSync(resolve(EVAL_DIR, "dataset.json"), "utf8");
  return JSON.parse(raw) as EvalDataset;
}

export function loadDocuments(dataset: EvalDataset): Map<string, string> {
  const documents = new Map<string, string>();
  for (const [id, relativePath] of Object.entries(dataset.documents)) {
    documents.set(id, readFileSync(resolve(EVAL_DIR, relativePath), "utf8"));
  }
  return documents;
}

export function validateDataset(
  dataset: EvalDataset,
  documents: Map<string, string>,
): string[] {
  const problems: string[] = [];
  for (const testCase of dataset.cases) {
    const document = documents.get(testCase.document);
    if (!document) {
      problems.push(`${testCase.id}: unknown document "${testCase.document}"`);
      continue;
    }
    if (testCase.answerable) {
      if (!testCase.expectedEvidence) {
        problems.push(`${testCase.id}: answerable case has no expectedEvidence`);
      } else if (!document.includes(testCase.expectedEvidence)) {
        problems.push(`${testCase.id}: expectedEvidence not found verbatim in "${testCase.document}"`);
      }
    } else if (testCase.expectedEvidence) {
      problems.push(`${testCase.id}: unanswerable case must not set expectedEvidence`);
    }
  }
  return problems;
}

async function runCase(
  testCase: EvalCase,
  documentText: string,
  coverageThreshold?: number,
  chunkOptions?: ChunkOptions,
): Promise<CaseOutcome> {
  const chunks = chunkDocument(documentText, chunkOptions);
  const index = buildIndex(chunks);
  const results = retrieve(index, testCase.question, RETRIEVAL_TOP_K);
  const answer = await answerQuestion(testCase.question, results, { index, coverageThreshold });
  const abstained = answer.citedChunkIds.length === 0;
  let evidenceRank = 0;
  if (testCase.expectedEvidence) {
    const position = results.findIndex((result) =>
      result.chunk.text.includes(testCase.expectedEvidence as string),
    );
    evidenceRank = position === -1 ? 0 : position + 1;
  }
  const answeredWithEvidence = Boolean(
    testCase.answerable && !abstained && testCase.expectedEvidence &&
      answer.answer.includes(testCase.expectedEvidence),
  );
  const correct = testCase.answerable ? answeredWithEvidence : abstained;
  return {
    id: testCase.id,
    question: testCase.question,
    answerable: testCase.answerable,
    abstained,
    evidenceRank,
    answeredWithEvidence,
    topScore: Number((results[0]?.score ?? 0).toFixed(4)),
    answerChars: abstained ? 0 : answer.answer.length,
    correct,
  };
}

export async function runEvaluation(
  coverageThreshold?: number,
  chunkOptions?: ChunkOptions,
): Promise<EvalReport> {
  const dataset = loadDataset();
  const documents = loadDocuments(dataset);
  const problems = validateDataset(dataset, documents);
  if (problems.length > 0) {
    throw new Error(`Invalid evaluation dataset:\n  ${problems.join("\n  ")}`);
  }
  const outcomes: CaseOutcome[] = [];
  for (const testCase of dataset.cases) {
    outcomes.push(await runCase(
      testCase,
      documents.get(testCase.document) as string,
      coverageThreshold,
      chunkOptions,
    ));
  }
  return {
    metrics: computeMetrics(outcomes),
    outcomes,
    failures: outcomes.filter((outcome) => !outcome.correct),
  };
}

export type SweepRow = {
  coverageThreshold: number;
  abstentionRecall: number;
  overRefusalRate: number;
  overallAccuracy: number;
};

export const SWEEP_THRESHOLDS = [
  0, 0.3, 0.4, 0.45, 0.5, 0.55, 0.58, 0.6, 0.62, 0.65, 0.7, 0.75, 0.8, 0.9,
];

export async function sweepCoverageThreshold(): Promise<SweepRow[]> {
  const rows: SweepRow[] = [];
  for (const coverageThreshold of SWEEP_THRESHOLDS) {
    const report = await runEvaluation(coverageThreshold);
    rows.push({
      coverageThreshold,
      abstentionRecall: report.metrics.abstentionRecall,
      overRefusalRate: report.metrics.overRefusalRate,
      overallAccuracy: report.metrics.overallAccuracy,
    });
  }
  return rows;
}

export function formatSweep(rows: SweepRow[]): string {
  const percent = (value: number) => `${(value * 100).toFixed(1)}%`.padStart(7);
  const lines = [
    "Coverage threshold sweep",
    "------------------------",
    "  thresh | abst.recall | over-refusal | overall",
  ];
  for (const row of rows) {
    lines.push(
      `   ${row.coverageThreshold.toFixed(2)}  |   ${percent(row.abstentionRecall)}   |   ${percent(row.overRefusalRate)}    | ${percent(row.overallAccuracy)}`,
    );
  }
  const best = rows.reduce((a, b) => b.overallAccuracy > a.overallAccuracy ? b : a);
  lines.push("", `  Best overall accuracy at threshold ${best.coverageThreshold.toFixed(2)} (${(best.overallAccuracy * 100).toFixed(1)}%)`, "");
  return lines.join("\n");
}

export function computeMetrics(outcomes: CaseOutcome[]): EvalMetrics {
  const answerable = outcomes.filter((outcome) => outcome.answerable);
  const unanswerable = outcomes.filter((outcome) => !outcome.answerable);
  const abstentions = outcomes.filter((outcome) => outcome.abstained);
  const answered = outcomes.filter((outcome) => !outcome.abstained);
  const correctAbstentions = abstentions.filter((outcome) => !outcome.answerable);
  const hitAtOne = ratio(answerable.filter((outcome) => outcome.evidenceRank === 1).length, answerable.length);
  const hitAtThree = ratio(
    answerable.filter((outcome) => outcome.evidenceRank > 0 && outcome.evidenceRank <= 3).length,
    answerable.length,
  );
  const reciprocalRankTotal = answerable.reduce(
    (sum, outcome) => sum + (outcome.evidenceRank > 0 ? 1 / outcome.evidenceRank : 0),
    0,
  );
  return {
    totalCases: outcomes.length,
    answerableCases: answerable.length,
    unanswerableCases: unanswerable.length,
    hitAtOne,
    hitAtThree,
    mrr: ratio(reciprocalRankTotal, answerable.length),
    answerAccuracy: ratio(answerable.filter((outcome) => outcome.answeredWithEvidence).length, answerable.length),
    overRefusalRate: ratio(answerable.filter((outcome) => outcome.abstained).length, answerable.length),
    abstentionRecall: ratio(unanswerable.filter((outcome) => outcome.abstained).length, unanswerable.length),
    abstentionPrecision: ratio(correctAbstentions.length, abstentions.length),
    falseAnswerRate: ratio(unanswerable.filter((outcome) => !outcome.abstained).length, unanswerable.length),
    overallAccuracy: ratio(outcomes.filter((outcome) => outcome.correct).length, outcomes.length),
    meanAnswerChars: Math.round(ratio(
      answered.reduce((sum, outcome) => sum + outcome.answerChars, 0),
      answered.length,
    )),
  };
}

function ratio(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Number((numerator / denominator).toFixed(4));
}

export function formatReport(report: EvalReport): string {
  const { metrics } = report;
  const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
  const lines = [
    "Evaluation results", "==================", "",
    `Cases: ${metrics.totalCases} (${metrics.answerableCases} answerable, ${metrics.unanswerableCases} unanswerable)`, "",
    "Retrieval (answerable cases)",
    `  Hit@1                 ${percent(metrics.hitAtOne)}`,
    `  Hit@3                 ${percent(metrics.hitAtThree)}`,
    `  MRR@3                 ${metrics.mrr.toFixed(3)}`, "",
    "Answering (answerable cases)",
    `  Answer accuracy       ${percent(metrics.answerAccuracy)}`,
    `  Over-refusal rate     ${percent(metrics.overRefusalRate)}`, "",
    "Abstention (unanswerable cases)",
    `  Abstention recall     ${percent(metrics.abstentionRecall)}`,
    `  Abstention precision  ${percent(metrics.abstentionPrecision)}`,
    `  False-answer rate     ${percent(metrics.falseAnswerRate)}`, "",
    `Overall accuracy        ${percent(metrics.overallAccuracy)}`,
    `Mean answer length      ${metrics.meanAnswerChars} chars`, "",
  ];
  if (report.failures.length > 0) {
    lines.push(`Failing cases (${report.failures.length}):`);
    for (const failure of report.failures) {
      const reason = failure.answerable
        ? failure.abstained
          ? "wrongly declined"
          : `answered without expected evidence (evidence rank ${failure.evidenceRank})`
        : "failed to decline an unanswerable question";
      lines.push(`  ${failure.id}  ${reason}`);
      lines.push(`      score ${failure.topScore.toFixed(4)}  "${failure.question}"`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
