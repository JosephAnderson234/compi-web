export interface RunRequest {
  code: string;
}

export interface RunResponse {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface PhaseRequest {
  code: string;
  phase: 'tokens' | 'ast' | 'check' | 'run' | 'codegen';
}

export interface PhaseResponse {
  ok: boolean;
  output: string;
  error: string;
}

export interface Example {
  name: string;
  code: string;
}

export interface ExamplesResponse {
  examples: Example[];
}
