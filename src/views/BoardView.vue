<script setup lang="ts">
import { onMounted, ref, nextTick } from "vue";
import { useBoardStore } from "@/stores/board";
import StoryCard from "@/components/StoryCard.vue";
import TaskCard from "@/components/TaskCard.vue";
import TaskDialog from "@/components/TaskDialog.vue";
import { Check, Plus, X } from "@lucide/vue";
import type { TaskRecord } from "@/db/db";

const props = defineProps<{ boardId: string }>();

const boardStore = useBoardStore();

const isEditingTitle = ref(false);
const titleInput = ref("");
const titleInputRef = ref<HTMLInputElement | null>(null);
const isAddingStory = ref(false);
const newStoryTitle = ref("");
const dragOverCell = ref<string | null>(null); // key: "storyId:column"
const addTaskStoryId = ref<string | null>(null);
const storyInputRef = ref<HTMLInputElement | null>(null);

function startEditingTitle() {
  titleInput.value = boardStore.currentBoard?.title ?? "";
  isEditingTitle.value = true;
  nextTick(() => {
    titleInputRef.value?.focus();
  });
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

function openAddTask(storyId: string) {
  addTaskStoryId.value = storyId;
}

function closeAddTask() {
  addTaskStoryId.value = null;
}

const columnLabels: Record<TaskRecord["column"], string> = {
  TO_DO: "To Do",
  IN_PROGRESS: "In Progress",
  VERIFY: "Verify",
  DONE: "Done",
};

const columns: TaskRecord["column"][] = ["TO_DO", "IN_PROGRESS", "VERIFY", "DONE"];

onMounted(async () => {
  await boardStore.loadBoard(props.boardId);
});

function getTasks(storyId: string, column: TaskRecord["column"]) {
  return boardStore.getTasksForStory(storyId, column);
}

function cellKey(storyId: string, column: TaskRecord["column"]) {
  return `${storyId}:${column}`;
}

// Story input
async function startAddStory() {
  isAddingStory.value = true;
  await nextTick();
  storyInputRef.value?.focus();
}

async function addStory() {
  const trimmed = newStoryTitle.value.trim();
  if (trimmed) {
    await boardStore.createStory(trimmed);
  }
  newStoryTitle.value = "";
  isAddingStory.value = false;
}

function cancelAddStory() {
  isAddingStory.value = false;
  newStoryTitle.value = "";
}

// Drag & Drop
async function handleDrop(e: DragEvent, storyId: string, column: TaskRecord["column"]) {
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
    <header
      class="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800"
    >
      <div v-if="isEditingTitle">
        <input
          ref="titleInputRef"
          v-model="titleInput"
          @blur="saveTitle"
          @keydown="handleTitleKeydown"
          type="text"
          class="rounded border border-gray-300 px-2 py-1 text-lg font-semibold outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 field-sizing-content min-w-10"
          autofocus
        />
      </div>
      <h1
        v-else
        class="text-xl font-semibold text-gray-800 hover:text-gray-600 dark:text-gray-100 dark:hover:text-gray-300"
      >
        <span @dblclick="startEditingTitle" title="Double click to edit">{{
          boardStore.currentBoard.title
        }}</span>
      </h1>
    </header>

    <!-- Board Table -->
    <div class="flex-1 overflow-auto">
      <table class="border-collapse bg-white dark:bg-gray-800 w-full">
        <colgroup>
          <col class="w-50" />
          <col class="w-10" />
          <col v-for="col in columns" :key="col" class="min-w-40" />
        </colgroup>

        <!-- Header -->
        <thead>
          <tr
            class="sticky top-0 z-10 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
          >
            <th
              class="border-r border-gray-200 px-3 py-3 text-center text-sm font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-700 dark:text-gray-500"
            >
              Stories
            </th>
            <th class="border-r border-gray-200 dark:border-gray-700" />
            <th
              v-for="col in columns"
              :key="col"
              class="border-r border-gray-200 px-3 py-3 text-center text-sm font-semibold text-gray-400 dark:border-gray-700 dark:text-gray-500 last:border-r-0"
            >
              {{ columnLabels[col] }}
            </th>
          </tr>
        </thead>

        <!-- Story Rows -->
        <tbody>
          <tr
            v-for="story in boardStore.stories"
            :key="story.id"
            class="border-b border-gray-200 dark:border-gray-700"
          >
            <!-- Story Cell -->
            <td
              class="border-r border-gray-200 bg-white p-0 align-top dark:border-gray-700 dark:bg-gray-800"
              style="height: 1px"
            >
              <div class="h-full">
                <StoryCard :story="story" />
              </div>
            </td>

            <!-- Add Task Button Cell -->
            <td
              class="border-r border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800"
              @click="openAddTask(story.id)"
            >
              <button
                class="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                title="Add Task"
              >
                <Plus class="h-4 w-4" />
              </button>
            </td>

            <!-- Task Cells -->
            <td
              v-for="col in columns"
              :key="col"
              class="relative border-r border-gray-200 bg-gray-50 p-2 transition-colors dark:border-gray-700 dark:bg-gray-900 last:border-r-0"
              :class="dragOverCell === cellKey(story.id, col) ? 'bg-gray-200 dark:bg-gray-700' : ''"
              :data-story-id="story.id"
              :data-column="col"
              @dragover.prevent
              @dragenter="handleDragEnter($event, cellKey(story.id, col))"
              @drop="handleDrop($event, story.id, col)"
            >
              <div class="flex flex-wrap gap-2">
                <TaskCard
                  v-for="task in getTasks(story.id, col)"
                  :key="task.id"
                  :task="task"
                  @dragover.prevent
                  @dragenter.stop="handleDragEnter($event, cellKey(story.id, col))"
                  @drop.stop.prevent="handleDrop($event, story.id, col)"
                />
              </div>
            </td>
          </tr>
        </tbody>

        <!-- New Story Row -->
        <tfoot>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <td class="border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <div v-if="isAddingStory" class="flex flex-col gap-1 p-2">
                <input
                  ref="storyInputRef"
                  v-model="newStoryTitle"
                  type="text"
                  class="w-full rounded-sm border border-blue-400 px-2 py-1.5 text-sm outline-none dark:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
                <div class="flex gap-1">
                  <button
                    @click="addStory"
                    class="flex flex-1 items-center justify-center rounded-sm bg-green-600 py-1 text-white hover:bg-green-700"
                  >
                    <Check class="h-4 w-4" />
                  </button>
                  <button
                    @click="cancelAddStory"
                    class="flex flex-1 items-center justify-center rounded-sm bg-gray-500 py-1 text-white hover:bg-gray-600"
                  >
                    <X class="h-4 w-4" />
                  </button>
                </div>
              </div>
              <button
                v-else
                @click="startAddStory"
                class="flex py-4 w-full items-center justify-center text-sm text-gray-400 underline hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 skip-ink-none"
              >
                New Story
              </button>
            </td>
            <td class="border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800" />
            <td
              v-for="col in columns"
              :key="col"
              class="border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 last:border-r-0"
            />
          </tr>
        </tfoot>
      </table>
    </div>
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
