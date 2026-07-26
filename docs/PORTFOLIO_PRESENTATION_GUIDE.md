# Portfolio Presentation Guide

Use this guide after the code and CI are green.

## Run the application

```bash
git clone https://github.com/Meettala/rag-research-assistant.git
cd rag-research-assistant
npm ci
npm run dev
```

Open `http://localhost:3000`.

## Capture the primary screenshot

1. Use the included Apollo sample document.
2. Ask: `Who first stepped onto the Moon?`
3. Wait for the cited answer.
4. Capture the full browser area showing the project title, evidence input, question, answer, citations and retrieval metadata.
5. Do not show browser bookmarks, API keys, terminal secrets, personal files or unrelated tabs.
6. Save the image as `docs/assets/app-screenshot.png`.

Recommended width: 1440–1600 pixels. Use a sharp PNG.

## Record a short demo

Create a 30–60 second screen recording:

1. Show the sample evidence.
2. Ask a supported question and show the citation.
3. Ask an unrelated question such as `What is the capital of France?` and show the not-covered response.
4. Briefly open the retrieval metadata.

Keep the recording silent or use short captions. Remove private notifications and credentials. Save a compressed GIF or MP4 outside the repository if GitHub size becomes excessive.

## Add media to the README

After capturing the screenshot, add this near the top of `README.md`:

```markdown
![RAG Research Assistant demo](docs/assets/app-screenshot.png)
```

Do not add a placeholder or fake product screenshot.

## GitHub social preview

Source artwork already exists at:

```text
docs/assets/social-preview.svg
```

GitHub repository social previews generally work best as PNG. Export it at 1280 × 640 pixels, then:

1. Open the repository on GitHub.
2. Select **Settings**.
3. Open **General**.
4. Find **Social preview**.
5. Upload the rendered PNG.
6. Save and verify the preview.

## Repository metadata

Suggested description:

> Safety-first RAG assistant with local TF-IDF retrieval, cited answers, strict provider validation, prompt-injection tests, Next.js, TypeScript and Docker.

Suggested topics:

```text
rag
retrieval-augmented-generation
nextjs
typescript
applied-ai
prompt-injection
information-retrieval
vitest
docker
portfolio-project
```

## CV wording

> Built a safety-first RAG research assistant in Next.js and TypeScript using local TF-IDF retrieval, explicit no-answer thresholds, citation allow-listing, strict LLM response validation, provider fallback, prompt-injection testing, CI and Docker.

## Interview explanation

Explain the project in this order:

1. The problem: document assistants can answer fluently without sufficient evidence.
2. The default solution: local TF-IDF retrieval and extractive answers requiring no API key.
3. The fail-safe: low similarity returns not covered instead of guessing.
4. The optional LLM path: retrieved excerpts only, strict JSON, retrieved citation allow-list and extractive fallback.
5. The engineering controls: request validation, tests, TypeScript, ESLint, production build, dependency audit and Docker.
6. The trade-off: transparent lexical retrieval is easier to inspect but less semantically powerful than embeddings.

## Instructions for another AI

Start by reading `AI_HANDOFF.md`, this guide, `README.md`, `SECURITY.md` and `docs/architecture.md`. Verify the live `main` branch and CI. Do not invent screenshots, deployment URLs, metrics or test results. Preserve the local extractive mode and citation trust boundary.
