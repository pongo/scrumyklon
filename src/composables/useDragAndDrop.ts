import type { useBoardStore } from "@/stores/board";
import type { TaskRecord } from "@/db/db";

export function useDragAndDrop(boardStore: ReturnType<typeof useBoardStore>) {
  /** Called after a drag ends — persist the new order to DB */
  async function handleSortEnd(
    taskId: string,
    newStoryId: string,
    newColumn: TaskRecord["column"],
    insertIndex: number,
  ) {
    await boardStore.moveTask(taskId, newStoryId, newColumn, insertIndex);
  }

  return {
    handleSortEnd,
  };
}
