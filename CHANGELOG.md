# Changelog

All notable changes to this project are documented here.

## [Unreleased]

### JR03 job-readiness correctness pass — 5 September 2026

#### Added

- Permanent reconstructed regressions for all seven Northstar outcomes recorded in the 2 August live validation.
- Unrelated Harborview regression fixture with a supported answer, explicit negative and unsupported question.
- Narrow explicit-negative and safe quoted-instruction answerability support.
- Direct grounded `No` formatting for explicit denials.
- Concise extraction policy for direct quantitative/time/ranking answers without globally truncating evidence.
- GitHub Actions production dependency audit with `npm audit --omit=dev`.
- Docker CI that builds the standalone image, verifies the configured non-root `nextjs` user and smoke-tests the homepage without provider keys.
- `docs/JR03_AUTOMATED_FOLLOW_UP_2026-09-05.md` separating current automated results from historical live validation.

#### Changed

- Patched the PostCSS override from 8.5.18 to 8.5.23 and regenerated the lockfile.
- Provider/data documentation now states that a configured provider key automatically enables synthesis and sends the question plus retrieved excerpts to that provider.
- Current recruiter documentation now reports the deterministic evaluation metrics and the remaining live-validation condition explicitly.

#### Security notes

- Removed the historical `CVE-2026-14257` OSV exception after the current dependency graph no longer required it.
- OSV scanning remains enabled with `fail-on-vuln: true`; no replacement ignore was added.
- Current `npm audit --omit=dev` and OSV scanning are green.

#### Evaluation

The existing 57-case thresholds were **not lowered**. Current deterministic metrics remain:

- Hit@1: 94.6%
- Hit@3: 100.0%
- MRR@3: 0.973
- answer accuracy: 73.0%
- abstention recall: 90.0%
- overall accuracy: 79.0%
- over-refusal: 24.3%
- false-answer rate: 10.0%
- mean answer length: 274 characters

The package remains `0.1.0` with unreleased work. The repository's own release rule requires a fresh post-merge live validation before marking the corrected live behaviour fully validated.

### Earlier unreleased work

#### Added

- GitHub Actions verification for TypeScript, ESLint, Vitest and production build.
- Google OSV-Scanner dependency scanning.
- Strict provider-response validation and citation allow-listing.
- Provider HTTP failure handling, timeouts and safe extractive fallback.
- Strict API request validation and size limits.
- Retrieval edge-case coverage.
- Excerpt delimiter escaping and regression coverage.
- Accessible portfolio interface.
- Standalone non-root Docker image.
- MIT licence, security policy, contribution guidelines and living AI handoff.
- Deterministic 57-case retrieval/answerability evaluation and committed CI thresholds.

#### Changed

- Upgraded Next.js to 16.2.11.
- Regenerated and committed the dependency lockfile.
- Provider errors are no longer returned or logged with raw internal details.
- TF-IDF retrieval handles invalid limits, empty corpora and non-finite scores deterministically.
- The UI validates server response shape and presents evidence metadata clearly.
- Added evidence-coverage and key-term answerability checks so lexical retrieval alone does not authorise an answer.

## [0.1.0] - 2026-07-20

### Added

- Initial Next.js RAG MVP.
- Paragraph-aware chunking.
- Local TF-IDF retrieval.
- Extractive no-key answers.
- Optional OpenAI and Anthropic synthesis.
- Initial no-answer and prompt-injection tests.
