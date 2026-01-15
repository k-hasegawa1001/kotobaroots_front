import { apiFetch, ApiError } from "../shared/api.js";
import { requireAuth } from "../shared/auth.js";
import { renderHeader, setStatus, formatDate } from "../shared/ui.js";

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
    const message = error instanceof ApiError ? error.message : "プロフィールの取得に失敗しました。";
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

    if (!newName) {
      setStatus(usernameStatus, { type: "error", message: "ユーザー名を入力してください。" });
      return;
    }

    try {
      await apiFetch("/kotobaroots/profile/username", {
        method: "PATCH",
        data: { username: newName },
      });
      usernameEl.textContent = newName;
      closeModal(usernameModal);
      setStatus(statusEl, { type: "success", message: "ユーザー名を更新しました。" });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "更新に失敗しました。";
      setStatus(usernameStatus, { type: "error", message });
    }
  });

  emailRequestForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const newEmail = String(emailInput.value || "").trim();
    if (!newEmail) {
      setStatus(emailStatus, { type: "error", message: "新しいメールアドレスを入力してください。" });
      return;
    }

    try {
      await apiFetch("/kotobaroots/profile/email/request", {
        method: "POST",
        data: { new_email: newEmail },
      });
      setStatus(emailStatus, {
        type: "success",
        message: "確認メールを送信しました。メールのリンクから変更を完了してください。",
      });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "送信に失敗しました。";
      setStatus(emailStatus, { type: "error", message });
    }
  });
}

init();
