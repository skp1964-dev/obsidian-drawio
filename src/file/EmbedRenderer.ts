import { MarkdownPostProcessorContext, TFile, setIcon } from 'obsidian';
import { renderPreview } from '../preview/ViewerRenderer';
import { FileSource } from './FileSource';
import { DRAWIO_FILE_EXT } from '../constants';
import type DrawioPlugin from '../main';

export function registerDrawioEmbeds(plugin: DrawioPlugin) {
  plugin.registerMarkdownPostProcessor(async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    const embeds = Array.from(el.querySelectorAll<HTMLElement>('span.internal-embed, div.internal-embed'));
    for (const span of embeds) {
      // Robustness improvement #1: skip spans already processed to avoid redundant re-rendering
      if (span.hasClass('drawio-embed')) continue;

      const src = span.getAttribute('src');
      if (!src || !src.toLowerCase().endsWith('.' + DRAWIO_FILE_EXT)) continue;
      const file = plugin.app.metadataCache.getFirstLinkpathDest(src, ctx.sourcePath);
      if (!(file instanceof TFile)) continue;

      // Robustness improvement #2: wrap per-embed render in try/catch so one bad embed
      // doesn't break the rest of the post-processor pass
      try {
        await renderEmbed(plugin, span, file);
      } catch (err) {
        span.empty();
        span.addClass('drawio-embed');
        span.createDiv({ cls: 'drawio-error', text: `Failed to render diagram: ${String(err)}` });
      }
    }
  });
}

async function renderEmbed(plugin: DrawioPlugin, span: HTMLElement, file: TFile) {
  span.empty();
  span.addClass('drawio-embed');
  const xml = await plugin.app.vault.read(file);
  const preview = span.createDiv({ cls: 'drawio-preview' });
  renderPreview(preview, xml, { dark: plugin.settings.followObsidianTheme && plugin.isDark() });
  const editBtn = span.createEl('button', { cls: 'drawio-edit-btn', attr: { 'aria-label': 'Edit diagram' } });
  setIcon(editBtn, 'pencil');
  editBtn.addEventListener('click', () => plugin.openEditor(new FileSource(plugin.app, file)));
}
