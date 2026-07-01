import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
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

  const isWindows = process.platform === 'win32';
  const id = randomUUID();
  const tmpFile = path.join(os.tmpdir(), `cnn_${id}.cnn`);
  const execPath = path.join(os.tmpdir(), `cnn_${id}.out`);
  await writeFile(tmpFile, code);

  let compiled = false;
  try {
    const binPath = await getCompilerBinaryPath();

    // --exec asks the compiler to assemble with gcc and produce an executable at -o,
    // instead of printing assembly to stdout (which is what happens without flags now).
    // Note: the short form "-e" is not recognized by the current binary, only "--exec" works.
    const compileCmd = isWindows ? 'wsl' : binPath;
    const compileArgs = isWindows
      ? [toWslPath(binPath), toWslPath(tmpFile), '--exec', '-o', toWslPath(execPath)]
      : [tmpFile, '--exec', '-o', execPath];

    await execFileAsync(compileCmd, compileArgs, {
      timeout: 5000,
      maxBuffer: 1024 * 1024,
    });
    compiled = true;

    // Run the compiled executable itself; its stdout/stderr is the program's real output.
    const runCmd = isWindows ? 'wsl' : execPath;
    const runArgs = isWindows ? [toWslPath(execPath)] : [];

    const { stdout, stderr } = await execFileAsync(runCmd, runArgs, {
      timeout: 5000,
      maxBuffer: 1024 * 1024,
    });
    return NextResponse.json({ ok: true, stdout, stderr, exitCode: 0 });
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; message?: string; code?: number };
    return NextResponse.json({
      ok: false,
      stdout: err.stdout || '',
      stderr: err.stderr || err.message || (compiled ? 'Runtime error' : 'Compile error'),
      exitCode: err.code || 1,
    });
  } finally {
    await unlink(tmpFile).catch(() => {});
    await unlink(execPath).catch(() => {});
  }
}
