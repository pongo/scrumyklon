<script setup lang="ts">
import { useBoardStore } from "@/stores/board";
import { useBoardTitle } from "@/composables/useBoardTitle";

const boardStore = useBoardStore();

const {
  isEditingTitle,
  titleInput,
  startEditing: startEditingTitle,
  saveTitle,
  handleKeydown: handleTitleKeydown,
} = useBoardTitle(boardStore);
</script>

<template>
  <header class="border-b border-gray-200 bg-white px-6 py-4">
    <div v-if="isEditingTitle">
      <input
        ref="titleInputRef"
        v-model="titleInput"
        @blur="saveTitle"
        @keyup.enter="($event.target as HTMLInputElement).blur()"
        @keydown="handleTitleKeydown"
        type="text"
        class="field-sizing-content min-w-10 rounded border border-gray-300 px-2 py-1 text-lg font-semibold outline-none focus:border-blue-500"
      />
    </div>
    <h1 v-else class="text-xl font-semibold text-gray-800">
      <span @dblclick="startEditingTitle" title="Double click to edit">{{
        boardStore.currentBoard!.title
      }}</span>
    </h1>
  </header>
</template>
