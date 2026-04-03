import { getDB } from "./db";
import type { TaskRecord } from "./db";

type TaskColumn = TaskRecord["column"];

export async function getTasksByStory(
  storyId: string,
  column?: TaskColumn,
): Promise<TaskRecord[]> {
  const db = await getDB();
  if (column) {
    return db.getAllFromIndex("tasks", "by-story-column", [storyId, column]);
  }
  const all = await db.getAllFromIndex("tasks", "by-story", storyId);
  return all.sort((a, b) => a.order - b.order);
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
  newOrder?: number,
): Promise<void> {
  const db = await getDB();
  const task = await db.get("tasks", taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  const oldStoryId = task.storyId;
  const oldColumn = task.column;

  // Get tasks in both old and target locations
  const [oldTasks, targetTasks] = await Promise.all([
    getTasksByStory(oldStoryId, oldColumn),
    getTasksByStory(newStoryId, newColumn),
  ]);

  if (newOrder === undefined) {
    // Append to end
    task.order = targetTasks.length;
  } else {
    task.order = newOrder;
    // Shift other tasks in target
    for (const t of targetTasks) {
      if (t.id !== taskId && t.order >= newOrder) {
        t.order += 1;
      }
    }
  }

  // Decrease order for tasks in old location
  for (const t of oldTasks) {
    if (t.id !== taskId && t.order > task.order) {
      t.order -= 1;
    }
  }

  task.storyId = newStoryId;
  task.column = newColumn;

  // Save all changes in a single transaction
  const tx = db.transaction("tasks", "readwrite");
  await tx.objectStore("tasks").put(task);
  const allToUpdate = [
    ...oldTasks.filter((t) => t.id !== taskId),
    ...targetTasks.filter((t) => t.id !== taskId),
  ];
  for (const t of allToUpdate) {
    await tx.objectStore("tasks").put(t);
  }
  await tx.done;
}
