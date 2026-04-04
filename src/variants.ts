import { createVariants } from "./composables/useVariants";

export const useAppVariants = createVariants({
  TaskCard: { key: "1", variants: [true, false] as const },
  TaskWidth: { key: "2", variants: ["w-32", "w-35"] as const },
});
