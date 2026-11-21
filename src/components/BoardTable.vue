<script setup lang="ts">
import { useBoardStore } from "@/stores/board";
import StoryCard from "@/components/StoryCard.vue";
import StoryForm from "@/components/StoryForm.vue";
import TaskCell from "@/components/TaskCell.vue";
import { useDragAndDrop } from "@/composables/useDragAndDrop";
import { Plus, Trash2 } from "@lucide/vue";
import { TASK_COLUMNS, TASK_COLUMN_LABELS } from "@/constants/taskColumns";

defineProps<{
  isAddingStory: boolean;
}>();

const emit = defineEmits<{
  addTask: [storyId: string];
  startAddStory: [];
  addStory: [title: string];
  cancelAddStory: [];
  storyTitleUpdate: [id: string, title: string];
  storyDelete: [id: string];
}>();

const newStoryTitle = defineModel<string>("newStoryTitle", { default: "" });

const columnLabels = TASK_COLUMN_LABELS;
const columns = TASK_COLUMNS;

const boardStore = useBoardStore();
const drag = useDragAndDrop();
const { stories, saving, error } = drag;

async function clearDoneColumn() {
  if (!confirm("Delete all done tasks?")) return;
  await boardStore.deleteAllDoneTasks();
}
</script>

<template>
  <div class="flex-1 overflow-auto">
    <p v-if="error" role="alert" class="bg-red-50 px-3 py-2 text-sm text-red-800">
      {{ error }}
    </p>
    <table class="w-full table-fixed" style="border-collapse: separate; border-spacing: 0">
      <colgroup>
        <col class="w-50" />
        <col class="w-10" />
        <col v-for="col in columns" :key="col" class="min-w-40" />
      </colgroup>

      <!-- Header -->
      <thead>
        <tr class="bg-white">
          <th
            class="border-r border-b border-gray-200 bg-white px-3 py-3 text-center text-sm font-semibold tracking-wide text-gray-400 uppercase"
          >
            Stories
          </th>
          <th class="border-r border-b border-gray-200 bg-white" />
          <th
            v-for="col in columns"
            :key="col"
            class="relative border-r border-b border-gray-200 bg-white px-3 py-3 text-center text-sm font-semibold text-gray-400 last:border-r-0"
          >
            {{ columnLabels[col] }}
            <button
              v-if="col === 'DONE'"
              class="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-500"
              title="Delete all done tasks"
              @click="clearDoneColumn"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </th>
        </tr>
      </thead>

      <!-- Story Rows -->
      <tbody>
        <tr v-for="story in stories" :key="story.id">
          <!-- Story Cell -->
          <td class="border-r border-b border-gray-200 bg-white p-0 align-top" style="height: 1px">
            <div class="h-full">
              <StoryCard
                :story="story"
                @title-update="(id, title) => emit('storyTitleUpdate', id, title)"
                @delete="(id) => emit('storyDelete', id)"
              />
            </div>
          </td>

          <!-- Add Task Button Cell -->
          <td
            class="border-r border-b border-gray-200 bg-white p-2"
            @click="emit('addTask', story.id)"
          >
            <button
              class="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="Add Task"
            >
              <Plus class="h-4 w-4" />
            </button>
          </td>

          <!-- Task Cells -->
          <td
            v-for="col in columns"
            :key="col"
            class="relative border-r border-b border-gray-200 bg-gray-50 p-2 align-top last:border-r-0"
            :data-column="col"
            style="height: 1px"
          >
            <div class="flex h-full flex-col">
              <TaskCell
                :story-id="story.id"
                :column="col"
                :tasks="drag.tasksInCell(story.id, col)"
                :disabled="saving"
                :on-move="drag.move"
                @start="drag.start"
                @change="drag.change"
                @end="drag.end"
              />
            </div>
          </td>
        </tr>
      </tbody>

      <!-- New Story Row -->
      <tfoot>
        <tr>
          <td class="border-r border-b border-gray-200 bg-white">
            <StoryForm
              v-if="isAddingStory"
              :initial-title="newStoryTitle"
              @submit="(title) => emit('addStory', title)"
              @cancel="emit('cancelAddStory')"
            />
            <button
              v-else
              @click="emit('startAddStory')"
              class="skip-ink-none flex w-full items-center justify-center py-4 text-sm text-gray-400 underline hover:text-gray-600"
            >
              New Story
            </button>
          </td>
          <td class="border-r border-b border-gray-200 bg-white" />
          <td
            v-for="col in columns"
            :key="col"
            class="border-r border-b border-gray-200 bg-gray-50 last:border-r-0"
          />
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<style scoped>
@reference "../style.css";

thead th {
  position: sticky;
  top: 0;
  z-index: 10;
}

tbody td,
tfoot td {
  position: relative;
  z-index: 1;
}

/* firefox */
@-moz-document url-prefix() {
  tbody > tr {
    height: 1px;
  }
  tbody > tr > td[data-column] {
    height: 100% !important;
  }
}
</style>
