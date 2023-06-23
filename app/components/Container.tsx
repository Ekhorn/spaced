type ContainerProperties = {
  text: string;
  x: number;
  y: number;
  scale: number;
};

export function Container(properties: ContainerProperties) {
  return (
    <div
      class="absolute h-12 w-12 border"
      style={{
        translate: `${properties.x}px ${properties.y}px`,
        scale: `${properties.scale}`,
      }}
    >
      {properties.text}
    </div>
  );
}
