import { requireAuth } from "../shared/auth.js";
import { renderHeader, formatDate } from "../shared/ui.js";
import { loadHistory } from "../shared/storage.js";

const historyList = document.getElementById("history-list");
const languageFilter = document.getElementById("language-filter");

let historyEntries = [];

function buildLanguageOptions(entries) {
  const languages = Array.from(
    new Set(entries.map((item) => item.language || "unknown"))
  );

  languageFilter.textContent = "";
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "すべて";
  languageFilter.appendChild(allOption);

  languages.forEach((lang) => {
    const option = document.createElement("option");
    option.value = lang;
    option.textContent = lang === "unknown" ? "不明" : lang;
    languageFilter.appendChild(option);
  });
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
    title.textContent = item.topicTitle ? item.topicTitle : `単元 ID: ${item.topicId}`;

    const meta = document.createElement("p");
    meta.textContent = `${formatDate(item.createdAt)} ・ 正解率 ${item.accuracy}%`;

    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = `正解 ${item.correctCount} / ${item.total}`;

    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "詳細を見る";
    details.appendChild(summary);

    const list = document.createElement("ol");
    item.questions.forEach((question, index) => {
      const li = document.createElement("li");
      li.textContent = `Q${index + 1}: ${question.question} / あなた: ${question.userAnswer} / 正解: ${question.correctAnswer}`;
      list.appendChild(li);
    });
    details.appendChild(list);

    row.append(title, meta, tag, details);
    historyList.appendChild(row);
  });
}

async function init() {
  const profile = await requireAuth();
  if (!profile) {
    return;
  }
  renderHeader({ active: "history", user: profile });

  historyEntries = loadHistory();
  buildLanguageOptions(historyEntries);
  renderHistory(historyEntries);

  languageFilter.addEventListener("change", () => {
    const filter = languageFilter.value;
    if (filter === "all") {
      renderHistory(historyEntries);
      return;
    }
    const filtered = historyEntries.filter((item) => (item.language || "unknown") === filter);
    renderHistory(filtered);
  });
}

init();
