import { TimeoutError, NetworkError, RateLimitError, AuthError, HttpErrorInit } from '@/errors';
import { SSORequiredError } from '@/errors';
import { HTTPError } from '@/errors';

export async function request(
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number },
): Promise<Response> {
  const controller = new AbortController();
  const timeout = init?.timeoutMs ?? 0;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (timeout > 0) {
    timeoutId = setTimeout(() => controller.abort(), timeout);
  }

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      throw new TimeoutError('Request timed out', timeout, { cause: error });
    }
    throw new NetworkError('Network request failed', { cause: error });
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function ensureOk(
  response: Response,
  ctx?: { url?: string; op?: string; meta?: Record<string, unknown> },
): Promise<void> {
  if (response.ok) return;

  const base = await buildHttpErrorInit(response, ctx);
  const headers = base.headers ?? {};
  const opts = { meta: ctx?.meta };

  if (response.status === 429 || headers['x-ratelimit-remaining'] === '0') {
    const resetAtEpochMs = headers['x-ratelimit-reset']
      ? Number(headers['x-ratelimit-reset']) * 1000
      : undefined;
    const responseStatus = response.status === 429 ? 429 : 403;
    throw new RateLimitError(
      'Rate limit exceeded',
      responseStatus,
      {
        ...base,
        resetAtEpochMs,
        limit: headers['x-ratelimit-limit'] ? Number(headers['x-ratelimit-limit']) : undefined,
        remaining: headers['x-ratelimit-remaining']
          ? Number(headers['x-ratelimit-remaining'])
          : undefined,
        resource: headers['x-ratelimit-resource'],
      },
      opts,
    );
  }

  if (response.status === 401 || response.status === 403) {
    const scopeList = headers['x-oauth-scopes']
      ? headers['x-oauth-scopes']
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
    throw new AuthError(
      'Authentication/Authorization failed',
      response.status,
      {
        ...base,
        scopeList,
      },
      opts,
    );
  }

  if (response.status === 422) {
    const organization = headers['x-github-organization'] ?? headers['x-github-org'];
    const ssoAuthorizeUrl = headers['x-github-sso-authorize-url'];
    throw new SSORequiredError(
      'SAML SSO authorization required',
      response.status,
      {
        ...base,
        organization,
        ssoAuthorizeUrl,
      },
      opts,
    );
  }

  throw new HTTPError(
    'HTTP request failed',
    response.status,
    {
      ...base,
    },
    opts,
  );
}

export async function buildHttpErrorInit(
  response: Response,
  ctx?: { url?: string },
): Promise<HttpErrorInit> {
  const headers = Object.fromEntries(response.headers.entries());
  const bodyText = await response.clone().text();
  return { statusText: response.statusText, url: ctx?.url, headers, bodyText };
}
