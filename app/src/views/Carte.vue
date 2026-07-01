<script setup>
import { ref, computed } from 'vue'
import { MAP_REGIONS } from '../data/mapData.js'
import { asset } from '../lib/assets.js'

const regions = Object.entries(MAP_REGIONS).map(([key, v]) => ({ key, ...v }))

const selectedKey = ref(null)
const hoveredKey = ref(null)
const activePoi = ref(null)

const selected = computed(() => regions.find((r) => r.key === selectedKey.value) || null)
const hovered = computed(() => regions.find((r) => r.key === hoveredKey.value) || null)
const poi = computed(() =>
  selected.value && activePoi.value !== null ? selected.value.points[activePoi.value] : null
)

const ZOOM = 2.4
const mediaStyle = computed(() => {
  const p = poi.value
  if (!p) return { transform: 'scale(1)', transformOrigin: 'center center' }
  return {
    transform: `scale(${ZOOM})`,
    transformOrigin: `${(p.x * 100).toFixed(2)}% ${(p.y * 100).toFixed(2)}%`,
  }
})

const worldImg = asset('img/map/world.webp')
function polyPoints(r) {
  return r.polygon.map((p) => `${(p[0] * 100).toFixed(2)},${(p[1] * 100).toFixed(2)}`).join(' ')
}
function regionImg(r) {
  return asset(`img/map/region-${r.slug || r.key}.webp`)
}
function openRegion(key) {
  selectedKey.value = key
  activePoi.value = null
  hoveredKey.value = null
}
function backToWorld() {
  selectedKey.value = null
  activePoi.value = null
}
function togglePoi(i) {
  activePoi.value = activePoi.value === i ? null : i
}
</script>

<template>
  <div class="carte">
    <!-- ================= WORLD ================= -->
    <template v-if="!selected">
      <h1 class="carte-title">Carte du Monde</h1>
      <p class="carte-hint">
        <span class="d">Survolez un continent pour le découvrir, cliquez pour l'explorer.</span>
        <span class="m">Touchez un continent pour l'explorer.</span>
      </p>
      <div class="world-layout">
        <div class="map-frame">
          <img :src="worldImg" alt="Carte du monde" draggable="false" class="world-img">
          <svg class="map-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon
              v-for="r in regions"
              :key="r.key"
              :points="polyPoints(r)"
              class="region-poly"
              :class="{ hot: hoveredKey === r.key }"
              @mouseenter="hoveredKey = r.key"
              @mouseleave="hoveredKey = null"
              @click="openRegion(r.key)"
            />
          </svg>
        </div>
        <aside class="world-side">
          <div class="info-bar">
            <template v-if="hovered">
              <h2>{{ hovered.name }}</h2>
              <p>{{ hovered.description }}</p>
            </template>
            <p v-else class="muted">Choisissez un continent pour explorer ses lieux.</p>
          </div>
          <div class="region-chips">
            <button v-for="r in regions" :key="r.key" class="chip" @click="openRegion(r.key)">
              {{ r.name }}
            </button>
          </div>
        </aside>
      </div>
    </template>

    <!-- ================= REGION ================= -->
    <section v-else class="region-view">
      <header class="region-bar">
        <button class="back-btn" @click="backToWorld">← Carte</button>
        <h1>{{ selected.name }}</h1>
      </header>

      <div class="region-grid">
        <!-- Lieux (gauche) -->
        <aside class="poi-panel">
          <h4>Lieux d'intérêt</h4>
          <div class="poi-list">
            <button
              v-for="(p, i) in selected.points"
              :key="i"
              class="poi-btn"
              :class="{ active: activePoi === i, invented: !p.lore }"
              @click="togglePoi(i)"
            >
              <span class="poi-btn-dot"></span>{{ p.name }}
            </button>
          </div>
        </aside>

        <!-- Carte (centre) -->
        <div class="map-viewport">
          <div class="map-media" :style="mediaStyle">
            <img :src="regionImg(selected)" :alt="selected.name" draggable="false">
            <button
              v-for="(p, i) in selected.points"
              :key="i"
              class="poi"
              :class="{ active: activePoi === i, invented: !p.lore }"
              :style="{ left: p.x * 100 + '%', top: p.y * 100 + '%' }"
              :title="p.name"
              @click="togglePoi(i)"
            >
              <span class="poi-dot"></span>
            </button>
          </div>
        </div>

        <!-- Description (droite) -->
        <aside class="desc-panel">
          <template v-if="poi">
            <h3>{{ poi.name }}</h3>
            <p>{{ poi.desc }}</p>
            <span v-if="!poi.lore" class="invented-tag">Lieu supposé (non confirmé par le lore)</span>
          </template>
          <template v-else>
            <h3>{{ selected.name }}</h3>
            <p>{{ selected.description }}</p>
            <p class="muted">Sélectionnez un lieu pour zoomer dessus.</p>
          </template>
        </aside>
      </div>
    </section>
  </div>
</template>

<style scoped>
.carte { max-width: 1600px; margin: 0 auto; padding: clamp(16px, 3vw, 40px) clamp(10px, 3vw, 40px) 40px; }
.carte-title { text-align: center; font-size: clamp(1.8rem, 5vw, 3rem); text-shadow: 0 0 14px var(--accent-bright); margin: 0 0 8px; }
.carte-hint { text-align: center; color: #9fc4ec; margin: 0 0 18px; }
.carte-hint .m { display: none; }
@media (hover: none) { .carte-hint .d { display: none; } .carte-hint .m { display: inline; } }

/* ---------- World ---------- */
.world-layout { display: grid; grid-template-columns: 1fr; gap: 20px; }
@media (min-width: 1000px) { .world-layout { grid-template-columns: 1fr 340px; align-items: start; } }
.map-frame {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--glass-border);
  box-shadow: 0 0 26px rgba(126, 63, 242, 0.25);
  line-height: 0;
}
.world-img { width: 100%; height: auto; display: block; }
.map-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.region-poly { fill: rgba(0, 180, 255, 0); stroke: rgba(0, 180, 255, 0); stroke-width: 0.4; cursor: pointer; transition: fill 0.2s, stroke 0.2s; }
.region-poly:hover, .region-poly.hot { fill: rgba(0, 180, 255, 0.22); stroke: var(--cyan); }
.world-side { display: flex; flex-direction: column; gap: 16px; }
.info-bar { background: var(--bg-dark); border: 1px solid var(--glass-border); border-radius: 14px; padding: 18px 20px; min-height: 84px; }
.info-bar h2 { color: var(--accent); margin: 0 0 6px; font-size: 1.3rem; }
.info-bar p { color: var(--text); line-height: 1.6; margin: 0; }
.info-bar .muted, .muted { color: #7fa8d8; }
.region-chips { display: flex; flex-wrap: wrap; gap: 10px; }
.chip { padding: 8px 15px; background: var(--glass); border: 1px solid var(--glass-border); border-radius: 20px; color: var(--accent); font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
.chip:hover { box-shadow: 0 0 12px rgba(126, 63, 242, 0.5); transform: translateY(-2px); }

/* ---------- Region ---------- */
.region-view { display: flex; flex-direction: column; height: calc(100vh - var(--nav-h) - 40px); }
.region-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; flex: 0 0 auto; }
.region-bar h1 { font-size: clamp(1.4rem, 3.5vw, 2.2rem); text-shadow: 0 0 12px var(--accent-bright); margin: 0; }
.back-btn { background: var(--glass); border: 1px solid var(--glass-border); color: var(--accent); border-radius: 10px; padding: 8px 16px; cursor: pointer; font-weight: 600; transition: all 0.2s ease; white-space: nowrap; }
.back-btn:hover { box-shadow: 0 0 12px rgba(0, 180, 255, 0.4); }

.region-grid {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: 240px 1fr 320px;
  gap: 16px;
}

.poi-panel, .desc-panel {
  background: var(--bg-dark);
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  padding: 16px;
  overflow-y: auto;
  min-height: 0;
}
.poi-panel h4, .desc-panel h3 { color: var(--accent); margin: 0 0 12px; }
.poi-list { display: flex; flex-direction: column; gap: 8px; }
.poi-btn {
  display: flex; align-items: center; gap: 10px;
  text-align: left;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  border-radius: 10px;
  color: var(--text);
  padding: 9px 12px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}
.poi-btn:hover { border-color: rgba(0, 180, 255, 0.5); }
.poi-btn.active { background: rgba(0, 180, 255, 0.16); border-color: rgba(0, 180, 255, 0.6); color: #fff; }
.poi-btn-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--cyan); box-shadow: 0 0 8px var(--cyan); flex: 0 0 auto; }
.poi-btn.invented .poi-btn-dot { background: var(--accent-bright); box-shadow: 0 0 8px var(--accent-bright); }

.desc-panel p { color: var(--text); line-height: 1.65; }

/* Map viewport with zoom */
.map-viewport {
  position: relative;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid var(--glass-border);
  box-shadow: 0 0 26px rgba(126, 63, 242, 0.25);
  background: #05030f;
}
.map-media {
  position: relative;
  display: inline-block;
  max-width: 100%;
  max-height: 100%;
  transition: transform 0.45s ease;
  line-height: 0;
}
.map-media img { display: block; max-width: 100%; max-height: 100%; width: auto; height: auto; }

.poi { position: absolute; transform: translate(-50%, -50%); width: 22px; height: 22px; background: none; border: none; cursor: pointer; padding: 0; }
.poi-dot { display: block; width: 12px; height: 12px; margin: 5px; border-radius: 50%; background: var(--cyan); box-shadow: 0 0 10px var(--cyan); transition: transform 0.2s; }
.poi:hover .poi-dot { transform: scale(1.4); }
.poi.active .poi-dot { background: #fff; transform: scale(1.5); box-shadow: 0 0 16px var(--cyan); }
.poi.invented .poi-dot { background: var(--accent-bright); box-shadow: 0 0 10px var(--accent-bright); }

.invented-tag { display: inline-block; margin-top: 10px; font-size: 0.78rem; color: #d7b6ff; border: 1px dashed rgba(126, 63, 242, 0.6); border-radius: 8px; padding: 2px 8px; }

/* ---------- Mobile: stack, scroll autorisé ---------- */
@media (max-width: 900px) {
  .region-view { height: auto; }
  .region-grid { grid-template-columns: 1fr; }
  .map-viewport { height: 52vh; }
  .poi-panel { order: 3; max-height: none; }
  .desc-panel { order: 2; }
  .map-viewport { order: 1; }
}
</style>
