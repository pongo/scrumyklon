<script setup lang="ts">
import { ref } from "vue";
import StoryCard from "@/components/StoryCard.vue";
import TaskCard from "@/components/TaskCard.vue";
import { Check, Plus, X } from "@lucide/vue";
import type { TaskRecord, StoryRecord } from "@/db/db";

const props = defineProps<{
  stories: StoryRecord[];
  isAddingStory: boolean;
  newStoryTitle: string;
  dragOverCell: string | null;
  getTasks: (storyId: string, column: TaskRecord["column"]) => TaskRecord[];
}>();

const emit = defineEmits<{
  addTask: [storyId: string];
  startAddStory: [];
  addStory: [];
  cancelAddStory: [];
  drop: [e: DragEvent, storyId: string, column: TaskRecord["column"]];
  dragEnter: [e: DragEvent, key: string];
  "update:newStoryTitle": [value: string];
}>();

const storyInputRef = ref<HTMLInputElement | null>(null);

function updateStoryTitle(value: string) {
  emit("update:newStoryTitle", value);
}

const columnLabels: Record<TaskRecord["column"], string> = {
  TO_DO: "To Do",
  IN_PROGRESS: "In Progress",
  VERIFY: "Verify",
  DONE: "Done",
};

const columns: TaskRecord["column"][] = ["TO_DO", "IN_PROGRESS", "VERIFY", "DONE"];

function cellKey(storyId: string, column: TaskRecord["column"]) {
  return `${storyId}:${column}`;
}
</script>

<template>
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
          v-for="story in stories"
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
            @click="emit('addTask', story.id)"
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
            @dragenter="emit('dragEnter', $event, cellKey(story.id, col))"
            @drop="emit('drop', $event, story.id, col)"
          >
            <div class="flex flex-wrap gap-2">
              <TaskCard
                v-for="task in props.getTasks(story.id, col)"
                :key="task.id"
                :task="task"
                @dragover.prevent
                @dragenter.stop="emit('dragEnter', $event, cellKey(story.id, col))"
                @drop.stop.prevent="emit('drop', $event, story.id, col)"
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
                :value="newStoryTitle"
                @input="updateStoryTitle(($event.target as HTMLInputElement).value)"
                type="text"
                class="w-full rounded-sm border border-blue-400 px-2 py-1.5 text-sm outline-none dark:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
              <div class="flex gap-1">
                <button
                  @click="emit('addStory')"
                  class="flex flex-1 items-center justify-center rounded-sm bg-green-600 py-1 text-white hover:bg-green-700"
                >
                  <Check class="h-4 w-4" />
                </button>
                <button
                  @click="emit('cancelAddStory')"
                  class="flex flex-1 items-center justify-center rounded-sm bg-gray-500 py-1 text-white hover:bg-gray-600"
                >
                  <X class="h-4 w-4" />
                </button>
              </div>
            </div>
            <button
              v-else
              @click="emit('startAddStory')"
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
</template>
