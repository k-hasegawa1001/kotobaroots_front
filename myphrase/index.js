import { apiFetch, ApiError } from "../shared/api.js";
import { requireAuth } from "../shared/auth.js";
import { renderHeader, setStatus } from "../shared/ui.js";

const statusEl = document.getElementById("status");
const listEl = document.getElementById("myphrase-list");
const deleteButton = document.getElementById("delete-selected");
const questionNumEl = document.getElementById("question-num");
const openModalButton = document.getElementById("open-add-modal");
const modal = document.getElementById("myphrase-modal");
const modalForm = document.getElementById("myphrase-form");
const modalStatus = document.getElementById("myphrase-modal-status");
const closeModalButton = document.getElementById("close-myphrase-modal");
const successModal = document.getElementById("myphrase-success-modal");
const successMessage = document.getElementById("myphrase-success-message");
let successTimerId = null;

let myphrases = [];

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

openModalButton.addEventListener("click", openModal);
closeModalButton.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

function renderList() {
  listEl.textContent = "";

  if (!myphrases.length) {
    const empty = document.createElement("div");
    empty.className = "myphrase-row myphrase-empty";
    empty.textContent = "まだ登録されていません。";
    listEl.appendChild(empty);
    return;
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
    questionNumEl.textContent = data.question_num
      ? `現在の出題数: ${data.question_num}`
      : "";
    renderList();
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "取得に失敗しました。";
    setStatus(statusEl, { type: "error", message });
  }
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
      openSuccessModal(res.msg || "削除しました。");
      await loadMyphrases();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "削除に失敗しました。";
      setStatus(statusEl, { type: "error", message });
    }
  });
}

init();
