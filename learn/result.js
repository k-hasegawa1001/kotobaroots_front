import { requireAuth } from "../shared/auth.js";
import { renderHeader, setStatus, formatDate } from "../shared/ui.js";

const statusEl = document.getElementById("status");
const resultList = document.getElementById("result-list");

function renderResults(result) {
  if (!Array.isArray(result.questions)) {
    setStatus(statusEl, { type: "error", message: "結果データが不正です。" });
    return;
  }
  const topicTitle = result.topicTitle || "単元名不明";
  const total = Number.isFinite(result.total) ? result.total : result.questions.length;
  const correctCount = Number.isFinite(result.correctCount)
    ? result.correctCount
    : result.questions.filter((item) => item.isCorrect).length;
  const accuracy = Number.isFinite(result.accuracy)
    ? result.accuracy
    : total
      ? Math.round((correctCount / total) * 100)
      : 0;

  resultList.textContent = "";
  const details = document.createElement("details");
  details.className = "history-group";
  details.open = true;

  const summary = document.createElement("summary");
  summary.className = "history-summary";

  const title = document.createElement("div");
  title.className = "history-summary-topic";
  title.textContent = topicTitle;

  const accuracyEl = document.createElement("div");
  accuracyEl.className = "history-summary-accuracy";
  accuracyEl.textContent = `正答率: ${accuracy}% (${correctCount}/${total})`;
  if (accuracy >= 80) {
    accuracyEl.classList.add("is-high");
  } else {
    accuracyEl.classList.add("is-low");
  }

  const meta = document.createElement("div");
  meta.className = "history-summary-meta";
  meta.textContent = `学習日時: ${formatDate(result.createdAt)}`;

  summary.append(title, accuracyEl, meta);
  details.appendChild(summary);

  const list = document.createElement("div");
  list.className = "history-question-list";

  result.questions.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "history-question";

    const head = document.createElement("div");
    head.className = "history-question-head";

    const number = document.createElement("span");
    number.className = "history-question-number";
    number.textContent = `Q${index + 1}`;

    const tag = document.createElement("span");
    tag.className = "tag";
    if (item.isCorrect) {
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
    userAnswer.textContent = `あなたの回答: ${item.userAnswer || ""}`;

    const correctAnswer = document.createElement("p");
    correctAnswer.textContent = `正解: ${item.correctAnswer || ""}`;

    row.append(head, questionText, userAnswer, correctAnswer);

    if (item.explanation) {
      const explanation = document.createElement("p");
      explanation.textContent = `解説: ${item.explanation}`;
      row.appendChild(explanation);
    }

    list.appendChild(row);
  });

  details.appendChild(list);
  resultList.appendChild(details);
}

async function init() {
  const profile = await requireAuth();
  if (!profile) {
    return;
  }
  renderHeader({ active: "learn", user: profile });

  const saveError = sessionStorage.getItem("learnSaveError");
  if (saveError) {
    setStatus(statusEl, { type: "error", message: `履歴の保存に失敗しました。${saveError}` });
    sessionStorage.removeItem("learnSaveError");
  }

  const stored = sessionStorage.getItem("learnResult");
  if (!stored) {
    setStatus(statusEl, { type: "error", message: "結果データが見つかりません。" });
    return;
  }

  try {
    const result = JSON.parse(stored);
    renderResults(result);
  } catch (error) {
    setStatus(statusEl, { type: "error", message: "結果データの読み込みに失敗しました。" });
  }
}

init();
