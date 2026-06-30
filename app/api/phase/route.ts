import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';

const execFileAsync = promisify(execFile);

function toWslPath(winPath: string): string {
  return winPath
    .replace(/\\/g, '/')
    .replace(/^([A-Za-z]):/, (_, d) => `/mnt/${d.toLowerCase()}`);
}

const PHASE_FLAGS: Record<string, string> = {
  tokens: '--tokens',
  ast: '--ast',
  codegen: '--codegen',
};

export async function POST(request: NextRequest) {
  const { code, phase } = await request.json();
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ ok: false, output: 'No code provided' }, { status: 400 });
  }
  const flag = PHASE_FLAGS[phase];
  if (!flag) {
    return NextResponse.json({ ok: false, output: `Unknown phase: ${phase}` }, { status: 400 });
  }

  const tmpFile = path.join(os.tmpdir(), `cnn_${Date.now()}.cnn`);
  await writeFile(tmpFile, code);

  try {
    const wslBin = toWslPath(path.join(process.cwd(), 'c--'));
    const wslTmp = toWslPath(tmpFile);

    const { stdout, stderr } = await execFileAsync('wsl', [wslBin, wslTmp, flag], {
      timeout: 5000,
      maxBuffer: 1024 * 1024,
    });
    return NextResponse.json({ ok: true, output: stdout || stderr });
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    return NextResponse.json({
      ok: false,
      output: err.stderr || err.stdout || err.message || 'Error desconocido',
    });
  } finally {
    await unlink(tmpFile).catch(() => {});
  }
}
