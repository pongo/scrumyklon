<script setup lang="ts">
import { ref, nextTick } from "vue";
import { Check, X } from "@lucide/vue";
import type { StoryRecord } from "@/db/db";

const props = defineProps<{ story: StoryRecord }>();
const emit = defineEmits<{
  titleUpdate: [id: string, title: string];
  delete: [id: string];
}>();

const isEditing = ref(false);
const editTitle = ref("");
const inputRef = ref<HTMLInputElement | null>(null);

async function startEditing() {
  editTitle.value = props.story.title;
  isEditing.value = true;
  await nextTick();
  inputRef.value?.focus();
}

function cancelEditing() {
  isEditing.value = false;
  editTitle.value = "";
}

async function saveEditing() {
  const trimmed = editTitle.value.trim();
  if (!trimmed) {
    cancelEditing();
    return;
  }
  isEditing.value = false;
  emit("titleUpdate", props.story.id, trimmed);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault();
    saveEditing();
  } else if (e.key === "Escape") {
    cancelEditing();
  }
}

function handleDelete() {
  if (confirm("Delete this story and all its tasks?")) {
    emit("delete", props.story.id);
  }
}
</script>

<template>
  <div class="group relative flex h-full items-center justify-center">
    <!-- Delete button on hover (hidden while editing) -->
    <button
      v-if="!isEditing"
      @click.stop="handleDelete"
      class="absolute right-1 top-1 hidden rounded p-0.5 text-gray-400 hover:text-red-500 group-hover:block"
      title="Delete Story"
    >
      <X class="h-3.5 w-3.5" />
    </button>

    <!-- Edit mode -->
    <div v-if="isEditing" class="flex w-full flex-col gap-1 p-2">
      <input
        ref="inputRef"
        v-model="editTitle"
        @keydown="handleKeydown"
        @blur="saveEditing"
        type="text"
        class="w-full rounded-sm border border-blue-400 px-2 py-1.5 text-sm outline-none dark:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
      />
      <div class="flex gap-1">
        <button
          @click.stop="saveEditing"
          class="flex flex-1 items-center justify-center rounded-sm bg-green-600 py-1 text-white hover:bg-green-700"
        >
          <Check class="h-4 w-4" />
        </button>
        <button
          @click.stop="cancelEditing"
          class="flex flex-1 items-center justify-center rounded-sm bg-gray-500 py-1 text-white hover:bg-gray-600"
        >
          <X class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Story Title -->
    <div
      v-else
      class="text-center text-sm font-medium text-gray-700 dark:text-gray-200"
      @dblclick="startEditing"
      title="Double click to edit"
    >
      {{ story.title }}
    </div>
  </div>
</template>
