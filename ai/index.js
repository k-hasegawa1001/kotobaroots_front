import { apiFetch, getErrorMessage, ERROR_TYPES } from "../shared/api.js";
import { requireAuth } from "../shared/auth.js";
import { renderHeader, setStatus, formatDate } from "../shared/ui.js";
import { validateAiInput } from "../shared/validators.js";

const statusEl = document.getElementById("status");
const form = document.getElementById("ai-form");
const resultEl = document.getElementById("ai-result");
const historyEl = document.getElementById("ai-history");
const subtitleEl = document.getElementById("ai-subtitle");
const historyToggle = document.getElementById("ai-history-toggle");
const historyDrawer = document.getElementById("ai-history-drawer");
const historyPanel = historyDrawer?.querySelector(".ai-history-panel");
const historyCloseButtons = historyDrawer?.querySelectorAll("[data-close]") || [];

let lastFocusedElement = null;

function renderResult(data) {
  resultEl.textContent = "";
  if (!data) {
    return;
  }

  const translation = document.createElement("p");
  translation.textContent = `翻訳: ${data.translation || ""}`;

  const explanation = document.createElement("p");
  explanation.textContent = `解説: ${data.explanation || ""}`;

  resultEl.append(translation, explanation);
}

function renderHistory(items) {
  historyEl.textContent = "";
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "page-subtitle";
    empty.textContent = "履歴はまだありません。";
    historyEl.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "table-row";

    const title = document.createElement("h4");
    title.textContent = item.input_english;

    const meta = document.createElement("p");
    meta.textContent = formatDate(item.created_at);

    const translation = document.createElement("p");
    translation.textContent = `翻訳: ${item.japanese_translation}`;

    const explanation = document.createElement("p");
    explanation.textContent = `解説: ${item.explanation}`;

    row.append(title, meta, translation, explanation);
    historyEl.appendChild(row);
  });
}

function updateSubtitle(languageName) {
  if (!subtitleEl) {
    return;
  }
  if (languageName) {
    subtitleEl.textContent = `${languageName}表現をわかりやすく分解して学びます。`;
    return;
  }
  subtitleEl.textContent = "英語表現をわかりやすく分解して学びます。";
}

async function loadCurrentLanguage() {
  try {
    const data = await apiFetch("/kotobaroots/learning/config/current");
    updateSubtitle(data?.language || "");
  } catch (error) {
    updateSubtitle("");
  }
}

async function loadHistory() {
  try {
    const items = await apiFetch("/kotobaroots/ai-explanation/history");
    renderHistory(items || []);
  } catch (error) {
    const message = getErrorMessage(error, "履歴の取得に失敗しました。");
    setStatus(statusEl, { type: "error", message });
  }
}

function setDrawerOpen(isOpen) {
  if (!historyDrawer) {
    return;
  }
  historyDrawer.classList.toggle("is-open", isOpen);
  historyDrawer.setAttribute("aria-hidden", String(!isOpen));
  document.body.classList.toggle("is-drawer-open", isOpen);

  if (isOpen) {
    lastFocusedElement = document.activeElement;
    if (historyPanel instanceof HTMLElement) {
      historyPanel.focus();
    }
  } else if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
    lastFocusedElement = null;
  }
}

async function init() {
  const profile = await requireAuth();
  if (!profile) {
    return;
  }
  renderHeader({ active: "ai", user: profile });

  await loadCurrentLanguage();
  await loadHistory();

  if (historyToggle) {
    historyToggle.addEventListener("click", () => {
      setDrawerOpen(true);
    });
  }

  historyCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setDrawerOpen(false);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && historyDrawer?.classList.contains("is-open")) {
      setDrawerOpen(false);
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(statusEl, { message: "" });

    const formData = new FormData(form);
    const inputEnglish = String(formData.get("input_english") || "").trim();

    const inputError = validateAiInput(inputEnglish);
    if (inputError) {
      setStatus(statusEl, { type: "error", message: inputError });
      return;
    }

    try {
      const data = await apiFetch("/kotobaroots/ai-explanation", {
        method: "POST",
        data: { input_english: inputEnglish },
      });
      renderResult(data);
      await loadHistory();
    } catch (error) {
      const message = getErrorMessage(error, "解説の取得に失敗しました。", {
        [ERROR_TYPES.ExternalServiceError]: "AI機能は現在利用できません。",
      });
      setStatus(statusEl, { type: "error", message });
    }
  });
}

init();
