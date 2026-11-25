export interface SafeJsonResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
  message?: string | null;
}

/**
 * Resolves a relative `/api/...` path against optional `VITE_API_BASE_URL`
 * (used when the static frontend is hosted separately from the Node.js backend).
 * Defaults to same-origin when `VITE_API_BASE_URL` is unset.
 */
export function resolveApiUrl(input: string): string {
  const trimmed = String(input || '').trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const baseRaw =
    typeof import.meta !== 'undefined' && import.meta.env
      ? String((import.meta.env as Record<string, string | undefined>).VITE_API_BASE_URL || '')
      : '';
  const base = baseRaw.trim().replace(/\/+$/, '');
  if (!base) return trimmed;

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${normalizedPath}`;
}

function normalizeParsedPayload<T>(parsed: unknown): T & {
  success?: boolean;
  error?: string;
  message?: string;
  data?: unknown;
} {
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      return {
        ...(obj.data as Record<string, unknown>),
        ...obj,
      } as T & { success?: boolean; error?: string; message?: string; data?: unknown };
    }
  }
  return parsed as T & { success?: boolean; error?: string; message?: string; data?: unknown };
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
      message: `Unable to read server response (HTTP ${res.status}).`,
    };
  }

  const trimmed = rawText.trim();
  const contentType = (res.headers?.get('content-type') || '').toLowerCase();

  if (!trimmed) {
    const emptyErr =
      res.status === 404
        ? 'API route returned HTTP 404 with an empty body. Please verify backend API routing is active.'
        : `Server returned an empty response (HTTP ${res.status}). Please verify the backend service is running.`;
    return {
      ok: false,
      status: res.status,
      data: null,
      error: res.ok
        ? 'Server returned an empty response instead of JSON.'
        : emptyErr,
      message: res.ok
        ? 'Server returned an empty response instead of JSON.'
        : emptyErr,
    };
  }

  const looksLikeHtml =
    trimmed.startsWith('<!') ||
    trimmed.toLowerCase().startsWith('<html') ||
    contentType.includes('text/html');

  if (looksLikeHtml) {
    const htmlErr =
      res.status === 404
        ? 'API endpoint was not found and returned an HTML page (HTTP 404).'
        : `Server returned an HTML page instead of JSON (HTTP ${res.status}).`;
    return {
      ok: false,
      status: res.status,
      data: null,
      error: htmlErr,
      message: htmlErr,
    };
  }

  try {
    const rawParsed = JSON.parse(trimmed);
    const parsed = normalizeParsedPayload<T>(rawParsed);
    const hasExplicitFailure =
      parsed && typeof parsed === 'object' && parsed.success === false;
    const isOk = res.ok && !hasExplicitFailure;

    const parsedMessage =
      (typeof parsed?.message === 'string' && parsed.message.trim()) ||
      (typeof parsed?.error === 'string' && parsed.error.trim()) ||
      null;

    const apiErr = !isOk
      ? (typeof parsed?.error === 'string' && parsed.error.trim()) ||
        (typeof parsed?.message === 'string' && parsed.message.trim()) ||
        `Request failed with status HTTP ${res.status}.`
      : null;

    return {
      ok: isOk,
      status: res.status,
      data: parsed,
      error: apiErr,
      message: parsedMessage,
    };
  } catch {
    return {
      ok: false,
      status: res.status,
      data: null,
      error: contentType && !contentType.includes('json')
        ? `Unexpected server response type "${contentType}" (HTTP ${res.status}).`
        : `Server returned an invalid JSON response (HTTP ${res.status}).`,
      message: `Server returned an invalid JSON response (HTTP ${res.status}).`,
    };
  }
}

export async function safeApiFetch<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeJsonResult<T>> {
  const target = typeof input === 'string' ? resolveApiUrl(input) : input;
  try {
    const res = await fetch(target, init);
    return await readJsonSafe<T>(res);
  } catch (err: any) {
    const netMsg =
      err?.message && !String(err.message).toLowerCase().includes('failed to fetch')
        ? String(err.message)
        : 'Network error reaching the API server. Please check your internet connection.';
    return {
      ok: false,
      status: 0,
      data: null,
      error: netMsg,
      message: netMsg,
    };
  }
}

export const apiFetch = safeApiFetch;
