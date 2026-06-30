import { access, chmod, writeFile } from 'fs/promises';
import { constants } from 'fs';
import os from 'os';
import path from 'path';

const TMP_BIN_PATH = path.join(os.tmpdir(), 'c--');

async function isExecutable(p: string): Promise<boolean> {
  try {
    await access(p, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * The c-- binary isn't committed to git. Locally on Windows it's expected at the
 * project root and run through WSL. On Vercel (Linux) it's downloaded once per
 * function instance into /tmp and executed directly, since /tmp is the only
 * writable path and survives warm invocations.
 */
export async function getCompilerBinaryPath(): Promise<string> {
  if (process.platform === 'win32') {
    return path.join(process.cwd(), 'c--');
  }

  if (await isExecutable(TMP_BIN_PATH)) {
    return TMP_BIN_PATH;
  }

  const binUrl = process.env.COMPILER_BIN_URL;
  if (!binUrl) {
    throw new Error('COMPILER_BIN_URL is not set');
  }

  const res = await fetch(binUrl);
  if (!res.ok) {
    throw new Error(`Failed to download compiler binary: ${res.status} ${res.statusText}`);
  }
  await writeFile(TMP_BIN_PATH, Buffer.from(await res.arrayBuffer()));
  await chmod(TMP_BIN_PATH, 0o755);

  return TMP_BIN_PATH;
}
