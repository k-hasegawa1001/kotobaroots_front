import { buildApiUrl } from "./config.js";

export class ApiError extends Error {
  constructor(status, payload, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function extractMessage(payload, fallback) {
  if (!payload) {
    return fallback;
  }
  if (typeof payload === "string") {
    return payload;
  }
  return payload.msg || payload.error || payload.message || fallback;
}

export async function apiFetch(path, options = {}) {
  const url = buildApiUrl(path);
  const {
    method = "GET",
    data,
    headers = {},
    ...rest
  } = options;

  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  const fetchOptions = {
    method,
    credentials: "include",
    headers: requestHeaders,
    ...rest,
  };

  if (data !== undefined) {
    requestHeaders["Content-Type"] = "application/json";
    fetchOptions.body = JSON.stringify(data);
  }

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (error) {
    throw new ApiError(0, null, "ネットワークエラーが発生しました。接続を確認してください。");
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
    const message = extractMessage(payload, response.statusText || "リクエストに失敗しました");
    throw new ApiError(response.status, payload, message);
  }

  return payload;
}
