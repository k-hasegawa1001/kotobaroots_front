import { apiFetch, getErrorMessage } from "../shared/api.js";
import { requireAuth } from "../shared/auth.js";
import { renderHeader, formatDate, setStatus } from "../shared/ui.js";

const historyList = document.getElementById("history-list");
const languageFilter = document.getElementById("language-filter");
const accuracyFilter = document.getElementById("accuracy-filter");
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

function setupAccuracyFilter(entries) {
  if (!accuracyFilter) {
    return;
  }
  accuracyFilter.disabled = entries.length === 0;
  if (!accuracyFilter.value) {
    accuracyFilter.value = "all";
  }
}

function parseHistoryDate(value) {
  if (!value) {
    return 0;
  }
  const iso = String(value).replace(" ", "T");
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return 0;
  }
  return parsed.getTime();
}

function groupHistories(entries) {
  const groups = new Map();
  entries.forEach((entry) => {
    const topic = entry.topic || "単元名不明";
    const createdAt = entry.created_at || "";
    const key = `${topic}__${createdAt}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        topic,
        createdAt,
        items: [],
      });
    }
    groups.get(key).items.push(entry);
  });
  return Array.from(groups.values()).sort(
    (a, b) => parseHistoryDate(b.createdAt) - parseHistoryDate(a.createdAt)
  );
}

function getGroupAccuracy(group) {
  const total = group.items.length;
  const correct = group.items.filter((item) => item.is_passed).length;
  return total ? Math.round((correct / total) * 100) : 0;
}

function filterGroupsByAccuracy(groups) {
  if (!accuracyFilter || accuracyFilter.value === "all") {
    return groups;
  }
  return groups.filter((group) => {
    const accuracy = getGroupAccuracy(group);
    if (accuracyFilter.value === "high") {
      return accuracy >= 80;
    }
    if (accuracyFilter.value === "mid") {
      return accuracy >= 50 && accuracy < 80;
    }
    if (accuracyFilter.value === "low") {
      return accuracy < 50;
    }
    return true;
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

  const groups = filterGroupsByAccuracy(groupHistories(entries));
  if (!groups.length) {
    const empty = document.createElement("p");
    empty.className = "page-subtitle";
    empty.textContent = "条件に一致する履歴がありません。";
    historyList.appendChild(empty);
    return;
  }

  groups.forEach((group) => {
    const accuracy = getGroupAccuracy(group);

    const details = document.createElement("details");
    details.className = "history-group";

    const summary = document.createElement("summary");
    summary.className = "history-summary";

    const title = document.createElement("div");
    title.className = "history-summary-topic";
    title.textContent = group.topic;

    const accuracyEl = document.createElement("div");
    accuracyEl.className = "history-summary-accuracy";
    accuracyEl.textContent = `正答率: ${accuracy}%`;
    if (accuracy >= 80) {
      accuracyEl.classList.add("is-high");
    } else {
      accuracyEl.classList.add("is-low");
    }

    const meta = document.createElement("div");
    meta.className = "history-summary-meta";
    meta.textContent = `学習日時: ${formatDate(group.createdAt)}`;

    summary.append(title, accuracyEl, meta);
    details.appendChild(summary);

    const list = document.createElement("div");
    list.className = "history-question-list";

    group.items.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "history-question";

      const head = document.createElement("div");
      head.className = "history-question-head";

      const number = document.createElement("span");
      number.className = "history-question-number";
      number.textContent = `Q${index + 1}`;

      const tag = document.createElement("span");
      tag.className = "tag";
      if (item.is_passed) {
        tag.classList.add("is-correct");
        tag.textContent = "〇";
      } else {
        tag.classList.add("is-wrong");
        tag.textContent = "✕";
      }

      head.append(number, tag);

      const questionText = document.createElement("p");
      questionText.className = "history-question-text";
      questionText.textContent = `問題: ${item.question || item.question_statement || ""}`;

      const userAnswer = document.createElement("p");
      userAnswer.textContent = `あなたの回答: ${item.user_answer || ""}`;

      const correctAnswer = document.createElement("p");
      const resolvedCorrect = item.correct_answer || item.user_answer || "";
      correctAnswer.textContent = resolvedCorrect
        ? `正解: ${resolvedCorrect}`
        : "正解: -";

      row.append(head, questionText, userAnswer, correctAnswer);

      if (item.explanation) {
        const explanation = document.createElement("p");
        explanation.textContent = `解説: ${item.explanation}`;
        row.appendChild(explanation);
      }

      list.appendChild(row);
    });

    details.appendChild(list);
    historyList.appendChild(details);
  });
}

async function init() {
  const profile = await requireAuth();
  if (!profile) {
    return;
  }
  renderHeader({ active: "history", user: profile });
  buildLanguageOptions([]);
  setupAccuracyFilter([]);

  try {
    const data = await apiFetch("/kotobaroots/learning/history");
    historyEntries = data.histories || [];
    buildLanguageOptions(historyEntries);
    setupAccuracyFilter(historyEntries);
    renderHistory(historyEntries);
  } catch (error) {
    const message = getErrorMessage(error, "学習履歴の取得に失敗しました。");
    setStatus(statusEl, { type: "error", message });
    renderHistory([]);
  }
}

if (accuracyFilter) {
  accuracyFilter.addEventListener("change", () => {
    renderHistory(historyEntries);
  });
}

init();
