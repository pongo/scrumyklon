import { reactive, readonly, onUnmounted, getCurrentInstance } from "vue";

interface VariantConfig {
  key: string;
  variants: unknown[];
}

type VariantsSetup = Record<string, VariantConfig>;

// singleton
const variantsState = reactive<Record<string, unknown>>({});
let isInitialized = false;
let currentConfig: VariantsSetup | null = null;

function shouldIgnoreTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return el.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function handleKeydown(event: KeyboardEvent) {
  if (shouldIgnoreTarget(event.target)) return;
  if (event.repeat) return;
  if (!currentConfig) return;

  for (const [name, options] of Object.entries(currentConfig)) {
    if (event.key === options.key) {
      event.preventDefault();

      const variantsArray = options.variants;
      if (!variantsArray || variantsArray.length === 0) continue;

      const currentValue = variantsState[name];
      const currentIndex = variantsArray.indexOf(currentValue);
      const nextIndex = (currentIndex + 1) % variantsArray.length;

      variantsState[name] = variantsArray[nextIndex];
    }
  }
}

export function useVariants(config?: VariantsSetup) {
  if (config && !isInitialized) {
    isInitialized = true;
    currentConfig = config;

    for (const [name, options] of Object.entries(config)) {
      if (options.variants && options.variants.length > 0) {
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
    variants: readonly(variantsState),
  };
}
