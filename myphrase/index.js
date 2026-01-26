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
const testStartModal = document.getElementById("myphrase-test-start-modal");
const testStartStatus = document.getElementById("myphrase-test-start-status");
const testStartForm = document.getElementById("myphrase-test-start-form");
const testStartSelect = document.getElementById("myphrase-test-count");
const closeTestStartButton = document.getElementById("close-test-start");
const deleteConfirmModal = document.getElementById("myphrase-delete-modal");
const deleteConfirmButton = document.getElementById("confirm-delete-myphrase");
const deleteCancelButton = document.getElementById("cancel-delete-myphrase");
let successTimerId = null;
let pendingDeleteIds = [];

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

function openTestStartModal() {
  if (!testStartModal || !testStartSelect) {
    return;
  }
  setStatus(testStartStatus, { message: "" });
  const selectedValue = String(myphraseQuestionNum || 10);
  if (testStartSelect.querySelector(`option[value="${selectedValue}"]`)) {
    testStartSelect.value = selectedValue;
  } else {
    testStartSelect.value = "10";
  }
  testStartModal.hidden = false;
  testStartSelect.focus();
}

function closeTestStartModal() {
  if (testStartModal) {
    testStartModal.hidden = true;
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
closeModalButton.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});
if (testButton) {
  testButton.addEventListener("click", openTestStartModal);
}
if (closeTestStartButton) {
  closeTestStartButton.addEventListener("click", closeTestStartModal);
}
if (testStartModal) {
  testStartModal.addEventListener("click", (event) => {
    if (event.target === testStartModal) {
      closeTestStartModal();
    }
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
    const message = error instanceof ApiError ? error.message : "削除に失敗しました。";
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

  if (testStartForm) {
    testStartForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!testStartSelect) {
        return;
      }
      const rawValue = testStartSelect.value;
      const count = Number(rawValue);
      if (!Number.isFinite(count) || count <= 0) {
        setStatus(testStartStatus, { type: "error", message: "出題数を選択してください。" });
        return;
      }
      closeTestStartModal();
      window.location.href = `./test.html?count=${count}`;
    });
  }

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
    openDeleteConfirmModal(selected);
  });

}

init();
