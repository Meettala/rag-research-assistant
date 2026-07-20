# Privacy by design — RAG Research Assistant

- Documents are processed in-memory per request and not persisted to any
  database or file in this MVP — nothing is stored between requests.
- No user accounts, no document history — each query is stateless.
- If persistence is added later, uploaded documents should be stored per
  user with delete controls, and never used to train or fine-tune a model
  without explicit, separate consent.
