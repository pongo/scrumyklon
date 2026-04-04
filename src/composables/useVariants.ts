import { reactive, readonly, onUnmounted, getCurrentInstance, type DeepReadonly } from "vue";

interface VariantConfig<T extends readonly unknown[] = readonly unknown[]> {
  key: string;
  variants: T;
}

type VariantsSetup = Record<string, VariantConfig>;

type InferState<T extends VariantsSetup> = {
  [K in keyof T]: T[K]["variants"][number];
};

// singleton
const variantsState = reactive<Record<string, unknown>>({});
let isInitialized = false;
let currentConfig: VariantsSetup | null = null;

function shouldIgnoreTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return el.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function handleKeydown(event: KeyboardEvent): void {
  if (shouldIgnoreTarget(event.target)) return;
  if (event.repeat) return;
  if (!currentConfig) return;

  for (const [name, options] of Object.entries(currentConfig)) {
    if (event.key === options.key) {
      event.preventDefault();

      const variantsArray = options.variants as unknown[];
      if (variantsArray.length === 0) continue;

      const currentValue = variantsState[name];
      const currentIndex = variantsArray.indexOf(currentValue);
      const nextIndex = (currentIndex + 1) % variantsArray.length;

      variantsState[name] = variantsArray[nextIndex];
    }
  }
}

export function useVariants<T extends VariantsSetup>(
  config: T,
): { variants: DeepReadonly<InferState<T>> };
export function useVariants(): {
  variants: DeepReadonly<Record<string, unknown>>;
};
export function useVariants<T extends VariantsSetup>(config?: T) {
  if (config && !isInitialized) {
    isInitialized = true;
    currentConfig = config;

    for (const [name, options] of Object.entries(config)) {
      if (options.variants.length > 0) {
        variantsState[name] = options.variants[0];
      }
    }

    window.addEventListener("keydown", handleKeydown);

    if (getCurrentInstance()) {
      onUnmounted(() => {
        window.removeEventListener("keydown", handleKeydown);
        isInitialized = false;
        currentConfig = null;
      });
    }
  }

  return {
    variants: readonly(variantsState) as DeepReadonly<InferState<T>>,
  };
}

/**
 * Initializes the singleton and returns a typed hook.
 *
 * @example
 * // create variants.ts
 * export const useAppVariants = createVariants({
 *   TaskCard:  { key: "1", variants: [true, false]    as const },
 *   TaskWidth: { key: "2", variants: ["w-32", "w-35"] as const },
 * });
 *
 * // In a component
 * import { useAppVariants } from "@/variants";
 * const { variants } = useAppVariants();
 * // variants.TaskCard  → boolean
 * // variants.TaskWidth → "w-32" | "w-35"
 */
export function createVariants<T extends VariantsSetup>(config: T) {
  useVariants(config);

  return function useTypedVariants(): { variants: DeepReadonly<InferState<T>> } {
    return useVariants() as { variants: DeepReadonly<InferState<T>> };
  };
}
