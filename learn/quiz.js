import { apiFetch, ApiError } from "../shared/api.js";
import { requireAuth } from "../shared/auth.js";
import { buildAppUrl } from "../shared/config.js";
import { renderHeader, setStatus } from "../shared/ui.js";
import { normalizeAnswer } from "../shared/validators.js";
import { addHistory } from "../shared/storage.js";

const statusEl = document.getElementById("status");
const topicTitleEl = document.getElementById("topic-title");
const questionProgressEl = document.getElementById("question-progress");
const questionTypeEl = document.getElementById("question-type");
const questionTextEl = document.getElementById("question-text");
const answerAreaEl = document.getElementById("answer-area");
const resetButton = document.getElementById("reset-button");
const nextButton = document.getElementById("next-button");

const state = {
  topicId: null,
  topicTitle: "",
  questions: [],
  index: 0,
  answers: [],
  currentAnswer: "",
  tokenPool: [],
  selectedTokens: [],
};

function normalizeFormat(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function getFormatLabel(format, hasOptions) {
  if (format.includes("rearrangement")) {
    return "並び替え";
  }
  if (format.includes("fill")) {
    return hasOptions ? "穴埋め (選択)" : "穴埋め (入力)";
  }
  if (format.includes("choice") || format.includes("multiple")) {
    return "選択式";
  }
  if (hasOptions) {
    return "選択式";
  }
  return "入力式";
}

function normalizeQuestion(question) {
  const rawFormat = question.question_format || question.type || question.format || "";
  const format = normalizeFormat(rawFormat);
  const options = question.options || question.choices || [];
  return {
    format,
    question: question.question || "",
    options,
    answer: question.answer || "",
    explanation: question.explanation || "",
  };
}

function shuffleTokens(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function renderMultipleChoice(question) {
  const list = document.createElement("div");
  list.className = "option-list";

  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-button";
    button.textContent = option;
    button.addEventListener("click", () => {
      state.currentAnswer = option;
      list.querySelectorAll(".option-button").forEach((btn) => {
        btn.classList.toggle("is-selected", btn === button);
      });
      setStatus(statusEl, { message: "" });
    });
    list.appendChild(button);
  });

  answerAreaEl.appendChild(list);
}

function renderTextInput() {
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "答えを入力";
  input.addEventListener("input", () => {
    state.currentAnswer = input.value;
  });
  answerAreaEl.appendChild(input);
}

function renderRearrangement(question) {
  resetButton.hidden = false;
  resetButton.onclick = () => {
    state.selectedTokens = [];
    state.currentAnswer = "";
    renderQuestion();
  };

  const tokens = question.options.length
    ? question.options
    : shuffleTokens(question.answer.split(" ").filter(Boolean));

  if (state.selectedTokens.length === 0) {
    state.tokenPool = tokens;
  }

  const selectedSet = new Set(state.selectedTokens.map((item) => item.id));
  const availableTokens = state.tokenPool
    .map((token, index) => ({
      id: `${index}-${token}`,
      token,
    }))
    .filter((item) => !selectedSet.has(item.id));

  const preview = document.createElement("div");
  preview.className = "answer-preview";
  state.currentAnswer = state.selectedTokens.map((item) => item.token).join(" ");
  preview.textContent = state.currentAnswer;

  const list = document.createElement("div");
  list.className = "token-list";

  availableTokens.forEach((item) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "token";
    chip.textContent = item.token;
    chip.addEventListener("click", () => {
      state.selectedTokens.push(item);
      state.currentAnswer = state.selectedTokens.map((tokenItem) => tokenItem.token).join(" ");
      renderQuestion();
    });
    list.appendChild(chip);
  });

  if (state.selectedTokens.length) {
    const selectedList = document.createElement("div");
    selectedList.className = "token-list";
    state.selectedTokens.forEach((item, index) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "token selected";
      chip.textContent = item.token;
      chip.addEventListener("click", () => {
        state.selectedTokens.splice(index, 1);
        state.currentAnswer = state.selectedTokens.map((tokenItem) => tokenItem.token).join(" ");
        renderQuestion();
      });
      selectedList.appendChild(chip);
    });
    answerAreaEl.append(preview, selectedList, list);
  } else {
    answerAreaEl.append(preview, list);
  }
}

function renderQuestion() {
  const current = normalizeQuestion(state.questions[state.index]);
  state.currentAnswer = "";
  resetButton.hidden = true;
  answerAreaEl.textContent = "";

  questionProgressEl.textContent = `問題 ${state.index + 1} / ${state.questions.length}`;
  questionTypeEl.textContent = getFormatLabel(current.format, current.options.length > 0);
  questionTextEl.textContent = current.question;

  if (current.format.includes("rearrangement")) {
    renderRearrangement(current);
    return;
  }

  if (current.options.length > 0) {
    renderMultipleChoice(current);
    return;
  }

  renderTextInput();
}

function finalizeQuiz() {
  const correctCount = state.answers.filter((item) => item.isCorrect).length;
  const accuracy = Math.round((correctCount / state.answers.length) * 100);
  const result = {
    topicId: state.topicId,
    topicTitle: state.topicTitle,
    createdAt: new Date().toISOString(),
    total: state.answers.length,
    correctCount,
    accuracy,
    questions: state.answers,
    language: "unknown",
  };

  sessionStorage.setItem("quizResult", JSON.stringify(result));
  addHistory(result);
  window.location.href = buildAppUrl("/learn/result.html");
}

async function init() {
  const profile = await requireAuth();
  if (!profile) {
    return;
  }
  renderHeader({ active: "learn", user: profile });

  const params = new URLSearchParams(window.location.search);
  const topicId = params.get("topicId") || (() => {
    const stored = sessionStorage.getItem("selectedTopic");
    if (!stored) {
      return null;
    }
    try {
      return JSON.parse(stored).id;
    } catch (error) {
      return null;
    }
  })();

  if (!topicId) {
    setStatus(statusEl, { type: "error", message: "学習単元が選択されていません。" });
    return;
  }

  try {
    const data = await apiFetch("/kotobaroots/learning/start", {
      method: "POST",
      data: { learning_topic_id: Number(topicId) },
    });

    state.topicId = data.topic_id || Number(topicId);
    state.topicTitle = data.topic_title || "";
    state.questions = data.questions || [];

    if (!state.questions.length) {
      setStatus(statusEl, { type: "error", message: "問題が取得できませんでした。" });
      return;
    }

    topicTitleEl.textContent = state.topicTitle ? `単元: ${state.topicTitle}` : "";
    renderQuestion();
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "問題の取得に失敗しました。";
    setStatus(statusEl, { type: "error", message });
  }
}

nextButton.addEventListener("click", () => {
  setStatus(statusEl, { message: "" });

  const current = normalizeQuestion(state.questions[state.index]);
  const userAnswer = state.currentAnswer;

  if (!userAnswer || !String(userAnswer).trim()) {
    setStatus(statusEl, { type: "error", message: "回答を入力してください。" });
    return;
  }

  const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(current.answer);
  state.answers.push({
    question: current.question,
    format: current.format,
    userAnswer: String(userAnswer),
    correctAnswer: current.answer,
    explanation: current.explanation,
    isCorrect,
  });

  if (state.index < state.questions.length - 1) {
    state.index += 1;
    state.selectedTokens = [];
    renderQuestion();
  } else {
    finalizeQuiz();
  }
});

init();
