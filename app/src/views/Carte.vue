<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { MAP_REGIONS } from '../data/mapData.js'
import { asset } from '../lib/assets.js'

const regions = Object.entries(MAP_REGIONS).map(([key, v]) => ({ key, ...v }))
const worldImg = asset('img/map/world.webp')

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

const paneEl = ref(null)
const worldImgEl = ref(null)
const world = reactive({ w: 0, h: 0, lx: 0, ly: 0 })
const transform = ref('scale(1)')
const transMs = ref(0)
const currentSlug = ref(null)
const revealed = ref(null)
const curScale = ref(1)
const hoveredKey = ref(null)
const activePoi = ref(null)
const loaded = reactive({})
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

// Cadrage d'une région — réutilisable au resize.
// On réserve la place du panneau de description (à droite sur PC, en bas sur
// mobile) pour que la région soit cadrée dans la zone RESTÉE VISIBLE, et on
// utilise un "contain" strict pour que toute la région + tous ses POI tiennent.
function frameRegion(slug, animate) {
  const b = bboxes[slug]
  const W = world.w, H = world.h, Lx = world.lx, Ly = world.ly
  const pane = paneEl.value
  const PW = pane.clientWidth, PH = pane.clientHeight
  if (!W || !H || !PW || !PH) return

  const mobile = window.matchMedia('(max-width: 900px)').matches
  const rightReserve = mobile ? 0 : Math.min(360, PW * 0.34)
  const bottomReserve = mobile ? Math.min(PH * 0.42, 240) : 0
  const safePW = Math.max(140, PW - rightReserve)
  const safePH = Math.max(140, PH - bottomReserve)
  const safeCX = safePW / 2
  const safeCY = safePH / 2

  const widthFit = safePW / (b.w * W)
  const heightFit = safePH / (b.h * H)
  const scale = Math.min(6, 0.92 * Math.min(widthFit, heightFit))

  let dx = safeCX - Lx - scale * (b.cx * W)
  let dy = safeCY - Ly - scale * (b.cy * H)
  // Empêcher un vide au-delà des bords de l'image dans la zone visible.
  const maxDx = -Lx, minDx = safePW - Lx - scale * W
  if (minDx <= maxDx) dx = Math.max(minDx, Math.min(maxDx, dx))
  const maxDy = -Ly, minDy = safePH - Ly - scale * H
  if (minDy <= maxDy) dy = Math.max(minDy, Math.min(maxDy, dy))

  curScale.value = scale
  transMs.value = animate ? ZOOM_IN_MS : 0
  transform.value = `translate(${dx}px, ${dy}px) scale(${scale})`
}

function activateRegion(slug) {
  if (currentSlug.value === slug) return
  if (revealTimer) { clearTimeout(revealTimer); revealTimer = null }
  revealed.value = null
  hoveredKey.value = null
  activePoi.value = null
  loaded[slug] = true
  currentSlug.value = slug
  frameRegion(slug, true)
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

function onResize() {
  layoutWorld()
  if (currentSlug.value) frameRegion(currentSlug.value, false)
}

onMounted(() => {
  const img = worldImgEl.value
  if (img && img.complete && img.naturalWidth) layoutWorld()
  ro = new ResizeObserver(onResize)
  if (paneEl.value) ro.observe(paneEl.value)
})
onBeforeUnmount(() => { ro && ro.disconnect(); clearTimeout(revealTimer) })
</script>

<template>
  <div class="map-stage">
    <!-- Header (hauteur constante => pas de décalage entre monde/zoom) -->
    <header class="map-header">
      <button v-if="current" class="back-btn" @click="resetZoom">← Carte</button>
      <h1>{{ current ? current.name : 'Carte du Monde' }}</h1>
    </header>

    <!-- Fenêtre de carte -->
    <div ref="paneEl" class="world-pane">
      <div class="world-content" :style="contentStyle">
        <img ref="worldImgEl" :src="worldImg" alt="Carte du monde" class="world-img" draggable="false" @load="layoutWorld">

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

        <svg class="region-svg" :class="{ hidden: current }" viewBox="0 0 100 100" preserveAspectRatio="none">
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

      <!-- Survol (monde, desktop) -->
      <div v-if="!current && hovered" class="hover-hint">
        <strong>{{ hovered.name }}</strong><span>{{ hovered.description }}</span>
      </div>

      <!-- Description (zoom) : à droite sur PC, en bas sur mobile -->
      <aside v-if="current" class="desc-overlay">
        <template v-if="activePoiObj">
          <h3>{{ activePoiObj.name }}</h3>
          <p>{{ activePoiObj.desc }}</p>
          <span v-if="!activePoiObj.lore" class="invented-tag">Lieu supposé (non confirmé par le lore)</span>
        </template>
        <template v-else>
          <h3>{{ current.name }}</h3>
          <p>{{ current.description }}</p>
        </template>
      </aside>
    </div>

    <!-- Barre de pastilles (hauteur constante) : continents / lieux -->
    <div class="chips-bar">
      <template v-if="!current">
        <button v-for="r in regions" :key="r.key" class="chip" @click="activateRegion(r.key)">{{ r.name }}</button>
      </template>
      <template v-else>
        <button
          v-for="(p, i) in current.points"
          :key="i"
          class="chip"
          :class="{ active: activePoi === i, invented: !p.lore }"
          @click="selectPoi(i)"
        >{{ p.name }}</button>
        <span v-if="!current.points.length" class="chips-empty">Aucun lieu répertorié</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.map-stage {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - var(--nav-h));
  max-width: 1600px;
  margin: 0 auto;
  padding: 10px clamp(10px, 3vw, 34px) 12px;
  overflow: hidden;
}

.map-header { display: flex; align-items: center; gap: 14px; flex: 0 0 auto; height: 52px; }
.map-header h1 { font-size: clamp(1.3rem, 3.5vw, 2.2rem); text-shadow: 0 0 12px var(--accent-bright); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.back-btn { background: var(--glass); border: 1px solid var(--glass-border); color: var(--accent); border-radius: 10px; padding: 8px 15px; cursor: pointer; font-weight: 700; white-space: nowrap; }
.back-btn:hover { box-shadow: 0 0 12px rgba(0, 180, 255, 0.4); color: #fff; }

.world-pane {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
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

.region-detail { position: absolute; object-fit: fill; opacity: 0; pointer-events: none; transition: opacity 0.4s ease; }
.region-detail.active { opacity: 1; }

.region-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.region-svg.hidden { pointer-events: none; opacity: 0; }
.region-poly { fill: rgba(0, 180, 255, 0); stroke: rgba(0, 180, 255, 0); stroke-width: 0.4; cursor: pointer; transition: fill 0.2s, stroke 0.2s; }
.region-poly:hover, .region-poly.hot { fill: rgba(0, 180, 255, 0.22); stroke: var(--cyan); }

.poi-marker { position: absolute; width: 26px; height: 26px; background: none; border: none; padding: 0; cursor: pointer; opacity: 0; pointer-events: none; transition: opacity 0.35s ease; }
.poi-marker.shown { opacity: 1; pointer-events: auto; }
.poi-dot { display: block; width: 14px; height: 14px; margin: 6px; border-radius: 50%; background: var(--cyan); box-shadow: 0 0 10px var(--cyan); transition: transform 0.2s, background 0.2s; }
.poi-marker:hover .poi-dot { transform: scale(1.4); }
.poi-marker.active .poi-dot { background: #fff; transform: scale(1.6); box-shadow: 0 0 16px var(--cyan); }
.poi-marker.invented .poi-dot { background: var(--accent-bright); box-shadow: 0 0 10px var(--accent-bright); }

/* Survol monde */
.hover-hint {
  position: absolute;
  left: 14px; bottom: 14px; right: 14px;
  background: rgba(8, 2, 26, 0.82);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  padding: 10px 14px;
  backdrop-filter: blur(8px);
  display: flex; flex-direction: column; gap: 2px;
  pointer-events: none;
}
.hover-hint strong { color: var(--accent); }
.hover-hint span { color: var(--text); font-size: 0.88rem; line-height: 1.4; }
@media (hover: none) { .hover-hint { display: none; } }

/* Description en zoom */
.desc-overlay {
  position: absolute;
  right: 16px; top: 50%; transform: translateY(-50%);
  width: min(320px, 40vw);
  max-height: calc(100% - 32px);
  overflow-y: auto;
  background: rgba(8, 2, 26, 0.85);
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  padding: 16px;
  backdrop-filter: blur(10px);
}
.desc-overlay h3 { color: var(--accent); margin: 0 0 10px; }
.desc-overlay p { color: var(--text); line-height: 1.6; margin: 0; }
.invented-tag { display: inline-block; margin-top: 10px; font-size: 0.78rem; color: #d7b6ff; border: 1px dashed rgba(126, 63, 242, 0.6); border-radius: 8px; padding: 2px 8px; }

/* Barre de pastilles */
.chips-bar {
  flex: 0 0 auto;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 12px 2px 4px;
  scrollbar-width: thin;
}
.chip {
  flex: 0 0 auto;
  padding: 7px 14px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  color: var(--accent);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}
.chip:hover { box-shadow: 0 0 10px rgba(126, 63, 242, 0.5); }
.chip.active { background: rgba(0, 180, 255, 0.2); border-color: rgba(0, 180, 255, 0.6); color: #fff; }
.chip.invented { border-style: dashed; }
.chips-empty { color: #7fa8d8; padding: 8px; }

/* Mobile */
@media (max-width: 900px) {
  .map-stage { height: calc(100dvh - var(--bottom-nav-h)); }
  .desc-overlay {
    right: 12px; left: 12px; top: auto; bottom: 12px; transform: none;
    width: auto; max-height: 40%;
  }
}
</style>
