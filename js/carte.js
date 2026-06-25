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

const regionInfoEl = document.getElementById('region-info');
const regionTitle = document.getElementById('region-title');
const regionDesc = document.getElementById('region-desc');
const poiListEl = document.getElementById('region-poi-list');
const backBtn = document.getElementById('back-btn');

const tooltip = document.getElementById('map-tooltip');
const tooltipTitle = document.getElementById('tooltip-title');
const tooltipDesc = document.getElementById('tooltip-desc');

const poiDetailCard = document.getElementById('poi-detail-card');
const poiDetailName = document.getElementById('poi-detail-name');
const poiDetailDesc = document.getElementById('poi-detail-desc');
const poiDetailTag = document.getElementById('poi-detail-tag');

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
  // Always re-center: in contain mode w<=pw and h<=ph always hold, so
  // there's no overflow to pan in the first place — left/top here is
  // purely the letterbox offset, always (pw-w)/2 / (ph-h)/2. A previous
  // version instead clamped against whatever left/top was already set,
  // a leftover from an earlier cover+pan mode (since reverted) where the
  // content could be larger than the pane; against contain's always-fits
  // sizing that clamp collapsed to exactly 0 on every resize after the
  // first layout, snapping the map to the pane's left/top edge instead
  // of keeping it centered.
  worldContent.style.left = `${(pw - w) / 2}px`;
  worldContent.style.top = `${(ph - h) / 2}px`;
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
let cardDragEls = [];   // [continent-card-top, continent-card-bar], set below
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

  worldPane.addEventListener('touchend', () => {
    active = false;
    // panDidDrag is deliberately left as-is here (cleared at the start of
    // the *next* touchstart instead): the click a tap-or-drag gesture
    // produces fires asynchronously after touchend, and clearing the flag
    // on a timer risked a race against that click's own timing.
  }, { passive: true });
})();

// The top description card visually follows the finger during the swipe
// instead of only snapping once released — the bottom name/progress/zoom
// bar stays put (it's a persistent control, not "content" being swiped
// through), and the map image itself stays put too, since dragging the
// actual map would conflict with its own zoom transform.
attachDragSwipe(worldPane, {
  getDraggables: () => (isMobile() && !currentSlug) ? cardDragEls : [],
  onCommit: (direction) => (isMobile() && !currentSlug && onCardSwipe) ? onCardSwipe(direction) : false,
});

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

// Mobile-only fixed bottom card for a selected POI chip — see
// #poi-detail-card in carte.html. Steady location instead of a tooltip
// that would float to wherever the chip happened to be.
function showPoiDetailCard(title, desc, invented) {
  if (!poiDetailCard) return;
  poiDetailName.textContent = title;
  poiDetailDesc.textContent = desc;
  poiDetailTag?.classList.toggle('shown', invented);
  poiDetailCard.classList.add('active');
}

function hidePoiDetailCard() {
  poiDetailCard?.classList.remove('active');
}

function attachHoverTooltip(el, getTitle, getDesc, getInvented, { tapToShow = false } = {}) {
  // Mobile browsers commonly simulate a "hover" from a long-press (before
  // the actual tap/click fires), which without this guard popped the
  // tooltip and the region's bright border highlight open just from
  // holding a finger down — discovery on mobile is meant to happen only
  // through the swipe card / POI chips, with a tap still reaching the
  // region's own click-to-zoom listener below unaffected by this.
  el.addEventListener('mouseenter', (e) => {
    if (isMobile()) return;
    el.classList.add('hovered');
    showTooltip(getTitle(), getDesc(), e.clientX, e.clientY, getInvented());
  });
  el.addEventListener('mousemove', (e) => {
    if (isMobile()) return;
    queueTooltipMove(e.clientX, e.clientY);
  });
  el.addEventListener('mouseleave', () => {
    if (isMobile()) return;
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
  const tooltipOpen = !tooltip.classList.contains('hidden');
  const poiCardOpen = poiDetailCard?.classList.contains('active');
  if (!tooltipOpen && !poiCardOpen) return;
  hideTooltip();
  hidePoiDetailCard();
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
const markersBySlug = {}; // slug -> [<div class="poi-marker">, ...] in region.points order

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
  const markers = [];
  region.points.forEach((pt) => {
    const marker = document.createElement('div');
    marker.className = 'poi-marker' + (pt.lore ? '' : ' invented');
    marker.dataset.slug = slug;
    marker.style.left = `${(bbox.x0 + pt.x * bbox.w) * 100}%`;
    marker.style.top = `${(bbox.y0 + pt.y * bbox.h) * 100}%`;
    // No tapToShow here: on mobile the dots are too small to reliably hit,
    // so the POI chip list built in activateRegion is the only way in on
    // touch — tapping a chip highlights the matching marker below instead
    // (reusing .hovered, the same look the click handler above already
    // clears on an outside tap).
    attachHoverTooltip(marker, () => pt.name, () => pt.desc, () => !pt.lore);
    fragPoi.appendChild(marker);
    markers.push(marker);
  });
  markersBySlug[slug] = markers;
});

regionSvg.appendChild(fragSvg);
detailLayer.appendChild(fragDetail);
poiLayer.appendChild(fragPoi);

// ---------- Continent cards (mobile): swipe to preview, button to zoom ----------
// One continent highlighted at a time (the same visual state :hover gives
// on desktop), nothing drawn over the map itself — swiping moves to the
// next/previous one, and "Zoom in" is what actually commits to it
// (tapping the highlighted shape directly still works too, as a shortcut).
const cardTopEl = document.getElementById('continent-card-top');
const cardBar = document.getElementById('continent-card-bar');
const cardNameEl = document.getElementById('continent-card-name');
const cardDescEl = document.getElementById('continent-card-desc');
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
  cardDescEl.textContent = region.description;
  cardProgressEl.textContent = `${cardIndex + 1}/${regionSlugs.length}`;
}

zoomInBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  activateRegion(regionSlugs[cardIndex]);
});

if (cardBar) {
  cardDragEls = [cardTopEl].filter(Boolean);
  renderContinentCard();
  onCardSwipe = (direction) => {
    const next = Math.max(0, Math.min(cardIndex + direction, regionSlugs.length - 1));
    if (next === cardIndex) return false;
    cardIndex = next;
    renderContinentCard();
    document.getElementById("map-swipe-hint")?.classList.add("done");
    return true;
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

  // Title + POI chip list are populated before the zoom framing math below
  // so its real rendered height (the title can wrap, the chip list can
  // wrap to several rows depending on the region) is known in time to keep
  // this region's markers clear of it — populating them after, like before,
  // meant the framing always assumed the full pane was free, so a marker
  // near the top of the map (a north continent) could land right behind
  // the title bar, and one near the bottom (a south continent) right where
  // the POI detail card would pop up.
  regionTitle.textContent = region.name;
  regionDesc.textContent = region.description;
  const markers = markersBySlug[slug] || [];
  if (poiListEl) {
    poiListEl.innerHTML = '';
    region.points.forEach((pt, i) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'poi-chip' + (pt.lore ? '' : ' invented');
      chip.textContent = pt.name;
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const already = chip.classList.contains('hovered');
        poiListEl.querySelectorAll('.poi-chip.hovered').forEach((c) => c.classList.remove('hovered'));
        markers.forEach((m) => m.classList.remove('hovered'));
        hidePoiDetailCard();
        if (already) return;
        chip.classList.add('hovered');
        // Same .hovered class hovering/tapping the dot itself would have
        // used — shows where this point actually sits on the map.
        markers[i]?.classList.add('hovered');
        showPoiDetailCard(pt.name, pt.desc, !pt.lore);
      });
      poiListEl.appendChild(chip);
    });
  }

  // Fit the padded bbox inside the pane (with margin), then translate so its
  // center lands on the pane's center. transform-origin is the element's
  // top-left (0 0), and that box itself sits at (Lx,Ly) inside the pane
  // (letterbox offset from layoutWorld), so local px p maps to screen as:
  // Lx + s*p.x + dx  (and same for y).
  const W = worldContent.offsetWidth, H = worldContent.offsetHeight;
  const Lx = parseFloat(worldContent.style.left) || 0, Ly = parseFloat(worldContent.style.top) || 0;
  const PW = worldPane.clientWidth, PH = worldPane.clientHeight;

  // On mobile the title/chip block (#region-info, anchored top) and the
  // POI detail card a chip tap can open (#poi-detail-card, anchored
  // bottom) sit directly over the map rather than in an empty letterbox
  // bar the way the world view's continent card does — so the "pane"
  // markers should actually be centered/fit within is shorter than the
  // full height, by however much those two reserve.
  let topReserve = 0, bottomReserve = 0;
  if (isMobile()) {
    topReserve = regionInfoEl.offsetHeight + 28;
    // A typical short (1-3 line) description, not the detail card's full
    // 30vh cap — reserving the rare worst case measurably cost zoom level
    // on every region to guard against a description that's usually much
    // shorter than that.
    bottomReserve = Math.min(PH * 0.18, 110);
  }
  const safePH = Math.max(80, PH - topReserve - bottomReserve);
  const safeCY = topReserve + safePH / 2;

  const bboxPxW = bbox.w * W, bboxPxH = bbox.h * H;
  // Centering only moves the bbox's *center* into the safe band — it
  // doesn't stop the bbox's own top/bottom edges (where a POI marker can
  // sit, not just at its center) from reaching past that band into the
  // reserved strips once scaled. The geometric-mean "fill the pane
  // better than strict contain" fit deliberately overshoots one
  // dimension for a tighter look (that's the whole point of using it
  // instead of a strict min), and when that overshoot landed in the
  // vertical dimension, it's exactly what pushed a region's own POI
  // markers into the reserved strips or off the pane for a region near a
  // corner of the world map (Nordvinter, Contrées de Cristal) — the
  // "missing point of interest" bug. heightFitScale below is the most
  // the bbox can ever be scaled while still fitting inside safePH
  // *outright* (not just its center) — capping to it guarantees that,
  // while geoMeanScale still gets to fill the width tightly whenever
  // doing so doesn't also need more vertical room than safePH allows.
  const widthFitScale = PW / bboxPxW;
  const heightFitScale = safePH / bboxPxH;
  const geoMeanScale = Math.sqrt(widthFitScale * heightFitScale);
  const fitScale = Math.min(geoMeanScale, heightFitScale);
  const scale = Math.min(6, Math.max(1.3, 0.85 * fitScale));
  let dx = PW / 2 - Lx - scale * (bbox.cx * W);
  let dy = safeCY - Ly - scale * (bbox.cy * H);

  // Clamp so the zoom never pulls the map's actual edge in past the
  // pane's edge, which would reveal #map-stage's plain black background
  // beyond where the image actually ends — most noticeable for a region
  // near a corner of the world map, like Contrées de Cristal at the very
  // top, where centering on it alone could push the view above the map.
  // The top/bottom bounds below allow that reveal specifically within the
  // reserved strips (topReserve/bottomReserve), since the title/chip
  // block and detail card already paint over that area regardless, so
  // black space there is invisible — without this carve-out, the clamp
  // was fighting the safe-zone centering above for any region whose bbox
  // ran out of image content to push toward safeCY before its true edge
  // hit the pane's literal edge, pulling the rendering back up
  // underneath the title bar it was supposed to stay clear of.
  const maxDx = -Lx, minDx = PW - Lx - scale * W;
  if (minDx <= maxDx) dx = Math.max(minDx, Math.min(maxDx, dx));
  const maxDy = topReserve - Ly, minDy = PH - bottomReserve - Ly - scale * H;
  if (minDy <= maxDy) dy = Math.max(minDy, Math.min(maxDy, dy));

  currentSlug = slug;
  worldContent.style.transitionDuration = `${ZOOM_IN_MS}ms`;
  worldContent.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;

  // Give immediate feedback on click instead of half a second of silence:
  // the info panel is cheap now (no backdrop-filter), so it can fade in
  // right away alongside the transform.
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
  poiLayer.querySelectorAll(`.poi-marker[data-slug="${currentSlug}"]`).forEach((m) => m.classList.remove('active', 'hovered'));
  hidePoiDetailCard();
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
