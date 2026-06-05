import { Plugin, FileSystemAdapter, Notice } from 'obsidian';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { DrawioSettings, DEFAULT_SETTINGS } from './settings';
import { ServerManager } from './server/ServerManager';
import { DrawioModal } from './editor/DrawioModal';
import type { DrawioEditorDeps } from './editor/DrawioEditor';
import type { DrawioSource } from './model/DrawioSource';
import { DRAWIO_VIEW_TYPE, DRAWIO_FILE_EXT, EMPTY_DIAGRAM, ONLINE_DRAWIO_URL } from './constants';

export default class DrawioPlugin extends Plugin {
  settings!: DrawioSettings;
  server!: ServerManager;

  async onload() {
    await this.loadSettings();
    this.server = this.buildServer();
    this.register(() => this.server.stop());

    const { registerDrawioCodeBlock } = await import('./codeblock/DrawioCodeBlock');
    registerDrawioCodeBlock(this);

    const { DrawioFileView } = await import('./file/DrawioFileView');
    this.registerView(DRAWIO_VIEW_TYPE, (leaf) => new DrawioFileView(leaf, this));
    this.registerExtensions([DRAWIO_FILE_EXT], DRAWIO_VIEW_TYPE);

    const { registerDrawioEmbeds } = await import('./file/EmbedRenderer');
    registerDrawioEmbeds(this);

    this.addCommand({
      id: 'create-drawio-file',
      name: 'Create new drawio diagram',
      callback: async () => {
        const path = `Untitled Diagram ${Date.now()}.drawio`;
        const file = await this.app.vault.create(path, EMPTY_DIAGRAM);
        const leaf = this.app.workspace.getLeaf(true);
        await leaf.openFile(file);
      },
    });

    const { DrawioSettingTab } = await import('./settingsTab');
    this.addSettingTab(new DrawioSettingTab(this.app, this));
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(DRAWIO_VIEW_TYPE);
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
    const mode = this.settings.drawioMode;
    if (mode === 'custom' && this.settings.customDrawioUrl) {
      return this.settings.customDrawioUrl;
    }
    if (mode === 'offline') {
      const indexPath = join(this.pluginDir(), 'webapp', 'index.html');
      if (!existsSync(indexPath)) {
        const msg = 'Drawio: offline editor not found. Run "npm run fetch-drawio" and copy the "webapp" folder into the plugin directory, or switch "Editor source" to Online in settings.';
        new Notice(msg, 10000);
        throw new Error(msg);
      }
      const port = await this.server.ensureStarted();
      this.server.touch();
      return `http://127.0.0.1:${port}/index.html`;
    }
    // 'online' (and 'custom' with no URL set) → the hosted diagrams.net embed.
    return ONLINE_DRAWIO_URL;
  }

  isDark(): boolean {
    return document.body.hasClass('theme-dark');
  }

  /** Shared deps for any DrawioEditor surface (modal or inline file view). */
  editorDeps(): DrawioEditorDeps {
    return {
      resolveBaseUrl: () => this.resolveBaseUrl(),
      isDark: () => this.settings.followObsidianTheme && this.isDark(),
      showLibraries: () => this.settings.showLibraries,
      acquireServer: () => this.server.acquire(),
      releaseServer: () => this.server.release(),
    };
  }

  openEditor(source: DrawioSource) {
    new DrawioModal(this.app, source, this.editorDeps()).open();
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private buildServer(): ServerManager {
    const webappDir = join(this.pluginDir(), 'webapp');
    return new ServerManager(webappDir, {
      min: this.settings.serverPortMin,
      max: this.settings.serverPortMax,
      idleMs: this.settings.serverIdleTimeout * 1000,
    });
  }

  rebuildServer() {
    this.server.stop();
    this.server = this.buildServer();
  }
}
