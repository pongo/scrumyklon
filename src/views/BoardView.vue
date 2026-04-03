<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useBoardStore } from "@/stores/board";
import StoryColumn from "@/components/StoryColumn.vue";
import TaskColumn from "@/components/TaskColumn.vue";

const props = defineProps<{ boardId: string }>();

const boardStore = useBoardStore();
const isEditingTitle = ref(false);
const titleInput = ref("");

onMounted(async () => {
  await boardStore.loadBoard(props.boardId);
});

function startEditingTitle() {
  titleInput.value = boardStore.currentBoard?.title ?? "";
  isEditingTitle.value = true;
}

function saveTitle() {
  const trimmed = titleInput.value.trim();
  if (trimmed) {
    boardStore.updateBoardTitle(trimmed);
  }
  isEditingTitle.value = false;
}

function handleTitleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    saveTitle();
  } else if (e.key === "Escape") {
    isEditingTitle.value = false;
  }
}
</script>

<template>
  <div v-if="boardStore.loading" class="flex min-h-screen items-center justify-center">
    <p class="text-gray-500">Loading board...</p>
  </div>

  <div
    v-else-if="boardStore.currentBoard"
    class="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900"
  >
    <!-- Board Header -->
    <header class="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
      <div v-if="isEditingTitle">
        <input
          v-model="titleInput"
          @blur="saveTitle"
          @keydown="handleTitleKeydown"
          type="text"
          class="rounded border border-gray-300 px-2 py-1 text-lg font-semibold outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          autofocus
        />
      </div>
      <h1
        v-else
        @dblclick="startEditingTitle"
        class="cursor-pointer text-xl font-semibold text-gray-800 hover:text-gray-600 dark:text-gray-100 dark:hover:text-gray-300"
      >
        {{ boardStore.currentBoard.title }}
      </h1>
    </header>

    <!-- Board Columns -->
    <div class="flex flex-1 gap-4 overflow-x-auto p-4">
      <!-- Stories Column -->
      <StoryColumn />

      <!-- Task Columns -->
      <TaskColumn
        v-for="column in boardStore.columns"
        :key="column"
        :column="column"
      />
    </div>
  </div>

  <div v-else class="flex min-h-screen items-center justify-center">
    <p class="text-gray-500">Board not found</p>
  </div>
</template>
