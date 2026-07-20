/**
 * Splits document text into overlapping chunks for retrieval.
 *
 * Kept simple and paragraph-aware rather than a fixed character window,
 * so citations point to something a human would recognize as "a passage"
 * rather than an arbitrary character slice.
 */

export type Chunk = {
  id: string;
  text: string;
  index: number;
};

const TARGET_CHUNK_CHARS = 800;
const OVERLAP_CHARS = 150;

export function chunkDocument(text: string): Chunk[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const paragraphs = normalized
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: Chunk[] = [];
  let buffer = "";

  const flush = () => {
    if (buffer.trim().length > 0) {
      chunks.push({
        id: `chunk_${chunks.length}`,
        text: buffer.trim(),
        index: chunks.length,
      });
    }
  };

  for (const para of paragraphs) {
    if (buffer.length + para.length > TARGET_CHUNK_CHARS && buffer.length > 0) {
      flush();
      // carry a small overlap forward so context isn't lost at boundaries
      buffer = buffer.slice(-OVERLAP_CHARS) + "\n\n" + para;
    } else {
      buffer = buffer ? buffer + "\n\n" + para : para;
    }
  }
  flush();

  // Fallback: if the whole document was one giant paragraph with no
  // blank-line breaks, hard-wrap it so we still get multiple chunks.
  if (chunks.length <= 1 && normalized.length > TARGET_CHUNK_CHARS * 1.5) {
    return hardWrap(normalized);
  }

  return chunks;
}

function hardWrap(text: string): Chunk[] {
  const chunks: Chunk[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + TARGET_CHUNK_CHARS, text.length);
    chunks.push({ id: `chunk_${chunks.length}`, text: text.slice(start, end).trim(), index: chunks.length });
    start = end - OVERLAP_CHARS;
    if (start <= 0 || end === text.length) break;
  }
  return chunks;
}
