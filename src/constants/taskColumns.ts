import type { TaskRecord } from "@/db/db";

export const TASK_COLUMNS = [
  "BACKLOG",
  "TO_DO",
  "IN_PROGRESS",
  "VERIFY",
  "DONE",
] as const satisfies readonly TaskRecord["column"][];

export const TASK_COLUMN_LABELS: Record<TaskRecord["column"], string> = {
  BACKLOG: "Backlog",
  TO_DO: "To Do",
  IN_PROGRESS: "In Progress",
  VERIFY: "Verify",
  DONE: "Done",
};
