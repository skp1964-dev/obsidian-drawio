import { App, Modal, Notice } from 'obsidian';
import { DrawioSource } from '../model/DrawioSource';
import { buildLoadMessage, parseDrawioEvent } from './embedMessages';
import { buildEmbedQuery } from '../constants';

export interface DrawioModalDeps {
  /** Resolve the editor base URL (local server origin or custom URL). */
  resolveBaseUrl(): Promise<string>;
  isDark(): boolean;
  showLibraries(): boolean;
}

export class DrawioModal extends Modal {
  private iframe: HTMLIFrameElement | null = null;
  private onMessage: ((e: MessageEvent) => void) | null = null;
  private origin = '';

  constructor(app: App, private source: DrawioSource, private deps: DrawioModalDeps) {
    super(app);
  }

  async onOpen() {
    this.modalEl.addClass('drawio-modal');
    this.titleEl.setText(this.source.title());
    const base = await this.deps.resolveBaseUrl();
    this.origin = new URL(base).origin;
    const q = buildEmbedQuery({ dark: this.deps.isDark(), libraries: this.deps.showLibraries() });
    const url = `${base}${base.includes('?') ? '&' : '?'}${q}`;

    this.iframe = this.contentEl.createEl('iframe', { cls: 'drawio-iframe' });
    this.iframe.setAttribute('src', url);

    this.onMessage = (e: MessageEvent) => this.handle(e);
    window.addEventListener('message', this.onMessage);
  }

  private async handle(e: MessageEvent) {
    if (e.source !== this.iframe?.contentWindow) return;
    if (this.origin !== 'null' && e.origin !== this.origin) return;
    const ev = parseDrawioEvent(e.data);
    if (!ev) return;
    switch (ev.event) {
      case 'init': {
        const xml = await this.source.read();
        this.post(buildLoadMessage(xml, { dark: this.deps.isDark() }));
        break;
      }
      case 'save':
      case 'autosave': {
        try {
          await this.source.write((ev as { xml: string }).xml);
        } catch (err) {
          new Notice('Drawio: failed to save diagram');
          console.error(err);
        }
        if (ev.event === 'save' && (ev as { exit?: boolean }).exit) this.close();
        break;
      }
      case 'exit':
        this.close();
        break;
    }
  }

  private post(message: string) {
    this.iframe?.contentWindow?.postMessage(message, this.origin === 'null' ? '*' : this.origin);
  }

  onClose() {
    if (this.onMessage) window.removeEventListener('message', this.onMessage);
    this.onMessage = null;
    this.iframe = null;
    this.contentEl.empty();
  }
}
