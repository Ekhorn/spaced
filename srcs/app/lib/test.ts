export function generateRandomItemList(items: number, area = 1000, text = '') {
  return Array.from({ length: items }).map((_, index) => ({
    id: index,
    x: Math.round(Math.random() * area),
    y: -Math.round(Math.random() * area),
    text,
  }));
}
