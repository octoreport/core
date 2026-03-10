import { z } from 'zod';

export class AppError extends Error {
  cause?: unknown;
  meta?: Record<string, unknown>;

  constructor(message: string, options?: { cause?: unknown; meta?: Record<string, unknown> }) {
    super(message);
    this.name = this.constructor.name;
    this.cause = options?.cause;
    this.meta = options?.meta;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    const { cause, meta, name, message, stack } = this;
    return {
      name,
      message,
      cause,
      meta,
      stack,
    };
  }

  toString() {
    return `${this.name}: ${this.message}`;
  }
}

export class NetworkError extends AppError {
  constructor(
    message: string = 'Network Error',
    options?: { cause?: unknown; meta?: Record<string, unknown> },
  ) {
    super(message, options);
    this.name = 'NetworkError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class TimeoutError extends AppError {
  timeoutMs: number;
  constructor(
    message: string = 'Request timed out',
    timeoutMs: number,
    options?: { cause?: unknown; meta?: Record<string, unknown> },
  ) {
    super(message, options);
    this.name = 'TimeoutError';
    this.timeoutMs = timeoutMs;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export type HttpErrorInit = {
  statusText?: string;
  url?: string;
  headers?: Record<string, string>;
  bodyText?: string;
};

export class HTTPError extends AppError {
  status: number;
  statusText?: string;
  url?: string;
  headers?: Record<string, string>;
  bodyText?: string;
  constructor(
    message: string = 'HTTP Error',
    status: number,
    init?: HttpErrorInit,
    options?: {
      cause?: unknown;
      meta?: Record<string, unknown>;
    },
  ) {
    super(message, options);
    this.name = 'HTTPError';
    this.status = status;
    this.statusText = init?.statusText;
    this.url = init?.url;
    this.headers = init?.headers;
    this.bodyText = init?.bodyText;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class AuthError extends HTTPError {
  scopeList?: string[];
  constructor(
    message: string = 'Authentication/Authorization error',
    status: 401 | 403,
    init?: HttpErrorInit & {
      scopeList?: string[];
    },
    options?: { cause?: unknown; meta?: Record<string, unknown> },
  ) {
    super(message, status, init, options);
    this.name = 'AuthError';
    this.scopeList = init?.scopeList;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class RateLimitError extends HTTPError {
  resetAtEpochMs?: number; // x-ratelimit-reset(ms)
  limit?: number; // x-ratelimit-limit
  remaining?: number; // x-ratelimit-remaining
  resource?: string; // x-ratelimit-resource
  constructor(
    message: string = 'Rate limit exceeded',
    status: 403 | 429,
    init?: HttpErrorInit & {
      resetAtEpochMs?: number;
      limit?: number;
      remaining?: number;
      resource?: string;
    },
    options?: { cause?: unknown; meta?: Record<string, unknown> },
  ) {
    super(message, status, init, options);
    this.name = 'RateLimitError';
    this.resetAtEpochMs = init?.resetAtEpochMs;
    this.limit = init?.limit;
    this.remaining = init?.remaining;
    this.resource = init?.resource;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class SSORequiredError extends HTTPError {
  organization?: string;
  ssoAuthorizeUrl?: string;
  constructor(
    message: string = 'SAML SSO authorization required',
    status: 401 | 403 | 422,
    init?: HttpErrorInit & {
      organization?: string;
      ssoAuthorizeUrl?: string;
    },
    options?: { cause?: unknown; meta?: Record<string, unknown> },
  ) {
    super(message, status, init, options);
    this.name = 'SSORequiredError';
    this.organization = init?.organization;
    this.ssoAuthorizeUrl = init?.ssoAuthorizeUrl;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class GitHubGraphQLError extends AppError {
  errors: Array<{
    message: string;
    path?: string[];
    type?: string;
    locations?: { line: number; column: number }[];
  }>;
  operationName?: string;
  constructor(
    message: string = 'GitHub GraphQL Error',
    errors: Array<{
      message: string;
      path?: string[];
      type?: string;
      locations?: { line: number; column: number }[];
    }>,
    init?: {
      operationName?: string;
    },
    options?: { cause?: unknown; meta?: Record<string, unknown> },
  ) {
    super(message, options);
    this.name = 'GitHubGraphQLError';
    this.errors = errors;
    this.operationName = init?.operationName;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends AppError {
  issues: z.ZodIssue[];
  constructor(
    message = 'Validation failed',
    issues: z.ZodIssue[],
    options?: { cause?: unknown; meta?: Record<string, unknown> },
  ) {
    super(message, options);
    this.name = 'ValidationError';
    this.issues = issues;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
