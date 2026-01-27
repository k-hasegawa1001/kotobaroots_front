const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);

export const API_BASE_URL = isLocal ? "http://127.0.0.1:5000/api" : "/api";


const APP_BASE_PATH = (() => {
  const parts = window.location.pathname.split("/").filter(Boolean);
  if (parts.length <= 2) {
    return "";
  }
  return `/${parts.slice(0, -2).join("/")}`;
})();

export function buildApiUrl(path) {
  if (!path) {
    return API_BASE_URL;
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const prefix = path.startsWith("/") ? "" : "/";
  return `${API_BASE_URL}${prefix}${path}`;
}

export function buildAppUrl(path) {
  if (!path) {
    return `${APP_BASE_PATH}/`;
  }
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${APP_BASE_PATH}${normalized}`;
}
