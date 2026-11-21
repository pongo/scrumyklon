import { getDB } from "./db";
import type { TaskRecord } from "./db";

type TaskColumn = TaskRecord["column"];

export type TaskCell = Pick<TaskRecord, "storyId" | "column">;
export type TaskMove = {
  taskId: string;
  source: TaskCell;
  target: TaskCell;
  beforeTaskId?: string;
};
type TaskPlacement = Pick<TaskRecord, "id" | "storyId" | "column" | "order">;

export async function getTasksByStory(storyId: string, column?: TaskColumn): Promise<TaskRecord[]> {
  const db = await getDB();
  let result: TaskRecord[];
  if (column) {
    result = await db.getAllFromIndex("tasks", "by-story-column", [storyId, column]);
  } else {
    result = await db.getAllFromIndex("tasks", "by-story", storyId);
  }
  return result.sort((a, b) => a.order - b.order);
}

export async function createTask(task: Omit<TaskRecord, "order">): Promise<string> {
  const db = await getDB();
  const tx = db.transaction("tasks", "readwrite");
  const existing = await tx.store.index("by-story-column").getAll([task.storyId, task.column]);
  const order = existing.reduce((next, record) => Math.max(next, record.order + 1), 0);
  await Promise.all([tx.store.add({ ...task, order }), tx.done]);
  return task.id;
}

export async function updateTask(
  id: string,
  updates: Partial<Omit<TaskRecord, "id">>,
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("tasks", "readwrite");
  const task = await tx.store.get(id);
  if (!task) throw new Error(`Task ${id} not found`);
  await Promise.all([tx.store.put({ ...task, ...updates }), tx.done]);
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("tasks", id);
}

export async function moveTask(
  boardId: string,
  { taskId, source, target, beforeTaskId }: TaskMove,
): Promise<TaskPlacement[]> {
  const db = await getDB();
  const tx = db.transaction(["stories", "tasks"], "readwrite");
  const stories = tx.objectStore("stories");
  const tasks = tx.objectStore("tasks");
  const index = tasks.index("by-story-column");
  const sameCell = source.storyId === target.storyId && source.column === target.column;
  const sourceStoryRequest = stories.get(source.storyId);
  const [sourceStory, targetStory, sourceTasks, otherTasks] = await Promise.all([
    sourceStoryRequest,
    source.storyId === target.storyId ? sourceStoryRequest : stories.get(target.storyId),
    index.getAll([source.storyId, source.column]),
    sameCell ? [] : index.getAll([target.storyId, target.column]),
  ]);

  const task = sourceTasks.find(({ id }) => id === taskId);
  if (!task || sourceStory?.boardId !== boardId || targetStory?.boardId !== boardId) {
    throw new Error("The source task or destination story has changed");
  }

  const remaining = sourceTasks.filter(({ id }) => id !== taskId).sort((a, b) => a.order - b.order);
  const destination = sameCell ? remaining : otherTasks.sort((a, b) => a.order - b.order);
  const position = beforeTaskId
    ? destination.findIndex(({ id }) => id === beforeTaskId)
    : destination.length;
  if (position < 0) throw new Error("The destination task has changed");
  destination.splice(position, 0, task);

  const placements: TaskPlacement[] = [];
  const writes: Promise<string>[] = [];
  const cells = sameCell
    ? [{ cell: target, records: destination }]
    : [
        { cell: source, records: remaining },
        { cell: target, records: destination },
      ];
  for (const { cell, records } of cells) {
    records.forEach((record, order) => {
      const placement = { id: record.id, ...cell, order };
      placements.push(placement);
      if (
        record.storyId !== cell.storyId ||
        record.column !== cell.column ||
        record.order !== order
      ) {
        writes.push(tasks.put({ ...record, ...placement }));
      }
    });
  }
  await Promise.all([...writes, tx.done]);
  return placements;
}

/**
 * Delete all tasks in the DONE column across all stories.
 */
export async function deleteAllDoneTasks(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction("tasks", "readwrite");
  const store = tx.objectStore("tasks");

  const allTasks = await store.getAll();
  const doneTaskIds = allTasks.filter((t) => t.column === "DONE").map((t) => t.id);

  await Promise.all([...doneTaskIds.map((id) => store.delete(id)), tx.done]);
}
