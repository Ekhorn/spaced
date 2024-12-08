import { createSignal, onCleanup, onMount } from 'solid-js';

export function useRequestRerender() {
  const [rerender, setRerender] = createSignal(1);
  let animationFrameIdRef: number;

  const clearAnimationFrame = () => {
    if (animationFrameIdRef) {
      cancelAnimationFrame(animationFrameIdRef);
      animationFrameIdRef = 0;
    }
  };

  onMount(() => clearAnimationFrame());

  return (immediately = false) => {
    if (immediately) {
      setRerender((prev) => prev + 1);
      return;
    }

    if (animationFrameIdRef) {
      return;
    }

    animationFrameIdRef = requestAnimationFrame(rerender);
  };
}

export function useOnResize<T extends HTMLElement>(
  ref: T,
  onResize: () => void,
) {
  const [observer] = createSignal(new ResizeObserver(() => onResize()));

  onMount(() => {
    if (!ref) {
      return;
    }

    observer().observe(ref);
    onCleanup(() => {
      observer().unobserve(ref);
    });
  });
}
