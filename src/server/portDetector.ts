import { createServer } from 'node:http';

function isFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = createServer();
    s.once('error', () => resolve(false));
    s.listen(port, '127.0.0.1', () => s.close(() => resolve(true)));
  });
}

export async function findFreePort(min: number, max: number): Promise<number> {
  for (let p = min; p <= max; p++) {
    if (await isFree(p)) return p;
  }
  throw new Error(`No free port in range ${min}-${max}`);
}
