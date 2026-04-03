<script setup lang="ts">
import { useBoardStore } from "@/stores/board";
import TaskCard from "@/components/TaskCard.vue";
import type { TaskRecord } from "@/db/db";
import { computed, ref } from "vue";

const props = defineProps<{ column: TaskRecord["column"] }>();

const boardStore = useBoardStore();
const isDragOver = ref(false);
const dragOverStoryId = ref<string | null>(null);

const columnLabels: Record<TaskRecord["column"], string> = {
  TO_DO: "To Do",
  IN_PROGRESS: "In Progress",
  VERIFY: "Verify",
  DONE: "Done",
};

const tasksByStory = computed(() => {
  return boardStore.stories.map((story) => ({
    story,
    tasks: boardStore.getTasksForStory(story.id, props.column),
  }));
});

function handleDragOver(e: DragEvent) {
  e.preventDefault();
  e.dataTransfer!.dropEffect = "move";
  isDragOver.value = true;

  // Determine which story zone we're over
  const target = e.target as HTMLElement;
  const storyEl = target.closest("[data-story-id]");
  if (storyEl) {
    dragOverStoryId.value = storyEl.getAttribute("data-story-id");
  }
}

function handleDragLeave(e: DragEvent) {
  // Only set false if we actually left the column
  const relatedTarget = e.relatedTarget as HTMLElement;
  if (!relatedTarget || !(e.currentTarget as HTMLElement).contains(relatedTarget)) {
    isDragOver.value = false;
    dragOverStoryId.value = null;
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  isDragOver.value = false;

  const taskId = e.dataTransfer?.getData("text/plain");
  if (!taskId) return;

  // Determine target story from drop location
  const target = e.target as HTMLElement;
  const storyEl = target.closest("[data-story-id]");
  const storyId = storyEl?.getAttribute("data-story-id");

  if (storyId) {
    boardStore.moveTask(taskId, storyId, props.column);
  }

  dragOverStoryId.value = null;
}
</script>

<template>
  <div
    class="flex min-w-[280px] flex-col rounded-lg bg-gray-100 p-3 dark:bg-gray-800"
    :class="{ 'bg-blue-50 dark:bg-blue-900/20': isDragOver }"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <h2 class="mb-3 px-1 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {{ columnLabels[column] }}
    </h2>

    <div class="flex flex-col gap-2">
      <div
        v-for="{ story, tasks } in tasksByStory"
        :key="story.id"
        :data-story-id="story.id"
        class="flex flex-col gap-1 rounded p-1 transition-colors"
        :class="dragOverStoryId === story.id ? 'bg-blue-100 dark:bg-blue-900/30' : ''"
      >
        <!-- Story label for context -->
        <span class="mb-0.5 text-xs font-medium text-gray-400 dark:text-gray-500">
          {{ story.title }}
        </span>
        <TaskCard
          v-for="task in tasks"
          :key="task.id"
          :task="task"
        />
      </div>

      <!-- Drop zone when no tasks in a story -->
      <div
        v-if="tasksByStory.length === 0"
        class="flex h-16 items-center justify-center rounded border-2 border-dashed border-gray-300 text-xs text-gray-400 dark:border-gray-600"
      >
        Drop here
      </div>
    </div>
  </div>
</template>

