import { Plugin } from 'obsidian';

export default class DrawioPlugin extends Plugin {
  async onload() {
    console.log('obsidian-drawio loaded');
  }
  onunload() {
    console.log('obsidian-drawio unloaded');
  }
}
