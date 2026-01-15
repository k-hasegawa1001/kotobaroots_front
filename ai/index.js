import { apiFetch, ApiError } from "../shared/api.js";
import { requireAuth } from "../shared/auth.js";
import { renderHeader, setStatus, formatDate } from "../shared/ui.js";

const statusEl = document.getElementById("status");
const form = document.getElementById("ai-form");
const resultEl = document.getElementById("ai-result");
const historyEl = document.getElementById("ai-history");

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

async function loadHistory() {
  try {
    const items = await apiFetch("/kotobaroots/ai-explanation/history");
    renderHistory(items || []);
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "履歴の取得に失敗しました。";
    setStatus(statusEl, { type: "error", message });
  }
}

async function init() {
  const profile = await requireAuth();
  if (!profile) {
    return;
  }
  renderHeader({ active: "ai", user: profile });

  await loadHistory();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(statusEl, { message: "" });

    const formData = new FormData(form);
    const inputEnglish = String(formData.get("input_english") || "").trim();

    if (!inputEnglish) {
      setStatus(statusEl, { type: "error", message: "英文を入力してください。" });
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
      const message = error instanceof ApiError && error.status >= 500
        ? "AI機能は現在利用できません。"
        : (error instanceof ApiError ? error.message : "解説の取得に失敗しました。");
      setStatus(statusEl, { type: "error", message });
    }
  });
}

init();
