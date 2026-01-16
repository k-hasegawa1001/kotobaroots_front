import { apiFetch, ApiError } from "../shared/api.js";
import { redirectIfAuthenticated } from "../shared/auth.js";
import { buildAppUrl } from "../shared/config.js";
import { renderHeader, setStatus } from "../shared/ui.js";
import { isValidEmail, isValidPassword } from "../shared/validators.js";

const form = document.getElementById("signup-form");
const statusEl = document.getElementById("status");
const successModal = document.getElementById("signup-success-modal");
let successTimerId = null;
let redirectTimerId = null;
const SUCCESS_DURATION_MS = 1500;

function openSuccessModal() {
  successModal.hidden = false;
  if (successTimerId) {
    window.clearTimeout(successTimerId);
  }
  successTimerId = window.setTimeout(() => {
    closeSuccessModal();
  }, SUCCESS_DURATION_MS);
}

function closeSuccessModal() {
  successModal.hidden = true;
  if (successTimerId) {
    window.clearTimeout(successTimerId);
    successTimerId = null;
  }
}

function scheduleRedirect() {
  if (redirectTimerId) {
    window.clearTimeout(redirectTimerId);
  }
  redirectTimerId = window.setTimeout(() => {
    window.location.href = buildAppUrl("/auth/login.html");
  }, SUCCESS_DURATION_MS);
}

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
    const username = String(formData.get("username") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const passwordConfirm = String(formData.get("passwordConfirm") || "");

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
    if (password !== passwordConfirm) {
      setStatus(statusEl, { type: "error", message: "パスワードが一致しません。" });
      return;
    }

    try {
      await apiFetch("/auth/create-user", {
        method: "POST",
        data: { username, email, password },
      });
      setStatus(statusEl, { message: "" });
      form.reset();
      openSuccessModal();
      scheduleRedirect();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "登録に失敗しました。";
      setStatus(statusEl, { type: "error", message });
    }
  });
})();
