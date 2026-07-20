# MVP scope — RAG Research Assistant

## In scope
- Paste-text document input (file upload is a fast follow, not MVP —
  matches the "start with paste text if upload slows progress" principle).
- Chunking, TF-IDF retrieval, and an extractive answer mode that needs
  zero API key.
- Optional LLM-generative answer mode once a key is configured.
- Explicit "not covered" fallback below a confidence threshold.
- Citations on every answer.

## Explicitly out of scope for MVP
- PDF/DOCX upload parsing (future — paste text covers the core RAG logic).
- Persisted document storage / history.
- Multi-document corpora (single document per query for now).
