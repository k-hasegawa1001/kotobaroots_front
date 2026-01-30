import { apiFetch, getErrorMessage } from "../shared/api.js";
import { requireAuth } from "../shared/auth.js";
import { renderHeader, setStatus } from "../shared/ui.js";
import { validateMeaning, validatePhrase } from "../shared/validators.js";

const statusEl = document.getElementById("status");
const layoutEl = document.getElementById("myphrase-layout");
const listEl = document.getElementById("myphrase-list");
const tableEl = document.querySelector(".myphrase-table");
const actionsEl = document.getElementById("myphrase-actions");
const emptyStateEl = document.getElementById("myphrase-empty-state");
const emptyAddButton = document.getElementById("empty-add-button");
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
const testCountSelect = document.getElementById("myphrase-test-count");
const deleteConfirmModal = document.getElementById("myphrase-delete-modal");
const deleteConfirmButton = document.getElementById("confirm-delete-myphrase");
const deleteCancelButton = document.getElementById("cancel-delete-myphrase");
let successTimerId = null;
let pendingDeleteIds = [];

let myphrases = [];
let myphraseQuestionNum = 10;

function setEmptyState(isEmpty) {
  if (layoutEl) {
    layoutEl.classList.toggle("is-empty", isEmpty);
    layoutEl.classList.remove("is-loading");
  }
  if (tableEl) {
    tableEl.hidden = isEmpty;
    tableEl.classList.toggle("is-empty", isEmpty);
  }
  if (actionsEl) {
    actionsEl.hidden = isEmpty;
  }
  if (emptyStateEl) {
    emptyStateEl.hidden = !isEmpty;
  }
}

function openModal() {
  modal.hidden = false;
  setStatus(modalStatus, { message: "" });
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

function openDeleteConfirmModal(selectedIds) {
  if (!deleteConfirmModal) {
    return;
  }
  pendingDeleteIds = Array.isArray(selectedIds) ? selectedIds : [];
  deleteConfirmModal.hidden = false;
  if (deleteConfirmButton) {
    deleteConfirmButton.focus();
  }
}

function closeDeleteConfirmModal() {
  if (deleteConfirmModal) {
    deleteConfirmModal.hidden = true;
  }
  pendingDeleteIds = [];
}

openModalButton.addEventListener("click", openModal);
if (emptyAddButton) {
  emptyAddButton.addEventListener("click", openModal);
}
closeModalButton.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});
if (testButton) {
  testButton.addEventListener("click", () => {
    const rawValue = testCountSelect ? testCountSelect.value : "";
    const count = Number(rawValue);
    const resolved = Number.isFinite(count) && count > 0 ? count : 10;
    window.location.href = `./test.html?count=${resolved}`;
  });
}
if (deleteCancelButton) {
  deleteCancelButton.addEventListener("click", closeDeleteConfirmModal);
}
if (deleteConfirmModal) {
  deleteConfirmModal.addEventListener("click", (event) => {
    if (event.target === deleteConfirmModal) {
      closeDeleteConfirmModal();
    }
  });
}
if (deleteConfirmButton) {
  deleteConfirmButton.addEventListener("click", async () => {
    if (!pendingDeleteIds.length) {
      closeDeleteConfirmModal();
      return;
    }
    const deleteIds = pendingDeleteIds.slice();
    closeDeleteConfirmModal();
    await deleteMyphrases(deleteIds);
  });
}

function renderList() {
  listEl.textContent = "";

  if (!myphrases.length) {
    setEmptyState(true);
    return;
  }

  setEmptyState(false);
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
    if (questionNumEl) {
      questionNumEl.textContent = "";
      questionNumEl.hidden = true;
    }
    if (testCountSelect) {
      const preferred = String(myphraseQuestionNum || 10);
      if (testCountSelect.querySelector(`option[value="${preferred}"]`)) {
        testCountSelect.value = preferred;
      } else {
        testCountSelect.value = "10";
      }
    }
    renderList();
  } catch (error) {
    const message = getErrorMessage(error, "取得に失敗しました。");
    setStatus(statusEl, { type: "error", message });
    myphrases = [];
    renderList();
  }
}

async function deleteMyphrases(selected) {
  try {
    await apiFetch("/kotobaroots/myphrase", {
      method: "DELETE",
      data: { delete_ids: selected },
    });
    setStatus(statusEl, { message: "" });
    const deletedCount = Array.isArray(selected) ? selected.length : 0;
    const deletedLabel = deletedCount ? `${deletedCount}件 削除しました。` : "削除しました。";
    openSuccessModal(deletedLabel);
    await loadMyphrases();
  } catch (error) {
    const message = getErrorMessage(error, "削除に失敗しました。");
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

    const phraseError = validatePhrase(phrase);
    if (phraseError) {
      setStatus(modalStatus, { type: "error", message: phraseError });
      return;
    }

    const meaningError = validateMeaning(mean);
    if (meaningError) {
      setStatus(modalStatus, { type: "error", message: meaningError });
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
      const message = getErrorMessage(error, "追加に失敗しました。");
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
    openDeleteConfirmModal(selected);
  });

}

init();
