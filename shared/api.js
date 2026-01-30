import { buildApiUrl } from "./config.js";

const DEFAULT_TIMEOUT_MS = 10000;

export const ERROR_TYPES = {
  ValidationError: "ValidationError",
  NotFound: "NotFound",
  Conflict: "Conflict",
  Unauthorized: "Unauthorized",
  ExternalServiceError: "ExternalServiceError",
  Timeout: "Timeout",
  UnexpectedError: "UnexpectedError",
};

const STATUS_ERROR_MAP = {
  400: {
    type: ERROR_TYPES.ValidationError,
    code: "VALIDATION_ERROR",
    message: "入力内容を確認してください。",
  },
  401: {
    type: ERROR_TYPES.Unauthorized,
    code: "UNAUTHORIZED",
    message: "ログインが必要です。",
  },
  403: {
    type: ERROR_TYPES.Unauthorized,
    code: "FORBIDDEN",
    message: "権限がありません。",
  },
  404: {
    type: ERROR_TYPES.NotFound,
    code: "NOT_FOUND",
    message: "対象が見つかりません。",
  },
  409: {
    type: ERROR_TYPES.Conflict,
    code: "CONFLICT",
    message: "既に登録されています。",
  },
  422: {
    type: ERROR_TYPES.ValidationError,
    code: "VALIDATION_ERROR",
    message: "入力内容を確認してください。",
  },
  429: {
    type: ERROR_TYPES.ExternalServiceError,
    code: "RATE_LIMIT",
    message: "混み合っています。時間をおいて再試行してください。",
  },
  500: {
    type: ERROR_TYPES.UnexpectedError,
    code: "SERVER_ERROR",
    message: "サーバーでエラーが発生しました。",
  },
  502: {
    type: ERROR_TYPES.ExternalServiceError,
    code: "BAD_GATEWAY",
    message: "外部サービスの処理に失敗しました。",
  },
  503: {
    type: ERROR_TYPES.ExternalServiceError,
    code: "SERVICE_UNAVAILABLE",
    message: "サービスが一時的に利用できません。",
  },
  504: {
    type: ERROR_TYPES.Timeout,
    code: "TIMEOUT",
    message: "通信がタイムアウトしました。",
  },
};

const FALLBACK_MESSAGES = {
  [ERROR_TYPES.ValidationError]: "入力内容を確認してください。",
  [ERROR_TYPES.NotFound]: "対象が見つかりません。",
  [ERROR_TYPES.Conflict]: "既に登録されています。",
  [ERROR_TYPES.Unauthorized]: "ログインが必要です。",
  [ERROR_TYPES.ExternalServiceError]: "外部サービスの処理に失敗しました。",
  [ERROR_TYPES.Timeout]: "通信がタイムアウトしました。",
  [ERROR_TYPES.UnexpectedError]: "予期せぬエラーが発生しました。",
};

export class ApiError extends Error {
  constructor({ status, payload, type, code, userMessage }) {
    super(userMessage);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
    this.type = type;
    this.code = code;
    this.userMessage = userMessage;
  }
}

function buildApiError({ status, payload, fallbackMessage }) {
  const mapped = STATUS_ERROR_MAP[status] || null;
  const type = mapped?.type || ERROR_TYPES.UnexpectedError;
  const code = mapped?.code || `HTTP_${status || 0}`;
  const userMessage = mapped?.message
    || fallbackMessage
    || FALLBACK_MESSAGES[type]
    || FALLBACK_MESSAGES[ERROR_TYPES.UnexpectedError];

  return new ApiError({
    status,
    payload,
    type,
    code,
    userMessage,
  });
}

export function getErrorMessage(error, fallbackMessage, overrides = {}) {
  if (error instanceof ApiError) {
    const override = error.type && overrides[error.type];
    return override || error.userMessage || fallbackMessage || FALLBACK_MESSAGES[ERROR_TYPES.UnexpectedError];
  }

  console.error("Unexpected error", error);
  return fallbackMessage || FALLBACK_MESSAGES[ERROR_TYPES.UnexpectedError];
}

export async function apiFetch(path, options = {}) {
  const url = buildApiUrl(path);
  const {
    method = "GET",
    data,
    headers = {},
    timeoutMs = DEFAULT_TIMEOUT_MS,
    ...rest
  } = options;

  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  const controller = rest.signal ? null : new AbortController();
  const fetchOptions = {
    method,
    credentials: "include",
    headers: requestHeaders,
    signal: rest.signal || controller?.signal,
    ...rest,
  };

  if (data !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
    fetchOptions.body = JSON.stringify(data);
  }

  let timeoutId = null;
  if (controller && typeof timeoutMs === "number" && timeoutMs > 0) {
    timeoutId = globalThis.setTimeout(() => {
      controller.abort();
    }, timeoutMs);
  }

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (error) {
    if (timeoutId) {
      globalThis.clearTimeout(timeoutId);
    }
    const isTimeout = error && error.name === "AbortError";
    const type = isTimeout ? ERROR_TYPES.Timeout : ERROR_TYPES.ExternalServiceError;
    const code = isTimeout ? "TIMEOUT" : "NETWORK_ERROR";
    const userMessage = isTimeout
      ? FALLBACK_MESSAGES[ERROR_TYPES.Timeout]
      : "ネットワークエラーが発生しました。接続を確認してください。";
    throw new ApiError({
      status: 0,
      payload: null,
      type,
      code,
      userMessage,
    });
  } finally {
    if (timeoutId) {
      globalThis.clearTimeout(timeoutId);
    }
  }

  let payload = null;
  if (response.status !== 204) {
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      payload = await response.json();
    } else {
      payload = await response.text();
    }
  }

  if (!response.ok) {
    const apiError = buildApiError({
      status: response.status,
      payload,
      fallbackMessage: response.statusText || "リクエストに失敗しました。",
    });
    if (apiError.type === ERROR_TYPES.UnexpectedError) {
      console.error("API error", {
        status: apiError.status,
        code: apiError.code,
        payload: apiError.payload,
      });
    }
    throw apiError;
  }

  return payload;
}
