"use client";

import { useState } from "react";
import {
  MAX_DOCUMENT_CHARS,
  MAX_QUESTION_CHARS,
} from "@/rag/request";

type QueryResponse = {
  answer: string;
  citedChunkIds: string[];
  mode: "extractive" | "generative";
  confidence: number;
  llmAvailable: boolean;
  chunkCount: number;
  retrievedChunks: { id: string; score: number }[];
};

const SAMPLE_DOC = `The Apollo 11 mission launched on July 16, 1969, carrying astronauts Neil Armstrong, Buzz Aldrin, and Michael Collins. It was the first crewed mission to land on the Moon.

Armstrong and Aldrin descended to the lunar surface in the Lunar Module "Eagle" on July 20, 1969, while Collins remained in lunar orbit aboard the Command Module "Columbia."

Armstrong became the first person to step onto the Moon. The astronauts spent about two and a half hours outside the spacecraft, collecting samples and conducting experiments.

The mission returned to Earth on July 24, 1969, splashing down in the Pacific Ocean. It was considered a major victory in the Space Race.`;

function isQueryResponse(value: unknown): value is QueryResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Partial<QueryResponse>;
  return (
    typeof candidate.answer === "string" &&
    Array.isArray(candidate.citedChunkIds) &&
    candidate.citedChunkIds.every((id) => typeof id === "string") &&
    (candidate.mode === "extractive" || candidate.mode === "generative") &&
    typeof candidate.confidence === "number" &&
    typeof candidate.llmAvailable === "boolean" &&
    typeof candidate.chunkCount === "number" &&
    Array.isArray(candidate.retrievedChunks)
  );
}

export default function Home() {
  const [documentText, setDocumentText] = useState(SAMPLE_DOC);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAsk =
    documentText.trim().length > 0 && question.trim().length > 0 && !loading;

  async function handleAsk() {
    if (!canAsk) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentText, question }),
      });
      const data: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof data.error === "string"
            ? data.error
            : "The request could not be processed.";
        throw new Error(message);
      }

      if (!isQueryResponse(data)) {
        throw new Error("The server returned an unexpected response.");
      }

      setResult(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function loadSample() {
    setDocumentText(SAMPLE_DOC);
    setQuestion("Who first stepped onto the Moon?");
    setResult(null);
    setError(null);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
            Safety-first retrieval augmented generation
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            RAG Research Assistant
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            Ask questions about supplied evidence and receive cited answers—or
            an explicit not-covered response when retrieval is insufficient.
            The default mode works locally without an API key.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <label htmlFor="document-text" className="font-semibold">
                Document evidence
              </label>
              <button
                type="button"
                onClick={loadSample}
                className="text-sm font-medium text-cyan-300 hover:text-cyan-200"
              >
                Load sample
              </button>
            </div>
            <textarea
              id="document-text"
              className="min-h-80 w-full rounded-xl border border-slate-700 bg-slate-950 p-4 font-mono text-sm leading-6 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
              value={documentText}
              maxLength={MAX_DOCUMENT_CHARS}
              onChange={(event) => setDocumentText(event.target.value)}
              aria-describedby="document-count"
            />
            <p id="document-count" className="mt-2 text-right text-xs text-slate-400">
              {documentText.length.toLocaleString()} / {MAX_DOCUMENT_CHARS.toLocaleString()} characters
            </p>
          </div>

          <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold">Evidence boundary</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <li>Local TF-IDF retrieval works without provider credentials.</li>
              <li>Low-confidence questions return a not-covered answer.</li>
              <li>Generated answers may cite only retrieved chunk identifiers.</li>
              <li>Document instructions are treated as untrusted source text.</li>
            </ul>
          </aside>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <label htmlFor="question" className="font-semibold">
            Research question
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              id="question"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 p-4 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
              value={question}
              maxLength={MAX_QUESTION_CHARS}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Who first stepped onto the Moon?"
              onKeyDown={(event) => {
                if (event.key === "Enter") void handleAsk();
              }}
            />
            <button
              type="button"
              onClick={() => void handleAsk()}
              disabled={!canAsk}
              className="rounded-xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Retrieving…" : "Ask document"}
            </button>
          </div>
        </section>

        <div aria-live="polite" aria-atomic="true">
          {error && (
            <div role="alert" className="mt-6 rounded-xl border border-red-400/40 bg-red-950/50 p-4 text-red-100">
              {error}
            </div>
          )}

          {result && (
            <section className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                <span className="rounded-full bg-cyan-300/15 px-3 py-1 text-cyan-200">
                  {result.mode === "generative"
                    ? "Grounded LLM synthesis"
                    : "Extractive local answer"}
                </span>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-300">
                  {result.chunkCount} chunks indexed
                </span>
              </div>

              <h2 className="mt-5 text-xl font-bold">Answer</h2>
              <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-200">
                {result.answer}
              </p>

              <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-slate-950 p-4">
                  <dt className="text-slate-400">Citations</dt>
                  <dd className="mt-1 font-medium">
                    {result.citedChunkIds.length > 0
                      ? result.citedChunkIds.join(", ")
                      : "No supporting chunk met the threshold"}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-950 p-4">
                  <dt className="text-slate-400">Retrieval confidence</dt>
                  <dd className="mt-1 font-medium">
                    {result.confidence.toFixed(3)}
                  </dd>
                </div>
              </dl>

              <details className="mt-5 rounded-xl border border-slate-700 p-4">
                <summary className="cursor-pointer font-medium">
                  Retrieved evidence metadata
                </summary>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {result.retrievedChunks.map((chunk) => (
                    <li key={chunk.id}>
                      {chunk.id}: similarity {chunk.score.toFixed(3)}
                    </li>
                  ))}
                </ul>
              </details>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
