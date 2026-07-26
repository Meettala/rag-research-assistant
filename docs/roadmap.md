# Roadmap

The roadmap preserves the local, cited and fail-safe core while improving retrieval quality and product usefulness.

## Near term

- Add a measured retrieval evaluation set with relevant and irrelevant questions.
- Tune the no-answer threshold from recorded results rather than intuition alone.
- Add file ingestion for text, PDF and DOCX with strict size and type controls.
- Add accessible source-chunk previews beside citations.
- Add provider latency and failure metrics without logging private document text.

## Medium term

- Add local or hosted embeddings behind a pluggable retrieval interface.
- Compare lexical, semantic and hybrid retrieval using the same evaluation set.
- Add reranking with explicit latency and quality measurements.
- Support multiple documents with document-level citation identifiers.
- Add user-controlled deletion and retention when persistence is introduced.

## Production-only work

A commercial service should be developed in a separate private repository. It would require authentication, authorisation, tenant isolation, managed secrets, encryption, audit logs, rate limits, abuse controls, monitoring, backups, retention policies, data-processing agreements, incident response and independent security testing.

## Non-goals

- Uncited general-purpose chat.
- Following instructions found inside source documents.
- Returning confident answers when evidence is insufficient.
- Claiming that prompt injection or hallucination risk is completely eliminated.
