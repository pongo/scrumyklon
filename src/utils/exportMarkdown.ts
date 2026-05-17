import type { BoardRecord, TaskRecord } from "@/db/db";
import * as storiesApi from "@/db/stories";
import * as tasksApi from "@/db/tasks";
import { TASK_COLUMNS, TASK_COLUMN_LABELS } from "@/constants/taskColumns";

export async function exportBoardToMarkdown(board: BoardRecord): Promise<string> {
  const stories = await storiesApi.getStoriesByBoard(board.id);
  const storyTasksMap: Record<string, TaskRecord[]> = {};

  await Promise.all(
    stories.map(async (story) => {
      storyTasksMap[story.id] = await tasksApi.getTasksByStory(story.id);
    }),
  );

  const lines: string[] = [];
  lines.push(`# ${board.title}`);
  lines.push("");
  lines.push(`${window.location.origin}/${board.slug}`);

  for (const story of stories) {
    lines.push("");
    lines.push(`## ${story.title}`);

    const storyTasks = storyTasksMap[story.id] ?? [];

    for (const col of TASK_COLUMNS) {
      lines.push("");
      lines.push(`### ${TASK_COLUMN_LABELS[col]}`);

      const colTasks = storyTasks.filter((t) => t.column === col).sort((a, b) => a.order - b.order);

      if (colTasks.length > 0) {
        lines.push("");
      }

      for (const task of colTasks) {
        const assignee = task.assignee ? `@${task.assignee}` : "";
        lines.push(`\n${toMarkdownQuote(`${assignee} ${task.title}`)}`);
      }
    }
  }

  return lines.join("\n") + "\n";
}

const reEOL = /\r?\n/;

function toMarkdownQuote(text: string): string {
  return text
    .split(reEOL)
    .map((line) => `> ${line}`)
    .join("\n");
}
