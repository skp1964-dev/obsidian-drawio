// Downloads a pinned drawio webapp (draw.war = ZIP) and extracts static files to webapp/.
import { createWriteStream, existsSync, mkdirSync, rmSync } from 'node:fs';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { execFileSync, spawnSync } from 'node:child_process';

const DRAWIO_VERSION = 'v30.0.4';
const WAR_URL = `https://github.com/jgraph/drawio/releases/download/${DRAWIO_VERSION}/draw.war`;
const OUT_DIR = join(process.cwd(), 'webapp');

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${url}`);
  await pipeline(res.body, createWriteStream(dest));
}

/**
 * Returns true if `unzip` is available on PATH, false otherwise.
 */
function hasUnzip() {
  try {
    execFileSync('unzip', ['-v'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns true if `python3` (or `python`) is available on PATH.
 * Sets pythonCmd to the found binary.
 */
function findPython() {
  for (const cmd of ['python3', 'python']) {
    const result = spawnSync(cmd, ['--version'], { stdio: 'ignore' });
    if (result.status === 0) return cmd;
  }
  return null;
}

/**
 * Extract a ZIP archive using unzip CLI.
 */
function extractWithUnzip(archive, destDir) {
  execFileSync('unzip', ['-q', '-o', archive, '-d', destDir]);
}

/**
 * Extract a ZIP archive using Python's zipfile module (fallback when unzip is unavailable).
 */
function extractWithPython(pythonCmd, archive, destDir) {
  const script = [
    'import zipfile, os, sys',
    'archive, dest = sys.argv[1], sys.argv[2]',
    'with zipfile.ZipFile(archive) as zf:',
    '    zf.extractall(dest)',
  ].join('\n');
  execFileSync(pythonCmd, ['-c', script, archive, destDir]);
}

async function main() {
  if (existsSync(OUT_DIR)) rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const tmp = await mkdtemp(join(tmpdir(), 'drawio-'));
  const war = join(tmp, 'draw.war');
  console.log(`Downloading ${WAR_URL} ...`);
  await download(WAR_URL, war);

  // draw.war is a ZIP. Extract everything, then drop the server-only WEB-INF/META-INF.
  console.log('Extracting ...');

  if (hasUnzip()) {
    extractWithUnzip(war, OUT_DIR);
  } else {
    // unzip not available; try Python's zipfile as a zero-dependency fallback.
    const pythonCmd = findPython();
    if (!pythonCmd) {
      throw new Error(
        'BLOCKED: Neither `unzip` nor `python3`/`python` is available on this system. ' +
        'Please install `unzip` (e.g. `sudo apt-get install unzip`) and re-run `npm run fetch-drawio`.'
      );
    }
    console.log(`unzip not found — using ${pythonCmd} zipfile module as fallback`);
    extractWithPython(pythonCmd, war, OUT_DIR);
  }

  rmSync(join(OUT_DIR, 'WEB-INF'), { recursive: true, force: true });
  rmSync(join(OUT_DIR, 'META-INF'), { recursive: true, force: true });

  // Sanity check key files exist.
  for (const f of ['index.html', join('js', 'viewer.min.js')]) {
    if (!existsSync(join(OUT_DIR, f))) throw new Error(`Missing expected file in webapp: ${f}`);
  }

  await writeFile(join(OUT_DIR, 'DRAWIO_VERSION'), DRAWIO_VERSION + '\n');
  console.log(`drawio ${DRAWIO_VERSION} extracted to ${OUT_DIR}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
