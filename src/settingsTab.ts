import { App, PluginSettingTab, Setting } from 'obsidian';
import type { DrawioMode } from './settings';
import type DrawioPlugin from './main';

export class DrawioSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: DrawioPlugin) { super(app, plugin); }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Editor source')
      .setDesc('Online loads the editor from diagrams.net (no setup). Offline uses a bundled webapp served locally (run "npm run fetch-drawio" first). Or point at a custom embed URL.')
      .addDropdown((d) => d
        .addOption('online', 'Online (diagrams.net)')
        .addOption('offline', 'Offline (bundled webapp)')
        .addOption('custom', 'Custom URL')
        .setValue(this.plugin.settings.drawioMode)
        .onChange(async (v) => {
          this.plugin.settings.drawioMode = v as DrawioMode;
          await this.plugin.saveSettings();
          this.display();
        }));

    if (this.plugin.settings.drawioMode === 'online') {
      new Setting(containerEl).setDesc(
        'The editor UI is loaded from diagrams.net. Your diagram content stays in the browser and is not uploaded; only the editor assets are fetched over the network.',
      );
    }

    if (this.plugin.settings.drawioMode === 'custom') {
      new Setting(containerEl)
        .setName('Custom drawio URL')
        .setDesc('Embed URL, e.g. https://embed.diagrams.net/')
        .addText((t) => t
          .setValue(this.plugin.settings.customDrawioUrl)
          .onChange(async (v) => { this.plugin.settings.customDrawioUrl = v.trim(); await this.plugin.saveSettings(); }));
    }

    new Setting(containerEl)
      .setName('Follow Obsidian theme')
      .addToggle((t) => t
        .setValue(this.plugin.settings.followObsidianTheme)
        .onChange(async (v) => { this.plugin.settings.followObsidianTheme = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Show shape libraries')
      .addToggle((t) => t
        .setValue(this.plugin.settings.showLibraries)
        .onChange(async (v) => { this.plugin.settings.showLibraries = v; await this.plugin.saveSettings(); }));

    new Setting(containerEl)
      .setName('Server idle timeout (seconds)')
      .setDesc('Stop the local drawio server after this idle period (minimum 5).')
      .addText((t) => t
        .setValue(String(this.plugin.settings.serverIdleTimeout))
        .onChange(async (v) => {
          const n = Number(v);
          if (Number.isFinite(n) && n >= 5) {
            this.plugin.settings.serverIdleTimeout = n;
            await this.plugin.saveSettings();
            this.plugin.rebuildServer();
          } else if (v.trim() !== '') {
            // Reject invalid/too-small values: restore the stored value.
            t.setValue(String(this.plugin.settings.serverIdleTimeout));
          }
        }));
  }
}
