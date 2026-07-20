# Safety rules — RAG Research Assistant

1. Document text is always treated as untrusted input. In the LLM
   (generative) path it's delimited with `<excerpt>` tags and the model
   is explicitly instructed not to follow any instructions found inside
   it — see `SYSTEM_PROMPT` in `src/rag/answer.ts`.
2. The extractive path (default, no API key needed) never executes
   anything found in the document — it can only ever quote retrieved
   text back verbatim. This makes it immune to prompt injection by
   construction, not just by instruction.
3. Both paths return an explicit "not covered in this document" instead
   of guessing when retrieval confidence is below threshold
   (`NO_ANSWER_THRESHOLD` in `answer.ts`).
4. Every answer states which chunk(s) it's based on.
5. No LLM key is required for the app to function.
