const HISTORY_KEY = "kotobaroots.history.v1";

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

export function saveHistory(entries) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

export function addHistory(entry) {
  const entries = loadHistory();
  entries.unshift(entry);
  saveHistory(entries.slice(0, 100));
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
