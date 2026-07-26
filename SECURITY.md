# Security Policy

## Reporting a vulnerability

Please do not publish suspected vulnerabilities, private documents, provider credentials, or exploit details in a public issue.

Report the concern privately to the repository owner through GitHub's private vulnerability reporting feature when available. Include the affected component, reproduction steps, impact, and any suggested mitigation. Do not include real customer or confidential document data.

## Security model

This project is a portfolio-grade reference implementation, not a complete governed enterprise platform. Its core controls are:

- document text and questions are treated as untrusted data;
- the default answer path is local and extractive;
- low-confidence retrieval returns an explicit not-covered result;
- optional provider output is parsed as untrusted JSON;
- generated citations must belong to the retrieved chunk allow-list;
- provider failures fall back to extractive mode;
- request size and type limits are enforced before processing;
- secrets are supplied only through environment variables and are excluded from source control and Docker build context.

No system should be described as completely or 100% secure. Production use requires separate threat modelling, identity and access controls, tenant isolation, secret management, monitoring, incident response, data-retention controls, dependency management and independent security testing.

## Supported version

Security fixes are applied to the current `main` branch. Earlier commits are historical snapshots and may not contain later protections.
