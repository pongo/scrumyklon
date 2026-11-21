<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import { VueDraggable, type MoveEvent, type SortableEvent } from "vue-draggable-plus";
import { useBoardStore } from "@/stores/board";
import StoryCard from "@/components/StoryCard.vue";
import StoryForm from "@/components/StoryForm.vue";
import TaskCard from "@/components/TaskCard.vue";
import { Plus, Trash2 } from "@lucide/vue";
import type { TaskRecord, StoryRecord } from "@/db/db";
import { TASK_COLUMNS, TASK_COLUMN_LABELS } from "@/constants/taskColumns";

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

const columnLabels = TASK_COLUMN_LABELS;
const columns = TASK_COLUMNS;

function cellKey(storyId: string, column: TaskRecord["column"]) {
  return `${storyId}:${column}`;
}

// Each cell gets its own mutable array that vue-draggable can reorder
const cellLists = ref<Record<string, TaskRecord[]>>({});
const boardStore = useBoardStore();

let dragSource: { cell: HTMLElement; nextCard: Element | null; placeholder: HTMLElement } | null =
  null;
let lastInsertion: { cell: HTMLElement; x: number; y: number } | null = null;

function rememberDragSource(event: SortableEvent) {
  const placeholder = document.createElement("div");
  placeholder.className = "source-placeholder";
  placeholder.setAttribute("aria-hidden", "true");
  dragSource = { cell: event.from, nextCard: event.item.nextElementSibling, placeholder };
}

function updateSourcePlaceholder(event: SortableEvent) {
  if (!dragSource) return;
  const { cell, nextCard, placeholder } = dragSource;

  if (event.to === cell) {
    placeholder.remove();
  } else if (placeholder.parentNode !== cell) {
    // A sortable child makes the original slot a drop target at its original index.
    cell.insertBefore(placeholder, nextCard?.parentNode === cell ? nextCard : null);
  }
}

function allowCardMove(event: MoveEvent, originalEvent: Event) {
  const pointer =
    "touches" in originalEvent
      ? (originalEvent as TouchEvent).touches[0]
      : (originalEvent as MouseEvent);
  if (!pointer || !Number.isFinite(pointer.clientX) || !Number.isFinite(pointer.clientY)) return;

  const { clientX: x, clientY: y } = pointer;

  // Ignore repeated dragover events while cards animate beneath a stationary pointer.
  if (lastInsertion?.cell === event.to && Math.hypot(x - lastInsertion.x, y - lastInsertion.y) < 3) {
    return false;
  }

  lastInsertion = { cell: event.to, x, y };

  // Insert before the placeholder so removing it leaves the card in the original slot.
  if (event.related === dragSource?.placeholder) return -1;
}

function clearSourcePlaceholder() {
  // unchoose runs before vue-draggable-plus restores the task using its original index.
  dragSource?.placeholder.remove();
  dragSource = null;
  lastInsertion = null;
}

onBeforeUnmount(clearSourcePlaceholder);

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

// Initial sync + watch for store changes (stories and tasks)
watch([() => props.stories, () => boardStore.tasks], () => syncCellLists(), {
  deep: true,
  immediate: true,
});

async function clearDoneColumn() {
  if (!confirm("Delete all done tasks?")) return;
  await boardStore.deleteAllDoneTasks();
}
</script>

<template>
  <div class="flex-1 overflow-auto">
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

          <!-- Task Cells with VueDraggable -->
          <td
            v-for="col in columns"
            :key="col"
            class="relative border-r border-b border-gray-200 bg-gray-50 p-2 align-top last:border-r-0"
            :data-story-id="story.id"
            :data-column="col"
            style="height: 1px"
          >
            <div class="flex h-full flex-col">
              <VueDraggable
                :key="cellKey(story.id, col)"
                v-model="cellLists[cellKey(story.id, col)]!"
                :group="{ name: 'tasks', pull: true, put: true }"
                class="task-list flex flex-1 flex-wrap content-start items-start gap-2"
                :animation="150"
                :on-move="allowCardMove"
                ghost-class="sortable-ghost"
                chosen-class="sortable-chosen"
                fallback-class="sortable-fallback"
                :fallback-tolerance="3"
                @start="rememberDragSource"
                @change="updateSourcePlaceholder"
                @unchoose="clearSourcePlaceholder"
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

.task-list > :deep(.source-placeholder) {
  @apply task-card-size rounded-[1px] outline-gray-500/50;
  --ghost-stripe: color-mix(in srgb, var(--color-gray-500) 15%, transparent);
}

.sortable-ghost {
  @apply outline-blue-400/50;
}

.sortable-ghost,
.task-list > :deep(.source-placeholder) {
  @apply opacity-40 outline-2 outline-dashed;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 6px,
    var(--ghost-stripe, rgba(59, 130, 246, 0.15)) 6px,
    var(--ghost-stripe, rgba(59, 130, 246, 0.15)) 12px
  ) !important;
  box-shadow: none !important;
}

.sortable-fallback {
  @apply opacity-80;
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
