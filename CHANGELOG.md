# Changelog

All notable changes to this project are documented here.

## [Unreleased]

### Added

- GitHub Actions verification for TypeScript, ESLint, Vitest, production build and production dependency audit.
- Strict provider-response validation and citation allow-listing.
- Provider HTTP failure handling, timeouts and safe extractive fallback.
- Strict API request validation and size limits.
- Retrieval edge-case coverage.
- Accessible portfolio interface.
- Standalone non-root Docker image.
- MIT licence, security policy, contribution guidelines and living AI handoff.

### Changed

- Provider errors are no longer returned or logged with raw internal details.
- TF-IDF retrieval now handles invalid limits, empty corpora and non-finite scores deterministically.
- The UI now validates server response shape and presents evidence metadata clearly.

## [0.1.0] - 2026-07-20

### Added

- Initial Next.js RAG MVP.
- Paragraph-aware chunking.
- Local TF-IDF retrieval.
- Extractive no-key answers.
- Optional OpenAI and Anthropic synthesis.
- Initial no-answer and prompt-injection tests.
