<script setup lang="ts">
import { ref } from "vue";
import { useBoardStore } from "@/stores/board";
import StoryCard from "@/components/StoryCard.vue";
import { Plus } from "@lucide/vue";

const boardStore = useBoardStore();
const isAdding = ref(false);
const newStoryTitle = ref("");

function startAdd() {
  isAdding.value = true;
}

async function handleAdd() {
  const trimmed = newStoryTitle.value.trim();
  if (trimmed) {
    await boardStore.createStory(trimmed);
    newStoryTitle.value = "";
  }
  isAdding.value = false;
}

function handleCancel() {
  isAdding.value = false;
  newStoryTitle.value = "";
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    handleAdd();
  } else if (e.key === "Escape") {
    handleCancel();
  }
}
</script>

<template>
  <div
    class="flex min-w-[280px] flex-col rounded-lg bg-gray-100 p-3 dark:bg-gray-800"
  >
    <h2 class="mb-3 px-1 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      Stories
    </h2>

    <!-- Story List -->
    <div class="flex flex-col gap-2">
      <StoryCard
        v-for="story in boardStore.stories"
        :key="story.id"
        :story="story"
      />
    </div>

    <!-- New Story Input -->
    <div v-if="isAdding" class="mt-2">
      <input
        v-model="newStoryTitle"
        @keydown="handleKeydown"
        @blur="handleAdd"
        type="text"
        placeholder="Story title"
        class="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        autofocus
      />
    </div>
    <button
      v-else
      @click="startAdd"
      class="mt-1 flex items-center gap-1 rounded px-2 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
    >
      <Plus class="h-4 w-4" />
      <span>New Story</span>
    </button>
  </div>
</template>
