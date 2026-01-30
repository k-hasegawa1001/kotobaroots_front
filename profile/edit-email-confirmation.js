import { apiFetch, getErrorMessage, ERROR_TYPES, ApiError } from "../shared/api.js";
import { getProfile } from "../shared/auth.js";
import { buildAppUrl } from "../shared/config.js";
import { renderHeader, setStatus } from "../shared/ui.js";
import { validatePassword } from "../shared/validators.js";

const statusEl = document.getElementById("status");
const form = document.getElementById("confirm-form");
const passwordInput = document.getElementById("confirm-password");
const confirmButton = document.getElementById("confirm-button");
const loginRequired = document.getElementById("login-required");
const successModal = document.getElementById("email-success-modal");
let successTimerId = null;

function getToken() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token");
}

function openSuccessModal(onClose) {
  successModal.hidden = false;
  if (successTimerId) {
    window.clearTimeout(successTimerId);
  }
  successTimerId = window.setTimeout(() => {
    closeSuccessModal();
    if (onClose) {
      onClose();
    }
  }, 1500);
}

function closeSuccessModal() {
  successModal.hidden = true;
  if (successTimerId) {
    window.clearTimeout(successTimerId);
    successTimerId = null;
  }
}

async function init() {
  let profile = null;
  let profileError = null;

  try {
    profile = await getProfile();
  } catch (error) {
    profileError = error;
    setStatus(statusEl, {
      type: "error",
      message: "ログイン状態の確認に失敗しました。必要に応じてログインしてください。",
    });
  }

  renderHeader({ active: "profile", user: profile, showAuth: !profileError });

  const token = getToken();
  if (!token) {
    setStatus(statusEl, {
      type: "error",
      message: "トークンが見つかりません。確認メールのリンクからアクセスしてください。",
    });
    confirmButton.disabled = true;
    return;
  }

  if (!profile && !profileError) {
    loginRequired.hidden = false;
    confirmButton.disabled = true;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = String(passwordInput.value || "");

    const passwordError = validatePassword(password);
    if (passwordError) {
      setStatus(statusEl, { type: "error", message: passwordError });
      return;
    }

    if (!profile && !profileError) {
      const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
      window.location.href = buildAppUrl(`/auth/login.html?next=${next}`);
      return;
    }

    try {
      await apiFetch("/kotobaroots/profile/email/update", {
        method: "POST",
        data: { token, password },
      });
      setStatus(statusEl, { message: "" });
      openSuccessModal(() => {
        window.location.href = buildAppUrl("/profile/index.html");
      });
      form.reset();
    } catch (error) {
      if (error instanceof ApiError && error.type === ERROR_TYPES.Unauthorized) {
        const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
        window.location.href = buildAppUrl(`/auth/login.html?next=${next}`);
        return;
      }
      const message = getErrorMessage(error, "変更に失敗しました。");
      setStatus(statusEl, { type: "error", message });
    }
  });
}

init();
