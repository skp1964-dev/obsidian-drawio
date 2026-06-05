import { App, MarkdownPostProcessorContext, TFile } from 'obsidian';
import { DrawioSource } from '../model/DrawioSource';
import { replaceCodeBlockBody } from '../model/codeBlockEdit';
import { formatDrawioXml } from '../model/formatXml';
import { locateDrawioBlock } from './locateBlock';

/** Editable source backed by a ```drawio block inside a markdown note. */
export class CodeBlockSource implements DrawioSource {
  private lastBody: string;

  constructor(
    private app: App,
    private ctx: MarkdownPostProcessorContext,
    private el: HTMLElement,
    initialXml: string,
  ) {
    this.lastBody = initialXml.trim();
  }

  title(): string { return 'Drawio diagram'; }

  async read(): Promise<string> { return this.lastBody; }

  async write(xml: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(this.ctx.sourcePath);
    if (!(file instanceof TFile)) throw new Error('Drawio: source note not found');
    const doc = await this.app.vault.read(file);
    const lines = doc.split('\n');

    // Primary: locate the block by its current (last-known) content. This is
    // robust after re-renders that detach the original element.
    let range = locateDrawioBlock(lines, this.lastBody);
    // Fallback: the original section info, if the element is still attached.
    if (!range) {
      const info = this.ctx.getSectionInfo(this.el);
      if (info) range = { start: info.lineStart, end: info.lineEnd };
    }
    if (!range) throw new Error('Drawio: cannot locate code block to update');

    // Store the XML pretty-printed over multiple lines so the code-block source
    // stays readable and wraps in the editor (drawio emits one very long line).
    const formatted = formatDrawioXml(xml);
    const next = replaceCodeBlockBody(doc, range.start, range.end, formatted);
    await this.app.vault.modify(file, next);
    this.lastBody = formatted;
  }
}
