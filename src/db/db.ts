import { type DBSchema, openDB } from "idb";

export interface BoardRecord {
  id: string;
  title: string;
  createdAt: number;
}

export interface StoryRecord {
  id: string;
  boardId: string;
  title: string;
  order: number;
}

export interface TaskRecord {
  id: string;
  storyId: string;
  column: "TO_DO" | "IN_PROGRESS" | "VERIFY" | "DONE";
  title: string;
  assignee: string;
  order: number;
}

export interface ScrumyklonDB extends DBSchema {
  boards: {
    key: string;
    value: BoardRecord;
  };
  stories: {
    key: string;
    value: StoryRecord;
    indexes: { "by-board": string };
  };
  tasks: {
    key: string;
    value: TaskRecord;
    indexes: { "by-story": string; "by-story-column": [string, string] };
  };
}

const DB_NAME = "scrumyklon2";
const DB_VERSION = 1;

export async function initDB() {
  return openDB<ScrumyklonDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Boards store
      if (!db.objectStoreNames.contains("boards")) {
        db.createObjectStore("boards", { keyPath: "id" });
      }

      // Stories store
      if (!db.objectStoreNames.contains("stories")) {
        const storyStore = db.createObjectStore("stories", { keyPath: "id" });
        storyStore.createIndex("by-board", "boardId");
      }

      // Tasks store
      if (!db.objectStoreNames.contains("tasks")) {
        const taskStore = db.createObjectStore("tasks", { keyPath: "id" });
        taskStore.createIndex("by-story", "storyId");
        taskStore.createIndex("by-story-column", ["storyId", "column"], {
          multiEntry: false,
        });
      }
    },
  });
}

// Helper to get DB instance (singleton)
let dbPromise: ReturnType<typeof initDB> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = initDB();
  }
  return dbPromise;
}
