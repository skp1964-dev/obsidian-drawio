import { describe, it, expect } from 'vitest';
import { sanitizeSvg } from '../src/preview/svgSanitizer';

describe('sanitizeSvg', () => {
  it('keeps benign svg shapes', () => {
    const out = sanitizeSvg('<svg><rect width="10" height="10"/></svg>');
    expect(out).toContain('<rect');
  });
  it('removes <script> elements', () => {
    const out = sanitizeSvg('<svg><script>alert(1)</script><rect/></svg>');
    expect(out).not.toContain('<script');
    expect(out).toContain('<rect');
  });
  it('removes inline event handlers', () => {
    const out = sanitizeSvg('<svg><rect onload="alert(1)" onclick="x()"/></svg>');
    expect(out).not.toContain('onload');
    expect(out).not.toContain('onclick');
  });

  it('strips external href from <use> elements', () => {
    const out = sanitizeSvg('<svg><use href="http://evil.com/evil.svg#x"/></svg>');
    expect(out).not.toContain('http://evil.com');
  });

  it('strips external xlink:href from <use> elements', () => {
    const out = sanitizeSvg('<svg><use xlink:href="https://evil.com/evil.svg#x"/></svg>');
    expect(out).not.toContain('evil.com');
  });

  it('keeps internal fragment href on <use> elements', () => {
    const out = sanitizeSvg('<svg><use href="#sym1"/></svg>');
    expect(out).toContain('#sym1');
  });
});
