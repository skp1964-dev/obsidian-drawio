import { MarkdownPostProcessorContext, setIcon } from 'obsidian';
import { renderPreview } from '../preview/ViewerRenderer';
import { CodeBlockSource } from './CodeBlockSource';
import type DrawioPlugin from '../main';

export function registerDrawioCodeBlock(plugin: DrawioPlugin) {
  plugin.registerMarkdownCodeBlockProcessor('drawio', (source, el, ctx) => {
    renderCodeBlock(plugin, source, el, ctx);
  });
}

function renderCodeBlock(
  plugin: DrawioPlugin,
  source: string,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
) {
  const wrapper = el.createDiv({ cls: 'drawio-codeblock' });
  const preview = wrapper.createDiv({ cls: 'drawio-preview' });
  renderPreview(preview, source, { dark: plugin.settings.followObsidianTheme && plugin.isDark() });

  const editBtn = wrapper.createEl('button', {
    cls: 'drawio-edit-btn',
    attr: { 'aria-label': 'Edit diagram' },
  });
  setIcon(editBtn, 'pencil');
  editBtn.addEventListener('click', () => {
    const src = new CodeBlockSource(plugin.app, ctx, el, source);
    plugin.openEditor(src);
  });
}
