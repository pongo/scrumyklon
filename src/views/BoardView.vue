<script setup lang="ts">
import { ref, watch } from "vue";
import { useBoardStore } from "@/stores/board";
import BoardTable from "@/components/BoardTable.vue";
import TaskDialog from "@/components/TaskDialog.vue";
import BoardHeader from "@/components/BoardHeader.vue";
import { useStoryManagement } from "@/composables/useStoryManagement";

const props = defineProps<{ slug: string }>();

const boardStore = useBoardStore();

const { isAddingStory, newStoryTitle, startAddStory, addStory, cancelAddStory } =
  useStoryManagement(boardStore);

const addTaskStoryId = ref<string | null>(null);

function openAddTask(storyId: string) {
  addTaskStoryId.value = storyId;
}

function closeAddTask() {
  addTaskStoryId.value = null;
}

async function handleStoryTitleUpdate(id: string, title: string) {
  await boardStore.updateStoryTitle(id, title);
}

async function handleStoryDelete(id: string) {
  await boardStore.deleteStory(id);
}

watch(
  () => props.slug,
  async (slug) => {
    await boardStore.loadBoard(slug);
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="boardStore.loading" class="flex min-h-screen items-center justify-center"></div>

  <div
    v-else-if="boardStore.currentBoard"
    class="flex h-screen flex-col overflow-hidden bg-gray-50"
  >
    <!-- Board Header -->
    <BoardHeader />

    <!-- Board Table -->
    <BoardTable
      v-model:new-story-title="newStoryTitle"
      :is-adding-story="isAddingStory"
      :key="boardStore.currentBoard.id"
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
