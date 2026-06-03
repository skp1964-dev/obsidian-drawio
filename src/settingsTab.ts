import { App, PluginSettingTab, Setting } from 'obsidian';
import type DrawioPlugin from './main';

export class DrawioSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: DrawioPlugin) { super(app, plugin); }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Editor source')
      .setDesc('Use the bundled offline drawio, or a custom/online URL.')
      .addDropdown((d) => d
        .addOption('offline', 'Offline (bundled)')
        .addOption('custom', 'Custom URL')
        .setValue(this.plugin.settings.drawioMode)
        .onChange(async (v) => {
          this.plugin.settings.drawioMode = v as 'offline' | 'custom';
          await this.plugin.saveSettings();
          this.display();
        }));

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
      .setDesc('Stop the local drawio server after this idle period.')
      .addText((t) => t
        .setValue(String(this.plugin.settings.serverIdleTimeout))
        .onChange(async (v) => {
          const n = Number(v);
          if (Number.isFinite(n) && n > 0) {
            this.plugin.settings.serverIdleTimeout = n;
            await this.plugin.saveSettings();
            this.plugin.rebuildServer();
          }
        }));
  }
}
