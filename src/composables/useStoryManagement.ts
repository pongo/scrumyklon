import { ref, nextTick } from "vue";
import type { useBoardStore } from "@/stores/board";

export function useStoryManagement(boardStore: ReturnType<typeof useBoardStore>) {
  const isAddingStory = ref(false);
  const newStoryTitle = ref("");
  const storyInputRef = ref<HTMLInputElement | null>(null);

  async function startAddStory() {
    isAddingStory.value = true;
    await nextTick();
    storyInputRef.value?.focus();
  }

  async function addStory() {
    const trimmed = newStoryTitle.value.trim();
    if (trimmed) {
      await boardStore.createStory(trimmed);
    }
    newStoryTitle.value = "";
    isAddingStory.value = false;
  }

  function cancelAddStory() {
    isAddingStory.value = false;
    newStoryTitle.value = "";
  }

  return {
    isAddingStory,
    newStoryTitle,
    storyInputRef,
    startAddStory,
    addStory,
    cancelAddStory,
  };
}
