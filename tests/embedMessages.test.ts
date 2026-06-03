import { describe, it, expect } from 'vitest';
import { buildLoadMessage, buildExportMessage, parseDrawioEvent } from '../src/editor/embedMessages';

describe('embedMessages', () => {
  it('builds a load message with autosave and theme', () => {
    const msg = JSON.parse(buildLoadMessage('<mxfile/>', { dark: true }));
    expect(msg).toEqual({ action: 'load', xml: '<mxfile/>', autosave: 1, modified: 0, dark: true });
  });

  it('builds an export-svg message', () => {
    const msg = JSON.parse(buildExportMessage('svg'));
    expect(msg).toEqual({ action: 'export', format: 'svg' });
  });

  it('parses an init event', () => {
    expect(parseDrawioEvent(JSON.stringify({ event: 'init' }))).toEqual({ event: 'init' });
  });

  it('parses a save event with xml', () => {
    const parsed = parseDrawioEvent(JSON.stringify({ event: 'save', xml: '<x/>' }));
    expect(parsed).toEqual({ event: 'save', xml: '<x/>' });
  });

  it('returns null for non-drawio / malformed payloads', () => {
    expect(parseDrawioEvent('not json')).toBeNull();
    expect(parseDrawioEvent(JSON.stringify({ foo: 'bar' }))).toBeNull();
  });
});
