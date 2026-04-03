<script setup lang="ts">
import { useBoardStore } from "@/stores/board";
import { X } from "@lucide/vue";
import type { StoryRecord } from "@/db/db";

const props = defineProps<{ story: StoryRecord }>();

const boardStore = useBoardStore();

function handleDelete() {
  if (confirm("Delete this story and all its tasks?")) {
    boardStore.deleteStory(props.story.id);
  }
}
</script>

<template>
  <div class="group relative flex items-center justify-center bg-gray-100">
    <!-- Delete button on hover -->
    <button
      @click.stop="handleDelete"
      class="absolute right-1 top-1 hidden rounded p-0.5 text-gray-400 hover:text-red-500 group-hover:block"
    >
      <X class="h-3.5 w-3.5" />
    </button>

    <!-- Story Title -->
    <div class="text-center text-sm font-medium text-gray-700 dark:text-gray-200">
      {{ story.title }}
    </div>
  </div>
</template>
