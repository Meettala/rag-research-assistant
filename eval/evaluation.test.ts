/**
 * Evaluation entry point.
 *
 * Run with `npm run eval`. This prints the metric report, writes the machine
 * readable result to eval/results/latest.json, and fails when any metric
 * breaches the committed floor in eval/thresholds.json.
 *
 * It is a Vitest file so that the evaluation can gate CI with no extra
 * tooling, but it is an evaluation rather than a unit test: the unit suite
 * lives in tests/ and runs separately via `npm test`.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  formatReport,
  formatSweep,
  runEvaluation,
  sweepCoverageThreshold,
} from "./harness";

const EVAL_DIR = dirname(fileURLToPath(import.meta.url));

type Thresholds = {
  minimums: Record<string, number>;
  maximums: Record<string, number>;
};

const thresholds = JSON.parse(
  readFileSync(resolve(EVAL_DIR, "thresholds.json"), "utf8"),
) as Thresholds;

describe("RAG pipeline evaluation", () => {
  it("meets every committed metric threshold", async () => {
    const report = await runEvaluation();

    console.log(`\n${formatReport(report)}`);

    const resultsDir = resolve(EVAL_DIR, "results");
    mkdirSync(resultsDir, { recursive: true });
    writeFileSync(
      resolve(resultsDir, "latest.json"),
      `${JSON.stringify(report, null, 2)}\n`,
      "utf8",
    );

    const metrics = report.metrics as unknown as Record<string, number>;

    for (const [metric, floor] of Object.entries(thresholds.minimums)) {
      expect(
        metrics[metric],
        `${metric} fell below its committed floor of ${floor}`,
      ).toBeGreaterThanOrEqual(floor);
    }

    for (const [metric, ceiling] of Object.entries(thresholds.maximums)) {
      expect(
        metrics[metric],
        `${metric} rose above its committed ceiling of ${ceiling}`,
      ).toBeLessThanOrEqual(ceiling);
    }
  });

  it("re-derives the coverage threshold from the golden set", async () => {
    const rows = await sweepCoverageThreshold();

    console.log(`\n${formatSweep(rows)}`);

    writeFileSync(
      resolve(EVAL_DIR, "results", "sweep.json"),
      `${JSON.stringify(rows, null, 2)}\n`,
      "utf8",
    );

    expect(rows.length).toBeGreaterThan(0);
  });
});
