import { requireAuth } from "../shared/auth.js";
import { renderHeader, setStatus, formatDate } from "../shared/ui.js";

const statusEl = document.getElementById("status");
const resultSummary = document.getElementById("result-summary");
const correctCountEl = document.getElementById("correct-count");
const accuracyEl = document.getElementById("accuracy");
const completedAtEl = document.getElementById("completed-at");
const resultList = document.getElementById("result-list");

function renderResults(result) {
  if (!Array.isArray(result.questions)) {
    setStatus(statusEl, { type: "error", message: "結果データが不正です。" });
    return;
  }
  resultSummary.textContent = result.topicTitle
    ? `単元: ${result.topicTitle}`
    : "";
  correctCountEl.textContent = `${result.correctCount} / ${result.total}`;
  accuracyEl.textContent = `${result.accuracy}%`;
  completedAtEl.textContent = formatDate(result.createdAt);

  resultList.textContent = "";
  result.questions.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "table-row";

    const title = document.createElement("h4");
    title.textContent = `Q${index + 1}. ${item.question}`;

    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = item.isCorrect ? "正解" : "不正解";

    const userAnswer = document.createElement("p");
    userAnswer.textContent = `あなたの回答: ${item.userAnswer}`;

    const correctAnswer = document.createElement("p");
    correctAnswer.textContent = `正解: ${item.correctAnswer}`;

    row.append(title, tag, userAnswer, correctAnswer);

    if (item.explanation) {
      const explanation = document.createElement("p");
      explanation.textContent = `解説: ${item.explanation}`;
      row.appendChild(explanation);
    }

    resultList.appendChild(row);
  });
}

async function init() {
  const profile = await requireAuth();
  if (!profile) {
    return;
  }
  renderHeader({ active: "learn", user: profile });

  const stored = sessionStorage.getItem("quizResult");
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
