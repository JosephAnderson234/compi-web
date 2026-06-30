import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';
import { getCompilerBinaryPath } from '@/lib/compilerBin';

const execFileAsync = promisify(execFile);

function toWslPath(winPath: string): string {
  // C:\foo\bar  ->  /mnt/c/foo/bar
  return winPath
    .replace(/\\/g, '/')
    .replace(/^([A-Za-z]):/, (_, d) => `/mnt/${d.toLowerCase()}`);
}

export async function POST(request: NextRequest) {
  const { code } = await request.json();
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ ok: false, error: 'No code provided' }, { status: 400 });
  }

  const tmpFile = path.join(os.tmpdir(), `cnn_${Date.now()}.cnn`);
  await writeFile(tmpFile, code);

  try {
    const binPath = await getCompilerBinaryPath();
    const isWindows = process.platform === 'win32';
    const cmd = isWindows ? 'wsl' : binPath;
    const args = isWindows ? [toWslPath(binPath), toWslPath(tmpFile)] : [tmpFile];

    const { stdout, stderr } = await execFileAsync(cmd, args, {
      timeout: 5000,
      maxBuffer: 1024 * 1024,
    });
    return NextResponse.json({ ok: true, stdout, stderr, exitCode: 0 });
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; message?: string; code?: number };
    return NextResponse.json({
      ok: false,
      stdout: err.stdout || '',
      stderr: err.stderr || err.message || 'Unknown error',
      exitCode: err.code || 1,
    });
  } finally {
    await unlink(tmpFile).catch(() => {});
  }
}
