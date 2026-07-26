# AI Handoff — RAG Research Assistant

> Paste this file into ChatGPT, Claude, Gemini, Copilot, Perplexity, or another AI assistant to continue the project without restarting it. Always verify the live repository, open pull requests, current branch, package versions, and CI status before changing anything.

## Continuation instruction

You are continuing `Meettala/rag-research-assistant`, a public portfolio project owned by Meet Tala.

Do not replace the architecture casually or weaken the evidence-grounding and untrusted-document safety model. Inspect the live code, tests, README, security documentation, package files, and active pull request before editing. Add or update tests for behavioural changes. Update this file after material code, architecture, security, dependency, deployment, documentation, licensing, roadmap, screenshot, or demo work.

Never commit API keys, private documents, customer data, private prompts, production infrastructure details, or confidential commercial information.

## Repository state

- Repository: `Meettala/rag-research-assistant`
- Default branch: `main`
- Working branch: `agent/professional-repository-foundation`
- Repository visibility: public
- Existing pull requests before this work: none
- Latest verified `main` commit when work began: `5324d84d7013680f00979f9570ec602f430f0ae0`
- CI on the starting commit: no GitHub Actions workflow run was present
- Project stack: Next.js 16, React 19, TypeScript, Tailwind CSS, Vitest
- Last updated: 26 July 2026

## Product purpose

The application accepts pasted document text and a research question, retrieves relevant chunks, and returns an answer with citations. It supports:

- a no-key extractive mode using TF-IDF retrieval and cosine similarity;
- optional OpenAI or Anthropic synthesis over retrieved excerpts;
- an explicit not-covered response when retrieval confidence is insufficient;
- citations identifying the supporting chunks.

## Intended safety properties

1. Document text is untrusted data, not system instructions.
2. The default extractive path returns retrieved text rather than generating unsupported claims.
3. Optional LLM synthesis must use only retrieved evidence and retain citations.
4. Prompt-like content inside documents must remain inert.
5. Low-confidence questions must return a clear not-covered answer instead of guessing.
6. No API key is required for the core local experience.
7. Secrets and private documents must not be committed or exposed in logs, examples, screenshots, or public CI artifacts.

These are intended properties from the existing README and security documentation. They must be verified against the live implementation and automated tests before being described as fully proven.

## Initial verified repository observations

- `package.json` defines `dev`, `build`, `start`, and `lint` scripts.
- Vitest is installed, but a dedicated `test` script is not currently defined.
- The README states that 11 tests cover chunking, retrieval, extractive answers, no-answer fallback, and prompt-injection resistance; this count and behaviour require a fresh CI-backed verification.
- No GitHub Actions workflow was present on the starting commit.
- The documentation references `PROJECT_STATUS.md`, but that file was not present on the live repository when this handoff was created.
- The public repository is currently marked private in `package.json` only in the npm-publication sense (`"private": true`); the GitHub repository itself is public.

## Audit and professionalisation plan

Continue in this order unless live findings require reprioritisation:

1. Inspect all RAG modules, API routes, UI code, tests, configuration, and documentation.
2. Establish a clean baseline by running or adding CI for install, TypeScript checking, linting, tests, and production build.
3. Add a proper `test` script and deterministic quality commands.
4. Verify retrieval thresholds, chunk identifiers, citation integrity, and not-covered behaviour.
5. Audit optional provider code for malformed responses, timeout/error handling, secret-safe logging, and evidence-only prompts.
6. Add tests for prompt injection, unsupported questions, empty documents, duplicate chunks, invalid provider output, and citation correctness.
7. Improve user-facing errors without exposing internal or provider details.
8. Add repository governance: licence, security policy, contribution guide, changelog, architecture, roadmap, and pull-request template where missing.
9. Add dependency/security scanning and reproducible setup guidance.
10. Add Docker/local demo support if useful and appropriate for this Next.js project.
11. Rework README for recruiters, technical reviewers, and job applications without unsupported claims.
12. Add portfolio presentation assets and a beginner-friendly presentation guide.
13. Keep the pull request draft until all required checks pass.
14. Merge intentionally into `main` only after final architecture, security, documentation, and recruiter-readiness review.

## Decisions to preserve

- Evidence grounding takes priority over fluent but unsupported answers.
- Extractive no-key mode remains a first-class product mode.
- Optional providers must remain subordinate to retrieval and citation controls.
- Public examples and screenshots must use synthetic or non-sensitive documents.
- Documentation claims must be supported by code, tests, CI, or measured evidence.
- Future paid production development should be separated from the public portfolio repository when private commercial controls are required.

## Rules for another AI

Before editing:

- inspect the live branch and pull requests;
- verify current dependency versions and framework documentation;
- read the actual implementation and tests rather than trusting this summary alone;
- do not ask the user to repeat information already recorded here.

Before finishing a work session:

- verify install, type checking, linting, tests, build, and security checks where configured;
- record facts rather than assumptions;
- update this file and the pull-request description;
- state any unresolved blocker clearly.
