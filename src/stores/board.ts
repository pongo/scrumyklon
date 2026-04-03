import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { BoardRecord, StoryRecord, TaskRecord } from "@/db/db";
import * as boardsApi from "@/db/boards";
import * as storiesApi from "@/db/stories";
import * as tasksApi from "@/db/tasks";

const COLUMNS: TaskRecord["column"][] = ["TO_DO", "IN_PROGRESS", "VERIFY", "DONE"];

export const useBoardStore = defineStore("board", () => {
  const currentBoard = ref<BoardRecord | null>(null);
  const stories = ref<StoryRecord[]>([]);
  const tasks = ref<TaskRecord[]>([]);
  const loading = ref(false);

  const columns = computed(() => COLUMNS);

  function getTasksForStory(storyId: string, column: TaskRecord["column"]) {
    return tasks.value
      .filter((t) => t.storyId === storyId && t.column === column)
      .sort((a, b) => a.order - b.order);
  }

  async function loadBoard(boardId: string) {
    loading.value = true;
    try {
      const board = await boardsApi.getBoard(boardId);
      if (!board) throw new Error("Board not found");
      currentBoard.value = board;

      const [storiesList, allTasks] = await Promise.all([
        storiesApi.getStoriesByBoard(boardId),
        loadAllTasksForBoard(boardId),
      ]);
      stories.value = storiesList;
      tasks.value = allTasks;
    } finally {
      loading.value = false;
    }
  }

  async function loadAllTasksForBoard(boardId: string): Promise<TaskRecord[]> {
    const storiesList = await storiesApi.getStoriesByBoard(boardId);
    const allTasks: TaskRecord[] = [];
    // Load tasks for all stories in parallel
    const taskPromises = storiesList.map((story) => tasksApi.getTasksByStory(story.id));
    const results = await Promise.all(taskPromises);
    for (const result of results) {
      allTasks.push(...result);
    }
    return allTasks;
  }

  async function createBoard(title: string): Promise<string> {
    const id = crypto.randomUUID();
    await boardsApi.createBoard({ id, title });
    return id;
  }

  async function updateBoardTitle(title: string): Promise<void> {
    if (!currentBoard.value) return;
    const previousTitle = currentBoard.value.title;

    // Optimistic update
    currentBoard.value.title = title;

    try {
      await boardsApi.updateBoard(currentBoard.value.id, { title });
    } catch (error) {
      // Rollback on error
      currentBoard.value.title = previousTitle;
      throw error;
    }
  }

  async function deleteCurrentBoard(): Promise<void> {
    if (!currentBoard.value) return;
    await boardsApi.deleteBoard(currentBoard.value.id);
    currentBoard.value = null;
    stories.value = [];
    tasks.value = [];
  }

  async function createStory(title: string): Promise<void> {
    if (!currentBoard.value) return;
    const id = crypto.randomUUID();
    await storiesApi.createStory({ id, boardId: currentBoard.value.id, title });
    const story = await storiesApi.getStoriesByBoard(currentBoard.value.id).then((s) =>
      s.find((x) => x.id === id),
    );
    if (story) stories.value.push(story);
  }

  async function updateStoryTitle(storyId: string, title: string): Promise<void> {
    const story = stories.value.find((s) => s.id === storyId);
    const previousTitle = story?.title;
    
    // Optimistic update
    if (story) story.title = title;
    
    try {
      await storiesApi.updateStory(storyId, { title });
    } catch (error) {
      // Rollback on error
      if (story && previousTitle !== undefined) {
        story.title = previousTitle;
      }
      throw error;
    }
  }

  async function deleteStory(storyId: string): Promise<void> {
    await storiesApi.deleteStory(storyId);
    stories.value = stories.value.filter((s) => s.id !== storyId);
    tasks.value = tasks.value.filter((t) => t.storyId !== storyId);
  }

  async function createTask(
    storyId: string,
    title: string,
    assignee: string,
  ): Promise<void> {
    const id = crypto.randomUUID();
    await tasksApi.createTask({
      id,
      storyId,
      column: "TO_DO",
      title,
      assignee,
    });
    const task = await tasksApi.getTasksByStory(storyId, "TO_DO").then((t) =>
      t.find((x) => x.id === id),
    );
    if (task) tasks.value.push(task);
  }

  async function updateTask(
    taskId: string,
    updates: { title?: string; assignee?: string },
  ): Promise<void> {
    await tasksApi.updateTask(taskId, updates);
    const task = tasks.value.find((t) => t.id === taskId);
    if (task) {
      if (updates.title !== undefined) task.title = updates.title;
      if (updates.assignee !== undefined) task.assignee = updates.assignee;
    }
  }

  async function deleteTask(taskId: string): Promise<void> {
    await tasksApi.deleteTask(taskId);
    tasks.value = tasks.value.filter((t) => t.id !== taskId);
  }

  async function moveTask(
    taskId: string,
    newStoryId: string,
    newColumn: TaskRecord["column"],
    insertIndex?: number,
  ): Promise<void> {
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task) return;

    // Persist to DB first (no reactive changes during drag)
    await tasksApi.moveTask(taskId, newStoryId, newColumn, insertIndex);

    // Then update reactively
    if (currentBoard.value) {
      const refreshed = await loadAllTasksForBoard(currentBoard.value.id);
      tasks.value = refreshed;
    }
  }

  async function loadAllBoards(): Promise<BoardRecord[]> {
    return boardsApi.getAllBoards();
  }

  return {
    currentBoard,
    stories,
    tasks,
    loading,
    columns,
    getTasksForStory,
    loadBoard,
    createBoard,
    updateBoardTitle,
    deleteCurrentBoard,
    createStory,
    updateStoryTitle,
    deleteStory,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    loadAllBoards,
  };
});
