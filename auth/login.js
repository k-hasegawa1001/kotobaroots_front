import { apiFetch, getErrorMessage, ERROR_TYPES } from "../shared/api.js";
import { redirectIfAuthenticated } from "../shared/auth.js";
import { buildAppUrl } from "../shared/config.js";
import { renderHeader, setStatus } from "../shared/ui.js";
import { validateEmail, validatePassword } from "../shared/validators.js";

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

    const emailError = validateEmail(email);
    if (emailError) {
      setStatus(statusEl, { type: "error", message: emailError });
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setStatus(statusEl, { type: "error", message: passwordError });
      return;
    }

    try {
      await apiFetch("/auth/login", {
        method: "POST",
        data: { email, password },
      });
      window.location.href = redirectTo;
    } catch (error) {
      const message = getErrorMessage(error, "ログインに失敗しました。", {
        [ERROR_TYPES.Unauthorized]: "メールアドレスまたはパスワードが正しくありません。",
      });
      setStatus(statusEl, { type: "error", message });
    }
  });
})();
