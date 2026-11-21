import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import type { MoveEvent, SortableEvent } from "vue-draggable-plus";
import { TASK_COLUMNS } from "@/constants/taskColumns";
import type { StoryRecord, TaskRecord } from "@/db/db";
import type { TaskCell } from "@/db/tasks";
import { useBoardStore } from "@/stores/board";

function cellFromElement(element: HTMLElement): TaskCell | undefined {
  const { storyId, column } = element.dataset;
  const taskColumn = TASK_COLUMNS.find((value) => value === column);
  if (storyId && taskColumn) return { storyId, column: taskColumn };
}

function cellKey({ storyId, column }: TaskCell) {
  return `${storyId}:${column}`;
}

export function useDragAndDrop() {
  const boardStore = useBoardStore();
  const saving = ref(false);
  const error = ref("");
  const taskLists = computed(() => {
    const lists = new Map<string, TaskRecord[]>();
    for (const task of boardStore.tasks) {
      const key = cellKey(task);
      const list = lists.get(key);
      if (list) list.push(task);
      else lists.set(key, [task]);
    }
    for (const list of lists.values()) list.sort((a, b) => a.order - b.order);
    return lists;
  });

  // Keep Vue's list structure stable while Sortable owns the card elements.
  const dragLists = shallowRef<Map<string, TaskRecord[]>>();
  const dragStories = shallowRef<StoryRecord[]>();
  let drag:
    | {
        from: HTMLElement;
        item: HTMLElement;
        nextCard: Element | null;
        placeholder: HTMLElement;
        cancelled: boolean;
      }
    | undefined;
  let lastInsertion: { cell: HTMLElement; x: number; y: number } | undefined;

  function start(event: SortableEvent) {
    const { from, item } = event;
    const nextCard = item.nextElementSibling;
    const placeholder = document.createElement("div");
    placeholder.className = "source-placeholder";
    placeholder.setAttribute("aria-hidden", "true");
    drag = { from, item, nextCard, placeholder, cancelled: false };
    dragLists.value = taskLists.value;
    dragStories.value = [...boardStore.stories];
  }

  function change(event: SortableEvent) {
    if (!drag) return;
    const { from, nextCard, placeholder } = drag;
    if (event.to === from) placeholder.remove();
    else if (placeholder.parentNode !== from) from.insertBefore(placeholder, nextCard);
  }

  function move(event: MoveEvent, originalEvent: Event) {
    if (saving.value || drag?.cancelled) return false;
    const pointer =
      "touches" in originalEvent
        ? (originalEvent as TouchEvent).touches[0]
        : (originalEvent as MouseEvent);
    if (pointer && Number.isFinite(pointer.clientX) && Number.isFinite(pointer.clientY)) {
      const { clientX: x, clientY: y } = pointer;
      // Ignore repeated dragover events while cards animate under a stationary pointer.
      if (
        lastInsertion?.cell === event.to &&
        Math.hypot(x - lastInsertion.x, y - lastInsertion.y) < 3
      ) {
        return false;
      }
      lastInsertion = { cell: event.to, x, y };
    }
    if (event.related === drag?.placeholder) return -1;
  }

  function restore() {
    if (!drag) return;
    const { from, item, nextCard, placeholder } = drag;
    placeholder.remove();
    // Restore Vue's DOM before rendering the optimistic order.
    if (item.parentNode !== from || item.nextElementSibling !== nextCard) {
      from.insertBefore(item, nextCard);
    }
    drag = undefined;
    lastInsertion = undefined;
    dragLists.value = undefined;
    dragStories.value = undefined;
  }

  async function end(event: SortableEvent) {
    if (!drag) return;
    const { item, from, nextCard, placeholder, cancelled } = drag;
    const { to } = event;
    const originalEvent = (event as SortableEvent & { originalEvent?: Event }).originalEvent;
    const taskId = item.dataset.taskId;
    const source = cellFromElement(from);
    const target = cellFromElement(to);
    const next = item.nextElementSibling;
    const beforeTaskId =
      (next === placeholder ? nextCard : next)?.getAttribute("data-task-id") ?? undefined;
    const unchanged =
      from === to && beforeTaskId === (nextCard?.getAttribute("data-task-id") ?? undefined);
    const pointer =
      originalEvent && "changedTouches" in originalEvent
        ? (originalEvent as TouchEvent).changedTouches[0]
        : (originalEvent as MouseEvent | undefined);
    const hit = pointer && document.elementFromPoint(pointer.clientX, pointer.clientY);
    const outsideTarget = pointer && hit?.closest("td") !== to.closest("td");
    const lists = dragLists.value;
    restore();

    if (
      cancelled ||
      originalEvent?.type.endsWith("cancel") ||
      hit === placeholder ||
      outsideTarget ||
      unchanged ||
      !taskId ||
      !source ||
      !target
    )
      return;

    const sourceKey = cellKey(source);
    const targetKey = cellKey(target);
    const sourceList = lists?.get(sourceKey) ?? [];
    const task = sourceList.find(({ id }) => id === taskId);
    if (!task) return;

    const remaining = sourceList.filter(({ id }) => id !== taskId);
    const destination = from === to ? remaining : [...(lists?.get(targetKey) ?? [])];
    const position = beforeTaskId
      ? destination.findIndex(({ id }) => id === beforeTaskId)
      : destination.length;
    if (position < 0) return;
    destination.splice(position, 0, { ...task, ...target });
    dragLists.value = new Map(lists).set(sourceKey, remaining).set(targetKey, destination);

    error.value = "";
    saving.value = true;
    try {
      await boardStore.moveTask({ taskId, source, target, beforeTaskId });
    } catch (cause) {
      console.error("Failed to move task:", cause);
      error.value = "Couldn't move the card. Try again.";
    } finally {
      dragLists.value = undefined;
      saving.value = false;
    }
  }

  function cancel(event: KeyboardEvent) {
    if (event.key === "Escape" && drag) drag.cancelled = true;
  }

  onMounted(() => window.addEventListener("keydown", cancel));
  onBeforeUnmount(() => {
    window.removeEventListener("keydown", cancel);
    restore();
  });

  return {
    stories: computed(() => dragStories.value ?? boardStore.stories),
    tasksInCell: (storyId: string, column: TaskRecord["column"]) =>
      (dragLists.value ?? taskLists.value).get(cellKey({ storyId, column })) ?? [],
    saving,
    error,
    start,
    change,
    move,
    end,
  };
}
