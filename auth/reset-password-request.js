import { apiFetch, getErrorMessage } from "../shared/api.js";
import { renderHeader, setStatus } from "../shared/ui.js";
import { validateEmail } from "../shared/validators.js";

const statusEl = document.getElementById("status");
const form = document.getElementById("request-form");
const emailInput = document.getElementById("request-email");
const modal = document.getElementById("reset-modal");
const modalMessage = document.getElementById("reset-modal-message");
let modalTimerId = null;

function openModal(message) {
  if (modalMessage) {
    modalMessage.textContent = message;
  }
  modal.hidden = false;
  if (modalTimerId) {
    window.clearTimeout(modalTimerId);
  }
  modalTimerId = window.setTimeout(() => {
    closeModal();
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
