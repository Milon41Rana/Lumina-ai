import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'lumina_studio_db';
const STORE_NAME = 'sessions';
const VERSION = 1;

export async function initDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function saveSession(id: string, data: any) {
  const db = await initDB();
  return db.put(STORE_NAME, data, id);
}

export async function loadSession(id: string) {
  const db = await initDB();
  return db.get(STORE_NAME, id);
}
