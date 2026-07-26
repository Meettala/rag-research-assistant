# AI Handoff — RAG Research Assistant

> Paste this file into ChatGPT, Claude, Gemini, Copilot, Perplexity, or another AI assistant to continue the project without restarting it. Verify the live `main` branch, open pull requests, current dependencies and latest CI before changing anything.

## Continuation instruction

You are continuing `Meettala/rag-research-assistant`, a public MIT-licensed portfolio and reference implementation owned by Meet Tala.

Do not weaken the evidence-grounding model, local extractive mode, no-answer threshold or provider citation boundary. Read the live code, tests, `README.md`, `SECURITY.md`, `docs/architecture.md`, `docs/roadmap.md` and `docs/PORTFOLIO_PRESENTATION_GUIDE.md` before editing. Add tests for behavioural changes and update this file after material code, security, dependency, deployment, documentation, screenshot or demo work.

Never commit API keys, private documents, customer data, private prompts, production infrastructure details or confidential commercial information.

## Repository state

- Repository: `Meettala/rag-research-assistant`
- Default branch: `main`
- Working branch: `agent/professional-repository-foundation`
- Active pull request: Draft PR #1, `Professionalize RAG research assistant`
- Starting `main` commit: `5324d84d7013680f00979f9570ec602f430f0ae0`
- Stack: Next.js 16, React 19, TypeScript, Tailwind CSS and Vitest
- Licence: MIT on the working branch
- Last updated: 26 July 2026

## Product purpose

The application accepts pasted document evidence and a research question, builds a local TF-IDF index, retrieves relevant chunks and returns either a cited answer or an explicit not-covered result.

The no-key mode is extractive and local. Optional OpenAI or Anthropic synthesis operates only over retrieved excerpts and remains subordinate to strict provider-response and citation validation.

## Core trust model

1. Request JSON, document text, questions and provider output are untrusted.
2. Input is type-checked, trimmed and size-limited before processing.
3. Retrieval occurs before answering.
4. Low retrieval confidence returns not covered rather than guessing.
5. Extractive mode returns the strongest retrieved passage with its chunk citation.
6. Provider mode accepts only a JSON object containing `answer` and `cited_chunk_ids`.
7. Unknown provider fields, empty answers, missing citations, invalid citation types and citations outside the retrieved allow-list are rejected.
8. Provider HTTP failures, timeouts and malformed output fall back to extractive mode.
9. Raw provider failures and private document content must not be exposed in the UI or public logs.
10. The project does not claim to eliminate every hallucination or prompt-injection risk.

## Implemented on the professionalisation branch

### Reliability and security

- Added `src/rag/request.ts` for strict request validation.
- Added document and question character limits.
- Added safe malformed-JSON and internal-error responses in the API route.
- Added strict `InvalidProviderAnswer` handling.
- Added provider JSON shape and unknown-field validation.
- Added retrieved-chunk citation allow-listing.
- Added provider HTTP status checks and 15-second timeouts.
- Replaced raw provider-error logging with a generic fallback message.
- Preserved no-key extractive fallback.
- Hardened TF-IDF retrieval for empty corpora, invalid `topK`, empty token sets, deterministic ties and non-finite scores.

### Tests

- Preserved original chunking, retrieval, answer and prompt-injection tests.
- Added strict provider-output tests.
- Added unavailable-citation rejection tests.
- Added offline provider HTTP failure and malformed-citation fallback tests.
- Added request validation and size-limit tests.
- Added retrieval edge-case tests.

### Engineering quality

- Added `test`, `typecheck`, `test:watch` and `verify` npm scripts.
- Added GitHub Actions for `npm ci`, TypeScript, zero-warning ESLint, Vitest, production build and high-severity production dependency audit.
- Added standalone Next.js output.
- Added a multi-stage non-root Docker image and health check.
- Added `.dockerignore` exclusions for secrets, caches and local files.

### Portfolio and governance

- Reworked the UI into an accessible evidence-first portfolio experience.
- Reworked the README for recruiters and technical reviewers.
- Added MIT `LICENSE`.
- Added `SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md` and a pull-request template.
- Added `docs/architecture.md`, `docs/roadmap.md` and commercial/private-production guidance.
- Added architecture and social-preview SVG assets.
- Added `docs/PORTFOLIO_PRESENTATION_GUIDE.md` with screenshot, demo, GitHub metadata, CV and interview instructions.

## Validation status

Verified on the integrated branch before the latest retrieval-test correction:

- dependency installation passed;
- TypeScript checking passed;
- ESLint passed with zero warnings;
- the test stage reached one incorrect new test assumption because the sample document could form one chunk.

That test now uses an explicit three-chunk corpus. A fresh full CI run is required. Do not claim the latest branch is green until GitHub confirms tests, production build and dependency audit on the current head.

## Decisions to preserve

- Evidence grounding takes priority over fluent unsupported answers.
- Extractive no-key mode remains a first-class mode.
- Provider output is untrusted and may cite only retrieved chunks.
- Provider failure falls back safely.
- Public examples use synthetic or non-sensitive documents.
- Documentation claims require code, tests, CI or measured evidence.
- Future paid production work belongs in a separate private proprietary repository.
- Neither the demo nor a future service should be described as completely secure, hallucination-free or immune to all prompt injection.

## Known limitations

- TF-IDF is lexical and can miss semantically equivalent wording.
- The no-answer threshold needs a larger labelled evaluation set.
- Input is pasted text only; PDF and DOCX parsing are future work.
- The app handles one in-memory document per request and has no identity or persistence.
- Provider retry, latency and cost instrumentation are not implemented.
- Docker is suitable for local demonstration, not a complete production platform.
- A real app screenshot or video must be captured from a running instance; repository SVG assets are already available.

## Immediate next work

1. Confirm full CI on the current branch head.
2. Fix any remaining test, build or dependency-audit finding without weakening the gates.
3. Update the PR description with the completed scope and verified result.
4. Perform final security, architecture, documentation and recruiter review.
5. Mark PR #1 ready and squash-merge only after the exact final head is green and mergeable.
6. Capture a real screenshot/demo and upload the rendered social-preview PNG manually after merge.

## Rules for another AI

Before editing, inspect the live branch, PR, CI and implementation rather than trusting this summary alone. Keep changes scoped, add positive and negative tests, never expose secrets or private documents, and update this file and the PR when project status changes.
