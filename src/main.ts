import { Plugin, FileSystemAdapter } from 'obsidian';
import { join } from 'node:path';
import { DrawioSettings, DEFAULT_SETTINGS } from './settings';
import { ServerManager } from './server/ServerManager';
import { DrawioModal } from './editor/DrawioModal';
import type { DrawioSource } from './model/DrawioSource';

export default class DrawioPlugin extends Plugin {
  settings!: DrawioSettings;
  server!: ServerManager;

  async onload() {
    await this.loadSettings();
    const webappDir = join(this.pluginDir(), 'webapp');
    this.server = new ServerManager(webappDir, {
      min: this.settings.serverPortMin,
      max: this.settings.serverPortMax,
      idleMs: this.settings.serverIdleTimeout * 1000,
    });
    this.register(() => this.server.stop());
  }

  onunload() {
    this.server?.stop();
  }

  /** Absolute path to this plugin's folder on disk. */
  pluginDir(): string {
    const adapter = this.app.vault.adapter;
    if (adapter instanceof FileSystemAdapter) {
      return join(adapter.getBasePath(), this.manifest.dir ?? '');
    }
    throw new Error('Drawio plugin requires a desktop (FileSystem) vault');
  }

  async resolveBaseUrl(): Promise<string> {
    if (this.settings.drawioMode === 'custom' && this.settings.customDrawioUrl) {
      return this.settings.customDrawioUrl;
    }
    const port = await this.server.ensureStarted();
    this.server.touch();
    return `http://127.0.0.1:${port}/index.html`;
  }

  isDark(): boolean {
    return document.body.hasClass('theme-dark');
  }

  openEditor(source: DrawioSource) {
    new DrawioModal(this.app, source, {
      resolveBaseUrl: () => this.resolveBaseUrl(),
      isDark: () => this.settings.followObsidianTheme && this.isDark(),
      showLibraries: () => this.settings.showLibraries,
    }).open();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
