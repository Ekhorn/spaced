export function debounce(
  cb: (...args: unknown[]) => void,
  delay = 1000,
): (...args: unknown[]) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      cb(...args);
    }, delay);
  };
}
