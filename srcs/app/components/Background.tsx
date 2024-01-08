import { createMemo } from 'solid-js';

import { useViewport } from './ViewportProvider.jsx';

export function Background() {
  const { absoluteViewportPosition, scalar } = useViewport();

  const dist = 50;
  const offsetX = createMemo(
    () => (-absoluteViewportPosition().x % dist) * scalar(),
  );
  const offsetY = createMemo(
    () => (absoluteViewportPosition().y % dist) * scalar(),
  );
  const size = createMemo(() =>
    scalar() > 1
      ? (dist * scalar()) /
        (Math.trunc((dist * Math.log2(scalar())) / dist / 2) + 1)
      : dist * scalar(),
  );
  return (
    <svg class="absolute z-0 h-full w-full">
      <pattern
        id="background"
        x={offsetX()}
        y={offsetY()}
        width={size()}
        height={size()}
        patternUnits="userSpaceOnUse"
      >
        <circle cx="1.7" cy="1.7" r="1.7" fill="black" />
      </pattern>
      <rect
        x="0"
        y="0"
        fill="url(#background)"
        class="h-full w-full"
        shape-rendering="optimizeSpeed"
      />
    </svg>
  );
}
