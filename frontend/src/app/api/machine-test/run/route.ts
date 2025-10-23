import { NextRequest, NextResponse } from 'next/server';

// Judge0 status descriptions
const JUDGE0_STATUSES = {
  1: 'In Queue',
  2: 'Processing',
  3: 'Accepted',
  4: 'Wrong Answer',
  5: 'Time Limit Exceeded',
  6: 'Compilation Error',
  7: 'Runtime Error (SIGSEGV)',
  8: 'Runtime Error (SIGXFSZ)',
  9: 'Runtime Error (SIGFPE)',
  10: 'Runtime Error (SIGABRT)',
  11: 'Runtime Error (NZEC)',
  12: 'Runtime Error (Other)',
  13: 'Internal Error',
  14: 'Exec Format Error',
} as const;

interface Judge0Submission {
  language_id: number;
  source_code: string;
  stdin?: string | null;
  cpu_time_limit?: number;
  memory_limit?: number;
}

interface Judge0Response {
  status?: {
    id: number;
    description: string;
  };
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  time?: string | null;
  memory?: number | null;
  token?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      language_id,
      source_code,
      stdin,
    }: Judge0Submission = body;

    // Validation
    if (!language_id || typeof language_id !== 'number') {
      return NextResponse.json(
        { message: 'Invalid language_id: must be a number' },
        { status: 400 }
      );
    }

    if (!source_code || typeof source_code !== 'string') {
      return NextResponse.json(
        { message: 'Invalid source_code: must be a base64-encoded string' },
        { status: 400 }
      );
    }

    // Environment variables
    const JUDGE0_URL = process.env.RAPIDAPI_JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com';
    const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
    const RAPIDAPI_HOST = process.env.RAPIDAPI_HOST || 'judge0-ce.p.rapidapi.com';

    if (!RAPIDAPI_KEY) {
      console.error('[Code Run] Missing RAPIDAPI_KEY environment variable');
      return NextResponse.json(
        { message: 'Server configuration error: Missing API key' },
        { status: 500 }
      );
    }

    // Prepare request
    const headers = {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': RAPIDAPI_HOST,
    };

    const submissionPayload: Judge0Submission = {
      language_id,
      source_code,
      stdin: stdin || null,
      cpu_time_limit: 2, // 2 seconds
      memory_limit: 128000, // 128 MB in KB
    };

    console.log('[Code Run] Submitting to Judge0:', {
      language_id,
      has_stdin: !!stdin,
    });

    // Submit to Judge0 with wait=true for synchronous response
    const submitRes = await fetch(
      `${JUDGE0_URL}/submissions?base64_encoded=true&wait=true&fields=*`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(submissionPayload),
        cache: 'no-store',
      }
    );

    if (!submitRes.ok) {
      const errorText = await submitRes.text();
      console.error('[Code Run] Judge0 error:', {
        status: submitRes.status,
        statusText: submitRes.statusText,
        body: errorText,
      });

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      return NextResponse.json(
        {
          message: errorData?.message || `Judge0 request failed: ${submitRes.statusText}`,
          details: errorData,
        },
        { status: submitRes.status }
      );
    }

    const result: Judge0Response = await submitRes.json();

    console.log('[Code Run] Judge0 response:', {
      status: result.status?.description,
      hasStdout: !!result.stdout,
      hasStderr: !!result.stderr,
      time: result.time,
      memory: result.memory,
    });

    // Decode base64 fields
    const decodeBase64 = (str?: string | null): string | null => {
      if (!str) return null;
      try {
        return Buffer.from(str, 'base64').toString('utf-8');
      } catch (err) {
        console.error('[Code Run] Base64 decode error:', err);
        return str; // Return as-is if decode fails
      }
    };

    // Normalize response
    const normalized = {
      status: result.status?.description || 'Unknown',
      statusId: result.status?.id,
      stdout: decodeBase64(result.stdout),
      stderr: decodeBase64(result.stderr),
      compile_output: decodeBase64(result.compile_output),
      message: decodeBase64(result.message),
      time: result.time || null,
      memory: result.memory || null,
    };

    return NextResponse.json(normalized);
  } catch (err: any) {
    console.error('[Code Run] Unexpected error:', err);
    
    return NextResponse.json(
      {
        message: err?.message || 'Unexpected server error',
        error: process.env.NODE_ENV === 'development' ? err?.stack : undefined,
      },
      { status: 500 }
    );
  }
}