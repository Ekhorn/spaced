import type { Vec2D } from '../lib/vector.js';

type ContainerProperties = {
  text: string;
  translation: Vec2D;
  scale: number;
};
let ref: HTMLDivElement;

export function Container(properties: ContainerProperties) {
  return (
    <div
      ref={ref}
      class="absolute h-12 w-12 rounded border bg-white"
      style={{
        'transform-origin': 'top left',
        translate: `
          ${properties.translation.x}px
          ${-properties.translation.y}px
        `,
        scale: `${properties.scale}`,
      }}
    >
      {properties.text}
    </div>
  );
}
