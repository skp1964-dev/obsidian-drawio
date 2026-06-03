/**
 * Replace the body of a fenced code block.
 * @param doc full markdown source
 * @param lineStart 0-based line index of the opening fence (```drawio)
 * @param lineEnd   0-based line index of the closing fence (```)
 * @param newBody   replacement body (without fences); may contain newlines
 */
export function replaceCodeBlockBody(
  doc: string,
  lineStart: number,
  lineEnd: number,
  newBody: string,
): string {
  const lines = doc.split('\n');
  const opening = lines[lineStart] ?? '';
  const closing = lines[lineEnd] ?? '';
  const before = lines.slice(0, lineStart);
  const after = lines.slice(lineEnd + 1);
  const bodyLines = newBody.split('\n');
  return [...before, opening, ...bodyLines, closing, ...after].join('\n');
}
