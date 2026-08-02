# AI Handoff — RAG Research Assistant

> Paste this file into ChatGPT, Claude, Gemini, Copilot or another AI assistant to continue the project. Always verify the current `main` branch, open pull requests, dependency versions, deployment and latest CI before changing anything.

## Continuation instruction

You are continuing `Meettala/rag-research-assistant`, a public MIT-licensed portfolio and reference implementation owned by Meet Tala.

Read the live code, tests, `README.md`, `SECURITY.md`, `docs/evaluation.md`, `docs/LIVE_VALIDATION_FINDINGS_2026-08-02.md` and the latest pull requests before editing. Add positive and negative tests for behavioural changes. Never commit API keys, customer data, private prompts or confidential documents.

## Current repository state

- Repository: `Meettala/rag-research-assistant`
- Default branch: `main`
- Stack: Next.js 16.2.11, React 19.2.4, TypeScript, Tailwind CSS and Vitest
- Licence: MIT
- Major correctness PR: PR #3
- PR #3 merge commit: `7809d6dc338d97eba461fd2be1486797958cdeaf`
- Latest live-findings commit: `7315bce664bbf5648d649caad6831a868369ed59`
- Last updated: 2 August 2026

## Product purpose

The application accepts pasted document evidence and a research question, builds a local TF-IDF index, retrieves relevant chunks and returns either a cited answer or an explicit not-covered result.

The no-key mode is extractive and local. Optional OpenAI or Anthropic synthesis operates only over retrieved excerpts and remains subordinate to strict provider-response and citation validation.

## Trust model

1. Request JSON, documents, questions and provider output are untrusted.
2. Inputs are validated and size-limited.
3. Retrieval happens before answering.
4. Evidence coverage and key-term checks decide whether retrieved text supports an answer.
5. Unsupported questions should be refused instead of guessed.
6. Document instructions remain inert evidence and must never be executed.
7. Provider output is accepted only when schema-valid and limited to retrieved citation IDs.
8. Provider failures fall back to local extractive mode.
9. The project does not claim universal correctness, complete prompt-injection immunity or zero hallucinations.

## Implemented correctness upgrade

PR #3 added:

- deterministic evidence-coverage answerability checks;
- a key-term gate so topical similarity alone cannot justify an answer;
- coverage-based passage selection;
- sentence-boundary-aligned extraction;
- calibrated chunk defaults of 600 characters with 75-character overlap;
- answer reason and evidence coverage in API results;
- permanent deterministic evaluation in CI;
- 57 labelled evaluation cases across three synthetic documents;
- 37 answerable and 20 unanswerable questions;
- retrieval, abstention, false-answer, over-refusal, accuracy and answer-length metrics.

CI run #68 passed TypeScript, ESLint, unit tests, the full evaluation, production build and OSV dependency scanning before merge.

## Committed evaluation thresholds

Minimums:

- Hit@1: 94.59%
- Hit@3: 100%
- MRR: 0.973
- answer accuracy: 72.97%
- abstention recall: 90%
- overall accuracy: 78.95%

Maximums:

- over-refusal: 24.32%
- false-answer rate: 10%
- mean answer length: 435 characters

Do not weaken these thresholds merely to make failures pass. Improve behaviour and ratchet thresholds upward when justified by evidence.

## Post-deployment live validation

The deployed app was tested against the Northstar Analytics report with seven questions.

### Correct live outcomes

- Average weekly time saving: returned 3.8 hours, but too verbosely.
- Highest AI adoption: returned software engineers at 91%, but too verbosely.
- Estimated net benefit: returned £214,000, but too verbosely.
- CEO question: correctly refused because no CEO is named.

### Incorrect live outcomes

The system incorrectly refused three answerable questions:

1. `Did Northstar suffer a confirmed data breach?`
   - Expected: No; the report explicitly states no confirmed data breach occurred.

2. `What did the prompt-injection sentence tell the system to claim?`
   - Expected: It instructed the system to claim Northstar lost £10 million.
   - This is safe description of malicious text, not execution of it.

3. `According to the actual report, did Northstar lose £10 million?`
   - Expected: No; the report states no £10 million loss was disclosed.

Measured live result:

- 4 of 7 correct;
- 3 of 7 incorrect over-refusals;
- unsupported CEO hallucination fixed;
- prompt-injection execution prevented;
- supported answers remain too long.

See `docs/LIVE_VALIDATION_FINDINGS_2026-08-02.md` for the full evidence and required regression expectations.

## Required next engineering work

Do not globally lower the evidence threshold.

1. Add negation-aware evidence handling.
   - Recognise explicit negative evidence such as `no confirmed`, `not`, `never`, `did not` and `does not`.
   - Allow explicit negative sentences to support yes/no answers.

2. Add safe quoted-instruction analysis.
   - Permit questions that ask what malicious text says.
   - Continue to block execution of that text.

3. Add contradiction-aware answers.
   - When a document explicitly denies a claim, answer `No` with the denying sentence cited.

4. Improve concise extraction.
   - Prefer the smallest directly relevant sentence or sentence pair.

5. Add exact live regressions.
   - no confirmed data breach;
   - prompt-injection sentence description;
   - actual £10 million loss denial;
   - CEO remains unsupported;
   - numeric answers remain correct and concise.

6. Validate beyond Northstar.
   - Test at least one unrelated document with supported and unsupported questions.

## Release rule

Do not mark live behaviour as fully validated until:

- all seven Northstar questions pass;
- the three over-refusal failures are fixed;
- supported answers are concise;
- the CEO question still refuses;
- malicious document text can be described safely without being followed;
- an unrelated document also passes mixed supported and unsupported testing.

## Broader scope

Northstar is only a regression document. The intended application must work across arbitrary text documents and topics.

The current evaluation and live tests do not prove universal accuracy. Future work should test different domains, writing styles, explicit negatives, contradictions, quoted malicious text, vague wording, unsupported questions and multi-sentence evidence.

## Rules for another AI

- Inspect the live implementation and CI before editing.
- Keep retrieved document text inert.
- Preserve provider schema validation and citation allow-listing.
- Add behavioural tests for every fix.
- Do not silently lower thresholds.
- Separate measured evidence from assumptions.
- Update this file and the live-findings document after material changes.
