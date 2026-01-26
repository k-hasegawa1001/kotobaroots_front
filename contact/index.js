import { apiFetch, getErrorMessage } from "../shared/api.js";
import { requireAuth } from "../shared/auth.js";
import { renderHeader, setStatus } from "../shared/ui.js";
import { validateContactContent } from "../shared/validators.js";

const statusEl = document.getElementById("status");
const form = document.getElementById("contact-form");
const modal = document.getElementById("contact-modal");
let modalTimerId = null;

function openModal() {
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

async function init() {
  const profile = await requireAuth();
  if (!profile) {
    return;
  }
  renderHeader({ active: "contact", user: profile });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(statusEl, { message: "" });

    const formData = new FormData(form);
    const content = String(formData.get("content") || "").trim();

    const contentError = validateContactContent(content);
    if (contentError) {
      setStatus(statusEl, { type: "error", message: contentError });
      return;
    }

    try {
      await apiFetch("/kotobaroots/contact", {
        method: "POST",
        data: { content },
      });
      form.reset();
      openModal();
    } catch (error) {
      const message = getErrorMessage(error, "送信に失敗しました。");
      setStatus(statusEl, { type: "error", message });
    }
  });
}

init();
