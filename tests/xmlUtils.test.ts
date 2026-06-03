import { describe, it, expect } from 'vitest';
import { isValidDrawioXml, ensureMxfile, extractDiagramTitle } from '../src/model/xmlUtils';

describe('xmlUtils', () => {
  it('accepts a valid mxfile', () => {
    expect(isValidDrawioXml('<mxfile><diagram>x</diagram></mxfile>')).toBe(true);
  });
  it('accepts a bare mxGraphModel', () => {
    expect(isValidDrawioXml('<mxGraphModel><root/></mxGraphModel>')).toBe(true);
  });
  it('rejects empty or non-xml', () => {
    expect(isValidDrawioXml('')).toBe(false);
    expect(isValidDrawioXml('not xml')).toBe(false);
  });
  it('wraps a bare mxGraphModel into an mxfile', () => {
    const out = ensureMxfile('<mxGraphModel><root/></mxGraphModel>');
    expect(out.startsWith('<mxfile')).toBe(true);
    expect(out).toContain('<mxGraphModel>');
  });
  it('leaves an existing mxfile unchanged', () => {
    const src = '<mxfile><diagram>x</diagram></mxfile>';
    expect(ensureMxfile(src)).toBe(src);
  });
  it('extracts a diagram name attribute', () => {
    const src = '<mxfile><diagram name="Flow">x</diagram></mxfile>';
    expect(extractDiagramTitle(src)).toBe('Flow');
  });
  it('returns null title when absent', () => {
    expect(extractDiagramTitle('<mxfile><diagram>x</diagram></mxfile>')).toBeNull();
  });
});
