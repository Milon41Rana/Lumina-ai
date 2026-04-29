import { openDB, IDBPDatabase } from 'idb';
import { Message, GeneratedFile, UserProfile } from '../types';

const DB_NAME = 'lumina_studio_v4';
const STORE_NAME = 'state';

export interface AppState {
  messages: Message[];
  generatedFiles: GeneratedFile[];
  userProfile: UserProfile | null;
  lastUpdated: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
};

export const dbService = {
  async saveState(state: Partial<AppState>) {
    const db = await getDB();
    const existing = await this.loadState();
    const updated = { 
      ...existing, 
      ...state, 
      lastUpdated: Date.now() 
    } as AppState;
    
    await db.put(STORE_NAME, updated, 'app_state');
    return updated;
  },

  async loadState(): Promise<AppState> {
    const db = await getDB();
    const state = await db.get(STORE_NAME, 'app_state');
    return state || {
      messages: [{ role: 'model', content: 'Architect instance ready. Describe the production system you want to build.' }],
      generatedFiles: [{ name: 'index.html', content: '<!DOCTYPE html>\n<html><body class="bg-gray-100 flex items-center justify-center h-screen"><h1>Genesis Node Active</h1></body></html>' }],
      userProfile: null,
      lastUpdated: Date.now()
    };
  },

  async clearState() {
    const db = await getDB();
    await db.clear(STORE_NAME);
  }
};
