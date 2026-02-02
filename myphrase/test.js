import { apiFetch, getErrorMessage } from "../shared/api.js";
import { requireAuth } from "../shared/auth.js";
import { renderHeader, setStatus } from "../shared/ui.js";
import { validateAnswer } from "../shared/validators.js";

const statusEl = document.getElementById("status");
const testProgress = document.getElementById("test-progress");
const testType = document.getElementById("test-type");
const testQuestion = document.getElementById("test-question");
const testAnswerArea = document.getElementById("test-answer-area");
const testSubmitButton = document.getElementById("test-submit");
const testSkipButton = document.getElementById("test-skip");
const feedbackModal = document.getElementById("myphrase-feedback-modal");
const feedbackTitle = document.getElementById("myphrase-feedback-title");
const feedbackQuestion = document.getElementById("myphrase-feedback-question");
const feedbackAnswer = document.getElementById("myphrase-feedback-answer");
const feedbackCorrect = document.getElementById("myphrase-feedback-correct");
const feedbackNextButton = document.getElementById("myphrase-feedback-next");

const params = new URLSearchParams(window.location.search);
const requestedCount = Number(params.get("count"));
const hasRequestedCount = Number.isFinite(requestedCount) && requestedCount > 0;

let myphraseQuestionNum = 10;
let testQuestions = [];
let testIndex = 0;
let testScoreCount = 0;
let testAnswered = false;
let currentAnswerInput = null;

function normalizeAnswer(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function updateTestProgress() {
  if (!testProgress) {
    return;
  }
  if (!testQuestions.length) {
    testProgress.textContent = "";
    return;
  }
  testProgress.textContent = `Q${testIndex + 1} / ${testQuestions.length}`;
}

function updateTestType(blankType) {
  if (!testType) {
    return;
  }
  if (blankType === "phrase") {
    testType.textContent = "単語・フレーズ穴埋め";
  } else {
    testType.textContent = "意味穴埋め";
  }
}

function buildAnswerInput(placeholder) {
  const input = document.createElement("input");
  input.type = "text";
  input.className = "test-input";
  input.placeholder = placeholder;
  input.setAttribute("aria-label", placeholder);
  input.autocomplete = "off";
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSubmitAnswer();
    }
  });
  return input;
}

function showFeedbackModal({ isCorrect, questionText, answer, correct, isLast }) {
  if (!feedbackModal) {
    return;
  }
  if (feedbackTitle) {
    feedbackTitle.textContent = isCorrect ? "正解" : "不正解";
    feedbackTitle.classList.toggle("is-correct", isCorrect);
    feedbackTitle.classList.toggle("is-wrong", !isCorrect);
  }
  if (feedbackAnswer) {
    feedbackAnswer.textContent = answer || "-";
  }
  if (feedbackQuestion) {
    feedbackQuestion.textContent = questionText || "-";
  }
  if (feedbackCorrect) {
    feedbackCorrect.textContent = correct || "-";
  }
  if (feedbackNextButton) {
    feedbackNextButton.textContent = "つぎへ";
  }
  feedbackModal.hidden = false;
}

function handleFeedbackKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    handleNextQuestion();
  }
}

function closeFeedbackModal() {
  if (feedbackModal) {
    feedbackModal.hidden = true;
  }
  if (feedbackModal) {
    feedbackModal.removeEventListener("keydown", handleFeedbackKeydown);
  }
}

function renderTestQuestion() {
  const question = testQuestions[testIndex];
  if (!question || !testQuestion || !testAnswerArea) {
    return;
  }

  testAnswered = false;
  currentAnswerInput = null;
  setStatus(statusEl, { message: "" });

  if (testSubmitButton) {
    testSubmitButton.disabled = false;
  }
  if (testSkipButton) {
    testSkipButton.disabled = false;
  }

  updateTestProgress();
  updateTestType(question.blank);

  testQuestion.textContent = "";
  testAnswerArea.textContent = "";

  if (question.blank === "phrase") {
    testQuestion.textContent = `意味: ${question.mean || ""}`;
    const input = buildAnswerInput("単語・フレーズを入力");
    testAnswerArea.appendChild(input);
    currentAnswerInput = input;
  } else {
    testQuestion.textContent = `単語・フレーズ: ${question.phrase || ""}`;
    const input = buildAnswerInput("意味を入力");
    testAnswerArea.appendChild(input);
    currentAnswerInput = input;
  }

  if (currentAnswerInput) {
    currentAnswerInput.focus();
  }
}

function startTest(questions) {
  testQuestions = questions.map((question) => ({
    ...question,
    blank: Math.random() < 0.5 ? "phrase" : "mean",
  }));
  testIndex = 0;
  testScoreCount = 0;
  testAnswered = false;

  if (!testQuestions.length) {
    if (testSubmitButton) {
      testSubmitButton.disabled = true;
    }
    setStatus(statusEl, { type: "info", message: "テスト用のフレーズがありません。" });
    return;
  }

  setStatus(statusEl, { message: "" });
  renderTestQuestion();
}

function handleSubmitAnswer() {
  if (!currentAnswerInput || testAnswered) {
    return;
  }

  const answer = String(currentAnswerInput.value || "").trim();
  const answerError = validateAnswer(answer);
  if (answerError) {
    setStatus(statusEl, { type: "error", message: answerError });
    currentAnswerInput.focus();
    return;
  }

  const question = testQuestions[testIndex];
  if (!question) {
    return;
  }

  const correct = question.blank === "phrase" ? question.phrase || "" : question.mean || "";
  const isCorrect = normalizeAnswer(answer) === normalizeAnswer(correct);

  if (isCorrect) {
    testScoreCount += 1;
  }

  testAnswered = true;
  currentAnswerInput.disabled = true;
  if (testSubmitButton) {
    testSubmitButton.disabled = true;
  }
  if (testSkipButton) {
    testSkipButton.disabled = true;
  }
  showFeedbackModal({
    isCorrect,
    questionText: testQuestion?.textContent || "",
    answer,
    correct,
    isLast: testIndex === testQuestions.length - 1,
  });

  if (feedbackModal) {
    feedbackModal.setAttribute("tabindex", "-1");
    feedbackModal.addEventListener("keydown", handleFeedbackKeydown);
    feedbackModal.focus();
  }
}

function handleNextQuestion() {
  if (!testAnswered) {
    return;
  }
  closeFeedbackModal();
  if (testIndex < testQuestions.length - 1) {
    testIndex += 1;
    renderTestQuestion();
  } else {
    window.location.href = "./index.html";
  }
}

function handleSkipAnswer() {
  if (!currentAnswerInput || testAnswered) {
    return;
  }

  const question = testQuestions[testIndex];
  if (!question) {
    return;
  }

  const correct = question.blank === "phrase" ? question.phrase || "" : question.mean || "";

  testAnswered = true;
  currentAnswerInput.disabled = true;
  if (testSubmitButton) {
    testSubmitButton.disabled = true;
  }
  if (testSkipButton) {
    testSkipButton.disabled = true;
  }

  showFeedbackModal({
    isCorrect: false,
    questionText: testQuestion?.textContent || "",
    answer: "スキップされました。",
    correct,
    isLast: testIndex === testQuestions.length - 1,
  });

  if (feedbackModal) {
    feedbackModal.setAttribute("tabindex", "-1");
    feedbackModal.addEventListener("keydown", handleFeedbackKeydown);
    feedbackModal.focus();
  }
}

async function resolveQuestionCount() {
  if (hasRequestedCount) {
    return requestedCount;
  }
  const config = await apiFetch("/kotobaroots/myphrase");
  return config.question_num || myphraseQuestionNum;
}

async function fetchQuestions() {
  setStatus(statusEl, { message: "" });
  closeFeedbackModal();
  if (testSubmitButton) {
    testSubmitButton.disabled = true;
  }
  if (testSkipButton) {
    testSkipButton.disabled = true;
  }

  try {
    myphraseQuestionNum = await resolveQuestionCount();
    const data = await apiFetch("/kotobaroots/myphrase/test", {
      method: "PUT",
      data: { myphrase_question_num: myphraseQuestionNum || 10 },
    });
    startTest(data.questions || []);
  } catch (error) {
    const message = getErrorMessage(error, "テストの開始に失敗しました。");
    setStatus(statusEl, { type: "error", message });
  }
}

async function init() {
  const profile = await requireAuth();
  if (!profile) {
    return;
  }
  renderHeader({ active: "myphrase", user: profile });

  testSubmitButton.addEventListener("click", handleSubmitAnswer);
  if (testSkipButton) {
    testSkipButton.addEventListener("click", handleSkipAnswer);
  }
  if (feedbackNextButton) {
    feedbackNextButton.addEventListener("click", handleNextQuestion);
  }

  await fetchQuestions();
}

init();
