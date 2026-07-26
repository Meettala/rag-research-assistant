# Changelog

All notable changes to this project are documented here.

## [Unreleased]

### Added

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

### Changed

- Upgraded Next.js to 16.2.11.
- Pinned patched PostCSS 8.5.18 and Sharp 0.35.0 through package overrides.
- Regenerated and committed the dependency lockfile.
- Provider errors are no longer returned or logged with raw internal details.
- TF-IDF retrieval now handles invalid limits, empty corpora and non-finite scores deterministically.
- The UI now validates server response shape and presents evidence metadata clearly.

### Security notes

- `osv-scanner.toml` documents one temporary exception for `CVE-2026-14257` in `brace-expansion` copies used only by ESLint/minimatch development tooling.
- Forcing `brace-expansion` 5 into minimatch 3 breaks ESLint; the exception must be removed when the upstream lint dependency chain supports a compatible patched release.
- The affected development dependency is not part of the standalone production runtime and is not used with user-controlled glob patterns in this repository.

## [0.1.0] - 2026-07-20

### Added

- Initial Next.js RAG MVP.
- Paragraph-aware chunking.
- Local TF-IDF retrieval.
- Extractive no-key answers.
- Optional OpenAI and Anthropic synthesis.
- Initial no-answer and prompt-injection tests.
