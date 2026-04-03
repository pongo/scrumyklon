<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useBoardStore } from "@/stores/board";
import { generatePastelColor } from "@/utils/pastelColor";
import { Check, X } from "@lucide/vue";
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

const textareaRef = ref<HTMLTextAreaElement | null>(null);

onMounted(() => {
  textareaRef.value?.focus();
  if (props.mode === "edit") {
    textareaRef.value?.select();
  }
});

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
  if (e.key === "Escape") {
    handleCancel();
  }
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/20" @click="handleCancel">
      <div
        class="w-full max-w-sm rounded border-2 border-gray-800 bg-white p-0 shadow-xl transition-colors dark:border-gray-600"
        :style="assignee.trim() ? { backgroundColor: generatePastelColor(assignee) } : {}"
        @click.stop
      >
        <!-- Title Area -->
        <div class="p-3">
          <textarea
            ref="textareaRef"
            v-model="title"
            @keydown="handleKeydown"
            rows="3"
            placeholder=""
            class="w-full resize-none border-none bg-transparent text-center text-lg font-medium text-gray-800 outline-none"
          />
        </div>

        <!-- Assignee Input -->
        <div class="border-t border-gray-200/60 px-3 py-2">
          <input
            v-model="assignee"
            type="text"
            placeholder="UNASSIGNED"
            class="w-full rounded-sm border border-gray-300/60 bg-white/80 px-2 py-1 text-sm text-gray-600 outline-none focus:border-blue-500"
          />
        </div>

        <!-- Actions -->
        <div class="flex border-t border-gray-200/60">
          <button
            @click="handleSave"
            :disabled="isSaving || !title.trim()"
            class="flex flex-1 items-center justify-center gap-1 bg-green-600 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check class="h-4 w-4" />
            <span>{{ mode === "create" ? "Create" : "Save" }}</span>
          </button>
          <button
            @click="handleCancel"
            class="flex flex-1 items-center justify-center gap-1 bg-gray-400 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-500"
          >
            <X class="h-4 w-4" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
