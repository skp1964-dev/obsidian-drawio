import { describe, it, expect } from 'vitest';
import { createServer } from 'node:http';
import { findFreePort } from '../src/server/portDetector';

function listen(port: number): Promise<() => void> {
  return new Promise((resolve, reject) => {
    const s = createServer();
    s.once('error', reject);
    s.listen(port, '127.0.0.1', () => resolve(() => s.close()));
  });
}

describe('findFreePort', () => {
  it('returns a port within the requested range', async () => {
    const port = await findFreePort(41000, 41010);
    expect(port).toBeGreaterThanOrEqual(41000);
    expect(port).toBeLessThanOrEqual(41010);
  });

  it('skips an occupied port', async () => {
    const close = await listen(41020);
    try {
      const port = await findFreePort(41020, 41030);
      expect(port).not.toBe(41020);
    } finally { close(); }
  });

  it('throws when no port is free in range', async () => {
    const close = await listen(41040);
    try {
      await expect(findFreePort(41040, 41040)).rejects.toThrow();
    } finally { close(); }
  });
});
