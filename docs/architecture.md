# Architecture

## Objective

The application answers questions from supplied document evidence while making retrieval, citations and failure behaviour visible and testable.

## Request flow

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
Local TF-IDF index and cosine retrieval
        |
        +---- low score ----> explicit not-covered response
        |
        v
Extractive answer (default) or optional provider synthesis
        |
        v
Strict provider JSON and citation validation
        |
        +---- failure ----> extractive fallback
        |
        v
Cited answer + retrieval metadata
```

## Trust boundaries

Untrusted inputs include request JSON, document text, questions, environment-controlled provider responses and any instructions embedded inside source documents.

The provider boundary accepts only a JSON object with `answer` and `cited_chunk_ids`. The answer must be non-empty, citations must be a non-empty string array, unknown fields are rejected, and every citation must belong to the retrieved chunk allow-list.

## Components

| Component | Responsibility |
|---|---|
| `src/rag/request.ts` | Validate and normalise API input |
| `src/rag/chunk.ts` | Split evidence into overlapping chunks |
| `src/rag/retrieval.ts` | Build a local TF-IDF index and rank chunks |
| `src/rag/answer.ts` | Apply no-answer threshold, extractive answer or validated provider synthesis |
| `src/app/api/query/route.ts` | Coordinate the server request safely |
| `src/app/page.tsx` | Provide the interactive evidence and answer interface |

## Design trade-offs

TF-IDF is transparent, deterministic, inexpensive and works locally, but it is lexical rather than semantic. The project intentionally uses a simple retrieval baseline so its evidence flow can be inspected and tested. Embeddings, reranking and multi-document persistence can be added later only with explicit evaluation, privacy controls and operational design.

## Extension rule

A new retrieval or generation feature should include positive and negative tests, citation validation, failure handling, privacy review, updated documentation and a green CI run before merge.
