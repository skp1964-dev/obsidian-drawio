import DOMPurify from 'dompurify';

const XLINK_NS = 'http://www.w3.org/1999/xlink';

/**
 * Drop external references on <use> elements. drawio only references internal
 * symbols (href="#id"); any non-fragment href/xlink:href would trigger an
 * external resource fetch (SSRF / network leak), so we strip it.
 */
function stripExternalUseHref(node: Element): void {
  if (node.tagName?.toLowerCase() !== 'use') return;
  const href = node.getAttribute('href');
  if (href !== null && !href.startsWith('#')) node.removeAttribute('href');
  const xhref = node.getAttributeNS(XLINK_NS, 'href');
  if (xhref !== null && !xhref.startsWith('#')) node.removeAttributeNS(XLINK_NS, 'href');
}

/**
 * Sanitize untrusted SVG markup (from diagram XML) before inserting into the DOM.
 * Removes <script>, inline event handlers, and external <use> references.
 */
export function sanitizeSvg(svg: string): string {
  DOMPurify.addHook('afterSanitizeAttributes', stripExternalUseHref);
  try {
    return DOMPurify.sanitize(svg, {
      USE_PROFILES: { svg: true, svgFilters: true },
      ADD_TAGS: ['use'],
    });
  } finally {
    DOMPurify.removeHook('afterSanitizeAttributes');
  }
}
