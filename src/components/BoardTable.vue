<script setup lang="ts">
import { ref, watch } from "vue";
import { VueDraggable } from "vue-draggable-plus";
import { useBoardStore } from "@/stores/board";
import StoryCard from "@/components/StoryCard.vue";
import StoryForm from "@/components/StoryForm.vue";
import TaskCard from "@/components/TaskCard.vue";
import { Plus } from "@lucide/vue";
import type { TaskRecord, StoryRecord } from "@/db/db";

const props = defineProps<{
  stories: StoryRecord[];
  isAddingStory: boolean;
  getTasks: (storyId: string, column: TaskRecord["column"]) => TaskRecord[];
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

// Each cell gets its own mutable array that vue-draggable can reorder
const cellLists = ref<Record<string, TaskRecord[]>>({});
const boardStore = useBoardStore();

// Sync cellLists with store data — mutate in-place to keep VueDraggable's reference
function syncCellLists() {
  for (const story of props.stories) {
    for (const col of columns) {
      const key = cellKey(story.id, col);
      const newTasks = [...props.getTasks(story.id, col)];
      if (!cellLists.value[key]) {
        cellLists.value[key] = newTasks;
      } else {
        // Mutate existing array in-place so VueDraggable's v-model reference stays valid
        const existing = cellLists.value[key]!;
        existing.length = 0;
        existing.push(...newTasks);
      }
    }
  }
}

// Initial sync + watch for store task changes
syncCellLists();
watch(() => boardStore.tasks, syncCellLists, { deep: true });
</script>

<template>
  <div class="flex-1 overflow-auto">
    <table class="w-full" style="border-collapse: separate; border-spacing: 0;">
      <colgroup>
        <col class="w-50" />
        <col class="w-10" />
        <col v-for="col in columns" :key="col" class="min-w-40" />
      </colgroup>

      <!-- Header -->
      <thead>
        <tr class="bg-white dark:bg-gray-800">
          <th
            class="border-b border-r border-gray-200 bg-white px-3 py-3 text-center text-sm font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
          >
            Stories
          </th>
          <th class="border-b border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800" />
          <th
            v-for="col in columns"
            :key="col"
            class="border-b border-r border-gray-200 bg-white px-3 py-3 text-center text-sm font-semibold text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 last:border-r-0"
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
        >
          <!-- Story Cell -->
          <td
            class="border-b border-r border-gray-200 bg-white p-0 align-top dark:border-gray-700 dark:bg-gray-800"
            style="height: 1px"
          >
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
            class="border-b border-r border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800"
            @click="emit('addTask', story.id)"
          >
            <button
              class="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Add Task"
            >
              <Plus class="h-4 w-4" />
            </button>
          </td>

          <!-- Task Cells with VueDraggable -->
          <td
            v-for="col in columns"
            :key="col"
            class="relative border-b border-r border-gray-200 bg-gray-50 p-2 align-top dark:border-gray-700 dark:bg-gray-900 last:border-r-0"
            :data-story-id="story.id"
            :data-column="col"
            style="height: 1px"
          >
            <div class="flex h-full flex-col">
              <VueDraggable
                :key="cellKey(story.id, col)"
                v-model="cellLists[cellKey(story.id, col)]!"
                :group="{ name: 'tasks', pull: true, put: true }"
                class="flex flex-1 flex-wrap content-start gap-2"
                :animation="150"
                ghost-class="sortable-ghost"
                chosen-class="sortable-chosen"
                fallback-class="sortable-fallback"
                :fallback-tolerance="3"
                @end="
                  async (e: any) => {
                    const sourceKey = cellKey(story.id, col);
                    const sourceTasks = cellLists[sourceKey] ?? [];

                    // Find target cell from DOM
                    const targetTd = e.to.closest('td[data-story-id]');
                    const targetStoryId = targetTd?.dataset.storyId;
                    const targetCol = targetTd?.dataset.column;

                    if (!targetStoryId || !targetCol) return;

                    const targetKey = cellKey(targetStoryId, targetCol);

                    if (e.to === e.from) {
                      // Intra-cell reorder — save only this cell
                      await boardStore.saveCell(story.id, col, sourceTasks);
                    } else {
                      // Cross-cell move — save both source and target
                      const targetTasks = cellLists[targetKey] ?? [];
                      await boardStore.saveBothCells(
                        story.id,
                        col,
                        sourceTasks,
                        targetStoryId,
                        targetCol,
                        targetTasks,
                      );
                    }
                  }
                "
              >
                <TaskCard
                  v-for="task in cellLists[cellKey(story.id, col)]"
                  :key="task.id"
                  :task="task"
                />
              </VueDraggable>
            </div>
          </td>
        </tr>
      </tbody>

      <!-- New Story Row -->
      <tfoot>
        <tr>
          <td class="border-b border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            <StoryForm
              v-if="isAddingStory"
              :initial-title="newStoryTitle"
              @submit="(title) => emit('addStory', title)"
              @cancel="emit('cancelAddStory')"
            />
            <button
              v-else
              @click="emit('startAddStory')"
              class="flex py-4 w-full items-center justify-center text-sm text-gray-400 underline hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 skip-ink-none"
            >
              New Story
            </button>
          </td>
          <td class="border-b border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800" />
          <td
            v-for="col in columns"
            :key="col"
            class="border-b border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 last:border-r-0"
          />
        </tr>
      </tfoot>
    </table>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

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

.sortable-ghost {
  @apply opacity-40 outline-2 outline-dashed outline-blue-400/50;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 6px,
    rgba(59, 130, 246, 0.15) 6px,
    rgba(59, 130, 246, 0.15) 12px
  ) !important;
  box-shadow: none !important;
}

.sortable-fallback {
  @apply opacity-80;
}
</style>
