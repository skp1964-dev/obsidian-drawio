import { createServer, Server } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, normalize, extname, sep } from 'node:path';
import { findFreePort } from './portDetector';

const MIME: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.gif': 'image/gif', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.map': 'application/json', '.txt': 'text/plain',
};

export interface ServerOptions { min: number; max: number; idleMs: number; }

export class ServerManager {
  private server: Server | null = null;
  private port = 0;
  private idleTimer: NodeJS.Timeout | null = null;

  constructor(private readonly root: string, private readonly opts: ServerOptions) {}

  async ensureStarted(): Promise<number> {
    this.touch();
    if (this.server) return this.port;
    this.port = await findFreePort(this.opts.min, this.opts.max);
    this.server = createServer((req, res) => this.handle(req.url ?? '/', res));
    await new Promise<void>((resolve, reject) => {
      this.server!.once('error', reject);
      this.server!.listen(this.port, '127.0.0.1', resolve);
    });
    return this.port;
  }

  /** Reset the idle countdown; call on each editor open/activity. */
  touch(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => this.stop(), this.opts.idleMs);
  }

  stop(): void {
    if (this.idleTimer) { clearTimeout(this.idleTimer); this.idleTimer = null; }
    if (this.server) { this.server.close(); this.server = null; this.port = 0; }
  }

  private handle(url: string, res: import('node:http').ServerResponse): void {
    // noUncheckedIndexedAccess: split('?')[0] is string | undefined; use ?? fallback
    const path0 = url.split('?')[0] ?? '/';
    let path = decodeURIComponent(path0);
    if (path === '/' || path === '') path = '/index.html';
    const full = normalize(join(this.root, path));
    // Path-traversal guard: resolved path must be inside root
    if (!full.startsWith(this.root + sep) && full !== this.root) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    if (!existsSync(full) || !statSync(full).isFile()) {
      res.writeHead(404); res.end('Not found'); return;
    }
    // MIME[extname(full)] is string | undefined — ?? handles it (noUncheckedIndexedAccess OK)
    res.writeHead(200, { 'Content-Type': MIME[extname(full)] ?? 'application/octet-stream' });
    createReadStream(full).pipe(res);
  }
}
