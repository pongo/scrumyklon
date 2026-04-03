<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useBoardStore } from "@/stores/board";
import { generatePastelColor } from "@/utils/pastelColor";
import type { TaskRecord } from "@/db/db";

const props = defineProps<{
  storyId: string;
  mode: "create" | "edit";
  task?: TaskRecord;
}>();

const emit = defineEmits<{ close: [] }>();

const boardStore = useBoardStore();

const title = ref(props.mode === "edit" && props.task ? props.task.title : "");
const assignee = ref(props.mode === "edit" && props.task ? props.task.assignee : "");
const isSaving = ref(false);

const inputRef = ref<HTMLInputElement | null>(null);

onMounted(() => {
  inputRef.value?.focus();
});

const previewColor = ref("#f0f0f0");

function updatePreviewColor() {
  previewColor.value = assignee.value ? generatePastelColor(assignee.value) : "#f0f0f0";
}

async function handleSave() {
  const trimmed = title.value.trim();
  if (!trimmed || isSaving.value) return;

  isSaving.value = true;
  try {
    if (props.mode === "create") {
      await boardStore.createTask(props.storyId, trimmed, assignee.value.trim());
    } else if (props.task) {
      await boardStore.updateTask(props.task.id, {
        title: trimmed,
        assignee: assignee.value.trim(),
      });
    }
    emit("close");
  } catch (e) {
    console.error("Failed to save task:", e);
  } finally {
    isSaving.value = false;
  }
}

function handleCancel() {
  emit("close");
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSave();
  } else if (e.key === "Escape") {
    handleCancel();
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        class="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg dark:bg-gray-800"
        @click.stop
      >
        <h3 class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
          {{ mode === "create" ? "New Task" : "Edit Task" }}
        </h3>

        <div class="flex flex-col gap-3">
          <!-- Title -->
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Title
            </label>
            <input
              ref="inputRef"
              v-model="title"
              @keydown="handleKeydown"
              type="text"
              placeholder="Task title"
              class="w-full rounded border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          <!-- Assignee -->
          <div>
            <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
              Assignee
            </label>
            <input
              v-model="assignee"
              @input="updatePreviewColor"
              @keydown="handleKeydown"
              type="text"
              placeholder="Assign to..."
              class="w-full rounded border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
            <!-- Color Preview -->
            <div
              v-if="assignee"
              class="mt-2 h-6 w-full rounded"
              :style="{ backgroundColor: previewColor }"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-4 flex justify-end gap-2">
          <button
            @click="handleCancel"
            class="rounded px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            {{ mode === "create" ? "Cancel" : "Cancel" }}
          </button>
          <button
            v-if="mode === 'edit'"
            @click="handleSave"
            :disabled="isSaving || !title.trim()"
            class="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ isSaving ? "Saving..." : "Save" }}
          </button>
          <button
            v-if="mode === 'create'"
            @click="handleSave"
            :disabled="isSaving || !title.trim()"
            class="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {{ isSaving ? "Creating..." : "Create" }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
