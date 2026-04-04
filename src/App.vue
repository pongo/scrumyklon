<script setup lang="ts">
import { RouterView } from "vue-router";
import { useVariants } from "@/composables/useVariants";

useVariants({
  TaskCard: { key: "'", variants: [true, false] },
  TaskWidth: { key: ";", variants: ["w-32", "w-35"] },
});
</script>

<template>
  <RouterView />
</template>
