import { apiFetch, ApiError } from "../shared/api.js";
import { redirectIfAuthenticated } from "../shared/auth.js";
import { buildAppUrl } from "../shared/config.js";
import { renderHeader, setStatus } from "../shared/ui.js";
import { isValidEmail, isValidPassword } from "../shared/validators.js";

const form = document.getElementById("login-form");
const statusEl = document.getElementById("status");

const params = new URLSearchParams(window.location.search);
const nextParam = params.get("next");
const decodedNext = nextParam ? decodeURIComponent(nextParam) : "";
const redirectTo = decodedNext && decodedNext.startsWith("/")
  ? decodedNext
  : buildAppUrl("/learn/index.html");

(async () => {
  const redirected = await redirectIfAuthenticated();
  if (redirected) {
    return;
  }
  renderHeader({ active: "auth", user: null, showAuth: true });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(statusEl, { message: "" });

    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!isValidEmail(email)) {
      setStatus(statusEl, { type: "error", message: "メールアドレスを正しく入力してください。" });
      return;
    }
    if (!isValidPassword(password)) {
      setStatus(statusEl, { type: "error", message: "パスワードは8-16文字で入力してください。" });
      return;
    }

    try {
      await apiFetch("/auth/login", {
        method: "POST",
        data: { email, password },
      });
      window.location.href = redirectTo;
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "ログインに失敗しました。";
      setStatus(statusEl, { type: "error", message });
    }
  });
})();
