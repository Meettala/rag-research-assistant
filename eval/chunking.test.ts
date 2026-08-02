/**
 * Chunking calibration.
 *
 * Chunk size and overlap are retrieval hyperparameters, not style choices, so
 * they are swept against the golden set rather than picked by feel. This file
 * prints the sweep and fails if the committed defaults stop being competitive
 * with the best configuration found, which would mean the defaults have drifted
 * away from the evidence that justified them.
 */

import { describe, expect, it } from "vitest";

import { OVERLAP_CHARS, TARGET_CHUNK_CHARS } from "../src/rag/chunk";
import { runEvaluation } from "./harness";

const TARGET_SIZES = [400, 600, 800, 1000, 1400];
const OVERLAPS = [0, 75, 150, 300];

/** How far below the best swept configuration the defaults may sit. */
const TOLERANCE = 0.02;

describe("chunking calibration", () => {
  it("keeps the committed defaults competitive with the best swept configuration", async () => {
    const rows: { targetChars: number; overlapChars: number; overallAccuracy: number }[] = [];

    for (const targetChars of TARGET_SIZES) {
      for (const overlapChars of OVERLAPS) {
        if (overlapChars >= targetChars) continue;
        const report = await runEvaluation(undefined, { targetChars, overlapChars });
        rows.push({
          targetChars,
          overlapChars,
          overallAccuracy: report.metrics.overallAccuracy,
        });
      }
    }

    const lines = rows.map(
      (row) =>
        `  ${String(row.targetChars).padStart(5)} / ${String(row.overlapChars).padStart(3)}  ${(row.overallAccuracy * 100).toFixed(1)}%`,
    );
    console.log(
      `\nChunking sweep (size / overlap -> overall accuracy)\n${lines.join("\n")}\n`,
    );

    const best = Math.max(...rows.map((row) => row.overallAccuracy));
    const committed = rows.find(
      (row) =>
        row.targetChars === TARGET_CHUNK_CHARS && row.overlapChars === OVERLAP_CHARS,
    );

    expect(committed, "committed chunk defaults are not covered by the sweep").toBeDefined();
    expect(
      committed?.overallAccuracy ?? 0,
      `committed chunk defaults (${TARGET_CHUNK_CHARS}/${OVERLAP_CHARS}) have drifted below the best swept configuration`,
    ).toBeGreaterThanOrEqual(best - TOLERANCE);
  });
});
