import { apiFetch, getErrorMessage } from "../shared/api.js";
import { buildAppUrl } from "../shared/config.js";
import { renderHeader, setStatus } from "../shared/ui.js";
import { validatePassword, validatePasswordConfirmation } from "../shared/validators.js";

const statusEl = document.getElementById("status");
const form = document.getElementById("reset-form");
const newPasswordInput = document.getElementById("new-password");
const confirmPasswordInput = document.getElementById("confirm-password");
const modal = document.getElementById("reset-modal");
const modalMessage = document.getElementById("reset-modal-message");
let modalTimerId = null;

function getToken() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  return token && token.trim() ? token.trim() : "";
}

function openModal(message, onClose) {
  if (modalMessage) {
    modalMessage.textContent = message;
  }
  modal.hidden = false;
  if (modalTimerId) {
    window.clearTimeout(modalTimerId);
  }
  modalTimerId = window.setTimeout(() => {
    closeModal();
    if (onClose) {
      onClose();
    }
  }, 1500);
}

function closeModal() {
  modal.hidden = true;
  if (modalTimerId) {
    window.clearTimeout(modalTimerId);
    modalTimerId = null;
  }
}

function init() {
  renderHeader({ active: "auth", user: null, showAuth: true });

  const token = getToken();
  if (!token) {
    setStatus(statusEl, {
      type: "error",
      message: "トークンが見つかりません。確認メールのリンクからアクセスしてください。",
    });
    form.querySelector("button")?.setAttribute("disabled", "true");
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(statusEl, { message: "" });

    const newPassword = String(newPasswordInput.value || "");
    const confirmPassword = String(confirmPasswordInput.value || "");

    const newError = validatePassword(newPassword, "新しいパスワード");
    if (newError) {
      setStatus(statusEl, { type: "error", message: newError });
      return;
    }

    const confirmError = validatePasswordConfirmation(newPassword, confirmPassword);
    if (confirmError) {
      setStatus(statusEl, { type: "error", message: confirmError });
      return;
    }

    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        data: { token, password: newPassword },
      });
      form.reset();
      openModal("パスワードを変更しました。", () => {
        window.location.href = buildAppUrl("/auth/login.html");
      });
    } catch (error) {
      const message = getErrorMessage(error, "変更に失敗しました。");
      setStatus(statusEl, { type: "error", message });
    }
  });
}

init();
