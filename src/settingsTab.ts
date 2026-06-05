import { App, PluginSettingTab } from 'obsidian';
import type { SettingDefinitionItem } from 'obsidian';
import type DrawioPlugin from './main';

export class DrawioSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: DrawioPlugin) { super(app, plugin); }

  // Declarative settings (Obsidian 1.13+). Control `key`s match DrawioSettings
  // fields, so the default getControlValue/setControlValue read and persist them.
  getSettingDefinitions(): SettingDefinitionItem[] {
    const mode = () => this.plugin.settings.drawioMode;
    return [
      {
        name: 'Editor source',
        desc: 'Online loads the editor from diagrams.net (no setup). Offline uses a bundled webapp served locally (run "npm run fetch-drawio" first). Or point at a custom embed URL.',
        control: {
          type: 'dropdown',
          key: 'drawioMode',
          options: {
            online: 'Online (diagrams.net)',
            offline: 'Offline (bundled webapp)',
            custom: 'Custom URL',
          },
        },
      },
      {
        name: 'Network use',
        desc: 'The editor UI is loaded from diagrams.net. Your diagram content stays in the browser and is not uploaded; only the editor assets are fetched over the network.',
        visible: () => mode() === 'online',
      },
      {
        name: 'Custom drawio URL',
        desc: 'Embed URL, e.g. https://embed.diagrams.net/',
        visible: () => mode() === 'custom',
        control: { type: 'text', key: 'customDrawioUrl', placeholder: 'https://embed.diagrams.net/' },
      },
      {
        name: 'Follow Obsidian theme',
        desc: 'Match the editor to the light/dark theme.',
        control: { type: 'toggle', key: 'followObsidianTheme' },
      },
      {
        name: 'Show shape libraries',
        desc: "Show the editor's shape library panel.",
        control: { type: 'toggle', key: 'showLibraries' },
      },
      {
        name: 'Server idle timeout (seconds)',
        desc: 'Stop the local drawio server after this idle period. Only used in Offline mode.',
        visible: () => mode() === 'offline',
        control: {
          type: 'number',
          key: 'serverIdleTimeout',
          min: 5,
          validate: (v: number) =>
            (Number.isFinite(v) && v >= 5 ? undefined : 'Enter a number of seconds (minimum 5).'),
        },
      },
    ];
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    await super.setControlValue(key, value);
    // Re-render so conditional rows (custom URL, idle timeout, the online note)
    // reflect the new editor source; restart the server with the new timeout.
    if (key === 'drawioMode') this.update();
    else if (key === 'serverIdleTimeout') this.plugin.rebuildServer();
  }
}
