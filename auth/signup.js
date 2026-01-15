import { apiFetch, ApiError } from "../shared/api.js";
import { redirectIfAuthenticated } from "../shared/auth.js";
import { renderHeader, setStatus } from "../shared/ui.js";
import { isValidEmail, isValidPassword } from "../shared/validators.js";

const form = document.getElementById("signup-form");
const statusEl = document.getElementById("status");

(async () => {
  const redirected = await redirectIfAuthenticated();
  if (redirected) {
    return;
  }
  renderHeader({ active: "signup", user: null, showAuth: true });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(statusEl, { message: "" });

    const formData = new FormData(form);
    const username = String(formData.get("username") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!username) {
      setStatus(statusEl, { type: "error", message: "ユーザー名を入力してください。" });
      return;
    }
    if (!isValidEmail(email)) {
      setStatus(statusEl, { type: "error", message: "メールアドレスを正しく入力してください。" });
      return;
    }
    if (!isValidPassword(password)) {
      setStatus(statusEl, { type: "error", message: "パスワードは8-16文字で入力してください。" });
      return;
    }

    try {
      await apiFetch("/auth/create-user", {
        method: "POST",
        data: { username, email, password },
      });
      setStatus(statusEl, { type: "success", message: "アカウントを作成しました。ログインしてください。" });
      form.reset();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "登録に失敗しました。";
      setStatus(statusEl, { type: "error", message });
    }
  });
})();
