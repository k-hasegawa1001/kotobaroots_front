import { apiFetch, ApiError } from "../shared/api.js";
import { requireAuth } from "../shared/auth.js";
import { renderHeader, setStatus } from "../shared/ui.js";

const statusEl = document.getElementById("status");
const listEl = document.getElementById("myphrase-list");
const tableEl = document.querySelector(".myphrase-table");
const deleteButton = document.getElementById("delete-selected");
const questionNumEl = document.getElementById("question-num");
const openModalButton = document.getElementById("open-add-modal");
const modal = document.getElementById("myphrase-modal");
const modalForm = document.getElementById("myphrase-form");
const modalStatus = document.getElementById("myphrase-modal-status");
const closeModalButton = document.getElementById("close-myphrase-modal");
const successModal = document.getElementById("myphrase-success-modal");
const successMessage = document.getElementById("myphrase-success-message");
const testButton = document.getElementById("start-test");
const testModal = document.getElementById("myphrase-test-modal");
const testList = document.getElementById("myphrase-test-list");
const testStatus = document.getElementById("myphrase-test-status");
const testMeta = document.getElementById("myphrase-test-meta");
const closeTestButton = document.getElementById("close-test-modal");
let successTimerId = null;

let myphrases = [];
let myphraseQuestionNum = 10;

function openModal() {
  modal.hidden = false;
  modalStatus.hidden = true;
  modalForm.reset();
  const firstInput = modalForm.querySelector("input, textarea");
  if (firstInput) {
    firstInput.focus();
  }
}

function closeModal() {
  modal.hidden = true;
}

function openSuccessModal(message) {
  if (successMessage) {
    successMessage.textContent = message;
  }
  successModal.hidden = false;
  if (successTimerId) {
    window.clearTimeout(successTimerId);
  }
  successTimerId = window.setTimeout(() => {
    closeSuccessModal();
  }, 1500);
}

function closeSuccessModal() {
  successModal.hidden = true;
  if (successTimerId) {
    window.clearTimeout(successTimerId);
    successTimerId = null;
  }
}

function openTestModal() {
  testModal.hidden = false;
}

function closeTestModal() {
  testModal.hidden = true;
}

openModalButton.addEventListener("click", openModal);
closeModalButton.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});
closeTestButton.addEventListener("click", closeTestModal);
testModal.addEventListener("click", (event) => {
  if (event.target === testModal) {
    closeTestModal();
  }
});

function renderList() {
  listEl.textContent = "";

  if (!myphrases.length) {
    if (tableEl) {
      tableEl.classList.add("is-empty");
    }
    const empty = document.createElement("div");
    empty.className = "myphrase-row myphrase-empty";
    empty.textContent = "まだ登録されていません。";
    listEl.appendChild(empty);
    return;
  }

  if (tableEl) {
    tableEl.classList.remove("is-empty");
  }
  myphrases.forEach((item) => {
    const row = document.createElement("div");
    row.className = "myphrase-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = item.id;
    checkbox.className = "row-check";

    const phrase = document.createElement("div");
    phrase.textContent = item.phrase;

    const mean = document.createElement("div");
    mean.textContent = item.mean;

    row.append(checkbox, phrase, mean);
    listEl.appendChild(row);
  });
}

async function loadMyphrases() {
  try {
    const data = await apiFetch("/kotobaroots/myphrase");
    myphrases = data.myphrases || [];
    myphraseQuestionNum = data.question_num || myphraseQuestionNum;
    questionNumEl.textContent = myphraseQuestionNum
      ? `現在の出題数: ${myphraseQuestionNum}`
      : "";
    renderList();
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "取得に失敗しました。";
    setStatus(statusEl, { type: "error", message });
  }
}

function renderTestQuestions(questions) {
  testList.textContent = "";
  testMeta.textContent = questions.length ? `出題数: ${questions.length}` : "";

  if (!questions.length) {
    const empty = document.createElement("p");
    empty.className = "page-subtitle";
    empty.textContent = "テスト用のフレーズがありません。";
    testList.appendChild(empty);
    return;
  }

  questions.forEach((question, index) => {
    const row = document.createElement("div");
    row.className = "test-row";

    const head = document.createElement("div");
    head.className = "test-row-head";

    const phrase = document.createElement("div");
    phrase.className = "test-phrase";
    phrase.textContent = `${index + 1}. ${question.phrase || ""}`;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "btn outline small test-toggle";
    toggle.textContent = "答えを見る";

    const mean = document.createElement("div");
    mean.className = "test-mean";
    mean.textContent = question.mean || "";
    mean.hidden = true;

    toggle.addEventListener("click", () => {
      mean.hidden = !mean.hidden;
      toggle.textContent = mean.hidden ? "答えを見る" : "答えを隠す";
    });

    head.append(phrase, toggle);
    row.append(head, mean);
    testList.appendChild(row);
  });
}

async function init() {
  const profile = await requireAuth();
  if (!profile) {
    return;
  }
  renderHeader({ active: "myphrase", user: profile });
  await loadMyphrases();

  modalForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(modalStatus, { message: "" });

    const formData = new FormData(modalForm);
    const phrase = String(formData.get("phrase") || "").trim();
    const mean = String(formData.get("mean") || "").trim();

    if (!phrase || !mean) {
      setStatus(modalStatus, { type: "error", message: "単語・意味を入力してください。" });
      return;
    }

    try {
      await apiFetch("/kotobaroots/myphrase", {
        method: "POST",
        data: { phrase, mean },
      });
      closeModal();
      setStatus(statusEl, { message: "" });
      openSuccessModal("追加しました。");
      await loadMyphrases();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "追加に失敗しました。";
      setStatus(modalStatus, { type: "error", message });
    }
  });

  deleteButton.addEventListener("click", async () => {
    setStatus(statusEl, { message: "" });
    const selected = Array.from(listEl.querySelectorAll("input[type=checkbox]:checked"))
      .map((input) => Number(input.value))
      .filter((id) => Number.isFinite(id));

    if (!selected.length) {
      setStatus(statusEl, { type: "error", message: "削除対象を選択してください。" });
      return;
    }

    try {
      const res = await apiFetch("/kotobaroots/myphrase", {
        method: "DELETE",
        data: { delete_ids: selected },
      });
      setStatus(statusEl, { message: "" });
      const deletedCount = Array.isArray(selected) ? selected.length : 0;
      const deletedLabel = deletedCount ? `${deletedCount}件 削除しました。` : "削除しました。";
      openSuccessModal(deletedLabel);
      await loadMyphrases();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "削除に失敗しました。";
      setStatus(statusEl, { type: "error", message });
    }
  });

  testButton.addEventListener("click", async () => {
    setStatus(testStatus, { message: "" });
    testButton.disabled = true;
    try {
      const data = await apiFetch("/kotobaroots/myphrase/test", {
        method: "PUT",
        data: { myphrase_question_num: myphraseQuestionNum || 10 },
      });
      renderTestQuestions(data.questions || []);
      openTestModal();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "テストの開始に失敗しました。";
      setStatus(testStatus, { type: "error", message });
      renderTestQuestions([]);
      openTestModal();
    } finally {
      testButton.disabled = false;
    }
  });
}

init();
