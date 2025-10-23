'use client';

export async function runCodeOnce(payload: {
  language_id: number;
  source_code: string; // base64
  stdin?: string;      // base64
}) {
  const res = await fetch('/api/machine-test/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || 'Run failed');
  }
  return res.json() as Promise<{
    status: string;
    stdout: string | null;
    stderr: string | null;
    compile_output: string | null;
    message: string | null;
    time?: string;
    memory?: number;
  }>;
}