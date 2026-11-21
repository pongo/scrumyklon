<script setup lang="ts">
import { computed, ref } from "vue";
import {
  useDraggable,
  type DraggableEvent,
  type MoveEvent,
  type SortableEvent,
} from "vue-draggable-plus";
import TaskCard from "@/components/TaskCard.vue";
import type { TaskRecord } from "@/db/db";

const props = defineProps<{
  storyId: string;
  column: TaskRecord["column"];
  tasks: TaskRecord[];
  disabled: boolean;
  onMove: (event: MoveEvent, originalEvent: Event) => false | -1 | undefined;
}>();

const emit = defineEmits<{
  start: [event: SortableEvent];
  change: [event: SortableEvent];
  end: [event: SortableEvent];
}>();

const list = ref<HTMLElement>();
useDraggable(
  list,
  computed(() => ({
    group: "tasks",
    draggable: ">:is([data-task-id], .source-placeholder)",
    filter: "button",
    preventOnFilter: false,
    animation: 150,
    disabled: props.disabled,
    forceFallback: true,
    fallbackOnBody: true,
    fallbackTolerance: 3,
    onStart: (event: DraggableEvent) => emit("start", event),
    onChange: (event: DraggableEvent) => emit("change", event),
    onEnd: (event: DraggableEvent) => emit("end", event),
    onMove: props.onMove,
  })),
);
</script>

<template>
  <div
    ref="list"
    class="task-list flex flex-1 flex-wrap content-start items-start gap-2"
    :data-story-id="storyId"
    :data-column="column"
  >
    <TaskCard v-for="task in tasks" :key="task.id" :task="task" />
  </div>
</template>

<style scoped>
@reference "../style.css";

.task-list > [data-task-id] {
  touch-action: none;
}

.task-list > :deep(.source-placeholder) {
  @apply task-card-size rounded-[1px] outline-gray-500/50;
  --ghost-stripe: color-mix(in srgb, var(--color-gray-500) 15%, transparent);
}

.sortable-ghost {
  @apply outline-blue-400/50;
}

.sortable-ghost,
.task-list > :deep(.source-placeholder) {
  @apply opacity-40 outline-2 outline-dashed;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 6px,
    var(--ghost-stripe, rgba(59, 130, 246, 0.15)) 6px,
    var(--ghost-stripe, rgba(59, 130, 246, 0.15)) 12px
  ) !important;
  box-shadow: none !important;
}

.sortable-fallback {
  @apply opacity-80;
}
</style>
