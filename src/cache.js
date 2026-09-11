const DB_NAME = "anil-random-atlas";
const DB_VERSION = 1;
const STORE = "files";
const SELECTED_KEY = "anil-atlas-selected";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function saveCachedFiles(entries) {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  const savedAt = Date.now();
  store.clear();
  for (const [key, value] of Object.entries(entries || {})) {
    if (!value?.text) continue;
    store.put({
      key,
      name: value.name || key,
      text: value.text,
      savedAt,
    });
  }
  await txDone(tx);
  return savedAt;
}

export async function loadCachedFiles() {
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const store = tx.objectStore(STORE);
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => {
      const out = {};
      for (const row of req.result || []) {
        if (row?.key && typeof row.text === "string") out[row.key] = row;
      }
      resolve(out);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function clearCachedFiles() {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).clear();
  await txDone(tx);
  localStorage.removeItem(SELECTED_KEY);
}

export function readSavedSelected() {
  try {
    return localStorage.getItem(SELECTED_KEY) || "";
  } catch {
    return "";
  }
}

export function writeSavedSelected(id) {
  try {
    if (id) localStorage.setItem(SELECTED_KEY, id);
    else localStorage.removeItem(SELECTED_KEY);
  } catch {
    /* quota / private mode */
  }
}

export function formatSavedAt(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleString("es-ES", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}
