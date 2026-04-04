<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { RouterLink } from "vue-router";
import { Menu, Plus, Trash2 } from "@lucide/vue";
import { useBoardStore } from "@/stores/board";
import { useBoardTitle } from "@/composables/useBoardTitle";
import type { BoardRecord } from "@/db/db";

const boardStore = useBoardStore();
const router = useRouter();

const {
  isEditingTitle,
  titleInput,
  titleInputRef,
  startEditing: startEditingTitle,
  saveTitle,
  handleKeydown: handleTitleKeydown,
} = useBoardTitle(boardStore);

const drawerOpen = ref(false);
const boards = ref<BoardRecord[]>([]);
const creating = ref(false);
const newBoardTitle = ref("");

async function openDrawer() {
  drawerOpen.value = true;
  boards.value = await boardStore.loadAllBoards();
}

function closeDrawer() {
  drawerOpen.value = false;
}

async function createBoard() {
  const trimmed = newBoardTitle.value.trim();
  if (!trimmed || creating.value) return;
  creating.value = true;
  try {
    const id = await boardStore.createBoard(trimmed);
    newBoardTitle.value = "";
    boards.value = await boardStore.loadAllBoards();
    router.push(`/${id}`);
    closeDrawer();
  } catch (e) {
    console.error("Failed to create board:", e);
  } finally {
    creating.value = false;
  }
}

async function deleteBoard(board: BoardRecord) {
  if (!confirm(`Delete board "${board.title}"?`)) return;
  // If deleting current board, navigate to /new
  const isCurrent = boardStore.currentBoard?.id === board.id;
  // Delete via direct API to avoid clearing currentBoard store state when navigating away
  const boardsApi = await import("@/db/boards");
  await boardsApi.deleteBoard(board.id);
  boards.value = boards.value.filter((b) => b.id !== board.id);
  if (isCurrent) {
    closeDrawer();
    router.push("/new");
  }
}

function handleCreateKeydown(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault();
    createBoard();
  }
}

// Close drawer on Escape
onMounted(() => {
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawerOpen.value) closeDrawer();
  });
});

// Close drawer when route changes (boardId prop change)
watch(
  () => boardStore.currentBoard?.id,
  () => {
    drawerOpen.value = false;
  },
);
</script>

<template>
  <header class="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-4">
    <!-- Hamburger -->
    <button
      @click="openDrawer"
      class="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
      title="Open boards menu"
    >
      <Menu class="size-5" />
    </button>

    <!-- Title -->
    <div v-if="isEditingTitle" class="flex-1">
      <input
        ref="titleInputRef"
        v-model="titleInput"
        @blur="saveTitle"
        @keyup.enter="($event.target as HTMLInputElement).blur()"
        @keydown="handleTitleKeydown"
        type="text"
        class="field-sizing-content min-w-10 rounded border border-gray-300 px-2 py-1 text-lg font-semibold outline-none focus:border-blue-500"
        autofocus
      />
    </div>
    <h1 v-else class="flex-1 text-xl font-semibold text-gray-800">
      <span @dblclick="startEditingTitle" title="Double click to edit">{{
        boardStore.currentBoard!.title
      }}</span>
    </h1>

    <!-- Drawer overlay -->
    <Teleport to="body">
      <Transition name="drawer">
        <div v-if="drawerOpen" class="fixed inset-0 z-50 flex">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/30" @click="closeDrawer" />

          <!-- Drawer panel -->
          <div
            class="relative flex w-80 flex-col border-r border-gray-200 bg-white shadow-xl"
          >
            <!-- Drawer header -->
            <div class="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
              <h2 class="flex-1 text-lg font-semibold text-gray-800">Boards</h2>
              <button
                @click="closeDrawer"
                class="rounded p-1 text-gray-500 hover:bg-gray-100"
                title="Close"
              >
                ✕
              </button>
            </div>

            <!-- Create board -->
            <div class="flex gap-2 border-b border-gray-200 px-4 py-2">
              <input
                v-model="newBoardTitle"
                @keydown="handleCreateKeydown"
                type="text"
                placeholder="New board title"
                class="flex-1 rounded border border-gray-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
                :disabled="creating"
              />
              <button
                @click="createBoard"
                :disabled="creating || !newBoardTitle.trim()"
                class="rounded bg-blue-600 px-2 py-1 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                title="Create new board"
              >
                <Plus class="size-4" />
              </button>
            </div>

            <!-- Board list -->
            <ul class="flex-1 overflow-y-auto">
              <li v-for="board in boards" :key="board.id">
                <div
                  class="group flex items-center gap-2 px-4 py-2 transition-colors hover:bg-gray-50"
                  :class="{
                    'bg-blue-50 font-medium text-blue-700':
                      boardStore.currentBoard?.id === board.id,
                  }"
                >
                  <RouterLink
                    :to="`/${board.id}`"
                    @click="closeDrawer"
                    class="flex-1 truncate text-sm text-gray-700 hover:text-gray-900"
                  >
                    {{ board.title }}
                  </RouterLink>
                  <button
                    @click="deleteBoard(board)"
                    class="shrink-0 rounded p-1 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                    title="Delete board"
                  >
                    <Trash2 class="size-4" />
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.2s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
</style>
