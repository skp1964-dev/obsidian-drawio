import { TextFileView, WorkspaceLeaf, setIcon } from 'obsidian';
import { DRAWIO_VIEW_TYPE } from '../constants';
import { renderPreview } from '../preview/ViewerRenderer';
import { FileSource } from './FileSource';
import type DrawioPlugin from '../main';

export class DrawioFileView extends TextFileView {
  private xml = '';

  constructor(leaf: WorkspaceLeaf, private plugin: DrawioPlugin) { super(leaf); }

  getViewType(): string { return DRAWIO_VIEW_TYPE; }
  getIcon(): string { return 'pencil-ruler'; }

  getViewData(): string { return this.xml; }

  setViewData(data: string, _clear: boolean): void {
    this.xml = data;
    this.renderUi();
  }

  clear(): void { this.xml = ''; }

  private renderUi() {
    const c = this.contentEl;
    c.empty();
    c.addClass('drawio-file-view');
    const preview = c.createDiv({ cls: 'drawio-preview' });
    renderPreview(preview, this.xml, {
      dark: this.plugin.settings.followObsidianTheme && this.plugin.isDark(),
    });
    const editBtn = c.createEl('button', { cls: 'drawio-edit-btn', text: 'Edit' });
    setIcon(editBtn.createSpan(), 'pencil');
    editBtn.addEventListener('click', () => {
      if (!this.file) return;
      this.plugin.openEditor(new FileSource(this.app, this.file));
    });
  }
}
