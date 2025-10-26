const container = document.getElementById('map-container');
const map = document.getElementById('map');

let isDragging = false;
let startX = 0, startY = 0;
let translateX = 0, translateY = 0;
let scale = 1;

let maxScale = 3;

// For pinch zoom
let initialDistance = 0;
let initialScale = 1;

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

// Dragging with mouse
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

// ---------- Touch support ----------
container.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    // Single-finger drag
    isDragging = true;
    startX = e.touches[0].clientX - translateX;
    startY = e.touches[0].clientY - translateY;
  } else if (e.touches.length === 2) {
    // Pinch zoom
    isDragging = false;
    initialDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    initialScale = scale;
  }
});

container.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (e.touches.length === 1 && isDragging) {
    let newX = e.touches[0].clientX - startX;
    let newY = e.touches[0].clientY - startY;
    [translateX, translateY] = clampTranslate(newX, newY, scale);
    updateTransform();
  } else if (e.touches.length === 2) {
    const currentDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    let zoomFactor = currentDistance / initialDistance;
    scale = initialScale * zoomFactor;

    const minScale = getMinScale();
    scale = Math.min(maxScale, Math.max(minScale, scale));

    // Optional: zoom towards midpoint between fingers
    const rect = container.getBoundingClientRect();
    const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
    const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;

    translateX -= (midX / initialScale - midX / scale);
    translateY -= (midY / initialScale - midY / scale);

    [translateX, translateY] = clampTranslate(translateX, translateY, scale);
    updateTransform();
  }
});

window.addEventListener('touchend', (e) => {
  if (e.touches.length === 0) {
    isDragging = false;
  }
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
