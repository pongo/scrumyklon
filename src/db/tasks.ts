import { getDB } from "./db";
import type { TaskRecord } from "./db";

type TaskColumn = TaskRecord["column"];

export async function getTasksByStory(
  storyId: string,
  column?: TaskColumn,
): Promise<TaskRecord[]> {
  const db = await getDB();
  let result: TaskRecord[];
  if (column) {
    result = await db.getAllFromIndex("tasks", "by-story-column", [storyId, column]);
  } else {
    result = await db.getAllFromIndex("tasks", "by-story", storyId);
  }
  return result.sort((a, b) => a.order - b.order);
}

export async function createTask(
  task: Omit<TaskRecord, "order">,
): Promise<string> {
  const db = await getDB();
  const existing = await getTasksByStory(task.storyId, task.column);
  const order =
    existing.length > 0 ? existing[existing.length - 1]!.order + 1 : 0;
  const record: TaskRecord = { ...task, order };
  await db.add("tasks", record);
  return record.id;
}

export async function updateTask(
  id: string,
  updates: Partial<Omit<TaskRecord, "id">>,
): Promise<void> {
  const db = await getDB();
  const task = await db.get("tasks", id);
  if (!task) throw new Error(`Task ${id} not found`);
  Object.assign(task, updates);
  await db.put("tasks", task);
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("tasks", id);
}

export async function moveTask(
  taskId: string,
  newStoryId: string,
  newColumn: TaskColumn,
): Promise<void> {
  const db = await getDB();
  const task = await db.get("tasks", taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  const oldStoryId = task.storyId;
  const oldColumn = task.column;
  const sameLocation = oldStoryId === newStoryId && oldColumn === newColumn;

  // Read ALL data BEFORE any writes
  const [oldLocationTasks, targetLocationTasks] = await Promise.all([
    getTasksByStory(oldStoryId, oldColumn),
    sameLocation ? Promise.resolve<TaskRecord[]>([]) : getTasksByStory(newStoryId, newColumn),
  ]);

  // Build target task list
  const targetTasks = sameLocation
    ? oldLocationTasks.filter((t) => t.id !== taskId)
    : targetLocationTasks;

  targetTasks.sort((a, b) => a.order - b.order);

  // Update task location and append
  task.storyId = newStoryId;
  task.column = newColumn;
  task.order = targetTasks.length;
  targetTasks.push(task);

  // Use idb's transaction pattern: open tx, do all puts in a Promise.all
  const tx = db.transaction("tasks", "readwrite");
  const store = tx.objectStore("tasks");

  const writePromises: Promise<string | void>[] = [];

  // Write target tasks
  for (const t of targetTasks) {
    writePromises.push(store.put(t));
  }

  // Fix old location if different
  if (!sameLocation) {
    oldLocationTasks.sort((a, b) => a.order - b.order);
    for (let i = 0; i < oldLocationTasks.length; i++) {
      if (oldLocationTasks[i]!.id !== taskId) {
        oldLocationTasks[i]!.order = i;
        writePromises.push(store.put(oldLocationTasks[i]!));
      }
    }
  }

  // Wait for all puts AND tx.done
  await Promise.all([...writePromises, tx.done]);
}
