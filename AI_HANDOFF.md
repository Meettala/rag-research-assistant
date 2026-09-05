# AI Handoff — RAG Research Assistant

> Always verify the current `main` branch, open pull requests, dependency versions, deployment and latest CI before changing anything.

## Current repository state

Repository: `Meettala/rag-research-assistant`  
Stack: Next.js 16.2.11, React 19.2.4, TypeScript, Tailwind CSS and Vitest  
Licence: MIT  
Package version: 0.1.0 with substantial work still under `[Unreleased]`

## Product purpose

The application accepts pasted document evidence and a research question, builds a local TF-IDF index, retrieves relevant chunks and returns either a cited answer or an explicit not-covered result.

The deterministic no-key path is primary. Optional OpenAI or Anthropic synthesis is automatically available when the corresponding provider key exists. Provider mode sends the user question and retrieved excerpts to that provider, but provider output remains subordinate to strict schema and citation validation.

## Trust model

1. Request JSON, documents, questions and provider output are untrusted.
2. Inputs are validated and size-limited.
3. Retrieval happens before answering.
4. Evidence coverage and key-term checks decide whether retrieved text supports an answer.
5. Unsupported questions should be refused instead of guessed.
6. Explicit negative evidence can support a direct `No` only through a narrow lexical proposition-overlap rule; this is not general contradiction reasoning.
7. Document instructions remain inert evidence and must never be executed.
8. Safe questions asking what hostile text says may describe that text without following it.
9. Provider output is accepted only when schema-valid and limited to retrieved citation IDs.
10. Provider failures fall back to local extractive mode.
11. The project does not claim universal correctness, complete prompt-injection immunity or zero hallucinations.

## Historical live validation — 2 August 2026

The deployed app was tested against a synthetic Northstar Analytics report with seven questions.

Historical live result:

- 4 of 7 correct;
- 3 of 7 incorrect over-refusals;
- unsupported CEO hallucination fixed;
- prompt-injection execution prevented;
- supported answers remained too long.

The three over-refusals were:

1. confirmed data breach → should have answered grounded `No`;
2. safe description of the prompt-injection sentence → should have described the sentence;
3. actual £10 million loss → should have answered grounded `No` because the report explicitly denied it.

This historical evidence is intentionally preserved in `docs/LIVE_VALIDATION_FINDINGS_2026-08-02.md`.

## JR03 automated correction — 5 September 2026

JR03 adds narrow deterministic support without lowering the global retrieval/evidence thresholds:

- explicit-negative evidence handling for positive yes/no questions when retrieval score and proposition overlap remain strong;
- safe metalinguistic handling for questions about hostile/instruction text;
- direct `No` formatting using the supporting negative evidence;
- concise one/two-sentence extraction for direct quantitative/time/ranking answers while retaining broader evidence for other questions;
- abbreviation-safe sentence splitting for forms such as `a.m.` and `p.m.`;
- reconstructed regressions for all seven documented Northstar outcomes;
- an unrelated Harborview fixture with supported, explicit-negative and unsupported questions;
- Docker verification and current production dependency auditing in CI.

The dedicated JR03 regression file contains 18 assertions over 10 labelled cases. On the current JR03 branch all 18 pass, including the three former over-refusals and the still-unsupported CEO case.

## Current deterministic evaluation

The existing golden evaluation remains 57 cases across three synthetic documents: 37 answerable and 20 unanswerable.

Current metrics:

- Hit@1: 94.6%
- Hit@3: 100.0%
- MRR@3: 0.973
- answer accuracy: 73.0%
- over-refusal: 24.3%
- abstention recall: 90.0%
- false-answer rate: 10.0%
- overall accuracy: 79.0%
- mean answer length: 274 characters

The committed thresholds were not lowered. Some known golden-set cases still fail inside the permitted envelope; do not describe the system as universally accurate or hallucination-free.

## Current verification gate

JR03 CI runs:

- `npm ci`;
- `npm audit --omit=dev`;
- TypeScript typecheck;
- zero-warning ESLint;
- Vitest unit/regression tests;
- `npm run eval`;
- production Next.js build;
- OSV lockfile scan with `fail-on-vuln: true`;
- Docker image build;
- non-root `nextjs` user verification;
- no-provider-key homepage smoke.

The stale OSV ignore for `CVE-2026-14257` was removed after dependency remediation; no replacement suppression was added.

## Release rule and remaining condition

Do **not** mark the corrected live RAG behaviour fully validated yet.

Candidate deployment:

`https://rag-research-assistant-brown.vercel.app`

After JR03 merges and deploys, complete the seven Northstar questions plus one unrelated document containing an answerable question, explicit negative and unsupported question. Record actual results separately from the automated regression fixture.

Until that fresh browser smoke passes:

- keep package version `0.1.0`;
- keep JR03 under `[Unreleased]`;
- do not claim a formal release;
- qualify the deployment as recorded/currently unverified after JR03.

See `docs/JR03_AUTOMATED_FOLLOW_UP_2026-09-05.md`.

## Rules for another AI

- Inspect live code and CI before editing.
- Preserve the retrieval/evidence thresholds unless a separate reviewed change explicitly authorises modification.
- Keep retrieved document text inert.
- Preserve provider schema validation and citation allow-listing.
- Add positive and negative tests for behavioural changes.
- Do not tune only to Northstar.
- Separate historical live results, current automated evidence and future deployment evidence.
- Never invent screenshots, deployment results, metrics or provider/privacy guarantees.
