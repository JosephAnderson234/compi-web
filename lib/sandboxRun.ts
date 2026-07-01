import { Sandbox } from '@vercel/sandbox';

interface SandboxRunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

// Vercel Functions don't have gcc, which the compiler's --exec flag shells out to.
// Vercel Sandbox runs on Amazon Linux 2023 with dnf + sudo, so gcc can be installed there instead.
//
// SANDBOX_SNAPSHOT_ID (optional) points to a snapshot pre-built by
// scripts/create-sandbox-snapshot.ts with gcc + the compiler already installed,
// so the sandbox boots in under a second instead of installing them per request.
// Without it, this falls back to installing everything from scratch each run.
export async function runInSandbox(code: string): Promise<SandboxRunResult> {
  const snapshotId = process.env.SANDBOX_SNAPSHOT_ID;
  const binUrl = process.env.COMPILER_BIN_URL;
  if (!snapshotId && !binUrl) {
    throw new Error('Neither SANDBOX_SNAPSHOT_ID nor COMPILER_BIN_URL is set');
  }

  const sandbox = await Sandbox.create({
    ...(snapshotId ? { source: { type: 'snapshot' as const, snapshotId } } : { runtime: 'node24' as const }),
    timeout: 60_000,
    persistent: false,
  });

  try {
    await sandbox.writeFiles([{ path: 'source.cnn', content: Buffer.from(code) }]);

    if (!snapshotId) {
      const setup = await sandbox.runCommand({
        cmd: 'sh',
        args: [
          '-c',
          `sudo dnf install -y gcc && curl -fsSL "${binUrl}" -o c-- && chmod +x c--`,
        ],
      });
      if (setup.exitCode !== 0) {
        return {
          ok: false,
          stdout: '',
          stderr: `Sandbox setup failed: ${await setup.stderr()}`,
          exitCode: setup.exitCode,
        };
      }
    }

    const compile = await sandbox.runCommand('./c--', ['source.cnn', '--exec', '-o', 'out']);
    if (compile.exitCode !== 0) {
      return {
        ok: false,
        stdout: await compile.stdout(),
        stderr: await compile.stderr(),
        exitCode: compile.exitCode,
      };
    }

    const run = await sandbox.runCommand('./out', []);
    return {
      ok: run.exitCode === 0,
      stdout: await run.stdout(),
      stderr: await run.stderr(),
      exitCode: run.exitCode,
    };
  } finally {
    // persistent: false means stop() won't snapshot it, but delete() also drops
    // the sandbox record itself instead of leaving it listed as "stopped".
    // Swallow cleanup errors here: throwing in `finally` would discard the
    // compile/run result already computed in the try block above.
    try {
      await sandbox.stop();
      await sandbox.delete();
    } catch (cleanupError) {
      console.error('Failed to clean up sandbox', cleanupError);
    }
  }
}
