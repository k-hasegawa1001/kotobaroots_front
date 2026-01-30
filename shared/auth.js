import { apiFetch, ApiError } from "./api.js";
import { buildAppUrl } from "./config.js";

export async function getProfile() {
  try {
    return await apiFetch("/kotobaroots/profile");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function requireAuth() {
  const profile = await getProfile();
  if (!profile) {
    const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    window.location.href = buildAppUrl(`/auth/login.html?next=${next}`);
    return null;
  }
  return profile;
}

export async function redirectIfAuthenticated() {
  const profile = await getProfile();
  if (profile) {
    window.location.href = buildAppUrl("/learn/index.html");
    return true;
  }
  return false;
}

export async function logout() {
  await apiFetch("/auth/logout", { method: "POST" });
}
