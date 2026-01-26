import { apiFetch, getErrorMessage, ERROR_TYPES } from "../shared/api.js";
import { requireAuth } from "../shared/auth.js";
import { renderHeader, setStatus, formatDate } from "../shared/ui.js";
import { validateEmail, validateUsername } from "../shared/validators.js";

const statusEl = document.getElementById("status");
const usernameEl = document.getElementById("profile-username");
const emailEl = document.getElementById("profile-email");
const createdEl = document.getElementById("profile-created");

const editUsernameButton = document.getElementById("edit-username");
const editEmailButton = document.getElementById("edit-email");

const usernameModal = document.getElementById("username-modal");
const usernameForm = document.getElementById("username-form");
const usernameInput = document.getElementById("username-input");
const usernameStatus = document.getElementById("username-status");
const closeUsernameModal = document.getElementById("close-username-modal");
const successModal = document.getElementById("profile-success-modal");
const successMessage = document.getElementById("profile-success-message");
let successTimerId = null;

const emailModal = document.getElementById("email-modal");
const emailRequestForm = document.getElementById("email-request-form");
const emailInput = document.getElementById("email-input");
const emailStatus = document.getElementById("email-status");
const closeEmailModal = document.getElementById("close-email-modal");

function openModal(modal, statusElToClear) {
  modal.hidden = false;
  if (statusElToClear) {
    setStatus(statusElToClear, { message: "" });
  }
}

function closeModal(modal) {
  modal.hidden = true;
}

function openSuccessModal(message) {
  if (successMessage) {
    successMessage.textContent = message;
  }
  successModal.hidden = false;
  if (successTimerId) {
    window.clearTimeout(successTimerId);
  }
  successTimerId = window.setTimeout(() => {
    closeSuccessModal();
  }, 1500);
}

function closeSuccessModal() {
  successModal.hidden = true;
  if (successTimerId) {
    window.clearTimeout(successTimerId);
    successTimerId = null;
  }
}

[usernameModal, emailModal].forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal(modal);
    }
  });
});

closeUsernameModal.addEventListener("click", () => closeModal(usernameModal));
closeEmailModal.addEventListener("click", () => closeModal(emailModal));

async function init() {
  const profile = await requireAuth();
  if (!profile) {
    return;
  }
  renderHeader({ active: "profile", user: profile });

  try {
    const data = await apiFetch("/kotobaroots/profile");
    usernameEl.textContent = data.username || "";
    emailEl.textContent = data.email || "";
    createdEl.textContent = formatDate(data.created_at);
  } catch (error) {
    const message = getErrorMessage(error, "プロフィールの取得に失敗しました。");
    setStatus(statusEl, { type: "error", message });
  }

  editUsernameButton.addEventListener("click", () => {
    usernameInput.value = usernameEl.textContent || "";
    openModal(usernameModal, usernameStatus);
  });

  editEmailButton.addEventListener("click", () => {
    emailInput.value = "";
    openModal(emailModal, emailStatus);
  });

  usernameForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const newName = String(usernameInput.value || "").trim();

    const usernameError = validateUsername(newName);
    if (usernameError) {
      setStatus(usernameStatus, { type: "error", message: usernameError });
      return;
    }

    if (newName === usernameEl.textContent) {
      setStatus(usernameStatus, { type: "error", message: "現在のユーザー名と同じです。" });
      return;
    }

    try {
      await apiFetch("/kotobaroots/profile/username", {
        method: "PATCH",
        data: { username: newName },
      });
      usernameEl.textContent = newName;
      closeModal(usernameModal);
      setStatus(statusEl, { message: "" });
      openSuccessModal("ユーザー名を変更しました。");
    } catch (error) {
      const message = getErrorMessage(error, "変更に失敗しました。", {
        [ERROR_TYPES.Conflict]: "このユーザー名は既に使われています。",
      });
      setStatus(usernameStatus, { type: "error", message });
    }
  });

  emailRequestForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const newEmail = String(emailInput.value || "").trim();

    const emailError = validateEmail(newEmail);
    if (emailError) {
      setStatus(emailStatus, { type: "error", message: emailError });
      return;
    }

    if (newEmail === emailEl.textContent) {
      setStatus(emailStatus, { type: "error", message: "現在のメールアドレスと同じです。" });
      return;
    }

    try {
      await apiFetch("/kotobaroots/profile/email/request", {
        method: "POST",
        data: { new_email: newEmail },
      });
      closeModal(emailModal);
      setStatus(emailStatus, { message: "" });
      openSuccessModal("確認メールを送信しました。");
    } catch (error) {
      const message = getErrorMessage(error, "送信に失敗しました。", {
        [ERROR_TYPES.Conflict]: "このメールアドレスは既に使われています。",
      });
      setStatus(emailStatus, { type: "error", message });
    }
  });
}

init();
