export interface AssetsBinding {
  fetch(request: Request | string): Promise<Response>;
}

export interface WorkerEnv {
  ASSETS: AssetsBinding;
  BACKEND_ORIGIN?: string;
}

export interface WorkerExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

function buildJsonResponse(
  status: number,
  payload: Record<string, unknown>,
  extraHeaders?: Record<string, string>
): Response {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...(extraHeaders || {}),
  });
  return new Response(JSON.stringify(payload), { status, headers });
}

function isJsonContentType(contentType: string): boolean {
  const lower = contentType.toLowerCase();
  return lower.includes('application/json') || lower.includes('+json');
}

function looksLikeAssetPath(pathname: string): boolean {
  const lastSegment = pathname.split('/').pop() || '';
  return /\.[a-z0-9]{1,8}$/i.test(lastSegment);
}

async function handleApiRequest(request: Request, url: URL, env: WorkerEnv): Promise<Response> {
  const backendOrigin = String(env.BACKEND_ORIGIN || '').trim().replace(/\/+$/, '');
  if (!backendOrigin) {
    return buildJsonResponse(503, {
      success: false,
      message:
        'Backend API service is not linked to this Cloudflare Worker (BACKEND_ORIGIN secret missing). Configure BACKEND_ORIGIN to point to the hosted Node.js server.',
      error:
        'Backend API service is not linked to this Cloudflare Worker (BACKEND_ORIGIN secret missing).',
    });
  }

  const normalizedPath =
    url.pathname.length > 1 && url.pathname.endsWith('/')
      ? url.pathname.slice(0, -1)
      : url.pathname;
  const upstreamUrl = `${backendOrigin}${normalizedPath}${url.search}`;

  const forwardHeaders = new Headers();
  const allowedHeaders = [
    'authorization',
    'content-type',
    'accept',
    'x-idempotency-key',
    'x-hub-signature-256',
  ];
  for (const name of allowedHeaders) {
    const val = request.headers.get(name);
    if (val) forwardHeaders.set(name, val);
  }
  forwardHeaders.set('Accept', forwardHeaders.get('Accept') || 'application/json');
  forwardHeaders.set('X-Forwarded-Host', url.host);
  forwardHeaders.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstreamUrl, {
      method: request.method,
      headers: forwardHeaders,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: 'manual',
    });
  } catch (err: any) {
    return buildJsonResponse(502, {
      success: false,
      message: 'Unable to reach GYAN ADDA LIBRARY API server. Please try again in a moment.',
      error: err?.message ? `Upstream connection failed: ${err.message}` : 'Upstream connection failed.',
    });
  }

  // Preserve Meta WhatsApp webhook plaintext challenge response
  if (normalizedPath === '/api/whatsapp/webhook' && request.method === 'GET' && upstreamRes.ok) {
    return new Response(await upstreamRes.text(), {
      status: upstreamRes.status,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const rawBody = await upstreamRes.text();
  const trimmed = rawBody.trim();
  const upstreamCt = upstreamRes.headers.get('content-type') || '';

  if (!trimmed) {
    const msg =
      upstreamRes.status === 404
        ? `API endpoint not found: ${request.method} ${normalizedPath}`
        : `Upstream API returned an empty response (HTTP ${upstreamRes.status}).`;
    return buildJsonResponse(upstreamRes.ok ? 502 : upstreamRes.status, {
      success: false,
      message: msg,
      error: msg,
    });
  }

  if (
    trimmed.startsWith('<!') ||
    trimmed.toLowerCase().startsWith('<html') ||
    (!isJsonContentType(upstreamCt) && !trimmed.startsWith('{') && !trimmed.startsWith('['))
  ) {
    const msg =
      upstreamRes.status === 404
        ? `API endpoint not found: ${request.method} ${normalizedPath}`
        : `Upstream API returned an unexpected non-JSON response (HTTP ${upstreamRes.status}).`;
    return buildJsonResponse(upstreamRes.ok ? 502 : upstreamRes.status, {
      success: false,
      message: msg,
      error: msg,
    });
  }

  // Validate JSON integrity before returning to client
  try {
    JSON.parse(trimmed);
  } catch {
    return buildJsonResponse(502, {
      success: false,
      message: `Upstream API returned malformed JSON (HTTP ${upstreamRes.status}).`,
      error: `Upstream API returned malformed JSON (HTTP ${upstreamRes.status}).`,
    });
  }

  const resHeaders = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  return new Response(trimmed, {
    status: upstreamRes.status,
    headers: resHeaders,
  });
}

export default {
  async fetch(
    request: Request,
    env: WorkerEnv,
    _ctx?: WorkerExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, url, env);
    }

    if (!env.ASSETS) {
      return buildJsonResponse(500, {
        success: false,
        message: 'Static ASSETS binding is missing from Worker configuration.',
        error: 'Static ASSETS binding is missing.',
      });
    }

    const assetRes = await env.ASSETS.fetch(request);
    if (
      assetRes.status === 404 &&
      (request.method === 'GET' || request.method === 'HEAD') &&
      !looksLikeAssetPath(url.pathname)
    ) {
      const spaUrl = new URL('/index.html', url.origin);
      return env.ASSETS.fetch(
        new Request(spaUrl.toString(), {
          method: request.method,
          headers: request.headers,
        })
      );
    }

    return assetRes;
  },
};
