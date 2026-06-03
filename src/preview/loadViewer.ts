// @ts-expect-error - imported as raw text via esbuild text loader
import viewerSource from './viewer.min.txt';

let injected = false;

/**
 * Inject drawio's GraphViewer (viewer.min.js) into the document exactly once.
 * Sets offline globals BEFORE injection so the viewer never reaches out to
 * viewer.diagrams.net for stylesheets/resources/proxy.
 */
export function ensureViewerLoaded(doc: Document = document): void {
  if (injected) return;
  const win = doc.defaultView as unknown as Record<string, unknown>;
  if (win && win.GraphViewer) { injected = true; return; }
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
  injected = true;
}

interface GraphViewerStatic {
  createViewerForElement(el: HTMLElement): void;
}

export function getGraphViewer(win: Window = window): GraphViewerStatic | null {
  const w = win as unknown as { GraphViewer?: GraphViewerStatic };
  return w.GraphViewer ?? null;
}

/** Test-only: reset the injected flag. */
export function __resetViewerForTests(): void { injected = false; }
