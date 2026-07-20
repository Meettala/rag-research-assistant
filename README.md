# RAG Research Assistant

Paste a document, ask it questions, get answers with citations — and an
honest "I don't know" when the document doesn't say, instead of a
confidently invented answer.

## Two modes, one app

- **No API key (default):** TF-IDF retrieval + extractive answers. Real
  vector search, zero external calls, zero hallucination risk — the
  answer is always a verbatim retrieved passage.
- **With `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`:** retrieved chunks are
  passed to the LLM to synthesize a real answer, required to cite its
  source chunk(s). Document text is delimited and the model is
  instructed never to follow instructions found inside it.

Both modes return "not covered in this document" instead of guessing
when nothing relevant is found.

## Architecture

- `src/rag/chunk.ts` — paragraph-aware chunking with overlap.
- `src/rag/retrieval.ts` — TF-IDF vectorization + cosine similarity
  search (zero-dependency).
- `src/rag/answer.ts` — extractive fallback + optional LLM generation,
  with the untrusted-input handling and no-answer threshold.
- `src/app/api/query/route.ts` — API route tying it together.
- `src/app/page.tsx` — UI.

## Run it

```bash
npm install
npm run dev              # http://localhost:3000
```

Optionally add a key to `.env.local` (copy from `.env.example`) to enable
generative mode.

## Tests

```bash
npx vitest run
```

11 tests: chunking, retrieval relevance, extractive answers, no-answer
fallback, and prompt-injection resistance.

## Docs

- [`docs/security/safety-rules.md`](docs/security/safety-rules.md)
- [`docs/security/privacy-by-design.md`](docs/security/privacy-by-design.md)
- [`docs/testing/prompt-injection-tests.md`](docs/testing/prompt-injection-tests.md)
- [`docs/product/mvp-scope.md`](docs/product/mvp-scope.md)
