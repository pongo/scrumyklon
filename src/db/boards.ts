import { getDB } from "./db";
import type { BoardRecord } from "./db";

export async function getAllBoards(): Promise<BoardRecord[]> {
  const db = await getDB();
  return db.getAll("boards");
}

export async function getBoard(id: string): Promise<BoardRecord | undefined> {
  const db = await getDB();
  return db.get("boards", id);
}

export async function createBoard(
  board: Omit<BoardRecord, "createdAt">,
): Promise<string> {
  const db = await getDB();
  const record: BoardRecord = { ...board, createdAt: Date.now() };
  await db.add("boards", record);
  return record.id;
}

export async function updateBoard(
  id: string,
  updates: Partial<Omit<BoardRecord, "id" | "createdAt">>,
): Promise<void> {
  const db = await getDB();
  const board = await db.get("boards", id);
  if (!board) throw new Error(`Board ${id} not found`);
  Object.assign(board, updates);
  await db.put("boards", board);
}

export async function deleteBoard(id: string): Promise<void> {
  const db = await getDB();
  // Delete associated stories and tasks first
  const stories = await db.getAllFromIndex("stories", "by-board", id);
  const tx = db.transaction(["boards", "stories", "tasks"], "readwrite");
  for (const story of stories) {
    const tasks = await db.getAllFromIndex("tasks", "by-story", story.id);
    for (const task of tasks) {
      await tx.objectStore("tasks").delete(task.id);
    }
    await tx.objectStore("stories").delete(story.id);
  }
  await tx.objectStore("boards").delete(id);
  await tx.done;
}
