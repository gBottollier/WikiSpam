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
const poiListEl = document.getElementById('region-poi-list');
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

const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

// ---------- Layout: size world-content to its exact render box, in pixels.
// JS-measured rather than CSS percentage-of-auto, which doesn't reliably
// resolve for nested boxes.
//
// Always fits the whole map letterboxed (contain), on mobile too: seeing
// every continent's full shape and border at once turned out to matter
// more than filling the screen edge-to-edge — a cover+pan mode was tried
// here and made that impossible, since only a cropped slice is ever
// visible at a given moment. The pan-to-explore gesture further down is
// harmless dead weight in contain mode (there's no overflow to pan,
// since the whole image already fits) and is left in case a future
// pinch-zoom wants it.
function layoutWorld() {
  const pw = worldPane.clientWidth, ph = worldPane.clientHeight;
  const nw = worldImg.naturalWidth || pw, nh = worldImg.naturalHeight || ph;
  if (!pw || !ph || !nw || !nh) return;
  const scale = Math.min(pw / nw, ph / nh);
  const w = nw * scale, h = nh * scale;
  worldContent.style.width = `${w}px`;
  worldContent.style.height = `${h}px`;
  // Re-clamp rather than re-center: a resize/orientation-change shouldn't
  // throw away wherever the user had panned to.
  const prevLeft = parseFloat(worldContent.style.left);
  const prevTop = parseFloat(worldContent.style.top);
  const minLeft = Math.min(0, pw - w), minTop = Math.min(0, ph - h);
  worldContent.style.left = `${Number.isFinite(prevLeft) ? Math.max(minLeft, Math.min(0, prevLeft)) : (pw - w) / 2}px`;
  worldContent.style.top = `${Number.isFinite(prevTop) ? Math.max(minTop, Math.min(0, prevTop)) : (ph - h) / 2}px`;
}
if (worldImg.complete && worldImg.naturalWidth) layoutWorld();
else worldImg.addEventListener('load', layoutWorld);
window.addEventListener('resize', layoutWorld);

// ---------- World-view touch: swipe between continent cards (mobile) ----------
// One listener handles both jobs so a single gesture isn't read twice: a
// horizontal drag switches which continent is highlighted (see the
// continent-card section further down, which calls renderContinentCard);
// a tap still needs to reach the region polygon's click handler below, so
// a drag past a small threshold marks panDidDrag, which that handler
// checks to ignore the click a real drag produces.
let panDidDrag = false;
let onCardSwipe = null; // set once renderContinentCard exists, below
(() => {
  let active = false, startX = 0, startY = 0;

  worldPane.addEventListener('touchstart', (e) => {
    if (!isMobile() || currentSlug || e.touches.length !== 1) return;
    active = true;
    panDidDrag = false;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  worldPane.addEventListener('touchmove', (e) => {
    if (!active || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    if (!panDidDrag && Math.hypot(dx, dy) > 10) panDidDrag = true;
  }, { passive: true });

  worldPane.addEventListener('touchend', (e) => {
    if (!active) return;
    active = false;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      onCardSwipe?.(dx < 0 ? 1 : -1);
    }
    // panDidDrag is deliberately left as-is here (cleared at the start of
    // the *next* touchstart instead): the click a tap-or-drag gesture
    // produces fires asynchronously after touchend, and clearing the flag
    // on a timer risked a race against that click's own timing.
  }, { passive: true });
})();

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

function attachHoverTooltip(el, getTitle, getDesc, getInvented, { tapToShow = false } = {}) {
  el.addEventListener('mouseenter', (e) => {
    el.classList.add('hovered');
    showTooltip(getTitle(), getDesc(), e.clientX, e.clientY, getInvented());
  });
  el.addEventListener('mousemove', (e) => queueTooltipMove(e.clientX, e.clientY));
  el.addEventListener('mouseleave', () => {
    el.classList.remove('hovered');
    hideTooltip();
  });

  // Touch devices have no hover at all, so without this, tapping a POI
  // marker did nothing — there's no separate action it should trigger
  // (unlike a region polygon, which zooms on click), so tapping just
  // toggles its tooltip instead.
  if (tapToShow) {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const alreadyShown = el.classList.contains('hovered') && !tooltip.classList.contains('hidden');
      if (alreadyShown) {
        el.classList.remove('hovered');
        hideTooltip();
        return;
      }
      el.classList.add('hovered');
      const r = el.getBoundingClientRect();
      showTooltip(getTitle(), getDesc(), r.left + r.width / 2, r.top, getInvented());
    });
  }
}

// Tapping anywhere outside an open marker/POI-chip tooltip dismisses it.
// Region-shape .hovered is deliberately left alone here: on mobile it
// marks whichever continent the swipe card is currently on, a persistent
// selection rather than a transient hover state, so it shouldn't clear
// just because the user tapped elsewhere (e.g. the "Zoom in" button).
document.addEventListener('click', () => {
  if (tooltip.classList.contains('hidden')) return;
  hideTooltip();
  poiLayer.querySelectorAll('.poi-marker.hovered').forEach((m) => m.classList.remove('hovered'));
  document.querySelectorAll('.poi-chip.hovered').forEach((c) => c.classList.remove('hovered'));
});

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
const polyBySlug = {};

Object.entries(MAP_REGIONS).forEach(([slug, region]) => {
  const bbox = computeBbox(region.polygon);
  bboxes[slug] = bbox;

  // Hoverable/clickable polygon (world view)
  const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  poly.setAttribute('points', region.polygon.map(p => p.join(',')).join(' '));
  poly.classList.add('region-shape');
  poly.dataset.slug = slug;
  polyBySlug[slug] = poly;
  attachHoverTooltip(poly, () => region.name, () => region.description, () => false);
  poly.addEventListener('click', () => {
    // A pan gesture that happened to end over a polygon shouldn't also
    // zoom into it.
    if (panDidDrag) return;
    activateRegion(slug);
  });
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
    attachHoverTooltip(marker, () => pt.name, () => pt.desc, () => !pt.lore, { tapToShow: true });
    fragPoi.appendChild(marker);
  });
});

regionSvg.appendChild(fragSvg);
detailLayer.appendChild(fragDetail);
poiLayer.appendChild(fragPoi);

// ---------- Continent cards (mobile): swipe to preview, button to zoom ----------
// One continent highlighted at a time (the same visual state :hover gives
// on desktop), nothing drawn over the map itself — swiping moves to the
// next/previous one, and "Zoom in" is what actually commits to it
// (tapping the highlighted shape directly still works too, as a shortcut).
const cardBar = document.getElementById('continent-card-bar');
const cardNameEl = document.getElementById('continent-card-name');
const cardProgressEl = document.getElementById('continent-card-progress');
const zoomInBtn = document.getElementById('continent-zoom-in');
const regionSlugs = Object.keys(MAP_REGIONS);
let cardIndex = 0;

function renderContinentCard() {
  const slug = regionSlugs[cardIndex];
  const region = MAP_REGIONS[slug];
  regionSvg.querySelectorAll('.region-shape.hovered').forEach((p) => p.classList.remove('hovered'));
  polyBySlug[slug].classList.add('hovered');
  cardNameEl.textContent = region.name;
  cardProgressEl.textContent = `${cardIndex + 1}/${regionSlugs.length}`;
}

zoomInBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  activateRegion(regionSlugs[cardIndex]);
});

if (cardBar) {
  renderContinentCard();
  onCardSwipe = (direction) => {
    cardIndex = Math.max(0, Math.min(cardIndex + direction, regionSlugs.length - 1));
    renderContinentCard();
  };
}

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
  let dx = PW / 2 - Lx - scale * (bbox.cx * W);
  let dy = PH / 2 - Ly - scale * (bbox.cy * H);

  // Clamp so the zoom never pulls the map's actual edge in past the
  // pane's edge, which would reveal #map-stage's plain black background
  // beyond where the image actually ends — most noticeable for a region
  // near a corner of the world map, like Contrées de Cristal at the very
  // top, where centering on it alone could push the view above the map.
  const maxDx = -Lx, minDx = PW - Lx - scale * W;
  if (minDx <= maxDx) dx = Math.max(minDx, Math.min(maxDx, dx));
  const maxDy = -Ly, minDy = PH - Ly - scale * H;
  if (minDy <= maxDy) dy = Math.max(minDy, Math.min(maxDy, dy));

  currentSlug = slug;
  worldContent.style.transitionDuration = `${ZOOM_IN_MS}ms`;
  worldContent.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;

  // Give immediate feedback on click instead of half a second of silence:
  // the info panel is cheap now (no backdrop-filter), so it can fade in
  // right away alongside the transform.
  regionTitle.textContent = region.name;
  regionDesc.textContent = region.description;
  mapStage.classList.add('zoomed');

  // Mobile POI chip list: a reliable way to reach each marker's tooltip
  // that doesn't depend on accurately tapping a small dot on the image.
  if (poiListEl) {
    poiListEl.innerHTML = '';
    region.points.forEach((pt) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'poi-chip' + (pt.lore ? '' : ' invented');
      chip.textContent = pt.name;
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const already = chip.classList.contains('hovered');
        poiListEl.querySelectorAll('.poi-chip.hovered').forEach((c) => c.classList.remove('hovered'));
        if (already) { hideTooltip(); return; }
        chip.classList.add('hovered');
        const r = chip.getBoundingClientRect();
        showTooltip(pt.name, pt.desc, r.left + r.width / 2, r.top, !pt.lore);
      });
      poiListEl.appendChild(chip);
    });
  }

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
  // Keep the card bar in sync in case the zoom was triggered by tapping a
  // shape directly rather than via the card + "Zoom in" button — without
  // this, swiping after returning would resume from a stale index.
  if (cardBar) {
    const slugPos = regionSlugs.indexOf(currentSlug);
    if (slugPos !== -1) cardIndex = slugPos;
  }
  deactivateCurrent();
  mapStage.classList.remove('zoomed');
  worldContent.style.transitionDuration = `${ZOOM_OUT_MS}ms`;
  worldContent.style.transform = 'scale(1)';
  // Bring the hoverable overlay back, and re-highlight the current card's
  // continent, only once the zoom-out transform has finished, for the
  // same reason the overlay was hidden going in.
  setTimeout(() => {
    regionSvg.classList.remove('zoomed-in');
    if (cardBar) renderContinentCard();
  }, ZOOM_OUT_MS + 20);
}

backBtn.addEventListener('click', resetZoom);
