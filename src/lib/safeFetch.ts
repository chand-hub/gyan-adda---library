export interface SafeJsonResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

/**
 * Safely parses an HTTP Response body as JSON without ever throwing
 * "SyntaxError: Failed to execute 'json' on 'Response': Unexpected end of JSON input".
 */
export async function readJsonSafe<T = any>(res: Response): Promise<SafeJsonResult<T>> {
  let rawText = '';
  try {
    rawText = await res.text();
  } catch {
    return {
      ok: false,
      status: res.status,
      data: null,
      error: `Unable to read server response (HTTP ${res.status}).`,
    };
  }

  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      ok: res.ok,
      status: res.status,
      data: null,
      error: res.ok
        ? null
        : `Server returned an empty response (HTTP ${res.status}). Please verify the backend service is running.`,
    };
  }

  try {
    const parsed = JSON.parse(trimmed) as T & { error?: string; message?: string };
    const apiErr =
      !res.ok
        ? (typeof parsed?.error === 'string' && parsed.error) ||
          (typeof parsed?.message === 'string' && parsed.message) ||
          `Request failed with status HTTP ${res.status}.`
        : null;
    return {
      ok: res.ok,
      status: res.status,
      data: parsed,
      error: apiErr,
    };
  } catch {
    const looksLikeHtml = trimmed.startsWith('<!') || trimmed.startsWith('<html');
    return {
      ok: false,
      status: res.status,
      data: null,
      error: looksLikeHtml
        ? `Server returned an HTML error page instead of JSON (HTTP ${res.status}).`
        : `Server returned an invalid response format (HTTP ${res.status}).`,
    };
  }
}

export async function safeApiFetch<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeJsonResult<T>> {
  try {
    const res = await fetch(input, init);
    return await readJsonSafe<T>(res);
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || 'Network error reaching the server. Please check your connection.',
    };
  }
}
