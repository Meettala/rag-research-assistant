# Commercialisation and Private Production

This public MIT-licensed repository is a portfolio and reference implementation. It demonstrates retrieval, citations, safe fallback behaviour, tests and engineering decisions.

A paid production product should be developed in a separate private repository under proprietary terms. The private implementation should not expose customer documents, production prompts, provider credentials, billing logic, tenant identifiers, private infrastructure, incident details or commercial-only intellectual property through this public repository.

Production work requires controls beyond this demo, including:

- authenticated users and least-privilege authorisation;
- tenant and document isolation;
- managed secrets and key rotation;
- encryption in transit and at rest;
- audit logging that avoids sensitive content;
- retention, export and deletion controls;
- rate limiting and abuse prevention;
- observability, alerting and backup recovery;
- provider and subprocessor review;
- privacy, regulatory and contractual assessment;
- dependency management and independent penetration testing;
- documented incident response.

Security claims must remain evidence-based. Neither the public demo nor a future production service should be described as completely secure, hallucination-free or immune to every prompt-injection technique.
