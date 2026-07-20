"use client";

import { useState } from "react";

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

Armstrong became the first person to step onto the Moon, famously saying "That's one small step for man, one giant leap for mankind." The astronauts spent about two and a half hours outside the spacecraft, collecting samples and conducting experiments.

The mission returned to Earth on July 24, 1969, splashing down in the Pacific Ocean. It was considered a major victory in the Space Race between the United States and the Soviet Union.`;

export default function Home() {
  const [documentText, setDocumentText] = useState(SAMPLE_DOC);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk() {
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentText, question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 font-sans">
      <h1 className="text-3xl font-bold">RAG Research Assistant</h1>
      <p className="mt-2 text-gray-600">
        Paste a document, ask a question, get an answer with citations — or an
        honest &quot;not covered&quot; when it isn&apos;t there.
      </p>

      <label className="mt-8 block text-sm font-medium">Document text</label>
      <textarea
        className="mt-2 w-full rounded border border-gray-300 p-3 font-mono text-sm"
        rows={10}
        value={documentText}
        onChange={(e) => setDocumentText(e.target.value)}
      />

      <label className="mt-6 block text-sm font-medium">Your question</label>
      <div className="mt-2 flex gap-2">
        <input
          className="flex-1 rounded border border-gray-300 p-3"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Who was the first person to walk on the Moon?"
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
        />
        <button
          onClick={handleAsk}
          disabled={loading}
          className="rounded bg-black px-5 py-3 text-white disabled:opacity-50"
        >
          {loading ? "Asking..." : "Ask"}
        </button>
      </div>

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {result && (
        <div className="mt-8 rounded border border-gray-200 p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {result.mode === "generative" ? "LLM-generated answer" : "Extractive answer (no API key configured)"}
          </p>
          <p className="mt-2 whitespace-pre-wrap">{result.answer}</p>
          {result.citedChunkIds.length > 0 && (
            <p className="mt-3 text-xs text-gray-500">
              Cited: {result.citedChunkIds.join(", ")} · confidence {result.confidence.toFixed(2)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
