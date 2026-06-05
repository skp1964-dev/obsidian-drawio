// @ts-expect-error - imported as raw text via esbuild text loader
import viewerSource from './viewer.min.txt';

const SENTINEL = 'drawioViewerLoaded';

/**
 * Inject drawio's GraphViewer (viewer.min.js) into the given document exactly
 * once PER DOCUMENT (so pop-out windows each get their own copy). Sets offline
 * globals BEFORE injection so the viewer never reaches out to viewer.diagrams.net
 * for stylesheets/resources/proxy.
 */
export function ensureViewerLoaded(doc: Document = activeDocument): void {
  if (doc.head.dataset[SENTINEL] === '1') return;
  const win = doc.defaultView as unknown as Record<string, unknown>;
  if (win && win.GraphViewer) { doc.head.dataset[SENTINEL] = '1'; return; }
  if (win) {
    // Keep everything local/offline.
    win.mxLoadResources = false;
    win.mxLoadStylesheets = false;
    win.mxForceIncludes = false;
    win.STYLE_PATH = win.STYLE_PATH ?? '.';
    win.RESOURCE_BASE = win.RESOURCE_BASE ?? '.';
    win.mxBasePath = win.mxBasePath ?? '.';
    win.PROXY_URL = win.PROXY_URL ?? '';
  }
  const script = doc.createElement('script');
  script.textContent = viewerSource as unknown as string;
  doc.head.appendChild(script);
  doc.head.dataset[SENTINEL] = '1';
}

interface GraphViewerStatic {
  createViewerForElement(el: HTMLElement): void;
}

export function getGraphViewer(win: Window = window): GraphViewerStatic | null {
  const w = win as unknown as { GraphViewer?: GraphViewerStatic };
  return w.GraphViewer ?? null;
}

/** Test-only: clear the per-document injection sentinel. */
export function __resetViewerForTests(doc: Document = activeDocument): void {
  delete doc.head.dataset[SENTINEL];
}
