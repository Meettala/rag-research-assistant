# Contributing

Thank you for improving the RAG Research Assistant.

## Development workflow

1. Create a focused branch from `main`.
2. Install with `npm ci`.
3. Make a scoped change with tests.
4. Run `npm run verify`.
5. Open a pull request explaining behaviour, risks and validation.

## Required design rules

- Keep the no-key extractive mode functional.
- Treat documents, questions and provider output as untrusted input.
- Do not return generated claims without retrieved evidence and validated citations.
- Keep the explicit not-covered behaviour when evidence is insufficient.
- Never log or commit API keys, private documents or provider payloads containing sensitive data.
- Do not weaken CI, lint, tests, build or dependency auditing merely to make a change pass.

## Tests

Add positive and negative tests for behavioural changes, especially changes involving retrieval thresholds, prompt injection, provider parsing, citations, API validation or error handling.

## Documentation

Update `README.md`, relevant files under `docs/`, `CHANGELOG.md` and `AI_HANDOFF.md` when architecture, security, deployment, limitations or project status changes.
