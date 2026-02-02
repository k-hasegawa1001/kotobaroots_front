import { apiFetch, getErrorMessage } from "../shared/api.js";
import { renderHeader, setStatus } from "../shared/ui.js";
import { validateEmail } from "../shared/validators.js";

const statusEl = document.getElementById("status");
const form = document.getElementById("request-form");
const emailInput = document.getElementById("request-email");
const modal = document.getElementById("reset-modal");
const modalMessage = document.getElementById("reset-modal-message");
let modalTimerId = null;
let redirectTimerId = null;
const MODAL_DURATION_MS = 1500;

function openModal(message) {
  if (modalMessage) {
    modalMessage.textContent = message;
  }
  modal.hidden = false;
  if (modalTimerId) {
    window.clearTimeout(modalTimerId);
  }
  if (redirectTimerId) {
    window.clearTimeout(redirectTimerId);
  }
  modalTimerId = window.setTimeout(() => {
    closeModal();
  }, MODAL_DURATION_MS);
  redirectTimerId = window.setTimeout(() => {
    window.location.href = "/auth/login.html";
  }, MODAL_DURATION_MS);
}

function closeModal() {
  modal.hidden = true;
  if (modalTimerId) {
    window.clearTimeout(modalTimerId);
    modalTimerId = null;
  }
  if (redirectTimerId) {
    window.clearTimeout(redirectTimerId);
    redirectTimerId = null;
  }
}

function init() {
  renderHeader({ active: "auth", user: null, showAuth: true });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(statusEl, { message: "" });

    const email = String(emailInput.value || "").trim();
    const emailError = validateEmail(email);
    if (emailError) {
      setStatus(statusEl, { type: "error", message: emailError });
      return;
    }

    try {
      await apiFetch("/auth/request-reset-password", {
        method: "POST",
        data: { email },
      });
      form.reset();
      openModal("パスワードリセットリンクを送信しました。");
    } catch (error) {
      const message = getErrorMessage(error, "送信に失敗しました。");
      setStatus(statusEl, { type: "error", message });
    }
  });
}

init();
