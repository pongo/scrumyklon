<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useBoardStore } from "@/stores/board";
import StoryCard from "@/components/StoryCard.vue";
import TaskCard from "@/components/TaskCard.vue";
import { Check, X } from "@lucide/vue";
import type { TaskRecord } from "@/db/db";

const props = defineProps<{ boardId: string }>();

const boardStore = useBoardStore();

const isAddingStory = ref(false);
const newStoryTitle = ref("");
const dragOverCell = ref<string | null>(null); // key: "storyId:column"

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
function startAddStory() {
  isAddingStory.value = true;
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
    <header class="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
      <h1 class="text-xl font-semibold text-gray-800 dark:text-gray-100">
        {{ boardStore.currentBoard.title }}
      </h1>
    </header>

    <!-- Board Table -->
    <div class="flex flex-1 overflow-auto">
      <!-- Header Row -->
      <div class="w-full">
        <!-- Column Headers -->
        <div class="sticky top-0 z-10 grid grid-cols-[200px_repeat(4,1fr)] border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div class="border-r border-gray-200 px-3 py-3 text-center text-sm font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-700 dark:text-gray-500">
            Stories
          </div>
          <div
            v-for="col in columns"
            :key="col"
            class="border-r border-gray-200 px-3 py-3 text-center text-sm font-semibold text-gray-400 dark:border-gray-700 dark:text-gray-500 last:border-r-0"
          >
            {{ columnLabels[col] }}
          </div>
        </div>

        <!-- Story Rows -->
        <div
          v-for="story in boardStore.stories"
          :key="story.id"
          class="grid grid-cols-[200px_repeat(4,1fr)] border-b border-gray-200 dark:border-gray-700"
        >
          <!-- Story Cell -->
          <div class="border-r border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
            <StoryCard :story="story" />
          </div>

          <!-- Task Cells -->
          <div
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
            <div class="flex flex-wrap gap-1">
              <TaskCard
                v-for="task in getTasks(story.id, col)"
                :key="task.id"
                :task="task"
                @dragover.prevent
                @dragenter.stop="handleDragEnter($event, cellKey(story.id, col))"
                @drop.stop.prevent="handleDrop($event, story.id, col)"
              />
            </div>
          </div>
        </div>

        <!-- New Story Row -->
        <div class="grid grid-cols-[200px_repeat(4,1fr)] border-b border-gray-200 dark:border-gray-700">
          <div class="border-r border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
            <div v-if="isAddingStory" class="flex flex-col gap-1">
              <input
                v-model="newStoryTitle"
                type="text"
                class="w-full rounded-sm border border-blue-400 px-2 py-1.5 text-sm outline-none dark:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                autofocus
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
              class="w-full text-left text-sm text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              New Story
            </button>
          </div>
          <!-- Empty cells for task columns -->
          <div
            v-for="col in columns"
            :key="col"
            class="border-r border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900 last:border-r-0"
          />
        </div>
      </div>
    </div>
  </div>

  <div v-else class="flex min-h-screen items-center justify-center">
    <p class="text-gray-500">Board not found</p>
  </div>
</template>
