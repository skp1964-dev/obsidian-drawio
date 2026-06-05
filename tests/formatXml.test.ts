import { describe, it, expect } from 'vitest';
import { formatDrawioXml } from '../src/model/formatXml';

describe('formatDrawioXml', () => {
  it('breaks a single-line mxfile into indented multi-line', () => {
    const src = '<mxfile><diagram id="0" name="P"><mxGraphModel><root>' +
      '<mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>';
    const out = formatDrawioXml(src);
    const lines = out.split('\n');
    expect(lines.length).toBeGreaterThan(5);
    expect(lines[0]).toBe('<mxfile>');
    expect(out).toContain('  <diagram id="0" name="P">');
    expect(out).toContain('    <mxGraphModel>');
    expect(out).toContain('      <root>');
    expect(out).toContain('        <mxCell id="0"/>');
    expect(lines[lines.length - 1]).toBe('</mxfile>');
  });

  it('is idempotent (formatting already-formatted xml is stable)', () => {
    const src = '<mxfile><diagram><mxGraphModel><root><mxCell id="0"/></root></mxGraphModel></diagram></mxfile>';
    const once = formatDrawioXml(src);
    expect(formatDrawioXml(once)).toBe(once);
  });

  it('preserves attribute values with escaped angle brackets, unbroken', () => {
    const src = '<mxfile><diagram><mxGraphModel><root>' +
      '<mxCell value="&lt;b&gt;hi&lt;/b&gt;" vertex="1"/></root></mxGraphModel></diagram></mxfile>';
    const out = formatDrawioXml(src);
    expect(out).toContain('<mxCell value="&lt;b&gt;hi&lt;/b&gt;" vertex="1"/>');
  });

  it('keeps a self-closing tag on its own single line', () => {
    expect(formatDrawioXml('<a><b x="1" y="2"/></a>')).toBe('<a>\n  <b x="1" y="2"/>\n</a>');
  });

  it('returns input unchanged when it is not tag-structured', () => {
    expect(formatDrawioXml('not xml')).toBe('not xml');
    expect(formatDrawioXml('')).toBe('');
  });

  it('wraps an over-long tag by spreading its attributes across lines', () => {
    const src = '<mxfile><diagram><mxGraphModel dx="1437" dy="998" grid="1" gridSize="10" ' +
      'guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" ' +
      'pageWidth="827" pageHeight="1169" math="0" shadow="0"><root><mxCell id="0"/>' +
      '</root></mxGraphModel></diagram></mxfile>';
    const out = formatDrawioXml(src);
    // No line overflows.
    for (const line of out.split('\n')) expect(line.length).toBeLessThanOrEqual(105);
    // Attributes are preserved and the tag is still closed with '>'.
    expect(out).toContain('dx="1437"');
    expect(out).toContain('shadow="0">');
    // The mxGraphModel tag spans more than one line now.
    expect(out.split('\n').filter((l) => l.includes('="')).length).toBeGreaterThan(1);
  });
});
