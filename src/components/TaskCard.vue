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
    class="group relative rounded-sm border border-gray-200 px-3 py-2 shadow-sm transition-shadow hover:shadow-md dark:border-gray-600"
    :style="{ backgroundColor: task.assignee ? generatePastelColor(task.assignee) : undefined }"
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
    <p class="pr-5 text-sm font-medium text-gray-800 dark:text-gray-100">
      {{ task.title }}
    </p>

    <!-- Assignee -->
    <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
      {{ task.assignee || "UNASSIGNED" }}
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
