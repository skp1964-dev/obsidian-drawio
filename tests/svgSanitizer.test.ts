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
});
