import { ref } from "vue";
import type { useBoardStore } from "@/stores/board";
import type { TaskRecord } from "@/db/db";

export function useDragAndDrop(boardStore: ReturnType<typeof useBoardStore>) {
  const dragOverCell = ref<string | null>(null); // key: "storyId:column"

  function cellKey(storyId: string, column: TaskRecord["column"]) {
    return `${storyId}:${column}`;
  }

  async function handleDrop(
    e: DragEvent,
    storyId: string,
    column: TaskRecord["column"],
  ) {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer?.getData("text/plain");
    if (!taskId) return;
    await boardStore.moveTask(taskId, storyId, column);
    dragOverCell.value = null;
  }

  function handleDragEnter(e: DragEvent, key: string) {
    e.stopPropagation();
    dragOverCell.value = key;
  }

  return {
    dragOverCell,
    cellKey,
    handleDrop,
    handleDragEnter,
  };
}
