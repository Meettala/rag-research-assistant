# AI Handoff — RAG Research Assistant

> Paste this file into ChatGPT, Claude, Gemini, Copilot, Perplexity, or another AI assistant to continue the project without restarting it. Verify the live `main` branch, open pull requests, dependency versions and latest CI before changing anything.

## Continuation instruction

You are continuing `Meettala/rag-research-assistant`, a public MIT-licensed portfolio and reference implementation owned by Meet Tala.

Do not weaken the evidence-grounding model, local extractive mode, no-answer threshold, excerpt delimiter escaping or provider citation boundary. Read the live code, tests, `README.md`, `SECURITY.md`, `docs/architecture.md`, `docs/roadmap.md`, `osv-scanner.toml` and `docs/PORTFOLIO_PRESENTATION_GUIDE.md` before editing. Add tests for behavioural changes and update this file after material code, security, dependency, deployment, documentation, screenshot or demo work.

Never commit API keys, private documents, customer data, private prompts, production infrastructure details or confidential commercial information.

## Repository state

- Repository: `Meettala/rag-research-assistant`
- Default branch: `main`
- Professionalisation branch: `agent/professional-repository-foundation`
- Pull request: PR #1, `Professionalize RAG research assistant`
- Starting `main` commit: `5324d84d7013680f00979f9570ec602f430f0ae0`
- Stack: Next.js 16.2.11, React 19, TypeScript, Tailwind CSS and Vitest
- Licence: MIT
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
6. Document excerpts are delimiter-escaped before optional provider submission.
7. Provider mode accepts only a JSON object containing `answer` and `cited_chunk_ids`.
8. Unknown fields, empty answers, missing citations, invalid citation types and citations outside the retrieved allow-list are rejected.
9. Provider HTTP failures, timeouts and malformed output fall back to extractive mode.
10. Raw provider failures and private document content are not exposed in the UI.
11. The project does not claim to eliminate every hallucination or prompt-injection risk.

## Implemented

### Reliability and security

- Strict request validation and document/question size limits.
- Safe malformed-JSON and internal-error API responses.
- Strict provider output parsing and unknown-field rejection.
- Retrieved-chunk citation allow-listing.
- Provider HTTP status checks and 15-second timeouts.
- Generic provider-failure logging and extractive fallback.
- XML delimiter escaping for untrusted excerpt text.
- Deterministic TF-IDF behaviour for empty corpora, invalid `topK`, empty token sets, ties and non-finite scores.

### Tests

- Chunking and retrieval relevance.
- Empty/invalid retrieval inputs and deterministic ranking.
- Extractive and not-covered behaviour.
- Prompt-injection resistance.
- Request validation and size limits.
- Strict provider output validation.
- Citation allow-listing and provider fallback.
- Excerpt delimiter-escape regression coverage.

### Engineering quality

- `npm ci`, TypeScript, zero-warning ESLint, Vitest and production Next.js build in GitHub Actions.
- Google OSV-Scanner v2.3.8 against `package-lock.json`.
- Next.js 16.2.11, PostCSS 8.5.18 and Sharp 0.35.0 patched after OSV findings.
- Reproducible committed lockfile.
- Standalone Next.js output and a multi-stage non-root Docker image with health check.

### Portfolio and governance

- Accessible evidence-first UI.
- Recruiter-focused README.
- MIT licence, security policy, contribution guide, changelog and PR template.
- Architecture, roadmap and commercial/private-production documentation.
- Architecture and social-preview SVG assets.
- Beginner-friendly portfolio presentation guide.

## Dependency exception

`osv-scanner.toml` temporarily ignores only `CVE-2026-14257` for old `brace-expansion` copies used by ESLint/minimatch development tooling.

Reason:

- the affected package is not included in the standalone production runtime;
- the repository does not pass user-controlled glob patterns into ESLint tooling;
- forcing `brace-expansion` 5.0.8 into minimatch 3 breaks ESLint because the APIs are incompatible;
- the exception must be removed when the upstream ESLint dependency chain supports a patched compatible version.

Do not broaden this exception or add new ignores without a documented reachability and compatibility review.

## Verified validation status

Workflow run 38 verified the integrated implementation and generated lockfile:

- dependency installation passed;
- TypeScript passed;
- ESLint passed with zero warnings;
- all Vitest tests passed;
- the production Next.js build passed;
- OSV-Scanner passed with the documented dev-only exception.

A final clean workflow must still run after the streamlined CI and this handoff update. Do not claim a newer commit is green until GitHub confirms it.

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

## Remaining presentation work after merge

1. Run or deploy the application.
2. Capture a clean screenshot and a 30–60 second demo.
3. Add the real media to the README/portfolio.
4. Render `docs/assets/social-preview.svg` to PNG and upload it in GitHub repository settings.
5. Follow `docs/PORTFOLIO_PRESENTATION_GUIDE.md` for CV, LinkedIn and interview wording.

## Rules for another AI

Before editing, inspect the live branch, PR, CI and implementation rather than trusting this summary alone. Keep changes scoped, add positive and negative tests, never expose secrets or private documents, and update this file and the PR when project status changes.
