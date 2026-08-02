/** Paragraph-aware chunking with calibrated size and overlap. */

export type Chunk = { id: string; text: string; index: number };

export const TARGET_CHUNK_CHARS = 600;
export const OVERLAP_CHARS = 75;
export const DEFAULT_TARGET_CHUNK_CHARS = TARGET_CHUNK_CHARS;
export const DEFAULT_OVERLAP_CHARS = OVERLAP_CHARS;

export type ChunkOptions = {
  targetChars?: number;
  overlapChars?: number;
};

export function chunkDocument(
  text: string,
  optionsOrTarget: ChunkOptions | number = {},
  legacyOverlap = OVERLAP_CHARS,
): Chunk[] {
  const options = typeof optionsOrTarget === "number"
    ? { targetChars: optionsOrTarget, overlapChars: legacyOverlap }
    : optionsOrTarget;
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const target = Math.max(100, Math.floor(options.targetChars ?? TARGET_CHUNK_CHARS));
  const overlap = Math.max(0, Math.min(Math.floor(options.overlapChars ?? OVERLAP_CHARS), target - 1));
  const paragraphs = normalized.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: Chunk[] = [];
  let buffer = "";
  const flush = () => {
    if (buffer.trim()) chunks.push({ id: `chunk_${chunks.length}`, text: buffer.trim(), index: chunks.length });
  };
  for (const paragraph of paragraphs) {
    if (buffer.length + paragraph.length > target && buffer.length > 0) {
      flush();
      buffer = `${buffer.slice(-overlap)}\n\n${paragraph}`;
    } else {
      buffer = buffer ? `${buffer}\n\n${paragraph}` : paragraph;
    }
  }
  flush();
  if (chunks.length <= 1 && normalized.length > target * 1.5) return hardWrap(normalized, target, overlap);
  return chunks;
}

function hardWrap(text: string, target: number, overlap: number): Chunk[] {
  const chunks: Chunk[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + target, text.length);
    chunks.push({ id: `chunk_${chunks.length}`, text: text.slice(start, end).trim(), index: chunks.length });
    if (end === text.length) break;
    const next = end - overlap;
    if (next <= start) break;
    start = next;
  }
  return chunks;
}
