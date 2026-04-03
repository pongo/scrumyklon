<script setup lang="ts">
import { useBoardStore } from "@/stores/board";
import TaskDialog from "@/components/TaskDialog.vue";
import { Plus, X } from "@lucide/vue";
import { ref } from "vue";
import type { StoryRecord } from "@/db/db";

const props = defineProps<{ story: StoryRecord }>();

const boardStore = useBoardStore();
const showAddTask = ref(false);
const isEditing = ref(false);
const editTitle = ref("");

function handleDelete() {
  if (confirm("Delete this story and all its tasks?")) {
    boardStore.deleteStory(props.story.id);
  }
}

function startEdit() {
  editTitle.value = props.story.title;
  isEditing.value = true;
}

function saveEdit() {
  const trimmed = editTitle.value.trim();
  if (trimmed) {
    boardStore.updateStoryTitle(props.story.id, trimmed);
  }
  isEditing.value = false;
}

function handleEditKeydown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    saveEdit();
  } else if (e.key === "Escape") {
    isEditing.value = false;
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
    class="group relative rounded bg-white p-2 shadow-sm dark:bg-gray-700"
    draggable="true"
    @dragstart.stop
  >
    <!-- Delete button on hover -->
    <button
      @click="handleDelete"
      class="absolute right-1 top-1 hidden rounded p-0.5 text-gray-400 hover:text-red-500 group-hover:block"
    >
      <X class="h-3.5 w-3.5" />
    </button>

    <!-- Story Title -->
    <div v-if="isEditing">
      <input
        v-model="editTitle"
        @keydown="handleEditKeydown"
        @blur="saveEdit"
        type="text"
        class="w-full rounded border border-gray-300 px-1.5 py-0.5 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100"
        autofocus
      />
    </div>
    <div
      v-else
      @dblclick="startEdit"
      class="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-200"
    >
      {{ story.title }}
    </div>

    <!-- Add Task Button -->
    <button
      @click="openAddTask"
      class="mt-1 flex items-center gap-0.5 rounded px-1 text-xs text-gray-500 transition-colors hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
    >
      <Plus class="h-3 w-3" />
      <span>Add task</span>
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
