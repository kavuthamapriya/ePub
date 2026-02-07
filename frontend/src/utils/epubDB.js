import { openDB } from "idb";

const DB_NAME = "EPUB_STORAGE_DB";
const STORE = "epubs";

async function initDB() {
  return openDB(DB_NAME, 2, {
    upgrade(db) {
      // Always create store if missing
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    },
  });
}

export async function saveEPUB(id, file) {
  const db = await initDB();
  await db.put(STORE, { id, file });
}

export async function loadEPUB(id) {
  const db = await initDB();
  const item = await db.get(STORE, id);
  return item?.file || null;
}

export async function loadAllEPUBs() {
  const db = await initDB();
  return await db.getAll(STORE);
}
export async function deleteEPUB(id) {
  const db = await initDB();
  await db.delete(STORE, id);
}
