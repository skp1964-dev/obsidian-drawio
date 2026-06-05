// Obsidian exposes `activeDocument`/`activeWindow` globals (popout-window aware).
// jsdom doesn't, so map them to the test document/window for code that defaults
// to them.
const g = globalThis as unknown as { activeDocument?: Document; activeWindow?: Window };
g.activeDocument = document;
g.activeWindow = window;
