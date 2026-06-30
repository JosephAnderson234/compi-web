import { RunResponse } from './types';

export async function runCode(code: string): Promise<RunResponse> {
  const response = await fetch('/api/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  return response.json();
}
