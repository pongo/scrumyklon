<script setup lang="ts">
import { ref } from "vue";
import { useBoardStore } from "@/stores/board";
import { generatePastelColor } from "@/utils/pastelColor";
import TaskDialog from "@/components/TaskDialog.vue";
import { X } from "@lucide/vue";
import type { TaskRecord } from "@/db/db";

const props = defineProps<{ task: TaskRecord }>();

const boardStore = useBoardStore();
const isEditing = ref(false);
const isHovered = ref(false);

function handleDelete() {
  if (confirm("Delete this task?")) {
    boardStore.deleteTask(props.task.id);
  }
}

function startEdit() {
  isEditing.value = true;
}

function closeEdit() {
  isEditing.value = false;
}

function handleDragStart(e: DragEvent) {
  e.dataTransfer?.setData("text/plain", props.task.id);
  e.dataTransfer!.effectAllowed = "move";
}
</script>

<template>
  <div
    class="group relative rounded px-2 py-1.5 shadow-sm transition-shadow hover:shadow-md"
    :style="{ backgroundColor: task.assignee ? generatePastelColor(task.assignee) : '#ffffff' }"
    :class="task.assignee ? 'dark:bg-gray-700' : 'bg-white dark:bg-gray-700'"
    draggable="true"
    @dragstart="handleDragStart"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @dblclick="startEdit"
  >
    <!-- Delete button on hover -->
    <button
      v-show="isHovered"
      @click.stop="handleDelete"
      class="absolute right-1 top-1 rounded p-0.5 text-gray-400 hover:text-red-500"
    >
      <X class="h-3.5 w-3.5" />
    </button>

    <!-- Task Title -->
    <p class="pr-5 text-sm text-gray-700 dark:text-gray-200">
      {{ task.title }}
    </p>

    <!-- Assignee -->
    <p v-if="task.assignee" class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
      {{ task.assignee }}
    </p>

    <!-- Edit Dialog -->
    <TaskDialog
      v-if="isEditing"
      :story-id="task.storyId"
      mode="edit"
      :task="task"
      @close="closeEdit"
    />
  </div>
</template>
