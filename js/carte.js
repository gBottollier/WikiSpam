// Interactive world map: hover continents for an overview, click to zoom in
// directly on the world image and reveal lore-deduced points of interest,
// without ever hiding the rest of the map.

const mapStage = document.getElementById('map-stage');
const worldPane = document.getElementById('world-pane');
const worldContent = document.getElementById('world-content');
const worldImg = document.getElementById('world-img');
const detailLayer = document.getElementById('region-detail-layer');
const regionSvg = document.getElementById('region-svg');
const poiLayer = document.getElementById('poi-layer');

const regionTitle = document.getElementById('region-title');
const regionDesc = document.getElementById('region-desc');
const backBtn = document.getElementById('back-btn');

const tooltip = document.getElementById('map-tooltip');
const tooltipTitle = document.getElementById('tooltip-title');
const tooltipDesc = document.getElementById('tooltip-desc');

const ZOOM_IN_MS = 1500;
const ZOOM_OUT_MS = 500;

let currentSlug = null;
let zoomRevealTimer = null;
const detailImgs = {};   // slug -> <img class="region-detail">
const bboxes = {};       // slug -> {x0,y0,w,h} normalized over world-img, 8% padded (matches the crop export)

// ---------- Layout: fit world.webp inside its pane (letterboxed) and size
// world-content to its exact render box, in pixels. JS-measured rather than
// CSS percentage-of-auto, which doesn't reliably resolve for nested boxes.
function layoutWorld() {
  const pw = worldPane.clientWidth, ph = worldPane.clientHeight;
  const nw = worldImg.naturalWidth || pw, nh = worldImg.naturalHeight || ph;
  if (!pw || !ph || !nw || !nh) return;
  const scale = Math.min(pw / nw, ph / nh);
  const w = nw * scale, h = nh * scale;
  worldContent.style.width = `${w}px`;
  worldContent.style.height = `${h}px`;
  worldContent.style.left = `${(pw - w) / 2}px`;
  worldContent.style.top = `${(ph - h) / 2}px`;
}
if (worldImg.complete && worldImg.naturalWidth) layoutWorld();
else worldImg.addEventListener('load', layoutWorld);
window.addEventListener('resize', layoutWorld);

// ---------- Tooltip ----------
// Tooltip size only changes when its text changes (on show), never on plain
// mouse movement, so the size is measured once and reused — calling
// getBoundingClientRect() on every mousemove forces a synchronous layout
// reflow dozens of times a second and was the main source of hover lag.
let tooltipSize = { width: 0, height: 0 };
let moveRAF = null;
let pendingMove = null;

function showTooltip(title, desc, clientX, clientY, invented) {
  tooltipTitle.textContent = title;
  tooltipDesc.textContent = desc;
  let tag = tooltip.querySelector('.invented-tag');
  if (invented) {
    if (!tag) {
      tag = document.createElement('span');
      tag.className = 'invented-tag';
      tooltip.appendChild(tag);
    }
    tag.textContent = 'Lieu supposé (non confirmé par le lore)';
  } else if (tag) {
    tag.remove();
  }
  tooltip.classList.remove('hidden');
  const rect = tooltip.getBoundingClientRect();
  tooltipSize = { width: rect.width, height: rect.height };
  positionTooltip(clientX, clientY);
}

function positionTooltip(clientX, clientY) {
  const margin = 18;
  let x = clientX + margin;
  let y = clientY + margin;
  if (x + tooltipSize.width > window.innerWidth - 10) x = clientX - tooltipSize.width - margin;
  if (y + tooltipSize.height > window.innerHeight - 10) y = clientY - tooltipSize.height - margin;
  tooltip.style.left = `${Math.max(10, x)}px`;
  tooltip.style.top = `${Math.max(10, y)}px`;
}

function queueTooltipMove(clientX, clientY) {
  pendingMove = { clientX, clientY };
  if (moveRAF) return;
  moveRAF = requestAnimationFrame(() => {
    moveRAF = null;
    if (pendingMove) positionTooltip(pendingMove.clientX, pendingMove.clientY);
  });
}

function hideTooltip() {
  tooltip.classList.add('hidden');
}

function attachHoverTooltip(el, getTitle, getDesc, getInvented) {
  el.addEventListener('mouseenter', (e) => {
    el.classList.add('hovered');
    showTooltip(getTitle(), getDesc(), e.clientX, e.clientY, getInvented());
  });
  el.addEventListener('mousemove', (e) => queueTooltipMove(e.clientX, e.clientY));
  el.addEventListener('mouseleave', () => {
    el.classList.remove('hovered');
    hideTooltip();
  });
}

// ---------- Bounding boxes (8% padded), matching the offline crop export ----------
function computeBbox(polygon) {
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  polygon.forEach(([x, y]) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  });
  const padX = (maxX - minX) * 0.08, padY = (maxY - minY) * 0.08;
  const x0 = Math.max(0, minX - padX), x1 = Math.min(1, maxX + padX);
  const y0 = Math.max(0, minY - padY), y1 = Math.min(1, maxY + padY);
  const w = x1 - x0, h = y1 - y0;
  return { x0, y0, w, h, cx: x0 + w / 2, cy: y0 + h / 2 };
}

// ---------- Build world overlay: polygons, detail images, POI markers ----------
const fragSvg = document.createDocumentFragment();
const fragDetail = document.createDocumentFragment();
const fragPoi = document.createDocumentFragment();

Object.entries(MAP_REGIONS).forEach(([slug, region]) => {
  const bbox = computeBbox(region.polygon);
  bboxes[slug] = bbox;

  // Hoverable/clickable polygon (world view)
  const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  poly.setAttribute('points', region.polygon.map(p => p.join(',')).join(' '));
  poly.classList.add('region-shape');
  poly.dataset.slug = slug;
  attachHoverTooltip(poly, () => region.name, () => region.description, () => false);
  poly.addEventListener('click', () => activateRegion(slug));
  fragSvg.appendChild(poly);

  // High-detail crop, lazily sourced, positioned over its own footprint
  const detail = document.createElement('img');
  detail.className = 'region-detail';
  detail.alt = region.name;
  detail.style.left = `${bbox.x0 * 100}%`;
  detail.style.top = `${bbox.y0 * 100}%`;
  detail.style.width = `${bbox.w * 100}%`;
  detail.style.height = `${bbox.h * 100}%`;
  detailImgs[slug] = detail;
  fragDetail.appendChild(detail);

  // Points of interest, placed in world-space via the region bbox
  region.points.forEach((pt) => {
    const marker = document.createElement('div');
    marker.className = 'poi-marker' + (pt.lore ? '' : ' invented');
    marker.dataset.slug = slug;
    marker.style.left = `${(bbox.x0 + pt.x * bbox.w) * 100}%`;
    marker.style.top = `${(bbox.y0 + pt.y * bbox.h) * 100}%`;
    attachHoverTooltip(marker, () => pt.name, () => pt.desc, () => !pt.lore);
    fragPoi.appendChild(marker);
  });
});

regionSvg.appendChild(fragSvg);
detailLayer.appendChild(fragDetail);
poiLayer.appendChild(fragPoi);

// ---------- Zoom in / out ----------
function activateRegion(slug) {
  if (currentSlug === slug) return;
  if (zoomRevealTimer) { clearTimeout(zoomRevealTimer); zoomRevealTimer = null; }
  if (currentSlug) deactivateCurrent();

  // Drop any hover state (and its filter:drop-shadow) before the zoom
  // transition starts. A filter on a descendant of an element being
  // transform-animated forces per-frame software recompositing and is the
  // main cause of jank while zooming in.
  hideTooltip();
  regionSvg.querySelectorAll('.region-shape.hovered').forEach((p) => p.classList.remove('hovered'));
  regionSvg.classList.add('zoomed-in');

  const region = MAP_REGIONS[slug];
  const bbox = bboxes[slug];

  // Fit the padded bbox inside the pane (with margin), then translate so its
  // center lands on the pane's center. transform-origin is the element's
  // top-left (0 0), and that box itself sits at (Lx,Ly) inside the pane
  // (letterbox offset from layoutWorld), so local px p maps to screen as:
  // Lx + s*p.x + dx  (and same for y).
  const W = worldContent.offsetWidth, H = worldContent.offsetHeight;
  const Lx = parseFloat(worldContent.style.left) || 0, Ly = parseFloat(worldContent.style.top) || 0;
  const PW = worldPane.clientWidth, PH = worldPane.clientHeight;
  const bboxPxW = bbox.w * W, bboxPxH = bbox.h * H;
  // Geometric mean of the two fit ratios: fills the pane better than a
  // strict "contain" fit for elongated regions (Hadeir, Lumethia), while a
  // hard cap keeps small regions (Nordvinter) from zooming in absurdly far.
  const fitRatio = Math.sqrt((PW / bboxPxW) * (PH / bboxPxH));
  const scale = Math.min(6, Math.max(1.3, 0.8 * fitRatio));
  const dx = PW / 2 - Lx - scale * (bbox.cx * W);
  const dy = PH / 2 - Ly - scale * (bbox.cy * H);

  currentSlug = slug;
  worldContent.style.transitionDuration = `${ZOOM_IN_MS}ms`;
  worldContent.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;

  // Give immediate feedback on click instead of half a second of silence:
  // the info panel is cheap now (no backdrop-filter), so it can fade in
  // right away alongside the transform.
  regionTitle.textContent = region.name;
  regionDesc.textContent = region.description;
  mapStage.classList.add('zoomed');

  // Start loading/decoding the detail image now, in parallel with the zoom,
  // rather than only at reveal time. The first time a region is opened, the
  // browser hasn't decoded this image yet — fading its opacity in before
  // decoding finishes makes it pop in part-way, which is what read as a
  // laggy reveal. Waiting for decode() (cheap no-op on repeat visits, since
  // it's already cached/decoded by then) guarantees the fade-in itself is
  // just a plain compositor opacity change.
  const detail = detailImgs[slug];
  if (!detail.src) detail.src = `img/map/region-${slug}.webp`;
  const ready = detail.decode ? detail.decode().catch(() => {}) : Promise.resolve();

  const reveal = () => {
    if (currentSlug !== slug) return;
    detail.classList.add('active');
    poiLayer.querySelectorAll(`.poi-marker[data-slug="${slug}"]`).forEach((m) => {
      m.style.setProperty('--poi-scale', 1 / scale);
      m.classList.add('active');
    });
  };
  // Wait for the transform to fully settle before popping the overlay in:
  // revealing it while the map is still visibly scaling makes an instant,
  // non-animated appearance read as a soft fade, since it's blending with
  // the ongoing motion.
  zoomRevealTimer = setTimeout(() => { ready.then(reveal); }, ZOOM_IN_MS + 20);
}

function deactivateCurrent() {
  if (!currentSlug) return;
  detailImgs[currentSlug].classList.remove('active');
  poiLayer.querySelectorAll(`.poi-marker[data-slug="${currentSlug}"]`).forEach((m) => m.classList.remove('active'));
  currentSlug = null;
}

function resetZoom() {
  if (zoomRevealTimer) { clearTimeout(zoomRevealTimer); zoomRevealTimer = null; }
  if (!currentSlug) return;
  hideTooltip();
  deactivateCurrent();
  mapStage.classList.remove('zoomed');
  worldContent.style.transitionDuration = `${ZOOM_OUT_MS}ms`;
  worldContent.style.transform = 'scale(1)';
  // Bring the hoverable overlay back only once the zoom-out transform has
  // finished, for the same reason it was hidden going in.
  setTimeout(() => regionSvg.classList.remove('zoomed-in'), ZOOM_OUT_MS + 20);
}

backBtn.addEventListener('click', resetZoom);
