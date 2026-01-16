import { apiFetch, ApiError } from "../shared/api.js";
import { requireAuth } from "../shared/auth.js";
import { renderHeader, formatDate, setStatus } from "../shared/ui.js";

const historyList = document.getElementById("history-list");
const languageFilter = document.getElementById("language-filter");
const statusEl = document.getElementById("status");

let historyEntries = [];

function buildLanguageOptions(entries) {
  languageFilter.textContent = "";
  const option = document.createElement("option");
  option.value = "current";
  option.textContent = entries.length ? "現在の学習言語" : "学習言語";
  languageFilter.appendChild(option);
  languageFilter.disabled = true;
}

function renderHistory(entries) {
  historyList.textContent = "";
  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "page-subtitle";
    empty.textContent = "履歴がまだありません。";
    historyList.appendChild(empty);
    return;
  }

  entries.forEach((item) => {
    const row = document.createElement("div");
    row.className = "table-row";

    const title = document.createElement("h4");
    title.textContent = item.topic || "単元名不明";

    const meta = document.createElement("p");
    meta.textContent = formatDate(item.created_at);

    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = item.is_passed ? "正解" : "不正解";

    const userAnswer = document.createElement("p");
    userAnswer.textContent = `あなたの回答: ${item.user_answer || ""}`;

    const correctAnswer = document.createElement("p");
    correctAnswer.textContent = item.correct_answer
      ? `正解: ${item.correct_answer}`
      : "正解: （正解）";

    row.append(title, meta, tag, userAnswer, correctAnswer);

    if (item.explanation) {
      const explanation = document.createElement("p");
      explanation.textContent = `解説: ${item.explanation}`;
      row.appendChild(explanation);
    }

    historyList.appendChild(row);
  });
}

async function init() {
  const profile = await requireAuth();
  if (!profile) {
    return;
  }
  renderHeader({ active: "history", user: profile });
  buildLanguageOptions([]);

  try {
    const data = await apiFetch("/kotobaroots/learning/history");
    historyEntries = data.histories || [];
    buildLanguageOptions(historyEntries);
    renderHistory(historyEntries);
  } catch (error) {
    const message = error instanceof ApiError
      ? `学習履歴の取得に失敗しました。(${error.message})`
      : "学習履歴の取得に失敗しました。";
    setStatus(statusEl, { type: "error", message });
    renderHistory([]);
  }
}

init();
