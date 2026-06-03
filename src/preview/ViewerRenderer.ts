import { ensureViewerLoaded, getGraphViewer } from './loadViewer';
import { isValidDrawioXml, ensureMxfile } from '../model/xmlUtils';
import { sanitizeSvg } from './svgSanitizer';

export interface RenderOptions { dark: boolean; }

/**
 * Render drawio XML into `el` as an inline SVG preview.
 * Returns true on success; on invalid XML renders an error placeholder and returns false.
 */
export function renderPreview(el: HTMLElement, xml: string, opts: RenderOptions): boolean {
  el.empty();
  if (!isValidDrawioXml(xml)) {
    el.createDiv({ cls: 'drawio-error', text: 'Invalid drawio diagram' });
    return false;
  }
  ensureViewerLoaded(el.ownerDocument);
  const viewer = getGraphViewer(el.ownerDocument.defaultView ?? window);
  const mount = el.createDiv({ cls: 'mxgraph' });
  const data = {
    highlight: '#0000ff', nav: true, toolbar: '', edit: null,
    'dark-mode': opts.dark ? 'auto' : 'off',
    xml: ensureMxfile(xml),
  };
  mount.setAttribute('data-mxgraph', JSON.stringify(data));
  if (viewer) {
    viewer.createViewerForElement(mount);
    // GraphViewer injects an <svg>; sanitize it post-hoc.
    // Parse the sanitized markup via DOMParser (safe DOM node insertion)
    // rather than assigning to outerHTML/innerHTML (XSS sink).
    const svg = mount.querySelector('svg');
    if (svg) {
      const clean = sanitizeSvg(svg.outerHTML);
      const parsed = new DOMParser().parseFromString(clean, 'image/svg+xml');
      const cleanNode = parsed.documentElement;
      if (cleanNode && cleanNode.tagName.toLowerCase() !== 'parsererror') {
        svg.replaceWith(el.ownerDocument.adoptNode(cleanNode));
      } else {
        svg.remove();
      }
    }
    return true;
  }
  el.createDiv({ cls: 'drawio-error', text: 'drawio viewer failed to load' });
  return false;
}
