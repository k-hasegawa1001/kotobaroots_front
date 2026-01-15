import { apiFetch, ApiError } from "../shared/api.js";
import { requireAuth } from "../shared/auth.js";
import { buildAppUrl } from "../shared/config.js";
import { renderHeader, setStatus } from "../shared/ui.js";

const statusEl = document.getElementById("status");
const topicsEl = document.getElementById("topics");
const difficultySelect = document.getElementById("difficulty-select");
const difficultyCap = document.getElementById("difficulty-cap");
const languageSelect = document.getElementById("language-select");

const state = {
  topics: [],
  currentMax: 1,
  selectedDifficulty: 1,
};

const LANGUAGE_OPTIONS = ["英語", "中国語", "韓国語", "フランス語"];

const LEVEL_LABELS = {
  1: "初級",
  2: "中級",
  3: "上級",
};

function getLevelLabel(level) {
  return LEVEL_LABELS[level] ? LEVEL_LABELS[level] : `難易度 ${level}`;
}

function buildDifficultyOptions(max, disabled = false) {
  difficultySelect.textContent = "";
  for (let level = 1; level <= max; level += 1) {
    const option = document.createElement("option");
    option.value = String(level);
    option.textContent = getLevelLabel(level);
    difficultySelect.appendChild(option);
  }
  state.selectedDifficulty = max;
  difficultySelect.value = String(max);
  difficultySelect.disabled = disabled;
}

function buildLanguageOptions(disabled = false) {
  languageSelect.textContent = "";
  LANGUAGE_OPTIONS.forEach((label) => {
    const option = document.createElement("option");
    option.value = label;
    option.textContent = label;
    languageSelect.appendChild(option);
  });
  languageSelect.disabled = disabled;
}

function renderPlaceholderCards(count = 12) {
  topicsEl.textContent = "";
  for (let index = 0; index < count; index += 1) {
    const card = document.createElement("article");
    card.className = "card unit-card";
    card.setAttribute("aria-hidden", "true");
    topicsEl.appendChild(card);
  }
}

function renderTopics() {
  topicsEl.textContent = "";
  const visibleTopics = state.topics.filter(
    (topic) => topic.difficulty <= state.selectedDifficulty
  );

  if (visibleTopics.length === 0) {
    renderPlaceholderCards(8);
    return;
  }

  visibleTopics.forEach((topic, index) => {
    const card = document.createElement("article");
    card.className = "card unit-card";
    card.style.setProperty("--delay", `${index * 0.04}s`);

    const title = document.createElement("h3");
    title.textContent = topic.topic;

    const meta = document.createElement("p");
    meta.textContent = getLevelLabel(topic.difficulty);

    const action = document.createElement("div");
    action.className = "card-actions";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn";

    const locked = topic.difficulty > state.currentMax;
    if (locked) {
      card.classList.add("locked");
      button.classList.add("ghost");
      button.disabled = true;
      button.textContent = "ロック中";
    } else {
      button.textContent = "クイズを開始";
      button.addEventListener("click", () => {
        sessionStorage.setItem(
          "selectedTopic",
          JSON.stringify({
            id: topic.id,
            title: topic.topic,
            difficulty: topic.difficulty,
          })
        );
        window.location.href = buildAppUrl(`/learn/quiz.html?topicId=${encodeURIComponent(topic.id)}`);
      });
    }

    action.appendChild(button);
    card.append(title, meta, action);
    topicsEl.appendChild(card);
  });
}

async function init() {
  const profile = await requireAuth();
  if (!profile) {
    return;
  }

  renderHeader({ active: "learn", user: profile });
  buildLanguageOptions(false);

  try {
    const data = await apiFetch("/kotobaroots/learning");
    state.topics = data.learning_topics || [];
    state.currentMax = data.current_max_difficulty || 1;
    buildDifficultyOptions(state.currentMax);
    difficultyCap.textContent = `解放済み: ${getLevelLabel(state.currentMax)}`;
    renderTopics();
  } catch (error) {
    const message = error instanceof ApiError
      ? `学習データの取得に失敗しました。(${error.message})`
      : "学習データの取得に失敗しました。";
    setStatus(statusEl, { type: "error", message: `${message} 学習APIが未実装の可能性があります。` });
    renderPlaceholderCards(8);
  }

  difficultySelect.addEventListener("change", () => {
    state.selectedDifficulty = Number(difficultySelect.value);
    renderTopics();
  });
}

init();
