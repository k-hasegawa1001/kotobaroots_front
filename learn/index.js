import { apiFetch, ApiError } from "../shared/api.js";
import { requireAuth } from "../shared/auth.js";
import { buildAppUrl } from "../shared/config.js";
import { renderHeader, setStatus } from "../shared/ui.js";

const statusEl = document.getElementById("status");
const topicsEl = document.getElementById("topics");
const difficultySelect = document.getElementById("difficulty-select");
const difficultyCap = document.getElementById("difficulty-cap");
const languageSelect = document.getElementById("language-select");

const CONFIG_STORAGE_KEY = "kotobaroots.learning.config.v1";

const state = {
  topics: [],
  currentMax: 1,
  selectedLevelId: 1,
  selectedLanguageId: 1,
};

const LANGUAGE_OPTIONS = [
  { id: 1, label: "英語（アメリカ）" },
  { id: 2, label: "英語（イギリス）" },
  { id: 3, label: "中国語" },
];

const LEVEL_OPTIONS = [
  { id: 1, label: "初級" },
  { id: 2, label: "中級" },
  { id: 3, label: "上級" },
];

function loadStoredConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function saveStoredConfig() {
  localStorage.setItem(
    CONFIG_STORAGE_KEY,
    JSON.stringify({
      levelId: state.selectedLevelId,
      languageId: state.selectedLanguageId,
    })
  );
}

function buildSelectOptions(select, options, selectedId) {
  select.textContent = "";
  options.forEach((optionItem) => {
    const option = document.createElement("option");
    option.value = String(optionItem.id);
    option.textContent = optionItem.label;
    select.appendChild(option);
  });
  select.value = String(selectedId);
}

function setSelectsDisabled(disabled) {
  difficultySelect.disabled = disabled;
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
  const visibleTopics = state.topics;

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
    meta.textContent = `難易度 ${topic.difficulty}`;

    const locked = topic.difficulty > state.currentMax;
    if (locked) {
      card.classList.add("locked");
      card.setAttribute("aria-disabled", "true");
    } else {
      const startLearning = () => {
        sessionStorage.setItem(
          "selectedTopic",
          JSON.stringify({
            id: topic.id,
            title: topic.topic,
            difficulty: topic.difficulty,
          })
        );
        window.location.href = buildAppUrl(`/learn/learn.html?topicId=${encodeURIComponent(topic.id)}`);
      };

      card.classList.add("is-clickable");
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", `${topic.topic} を学習する`);
      card.addEventListener("click", startLearning);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          startLearning();
        }
      });
    }

    const action = document.createElement("div");
    action.className = "card-actions";
    const hint = document.createElement("span");
    hint.className = "badge";
    hint.textContent = locked ? "ロック中" : "クリックで開始";
    action.appendChild(hint);

    card.append(title, meta, action);
    topicsEl.appendChild(card);
  });
}

async function fetchLearningData() {
  try {
    const data = await apiFetch("/kotobaroots/learning");
    state.topics = data.learning_topics || [];
    state.currentMax = data.current_max_difficulty || 1;
    difficultyCap.textContent = `解放済み: 難易度 ${state.currentMax}`;
    renderTopics();
  } catch (error) {
    const message = error instanceof ApiError
      ? `学習データの取得に失敗しました。(${error.message})`
      : "学習データの取得に失敗しました。";
    setStatus(statusEl, { type: "error", message: `${message} 学習APIが未実装の可能性があります。` });
    renderPlaceholderCards(8);
  }
}

async function updateLearningConfig({ levelId, languageId }) {
  setStatus(statusEl, { message: "" });
  setSelectsDisabled(true);

  const previousLevel = state.selectedLevelId;
  const previousLanguage = state.selectedLanguageId;

  try {
    await apiFetch("/kotobaroots/learning/config", {
      method: "PUT",
      data: {
        level_id: levelId,
        language_id: languageId,
      },
    });

    state.selectedLevelId = levelId;
    state.selectedLanguageId = languageId;
    saveStoredConfig();
    await fetchLearningData();
  } catch (error) {
    const message = error instanceof ApiError
      ? error.message
      : "学習設定の変更に失敗しました。";
    setStatus(statusEl, { type: "error", message });
    state.selectedLevelId = previousLevel;
    state.selectedLanguageId = previousLanguage;
  } finally {
    buildSelectOptions(difficultySelect, LEVEL_OPTIONS, state.selectedLevelId);
    buildSelectOptions(languageSelect, LANGUAGE_OPTIONS, state.selectedLanguageId);
    setSelectsDisabled(false);
  }
}

async function init() {
  const profile = await requireAuth();
  if (!profile) {
    return;
  }

  renderHeader({ active: "learn", user: profile });

  const stored = loadStoredConfig();
  if (stored?.levelId) {
    state.selectedLevelId = stored.levelId;
  }
  if (stored?.languageId) {
    state.selectedLanguageId = stored.languageId;
  }

  buildSelectOptions(difficultySelect, LEVEL_OPTIONS, state.selectedLevelId);
  buildSelectOptions(languageSelect, LANGUAGE_OPTIONS, state.selectedLanguageId);

  await fetchLearningData();

  difficultySelect.addEventListener("change", () => {
    const levelId = Number(difficultySelect.value);
    updateLearningConfig({ levelId, languageId: state.selectedLanguageId });
  });

  languageSelect.addEventListener("change", () => {
    const languageId = Number(languageSelect.value);
    updateLearningConfig({ levelId: state.selectedLevelId, languageId });
  });
}

init();
