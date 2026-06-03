# Obsidian Drawio

Embed, preview, and edit [drawio](https://www.drawio.com/) diagrams in Obsidian — fully offline.

## Features

- **Code blocks**: store diagram XML inline in a ` ```drawio ` block, preview it as SVG in reading mode, and edit it in a full-screen modal.
- **Standalone `.drawio` files**: open a `.drawio` file in a dedicated view with an SVG preview + Edit button.
- **Embeds**: embed a diagram file in any note with `![[diagram.drawio]]`.
- **Offline-first**: a bundled drawio editor served from a local HTTP server — no internet required. Optionally point at a custom/online drawio embed URL instead.
- **Theme-aware**: the editor follows Obsidian's light/dark theme.

## Requirements

- **Desktop only.** The offline editor uses a local HTTP server (Node), so the plugin does not run on Obsidian mobile.

## Install (manual / development)

1. `npm install`
2. `npm run fetch-drawio` — downloads the offline drawio webapp (~30 MB download; requires network access to GitHub, plus either `unzip` or `python3` on PATH for extraction). This populates `webapp/` and generates `src/preview/viewer.min.txt`.
3. `npm run build`
4. Copy `main.js`, `manifest.json`, `styles.css`, and the `webapp/` folder into your vault at `<vault>/.obsidian/plugins/obsidian-drawio/`.
5. Enable **Drawio** in Obsidian's Community Plugins settings (desktop).

## Usage

- **New diagram file**: run the command **"Create new drawio diagram"** — it creates and opens an `Untitled Diagram <timestamp>.drawio` file.
- **Inline diagram**: add a ` ```drawio ` code block (paste drawio XML, or start empty and edit). In reading mode it renders as a preview with an Edit button.
- **Embed a file**: `![[your-diagram.drawio]]` in any note.
- Click the **Edit** (pencil) button on any preview to open the editor. Changes autosave back to the source (the code block, or the file).

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
- **Embed refresh**: an `![[file.drawio]]` preview refreshes when the containing note re-renders. Editing via the embed's own Edit button triggers that re-render. A `.drawio` file changed by an external program won't live-refresh an already-open note until it re-renders.
- **Desktop only**: see Requirements above.
- **Security**: rendered SVG previews are sanitized (DOMPurify) and the local server binds to `127.0.0.1` only, serving solely the bundled `webapp/` directory.

## License

MIT
