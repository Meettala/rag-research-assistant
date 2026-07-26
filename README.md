# RAG Research Assistant

A safety-first retrieval-augmented generation application that answers questions from supplied document evidence, cites the retrieved source chunks and explicitly declines to guess when evidence is insufficient.

![RAG Research Assistant architecture](docs/assets/architecture.svg)

## Why this project exists

Many document-chat demos optimise for fluent answers without making retrieval quality, citation validity or failure behaviour visible. This project treats those concerns as core engineering requirements.

The default mode works without an API key: it builds a local TF-IDF index, retrieves relevant passages and returns the strongest passage verbatim. Optional OpenAI or Anthropic synthesis is available, but provider output remains untrusted and must pass strict JSON and citation validation before it can reach the user.

## Engineering highlights

- Paragraph-aware chunking with overlap.
- Deterministic local TF-IDF retrieval and cosine similarity ranking.
- Explicit low-confidence not-covered response.
- No-key extractive mode with no external document transfer.
- Optional OpenAI or Anthropic synthesis over retrieved evidence only.
- Strict provider JSON schema, unknown-field rejection and citation allow-listing.
- Safe fallback to extractive mode after provider failures or malformed output.
- Prompt-injection tests treating hostile document instructions as inert source text.
- Request type and size validation.
- TypeScript, ESLint, Vitest, production build and dependency-audit CI.
- Non-root standalone Docker image.

## Safety and grounding model

Document text, questions and provider responses are all untrusted inputs.

The application does not claim to eliminate every hallucination or prompt-injection risk. Instead, it applies measurable controls:

1. Retrieval happens before answering.
2. Low retrieval confidence produces a not-covered response.
3. Extractive mode returns retrieved source text rather than generated claims.
4. Optional provider output must be valid JSON with only `answer` and `cited_chunk_ids`.
5. Every generated citation must belong to the actual retrieved chunk set.
6. Provider failure or invalid output falls back to extractive mode.
7. Raw provider errors, API keys and document contents are not returned to users.

See [`SECURITY.md`](SECURITY.md) and [`docs/architecture.md`](docs/architecture.md).

## Architecture

```text
Document + question
        |
        v
Strict request validation
        |
        v
Paragraph-aware chunking
        |
        v
TF-IDF index + cosine retrieval
        |
        +---- low confidence ----> not covered; do not guess
        |
        v
Extractive answer or optional provider synthesis
        |
        v
Strict JSON + retrieved-citation validation
        |
        +---- provider failure ----> extractive fallback
        |
        v
Cited answer + retrieval metadata
```

Key modules:

- `src/rag/request.ts` — request normalisation and limits.
- `src/rag/chunk.ts` — paragraph-aware chunking with overlap.
- `src/rag/retrieval.ts` — local TF-IDF indexing and deterministic ranking.
- `src/rag/answer.ts` — thresholding, extractive mode and validated provider mode.
- `src/app/api/query/route.ts` — safe server orchestration.
- `src/app/page.tsx` — accessible interactive portfolio interface.

## Quick start

### Requirements

- Node.js 22
- npm

```bash
git clone https://github.com/Meettala/rag-research-assistant.git
cd rag-research-assistant
npm ci
npm run dev
```

Open `http://localhost:3000`.

The sample document and local extractive mode work without provider credentials.

### Optional provider synthesis

Copy the environment example:

```bash
cp .env.example .env.local
```

Add either `OPENAI_API_KEY` or `ANTHROPIC_API_KEY`. Do not commit `.env.local`.

When provider mode is enabled, retrieved excerpts may be sent to that provider. Do not submit confidential documents unless the provider configuration and your data-governance requirements permit it.

## Verification

```bash
npm run verify
```

This runs:

- TypeScript checking
- zero-warning ESLint
- the Vitest test suite
- a production Next.js build

GitHub Actions also runs a high-severity production dependency audit.

The tests cover chunking, retrieval relevance, empty and invalid retrieval inputs, no-answer behaviour, extractive answers, prompt-injection resistance, API request validation, strict provider output parsing, citation allow-listing and safe provider fallback.

## Docker demo

```bash
docker build -t rag-research-assistant .
docker run --rm -p 3000:3000 rag-research-assistant
```

Optional provider credentials should be supplied at runtime, not stored in the image:

```bash
docker run --rm -p 3000:3000 \
  -e OPENAI_API_KEY="$OPENAI_API_KEY" \
  rag-research-assistant
```

The Docker image runs as a non-root user and includes a health check. It is intended for local demonstration, not as a complete production platform.

## Repository structure

```text
.
├── src/app/                 # Next.js UI and API route
├── src/rag/                 # Request, chunking, retrieval and answer logic
├── tests/                   # Unit, safety and failure-path tests
├── docs/                    # Architecture, roadmap, security and product docs
├── .github/workflows/       # CI pipeline
├── Dockerfile
├── AI_HANDOFF.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE
```

## Known limitations

- TF-IDF is lexical and may miss semantic matches with different wording.
- The no-answer threshold still needs a larger labelled evaluation set.
- The MVP accepts pasted text rather than PDF or DOCX files.
- It handles one in-memory document per request and has no user accounts or persistence.
- Provider retry, latency and cost instrumentation are future work.
- The public demo is not a governed multi-tenant enterprise service.

See [`docs/roadmap.md`](docs/roadmap.md).

## Commercial boundary

This public repository is MIT licensed for portfolio and reference use. A future paid service should be developed in a separate private proprietary repository with identity, tenant isolation, managed secrets, encryption, monitoring, retention controls, abuse prevention, incident response and independent security testing.

See [`docs/commercialisation-and-private-production.md`](docs/commercialisation-and-private-production.md).

## Contributing

Review [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening a pull request. Changes must preserve the evidence boundary and pass `npm run verify`.

## Licence

MIT. See [`LICENSE`](LICENSE).

## Author

Built by [Meet Tala](https://github.com/Meettala) as a portfolio project demonstrating applied AI, RAG, retrieval evaluation, grounded generation, TypeScript and production-minded software engineering.
