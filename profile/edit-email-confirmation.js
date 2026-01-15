import { apiFetch, ApiError } from "../shared/api.js";
import { getProfile } from "../shared/auth.js";
import { buildAppUrl } from "../shared/config.js";
import { renderHeader, setStatus } from "../shared/ui.js";

const statusEl = document.getElementById("status");
const form = document.getElementById("confirm-form");
const passwordInput = document.getElementById("confirm-password");
const confirmButton = document.getElementById("confirm-button");
const loginRequired = document.getElementById("login-required");
const loginActions = document.getElementById("login-actions");
const loginButton = document.getElementById("login-button");

function getToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

async function init() {
  let profile = null;
  try {
    profile = await getProfile();
  } catch (error) {
    setStatus(statusEl, {
      type: "error",
      message: "ログイン状態の確認に失敗しました。接続状況を確認してください。",
    });
  }

  renderHeader({ active: "profile", user: profile, showAuth: true });

  const token = getToken();
  if (!token) {
    setStatus(statusEl, {
      type: "error",
      message: "トークンが見つかりません。確認メールのリンクからアクセスしてください。",
    });
    confirmButton.disabled = true;
    return;
  }

  if (!profile) {
    loginRequired.hidden = false;
    loginActions.hidden = false;
    confirmButton.disabled = true;
  }

  loginButton.addEventListener("click", () => {
    const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    window.location.href = buildAppUrl(`/auth/login.html?next=${next}`);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = String(passwordInput.value || "");
    if (!password) {
      setStatus(statusEl, { type: "error", message: "パスワードを入力してください。" });
      return;
    }
    if (!profile) {
      const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
      window.location.href = buildAppUrl(`/auth/login.html?next=${next}`);
      return;
    }

    try {
      await apiFetch("/kotobaroots/profile/email/update", {
        method: "POST",
        data: { token, password },
      });
      setStatus(statusEl, {
        type: "success",
        message: "メールアドレスを更新しました。プロフィールへ戻ってください。",
      });
      form.reset();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
        window.location.href = buildAppUrl(`/auth/login.html?next=${next}`);
        return;
      }
      const message = error instanceof ApiError ? error.message : "更新に失敗しました。";
      setStatus(statusEl, { type: "error", message });
    }
  });
}

init();
