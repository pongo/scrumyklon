<script setup lang="ts">
import { ref } from "vue";
import { useBoardStore } from "@/stores/board";
import { generatePastelColor } from "@/utils/pastelColor";
import TaskDialog from "@/components/TaskDialog.vue";
import { User, X } from "@lucide/vue";
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
</script>

<template>
  <div
    class="group relative flex h-32 w-35 cursor-default flex-col justify-between overflow-hidden rounded-sm border border-gray-200 px-2 py-2 text-center shadow-sm select-none"
    :style="{ backgroundColor: task.assignee ? generatePastelColor(task.assignee) : '#fff' }"
    :data-task-id="task.id"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @dblclick="startEdit"
  >
    <!-- Delete button on hover -->
    <button
      v-show="isHovered"
      @click.stop="handleDelete"
      class="absolute top-0.5 right-0.5 rounded p-0.5 text-gray-400 hover:text-red-500"
      title="Delete"
    >
      <X class="h-3.5 w-3.5" />
    </button>

    <!-- Task Title -->
    <p
      class="line-clamp-6 text-xs font-medium whitespace-pre-wrap text-gray-800"
      :class="[task.assignee ? 'mb-3.5' : '']"
    >
      {{ task.title }}
    </p>

    <!-- Assignee -->
    <div
      v-if="task.assignee"
      class="absolute bottom-0.5 left-0.5 flex items-center gap-0.5 self-start text-xs text-gray-600"
    >
      <User class="h-2.5 w-2.5" />
      <span class="truncate">{{ task.assignee }}</span>
    </div>

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
