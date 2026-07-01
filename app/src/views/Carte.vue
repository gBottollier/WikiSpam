<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { MAP_REGIONS } from '../data/mapData.js'
import { asset } from '../lib/assets.js'

const regions = Object.entries(MAP_REGIONS).map(([key, v]) => ({ key, ...v }))
const worldImg = asset('img/map/world.webp')

// Bounding boxes (8% padded) — identiques à l'export des crops de région.
function computeBbox(polygon) {
  let minX = 1, minY = 1, maxX = 0, maxY = 0
  for (const [x, y] of polygon) {
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  const padX = (maxX - minX) * 0.08, padY = (maxY - minY) * 0.08
  const x0 = Math.max(0, minX - padX), x1 = Math.min(1, maxX + padX)
  const y0 = Math.max(0, minY - padY), y1 = Math.min(1, maxY + padY)
  const w = x1 - x0, h = y1 - y0
  return { x0, y0, w, h, cx: x0 + w / 2, cy: y0 + h / 2 }
}
const bboxes = {}
regions.forEach((r) => { bboxes[r.key] = computeBbox(r.polygon) })

const ZOOM_IN_MS = 1400
const ZOOM_OUT_MS = 500

// Refs / état
const paneEl = ref(null)
const worldImgEl = ref(null)
const world = reactive({ w: 0, h: 0, lx: 0, ly: 0 })
const transform = ref('scale(1)')
const transMs = ref(0)
const currentSlug = ref(null)
const revealed = ref(null)
const curScale = ref(1)
const hoveredKey = ref(null)
const activePoi = ref(null)          // index dans la région courante
const loaded = reactive({})          // slug -> true (détail chargé)
let revealTimer = null, ro = null

const hovered = computed(() => regions.find((r) => r.key === hoveredKey.value) || null)
const current = computed(() => regions.find((r) => r.key === currentSlug.value) || null)
const activePoiObj = computed(() =>
  current.value && activePoi.value !== null ? current.value.points[activePoi.value] : null
)

const contentStyle = computed(() => ({
  width: world.w + 'px',
  height: world.h + 'px',
  left: world.lx + 'px',
  top: world.ly + 'px',
  transform: transform.value,
  transitionDuration: transMs.value + 'ms',
}))

function polyPoints(r) {
  return r.polygon.map((p) => `${(p[0] * 100).toFixed(2)},${(p[1] * 100).toFixed(2)}`).join(' ')
}
function regionImg(r) { return asset(`img/map/region-${r.slug || r.key}.webp`) }
function detailStyle(r) {
  const b = bboxes[r.key]
  return { left: b.x0 * 100 + '%', top: b.y0 * 100 + '%', width: b.w * 100 + '%', height: b.h * 100 + '%' }
}
function markerStyle(r, p) {
  const b = bboxes[r.key]
  const s = r.key === currentSlug.value ? 1 / curScale.value : 1
  return {
    left: (b.x0 + p.x * b.w) * 100 + '%',
    top: (b.y0 + p.y * b.h) * 100 + '%',
    transform: `translate(-50%, -50%) scale(${s})`,
  }
}

function layoutWorld() {
  const pane = paneEl.value, img = worldImgEl.value
  if (!pane || !img) return
  const pw = pane.clientWidth, ph = pane.clientHeight
  const nw = img.naturalWidth || pw, nh = img.naturalHeight || ph
  if (!pw || !ph || !nw || !nh) return
  const scale = Math.min(pw / nw, ph / nh)
  world.w = nw * scale
  world.h = nh * scale
  world.lx = (pw - world.w) / 2
  world.ly = (ph - world.h) / 2
}

function activateRegion(slug) {
  if (currentSlug.value === slug) return
  if (revealTimer) { clearTimeout(revealTimer); revealTimer = null }
  revealed.value = null
  hoveredKey.value = null
  activePoi.value = null

  const b = bboxes[slug]
  const W = world.w, H = world.h, Lx = world.lx, Ly = world.ly
  const pane = paneEl.value
  const PW = pane.clientWidth, PH = pane.clientHeight

  const bboxPxW = b.w * W, bboxPxH = b.h * H
  const widthFitScale = PW / bboxPxW
  const heightFitScale = PH / bboxPxH
  const geoMeanScale = Math.sqrt(widthFitScale * heightFitScale)
  const fitScale = Math.min(geoMeanScale, heightFitScale)
  const scale = Math.min(6, Math.max(1.3, 0.85 * fitScale))
  let dx = PW / 2 - Lx - scale * (b.cx * W)
  let dy = PH / 2 - Ly - scale * (b.cy * H)

  const maxDx = -Lx, minDx = PW - Lx - scale * W
  if (minDx <= maxDx) dx = Math.max(minDx, Math.min(maxDx, dx))
  const maxDy = -Ly, minDy = PH - Ly - scale * H
  if (minDy <= maxDy) dy = Math.max(minDy, Math.min(maxDy, dy))

  loaded[slug] = true
  curScale.value = scale
  currentSlug.value = slug
  transMs.value = ZOOM_IN_MS
  transform.value = `translate(${dx}px, ${dy}px) scale(${scale})`

  revealTimer = setTimeout(() => {
    if (currentSlug.value === slug) revealed.value = slug
  }, ZOOM_IN_MS + 20)
}

function resetZoom() {
  if (revealTimer) { clearTimeout(revealTimer); revealTimer = null }
  revealed.value = null
  activePoi.value = null
  currentSlug.value = null
  transMs.value = ZOOM_OUT_MS
  transform.value = 'scale(1)'
}

function selectPoi(i) {
  activePoi.value = activePoi.value === i ? null : i
}

onMounted(() => {
  const img = worldImgEl.value
  if (img && img.complete && img.naturalWidth) layoutWorld()
  ro = new ResizeObserver(() => { if (!currentSlug.value) layoutWorld() })
  if (paneEl.value) ro.observe(paneEl.value)
})
onBeforeUnmount(() => { ro && ro.disconnect(); clearTimeout(revealTimer) })
</script>

<template>
  <div class="map-stage" :class="{ zoomed: currentSlug }">
    <h1 v-if="!currentSlug" class="carte-title">Carte du Monde</h1>
    <p v-if="!currentSlug" class="carte-hint">
      <span class="d">Survolez un continent pour le découvrir, cliquez pour zoomer.</span>
      <span class="m">Touchez un continent pour zoomer.</span>
    </p>

    <div ref="paneEl" class="world-pane">
      <div class="world-content" :style="contentStyle">
        <img ref="worldImgEl" :src="worldImg" alt="Carte du monde" class="world-img" draggable="false" @load="layoutWorld">

        <!-- Crops de détail par région -->
        <img
          v-for="r in regions"
          :key="'d-' + r.key"
          class="region-detail"
          :class="{ active: revealed === r.key }"
          :src="loaded[r.key] ? regionImg(r) : null"
          :alt="r.name"
          :style="detailStyle(r)"
          draggable="false"
        >

        <!-- Polygones cliquables (vue monde) -->
        <svg class="region-svg" :class="{ hidden: currentSlug }" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon
            v-for="r in regions"
            :key="'p-' + r.key"
            :points="polyPoints(r)"
            class="region-poly"
            :class="{ hot: hoveredKey === r.key }"
            @mouseenter="hoveredKey = r.key"
            @mouseleave="hoveredKey = null"
            @click="activateRegion(r.key)"
          />
        </svg>

        <!-- Marqueurs POI -->
        <template v-for="r in regions" :key="'m-' + r.key">
          <button
            v-for="(p, i) in r.points"
            :key="'m-' + r.key + '-' + i"
            class="poi-marker"
            :class="{ shown: revealed === r.key, active: currentSlug === r.key && activePoi === i, invented: !p.lore }"
            :style="markerStyle(r, p)"
            :title="p.name"
            @click="selectPoi(i)"
          ><span class="poi-dot"></span></button>
        </template>
      </div>
    </div>

    <!-- Vue monde : info survol -->
    <div v-if="!currentSlug" class="world-hint">
      <template v-if="hovered"><h2>{{ hovered.name }}</h2><p>{{ hovered.description }}</p></template>
      <p v-else class="muted">Survolez ou touchez un continent.</p>
    </div>

    <!-- Vue zoomée : overlays -->
    <button v-if="current" class="back-btn" @click="resetZoom">← Carte</button>

    <aside v-if="current" class="panel panel-left">
      <h4>Lieux d'intérêt</h4>
      <div class="poi-list">
        <button
          v-for="(p, i) in current.points"
          :key="i"
          class="poi-btn"
          :class="{ active: activePoi === i, invented: !p.lore }"
          @click="selectPoi(i)"
        ><span class="poi-btn-dot"></span>{{ p.name }}</button>
      </div>
    </aside>

    <aside v-if="current" class="panel panel-right">
      <template v-if="activePoiObj">
        <h3>{{ activePoiObj.name }}</h3>
        <p>{{ activePoiObj.desc }}</p>
        <span v-if="!activePoiObj.lore" class="invented-tag">Lieu supposé (non confirmé par le lore)</span>
      </template>
      <template v-else>
        <h3>{{ current.name }}</h3>
        <p>{{ current.description }}</p>
        <p class="muted">Sélectionnez un lieu.</p>
      </template>
    </aside>
  </div>
</template>

<style scoped>
.map-stage {
  position: relative;
  max-width: 1600px;
  margin: 0 auto;
  padding: clamp(14px, 3vw, 34px) clamp(10px, 3vw, 36px) 24px;
}
.carte-title { text-align: center; font-size: clamp(1.7rem, 5vw, 2.8rem); text-shadow: 0 0 14px var(--accent-bright); margin: 0 0 6px; }
.carte-hint { text-align: center; color: #9fc4ec; margin: 0 0 14px; }
.carte-hint .m { display: none; }
@media (hover: none) { .carte-hint .d { display: none; } .carte-hint .m { display: inline; } }

/* Pane = fenêtre fixe dans laquelle la carte zoome (aucun scroll) */
.world-pane {
  position: relative;
  width: 100%;
  height: calc(100vh - var(--nav-h) - 150px);
  min-height: 320px;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid var(--glass-border);
  box-shadow: 0 0 26px rgba(126, 63, 242, 0.25);
  background: #05030f;
}
.world-content {
  position: absolute;
  transform-origin: 0 0;
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.15, 1);
  will-change: transform;
}
.world-img { width: 100%; height: 100%; display: block; user-select: none; }

.region-detail {
  position: absolute;
  object-fit: fill;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.4s ease;
}
.region-detail.active { opacity: 1; }

.region-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.region-svg.hidden { pointer-events: none; opacity: 0; }
.region-poly { fill: rgba(0, 180, 255, 0); stroke: rgba(0, 180, 255, 0); stroke-width: 0.4; cursor: pointer; transition: fill 0.2s, stroke 0.2s; }
.region-poly:hover, .region-poly.hot { fill: rgba(0, 180, 255, 0.22); stroke: var(--cyan); }

.poi-marker {
  position: absolute;
  width: 26px; height: 26px;
  background: none; border: none; padding: 0; cursor: pointer;
  opacity: 0; pointer-events: none;
  transition: opacity 0.35s ease;
}
.poi-marker.shown { opacity: 1; pointer-events: auto; }
.poi-dot { display: block; width: 14px; height: 14px; margin: 6px; border-radius: 50%; background: var(--cyan); box-shadow: 0 0 10px var(--cyan); transition: transform 0.2s, background 0.2s; }
.poi-marker:hover .poi-dot { transform: scale(1.4); }
.poi-marker.active .poi-dot { background: #fff; transform: scale(1.6); box-shadow: 0 0 16px var(--cyan); }
.poi-marker.invented .poi-dot { background: var(--accent-bright); box-shadow: 0 0 10px var(--accent-bright); }

/* World hover info */
.world-hint {
  background: var(--bg-dark);
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  padding: 16px 20px;
  margin-top: 16px;
  min-height: 76px;
}
.world-hint h2 { color: var(--accent); margin: 0 0 6px; font-size: 1.25rem; }
.world-hint p { color: var(--text); line-height: 1.55; margin: 0; }
.muted { color: #7fa8d8; }

/* Overlays en vue zoomée */
.back-btn {
  position: absolute;
  top: clamp(18px, 4vw, 44px);
  left: clamp(16px, 4vw, 46px);
  z-index: 20;
  background: rgba(10, 0, 40, 0.75);
  border: 1px solid var(--glass-border);
  color: var(--accent);
  border-radius: 10px;
  padding: 9px 16px;
  cursor: pointer;
  font-weight: 700;
  backdrop-filter: blur(8px);
}
.back-btn:hover { box-shadow: 0 0 12px rgba(0, 180, 255, 0.4); color: #fff; }

.panel {
  position: absolute;
  z-index: 15;
  background: rgba(8, 2, 26, 0.82);
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  padding: 16px;
  backdrop-filter: blur(10px);
  max-height: calc(100% - 120px);
  overflow-y: auto;
}
.panel-left { left: clamp(16px, 4vw, 46px); top: 50%; transform: translateY(-50%); width: min(230px, 34vw); }
.panel-right { right: clamp(16px, 4vw, 46px); top: 50%; transform: translateY(-50%); width: min(320px, 40vw); }
.panel h4, .panel h3 { color: var(--accent); margin: 0 0 12px; }
.panel p { color: var(--text); line-height: 1.6; }
.poi-list { display: flex; flex-direction: column; gap: 8px; }
.poi-btn { display: flex; align-items: center; gap: 10px; text-align: left; background: rgba(255,255,255,0.04); border: 1px solid var(--glass-border); border-radius: 10px; color: var(--text); padding: 9px 12px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s ease; }
.poi-btn:hover { border-color: rgba(0, 180, 255, 0.5); }
.poi-btn.active { background: rgba(0, 180, 255, 0.16); border-color: rgba(0, 180, 255, 0.6); color: #fff; }
.poi-btn-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--cyan); box-shadow: 0 0 8px var(--cyan); flex: 0 0 auto; }
.poi-btn.invented .poi-btn-dot { background: var(--accent-bright); box-shadow: 0 0 8px var(--accent-bright); }
.invented-tag { display: inline-block; margin-top: 10px; font-size: 0.78rem; color: #d7b6ff; border: 1px dashed rgba(126, 63, 242, 0.6); border-radius: 8px; padding: 2px 8px; }

/* Mobile : panneaux en bas, plus compacts */
@media (max-width: 900px) {
  .world-pane { height: calc(100vh - var(--bottom-nav-h) - 160px); }
  .panel-left, .panel-right {
    top: auto; transform: none;
    bottom: 12px;
    max-height: 34%;
    width: calc(50% - 20px);
  }
  .panel-left { left: 12px; }
  .panel-right { right: 12px; }
}
</style>
