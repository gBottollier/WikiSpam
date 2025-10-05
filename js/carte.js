const container = document.getElementById('map-container');
const map = document.getElementById('map');

let isDragging = false;
let startX = 0, startY = 0;
let translateX = 0, translateY = 0;
let scale = 1;

let maxScale = 3;

// Dynamically calculate min scale to fit container
function getMinScale() {
  const scaleX = container.offsetWidth / map.offsetWidth;
  const scaleY = container.offsetHeight / map.offsetHeight;
  return Math.max(scaleX, scaleY); // ensures map always covers container
}

function clampTranslate(x, y, scale) {
  const mapWidth = map.offsetWidth * scale;
  const mapHeight = map.offsetHeight * scale;
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;

  const minX = Math.min(0, containerWidth - mapWidth);
  const maxX = 0;
  const minY = Math.min(0, containerHeight - mapHeight);
  const maxY = 0;

  return [
    Math.min(maxX, Math.max(minX, x)),
    Math.min(maxY, Math.max(minY, y))
  ];
}

// Disable default image drag
map.ondragstart = () => false;

// Dragging
container.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX - translateX;
  startY = e.clientY - translateY;
  container.style.cursor = 'grabbing';
});

window.addEventListener('mouseup', () => {
  isDragging = false;
  container.style.cursor = 'grab';
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  e.preventDefault();
  let newX = e.clientX - startX;
  let newY = e.clientY - startY;
  [translateX, translateY] = clampTranslate(newX, newY, scale);
  updateTransform();
});

// Zoom with mouse wheel
container.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomFactor = 0.1;
  const oldScale = scale;

  const minScale = getMinScale();

  if (e.deltaY < 0) scale *= 1 + zoomFactor; // zoom in
  else scale *= 1 - zoomFactor; // zoom out

  scale = Math.min(maxScale, Math.max(minScale, scale));

  // Zoom towards cursor
  const rect = container.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const offsetY = e.clientY - rect.top;

  translateX -= (offsetX / oldScale - offsetX / scale);
  translateY -= (offsetY / oldScale - offsetY / scale);

  // Clamp translation after zoom
  [translateX, translateY] = clampTranslate(translateX, translateY, scale);
  updateTransform();
});

function updateTransform() {
  map.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

// Initialize scale to fit screen
window.addEventListener('load', () => {
  scale = getMinScale();
  translateX = 0;
  translateY = 0;
  updateTransform();
});

// Adjust min scale if window is resized
window.addEventListener('resize', () => {
  const minScale = getMinScale();
  if (scale < minScale) scale = minScale;
  [translateX, translateY] = clampTranslate(translateX, translateY, scale);
  updateTransform();
});
