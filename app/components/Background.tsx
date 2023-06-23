export function Background() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('w-full', 'h-full', 'absolute', 'z-0');
  const pattern = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'pattern',
  );
  pattern.id = 'he832y89';
  pattern.setAttribute('patternUnits', 'userSpaceOnUse');
  const circle = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'circle',
  );
  circle.setAttribute('cx', '0.7');
  circle.setAttribute('cy', '0.7');
  circle.setAttribute('r', '0.7');
  circle.style.fill = '#363636';
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.style.width = '100%';
  rect.style.height = '100%';
  // The following is required to determine how big the pattern should be so how many dots you will see
  // The size of these dot should be a repeating pattern > 10 > 11 > 15 > 10 > 13 > 17 > 11 > 15 > 20 > 13 > 17 > 22 > 30 > 40 (full zoom)
  pattern.setAttribute('height', '13');
  pattern.setAttribute('width', '13');
  rect.setAttribute('x', '0');
  rect.setAttribute('y', '0');
  rect.setAttribute('fill', 'url(#he832y89)');
  pattern.append(circle);
  svg.append(pattern);
  svg.append(rect);
  return svg;
}
