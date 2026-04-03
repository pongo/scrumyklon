<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useBoardStore } from "@/stores/board";
import BoardTable from "@/components/BoardTable.vue";
import TaskDialog from "@/components/TaskDialog.vue";
import { useBoardTitle } from "@/composables/useBoardTitle";
import { useStoryManagement } from "@/composables/useStoryManagement";
import type { TaskRecord } from "@/db/db";

const props = defineProps<{ boardId: string }>();

const boardStore = useBoardStore();

const {
  isEditingTitle,
  titleInput,
  titleInputRef,
  startEditing: startEditingTitle,
  saveTitle,
  handleKeydown: handleTitleKeydown,
} = useBoardTitle(boardStore);

const { isAddingStory, newStoryTitle, startAddStory, addStory, cancelAddStory } =
  useStoryManagement(boardStore);

const addTaskStoryId = ref<string | null>(null);

function openAddTask(storyId: string) {
  addTaskStoryId.value = storyId;
}

function closeAddTask() {
  addTaskStoryId.value = null;
}

function getTasks(storyId: string, column: TaskRecord["column"]) {
  return boardStore.getTasksForStory(storyId, column);
}

async function handleStoryTitleUpdate(id: string, title: string) {
  await boardStore.updateStoryTitle(id, title);
}

async function handleStoryDelete(id: string) {
  await boardStore.deleteStory(id);
}

onMounted(async () => {
  await boardStore.loadBoard(props.boardId);
});
</script>

<template>
  <div v-if="boardStore.loading" class="flex min-h-screen items-center justify-center"></div>

  <div
    v-else-if="boardStore.currentBoard"
    class="flex h-screen flex-col overflow-hidden bg-gray-50 dark:bg-gray-900"
  >
    <!-- Board Header -->
    <header
      class="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800"
    >
      <div v-if="isEditingTitle">
        <input
          ref="titleInputRef"
          v-model="titleInput"
          @blur="saveTitle"
          @keyup.enter="($event.target as HTMLInputElement).blur()"
          @keydown="handleTitleKeydown"
          type="text"
          class="rounded border border-gray-300 px-2 py-1 text-lg font-semibold outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 field-sizing-content min-w-10"
          autofocus
        />
      </div>
      <h1 v-else class="text-xl font-semibold text-gray-800 dark:text-gray-100">
        <span @dblclick="startEditingTitle" title="Double click to edit">{{
          boardStore.currentBoard.title
        }}</span>
      </h1>
    </header>

    <!-- Board Table -->
    <BoardTable
      v-model:new-story-title="newStoryTitle"
      :stories="boardStore.stories"
      :is-adding-story="isAddingStory"
      :get-tasks="getTasks"
      @add-task="openAddTask"
      @start-add-story="startAddStory"
      @add-story="addStory"
      @cancel-add-story="cancelAddStory"
      @story-title-update="handleStoryTitleUpdate"
      @story-delete="handleStoryDelete"
    />
  </div>

  <div v-else class="flex min-h-screen items-center justify-center">
    <p class="text-gray-500">Board not found</p>
  </div>

  <!-- Add Task Dialog -->
  <TaskDialog
    v-if="addTaskStoryId"
    :story-id="addTaskStoryId"
    mode="create"
    @close="closeAddTask"
  />
</template>
