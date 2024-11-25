export function Background() {
  return (
    <svg class="absolute -z-50 h-full w-full">
      <pattern
        id="background"
        width="13"
        height="13"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="0.7" cy="0.7" r="0.7" fill="#363636" />
      </pattern>
      <rect x="0" y="0" fill="url(#background)" class="h-full w-full" />
    </svg>
  );
}
