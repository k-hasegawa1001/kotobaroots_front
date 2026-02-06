import { apiFetch, getErrorMessage } from "../shared/api.js";
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
    console.error("Failed to load learning config", error);
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
  if (!select) {
    return;
  }
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
  if (difficultySelect) {
    difficultySelect.disabled = disabled;
  }
  if (languageSelect) {
    languageSelect.disabled = disabled;
  }
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

function redirectToLogin() {
  const next = encodeURIComponent("/learn/index.html");
  window.location.href = buildAppUrl(`/auth/login.html?next=${next}`);
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
    meta.textContent = `難易度 ${index + 1}`;

    const locked = topic.difficulty > state.currentMax;
    if (locked) {
      card.classList.add("locked");
      card.setAttribute("aria-disabled", "true");
    } else {
      card.classList.add("is-clickable");
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", "ログインして学習を開始");
      card.addEventListener("click", redirectToLogin);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          redirectToLogin();
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
  setStatus(statusEl, { message: "" });
  setSelectsDisabled(true);
  renderPlaceholderCards(8);

  try {
    const params = new URLSearchParams({
      level_id: String(state.selectedLevelId),
      language_id: String(state.selectedLanguageId),
    });
    const data = await apiFetch(`/kotobaroots/learning/guest?${params.toString()}`);
    state.topics = data.learning_topics || [];
    state.currentMax = data.current_max_difficulty || 1;
    if (difficultyCap) {
      difficultyCap.textContent = `解放済み: 難易度 ${state.currentMax}`;
    }
    renderTopics();
  } catch (error) {
    const message = getErrorMessage(error, "学習データの取得に失敗しました。");
    setStatus(statusEl, { type: "error", message });
    renderPlaceholderCards(8);
  } finally {
    buildSelectOptions(difficultySelect, LEVEL_OPTIONS, state.selectedLevelId);
    buildSelectOptions(languageSelect, LANGUAGE_OPTIONS, state.selectedLanguageId);
    setSelectsDisabled(false);
  }
}

function init() {
  renderHeader({ active: "learn" });

  const stored = loadStoredConfig();
  if (stored?.levelId) {
    state.selectedLevelId = stored.levelId;
  }
  if (stored?.languageId) {
    state.selectedLanguageId = stored.languageId;
  }

  buildSelectOptions(difficultySelect, LEVEL_OPTIONS, state.selectedLevelId);
  buildSelectOptions(languageSelect, LANGUAGE_OPTIONS, state.selectedLanguageId);

  fetchLearningData();

  if (difficultySelect) {
    difficultySelect.addEventListener("change", () => {
      state.selectedLevelId = Number(difficultySelect.value);
      saveStoredConfig();
      fetchLearningData();
    });
  }

  if (languageSelect) {
    languageSelect.addEventListener("change", () => {
      state.selectedLanguageId = Number(languageSelect.value);
      saveStoredConfig();
      fetchLearningData();
    });
  }
}

init();