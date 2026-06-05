export type DrawioMode = 'online' | 'offline' | 'custom';
export type StoreFormat = 'xml' | 'compressed';

export interface DrawioSettings {
  drawioMode: DrawioMode;
  customDrawioUrl: string;
  serverPortMin: number;
  serverPortMax: number;
  serverIdleTimeout: number; // seconds
  followObsidianTheme: boolean;
  showLibraries: boolean;
  storeFormat: StoreFormat;
}

export const DEFAULT_SETTINGS: DrawioSettings = {
  drawioMode: 'online',
  customDrawioUrl: '',
  serverPortMin: 3000,
  serverPortMax: 3999,
  serverIdleTimeout: 300,
  followObsidianTheme: true,
  showLibraries: true,
  storeFormat: 'xml',
};
