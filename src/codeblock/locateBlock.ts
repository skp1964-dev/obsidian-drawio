export interface BlockRange { start: number; end: number; } // 0-based fence line indices

const OPEN_RE = /^\s*(```+|~~~+)\s*drawio\s*$/;
const CLOSE_RE = /^\s*(```+|~~~+)\s*$/;

/**
 * Find a fenced ```drawio block whose body (joined and trimmed) equals
 * `expectedBody` (trimmed). Returns the opening/closing fence line indices,
 * or null if no such block exists. Content-matching is robust against line
 * shifts and disambiguates multiple drawio blocks.
 */
export function locateDrawioBlock(lines: string[], expectedBody: string): BlockRange | null {
  const want = expectedBody.trim();
  for (let i = 0; i < lines.length; i++) {
    if (!OPEN_RE.test(lines[i] ?? '')) continue;
    for (let j = i + 1; j < lines.length; j++) {
      if (CLOSE_RE.test(lines[j] ?? '')) {
        const body = lines.slice(i + 1, j).join('\n').trim();
        if (body === want) return { start: i, end: j };
        i = j; // resume scanning after this block
        break;
      }
    }
  }
  return null;
}
