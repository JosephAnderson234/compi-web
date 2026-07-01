import { Sandbox } from '@vercel/sandbox';

interface SandboxRunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

// Vercel Functions don't have gcc, which the compiler's --exec flag shells out to.
// Vercel Sandbox runs on Amazon Linux 2023 with dnf + sudo, so gcc can be installed there instead.
export async function runInSandbox(code: string): Promise<SandboxRunResult> {
  const binUrl = process.env.COMPILER_BIN_URL;
  if (!binUrl) {
    throw new Error('COMPILER_BIN_URL is not set');
  }

  const sandbox = await Sandbox.create({
    runtime: 'node24',
    timeout: 60_000,
    persistent: false,
  });

  try {
    await sandbox.writeFiles([{ path: 'source.cnn', content: Buffer.from(code) }]);

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
    await sandbox.stop();
  }
}
