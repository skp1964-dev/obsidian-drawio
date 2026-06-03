const MXFILE_RE = /<mxfile[\s>]/;
const MXMODEL_RE = /<mxGraphModel[\s>]/;

export function isValidDrawioXml(xml: string): boolean {
  if (!xml || !xml.trim()) return false;
  return MXFILE_RE.test(xml) || MXMODEL_RE.test(xml);
}

export function ensureMxfile(xml: string): string {
  const trimmed = xml.trim();
  if (MXFILE_RE.test(trimmed)) return trimmed;
  if (MXMODEL_RE.test(trimmed)) {
    return `<mxfile><diagram id="0" name="Page-1">${trimmed}</diagram></mxfile>`;
  }
  return trimmed;
}

export function extractDiagramTitle(xml: string): string | null {
  const m = xml.match(/<diagram[^>]*\bname="([^"]*)"/);
  return m?.[1] ?? null;
}
