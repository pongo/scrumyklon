<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { useRouter, RouterLink } from "vue-router";
import { Trash2, Share, Check } from "@lucide/vue";
import type { BoardRecord } from "@/db/db";
import { exportBoardToMarkdown } from "@/utils/exportMarkdown";
import * as boardsApi from "@/db/boards";

const router = useRouter();

const boards = ref<BoardRecord[]>([]);
const exportedBoards = reactive<Record<string, boolean>>({});

onMounted(async () => {
  boards.value = await boardsApi.getAllBoards();
});

function navigateToCreate() {
  router.push("/new");
}

async function handleExport(board: BoardRecord) {
  const markdown = await exportBoardToMarkdown(board);
  await navigator.clipboard.writeText(markdown);
  exportedBoards[board.id] = true;
  setTimeout(() => {
    exportedBoards[board.id] = false;
  }, 2000);
}

async function deleteBoard(board: BoardRecord) {
  if (!confirm(`Delete board "${board.title}"?`)) return;
  await boardsApi.deleteBoard(board.id);
  boards.value = boards.value.filter((b) => b.id !== board.id);
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50">
    <div class="w-full max-w-2xl px-4">
      <h1 class="mb-8 text-center text-3xl font-bold text-gray-800">Scrumyklon</h1>

      <div v-if="boards.length > 0" class="rounded-lg border border-gray-200 bg-white shadow-sm">
        <ul>
          <li
            v-for="board in boards"
            :key="board.id"
            class="group flex items-center gap-2 border-b border-gray-100 px-4 py-3 transition-colors last:border-b-0"
          >
            <RouterLink
              :to="`/${board.slug}`"
              class="flex-1 truncate text-sm text-gray-700 hover:text-gray-900 hover:underline"
            >
              {{ board.title }}
            </RouterLink>
            <button
              @click="handleExport(board)"
              class="shrink-0 rounded p-1.5 text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-green-50 hover:text-green-600"
              :title="exportedBoards[board.id] ? 'Copied!' : 'Export as Markdown'"
            >
              <Check v-if="exportedBoards[board.id]" class="size-4" />
              <Share v-else class="size-4" />
            </button>
            <button
              @click="deleteBoard(board)"
              class="shrink-0 rounded p-1.5 text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
              title="Delete board"
            >
              <Trash2 class="size-4" />
            </button>
          </li>
        </ul>
      </div>

      <div class="mt-6 flex justify-center">
        <button
          @click="navigateToCreate"
          class="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          Create new board
        </button>
      </div>
    </div>
  </div>
</template>
