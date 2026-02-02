import { requireAuth } from "../shared/auth.js";
import { renderHeader, setStatus, formatDate } from "../shared/ui.js";

const statusEl = document.getElementById("status");
const resultList = document.getElementById("result-list");

function renderResults(result) {
  if (!Array.isArray(result.questions)) {
    setStatus(statusEl, { type: "error", message: "結果データが不正です。" });
    return;
  }

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
  title.textContent = "マイフレーズテスト";

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
  meta.textContent = `実施日時: ${formatDate(result.createdAt)}`;

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
    questionText.textContent = item.questionText ? `問題: ${item.questionText}` : "問題: -";

    const userAnswer = document.createElement("p");
    userAnswer.textContent = `あなたの回答: ${item.answer || ""}`;

    const correctAnswer = document.createElement("p");
    correctAnswer.textContent = `正解: ${item.correct || ""}`;

    row.append(head, questionText, userAnswer, correctAnswer);
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
  renderHeader({ active: "myphrase", user: profile });

  const stored = sessionStorage.getItem("myphraseTestResult");
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
