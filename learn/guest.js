import { buildAppUrl } from "../shared/config.js";
import { renderHeader } from "../shared/ui.js";

const topicsEl = document.getElementById("topics");
const difficultySelect = document.getElementById("difficulty-select");
const difficultyCap = document.getElementById("difficulty-cap");

const TOPICS_MAP = {
  Beginner: {
    "アルファベット": "alphabet",
    "基本語彙": "basic_vocabulary",
    "be動詞": "be_verb",
    "一般動詞": "general_verb",
    "否定文": "negative_form",
    "疑問文": "interrogative_form",
    "助動詞": "auxiliary_verb",
    "疑問詞": "question_word",
    "複数形": "plural_form",
    "三人称単数": "third_person_singular",
    "人称代名詞": "personal_pronoun",
    "現在進行形": "present_progressive",
    "過去形": "past_tense",
    "過去進行形": "past_progressive",
    "未来表現": "future_tense",
    "接続詞": "conjunction",
    "不定詞": "infinitive",
    "動名詞": "gerund",
    "比較": "comparison",
    "受動態": "passive_voice",
    "現在完了形": "present_perfect",
    "分詞": "participle",
    "関係代名詞": "relative_pronoun",
    "間接疑問文": "indirect_question",
    "仮定法": "subjunctive_mood",
  },
  Intermediate: {
    "文型": "sentence_pattern",
    "完了進行形": "perfect_progressive",
    "未来完了": "future_perfect",
    "助動詞(応用)": "advanced_auxiliary",
    "群動詞の受動態": "phrasal_verb_passive",
    "意味上の主語": "logical_subject",
    "完了不定詞": "perfect_infinitive",
    "分詞構文": "participle_construction",
    "関係副詞": "relative_adverb",
    "複合関係詞": "compound_relative",
    "非制限用法": "non_restrictive_usage",
    "仮定法過去": "subjunctive_past",
    "仮定法過去完了": "subjunctive_past_perfect",
    "無生物主語": "inanimate_subject",
    "強調構文": "cleft_sentence",
    "倒置": "inversion",
    "省略": "ellipsis",
    "同格": "apposition",
  },
  Advanced: {
    "米英豪の差異": "regional_varieties",
    "聖書・神話由来": "biblical_mythological",
    "文学・古典由来": "literary_references",
    "歴史的メタファー": "historical_metaphors",
    "婉曲表現": "euphemism",
    "包括的表現(PC)": "inclusive_language",
    "皮肉・ユーモア": "sarcasm_irony",
    "フォーマル・品格": "register_formal",
    "世代別スラング": "generational_slang",
    "ネットスラング": "internet_slang",
    "ポップカルチャー": "pop_culture_quotes",
  },
};

const DIFFICULTY_OPTIONS = [
  { id: "Beginner", label: "初級" },
  { id: "Intermediate", label: "中級" },
  { id: "Advanced", label: "上級" },
];

let currentDifficulty = "Beginner";

function redirectToLogin() {
  const next = encodeURIComponent("/learn/index.html");
  window.location.href = buildAppUrl(`/auth/login.html?next=${next}`);
}

function buildSelectOptions() {
  difficultySelect.textContent = "";
  DIFFICULTY_OPTIONS.forEach((optionItem) => {
    const option = document.createElement("option");
    option.value = optionItem.id;
    option.textContent = optionItem.label;
    difficultySelect.appendChild(option);
  });
  difficultySelect.value = currentDifficulty;
}

function getItems() {
  const topics = TOPICS_MAP[currentDifficulty] || {};
  return Object.keys(topics).map((title) => ({ title }));
}

function renderGuestCards() {
  topicsEl.textContent = "";
  const items = getItems();
  const isBeginner = currentDifficulty === "Beginner";

  items.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "card unit-card";
    card.style.setProperty("--delay", `${index * 0.04}s`);

    const title = document.createElement("h3");
    title.textContent = item.title;

    const meta = document.createElement("p");
    meta.textContent = `難易度 ${index + 1}`;

    const action = document.createElement("div");
    action.className = "card-actions";
    const hint = document.createElement("span");
    hint.className = "badge";

    const isUnlocked = isBeginner && index === 0;
    if (isUnlocked) {
      card.classList.add("is-clickable");
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-label", "ログインして学習を開始");
      hint.textContent = "クリックで開始";
      card.addEventListener("click", redirectToLogin);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          redirectToLogin();
        }
      });
    } else {
      card.classList.add("locked");
      card.setAttribute("aria-disabled", "true");
      hint.textContent = "ロック中";
    }

    action.appendChild(hint);
    card.append(title, meta, action);
    topicsEl.appendChild(card);
  });
}

function init() {
  renderHeader({ active: "learn" });
  buildSelectOptions();
  renderGuestCards();

  if (difficultyCap) {
    difficultyCap.textContent = "解放済み: 難易度 1";
  }

  difficultySelect.addEventListener("change", () => {
    currentDifficulty = difficultySelect.value;
    renderGuestCards();
  });
}

init();
