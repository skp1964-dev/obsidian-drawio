# Obsidian Drawio

Embed, preview, and edit [drawio](https://www.drawio.com/) diagrams in Obsidian — fully offline.

## Features

- **Code blocks**: store diagram XML inline in a ` ```drawio ` block, preview it as SVG (in both editing and reading views), and click to edit it in a full-screen modal.
- **Standalone `.drawio` files**: open a `.drawio` file in a dedicated tab with the drawio editor embedded inline (Excalidraw-style), edited directly in place.
- **Embeds**: embed a diagram file in any note with `![[diagram.drawio]]`; it renders inline in both editing and reading views, and click opens a quick-edit modal.
- **Offline-first**: a bundled drawio editor served from a local HTTP server — no internet required. Optionally point at a custom/online drawio embed URL instead.
- **Readable storage**: diagrams are saved as uncompressed, pretty-printed multi-line XML, so the underlying source stays diff-friendly and readable.
- **Theme-aware**: the editor follows Obsidian's light/dark theme.

## Requirements

- **Desktop only.** The offline editor uses a local HTTP server (Node), so the plugin does not run on Obsidian mobile.

## Install (manual / development)

1. `npm install`
2. `npm run fetch-drawio` — downloads the offline drawio webapp (~40 MB `draw.war` download; requires network access to GitHub, plus either `unzip` or `python3` on PATH for extraction). This populates `webapp/` (~145 MB extracted on disk — the full offline editor with all shape libraries) and generates `src/preview/viewer.min.txt`.
3. `npm run build`
4. Copy `main.js`, `manifest.json`, `styles.css`, and the `webapp/` folder into your vault at `<vault>/.obsidian/plugins/obsidian-drawio/`. Note: `webapp/` is ~145 MB (the bundled offline editor), so the installed plugin folder is large.
5. Enable **Drawio** in Obsidian's Community Plugins settings (desktop).

## Usage

- **New diagram file**: run the command **"Create new drawio diagram"** — it creates and opens an `Untitled Diagram <timestamp>.drawio` file with the editor embedded in the tab.
- **Inline diagram**: add a ` ```drawio ` code block (paste drawio XML, or start empty and edit). It renders as a preview in both editing and reading views.
- **Embed a file**: `![[your-diagram.drawio]]` in any note.
- **To edit**, click anywhere on a preview (a centered **Edit** hint appears on hover) to open the editor; standalone `.drawio` files open the editor directly in their tab. Changes autosave back to the source (the code block, or the file).

## Settings

- **Editor source** — Offline (bundled) or a Custom URL.
- **Custom drawio URL** — used when Editor source is "Custom URL" (e.g. `https://embed.diagrams.net/`).
- **Follow Obsidian theme** — match the editor to light/dark.
- **Show shape libraries** — toggle the editor's shape panel.
- **Server idle timeout (seconds)** — stop the local server after this idle period (minimum 5).

## Development

- `npm run dev` — watch build (rebuilds `main.js` on change).
- `npm test` — unit tests (vitest): XML utils, code-block locating/replacement, embed protocol messages, SVG sanitizer, port detection, the local server, and the preview renderer error path.
- `npm run build` — type-check + production bundle.

## Notes & limitations

- **Bundle size**: `main.js` includes drawio's `viewer.min.js` (~2.3 MB) inlined for offline previews, so the built `main.js` is ~2.4 MB. This is expected.
- **Multi-page diagrams**: a code-block or embed **preview shows only the first page** of a multi-page diagram. Click to edit to reach the other pages (the editor shows all page tabs).
- **Embed refresh**: an `![[file.drawio]]` embed re-renders automatically when the file is modified (including edits made through this plugin elsewhere).
- **Multi-page embed subpaths**: a page selector like `![[file.drawio#Page-2]]` is ignored — the embed always shows the first page.
- **Desktop only**: see Requirements above.
- **Security**: rendered SVG previews are sanitized before insertion — `<script>`/embedding elements, inline event handlers, script-bearing URL schemes (normalised to defeat control-character obfuscation), external `<use>` references, SMIL attribute injection, and dangerous CSS are removed, while drawio's `foreignObject` text labels are preserved. The local server binds to `127.0.0.1` only and serves solely the bundled `webapp/` directory.

## License

MIT
