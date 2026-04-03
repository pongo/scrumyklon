<script setup lang="ts">
import { useBoardStore } from "@/stores/board";
import TaskDialog from "@/components/TaskDialog.vue";
import { Plus, X } from "@lucide/vue";
import { ref } from "vue";
import type { StoryRecord } from "@/db/db";

const props = defineProps<{ story: StoryRecord }>();

const boardStore = useBoardStore();
const showAddTask = ref(false);

function handleDelete() {
  if (confirm("Delete this story and all its tasks?")) {
    boardStore.deleteStory(props.story.id);
  }
}

function openAddTask() {
  showAddTask.value = true;
}

function closeAddTask() {
  showAddTask.value = false;
}
</script>

<template>
  <div
    class="group relative flex items-center justify-between rounded-sm bg-gray-100 px-3 py-4 dark:bg-gray-700"
  >
    <!-- Delete button on hover -->
    <button
      @click.stop="handleDelete"
      class="absolute right-1 top-1 hidden rounded p-0.5 text-gray-400 hover:text-red-500 group-hover:block"
    >
      <X class="h-3.5 w-3.5" />
    </button>

    <!-- Story Title -->
    <span class="text-center text-sm font-medium text-gray-700 dark:text-gray-200">
      {{ story.title }}
    </span>

    <!-- Add Task Button -->
    <button
      @click.stop="openAddTask"
      class="ml-2 rounded-sm text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-600 dark:hover:text-gray-300"
    >
      <Plus class="h-4 w-4" />
    </button>

    <!-- Task Dialog -->
    <TaskDialog
      v-if="showAddTask"
      :story-id="story.id"
      mode="create"
      @close="closeAddTask"
    />
  </div>
</template>
