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

const worldImg = asset('img/map/world.webp')

function polyPoints(region) {
  return region.polygon.map((p) => `${(p[0] * 100).toFixed(2)},${(p[1] * 100).toFixed(2)}`).join(' ')
}
function regionImg(region) {
  return asset(`img/map/region-${region.slug || region.key}.webp`)
}
function openRegion(key) {
  selectedKey.value = key
  activePoi.value = null
  hoveredKey.value = null
  window.scrollTo({ top: 0, behavior: 'smooth' })
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
    <!-- ---------- WORLD VIEW ---------- -->
    <template v-if="!selected">
      <h1 class="carte-title">Carte du Monde</h1>
      <p class="carte-hint">
        <span class="d">Survolez un continent pour le découvrir, cliquez pour l'explorer.</span>
        <span class="m">Touchez un continent ci-dessous pour l'explorer.</span>
      </p>

      <div class="map-frame">
        <img :src="worldImg" alt="Carte du monde" draggable="false" class="map-img">
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
    </template>

    <!-- ---------- REGION VIEW ---------- -->
    <template v-else>
      <div class="region-top">
        <button class="back-btn" @click="backToWorld">← Retour à la carte</button>
        <h1>{{ selected.name }}</h1>
        <p class="region-desc">{{ selected.description }}</p>
      </div>

      <div class="map-frame region">
        <img :src="regionImg(selected)" :alt="selected.name" draggable="false" class="map-img">
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

      <!-- Selected POI card -->
      <div v-if="activePoi !== null" class="poi-card">
        <h3>{{ selected.points[activePoi].name }}</h3>
        <p>{{ selected.points[activePoi].desc }}</p>
        <span v-if="!selected.points[activePoi].lore" class="invented-tag">
          Lieu supposé (non confirmé par le lore)
        </span>
      </div>

      <!-- POI list (touch-friendly) -->
      <div class="poi-list" v-if="selected.points.length">
        <h4>Lieux d'intérêt</h4>
        <div class="poi-chips">
          <button
            v-for="(p, i) in selected.points"
            :key="i"
            class="chip"
            :class="{ active: activePoi === i, invented: !p.lore }"
            @click="togglePoi(i)"
          >
            {{ p.name }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.carte {
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(20px, 4vw, 50px) clamp(12px, 4vw, 40px) 60px;
}
.carte-title, .region-top h1 {
  text-align: center;
  font-size: clamp(1.8rem, 5vw, 3rem);
  text-shadow: 0 0 14px var(--accent-bright);
  margin: 0 0 8px;
}
.carte-hint { text-align: center; color: #9fc4ec; margin: 0 0 20px; }
.carte-hint .m { display: none; }
@media (hover: none) {
  .carte-hint .d { display: none; }
  .carte-hint .m { display: inline; }
}

/* Map frame */
.map-frame {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--glass-border);
  box-shadow: 0 0 26px rgba(126, 63, 242, 0.25);
  line-height: 0;
}
.map-img { width: 100%; height: auto; display: block; user-select: none; }
.map-svg { position: absolute; inset: 0; width: 100%; height: 100%; }

.region-poly {
  fill: rgba(0, 180, 255, 0);
  stroke: rgba(0, 180, 255, 0);
  stroke-width: 0.4;
  cursor: pointer;
  transition: fill 0.2s ease, stroke 0.2s ease;
}
.region-poly:hover,
.region-poly.hot {
  fill: rgba(0, 180, 255, 0.22);
  stroke: var(--cyan);
}

/* Info bar */
.info-bar {
  background: var(--bg-dark);
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  padding: 18px 22px;
  margin: 18px 0;
  min-height: 84px;
}
.info-bar h2 { color: var(--accent); margin: 0 0 6px; font-size: 1.3rem; }
.info-bar p { color: var(--text); line-height: 1.6; margin: 0; }
.info-bar .muted { color: #7fa8d8; }

/* Region chips */
.region-chips, .poi-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}
.chip {
  padding: 8px 16px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  color: var(--accent);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.chip:hover { box-shadow: 0 0 12px rgba(126, 63, 242, 0.5); transform: translateY(-2px); }
.chip.active { background: rgba(0, 180, 255, 0.2); border-color: rgba(0, 180, 255, 0.6); color: #fff; }
.chip.invented { border-style: dashed; }

/* Region view */
.region-top { text-align: center; margin-bottom: 18px; position: relative; }
.back-btn {
  background: var(--glass);
  border: 1px solid var(--glass-border);
  color: var(--accent);
  border-radius: 10px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: 600;
  margin-bottom: 14px;
  transition: all 0.2s ease;
}
.back-btn:hover { box-shadow: 0 0 12px rgba(0, 180, 255, 0.4); }
.region-desc { color: var(--text); line-height: 1.6; max-width: 800px; margin: 8px auto 0; }

/* POI markers */
.poi {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 26px; height: 26px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.poi-dot {
  display: block;
  width: 14px; height: 14px;
  margin: 6px;
  border-radius: 50%;
  background: var(--cyan);
  box-shadow: 0 0 10px var(--cyan);
  transition: transform 0.2s ease, background 0.2s ease;
}
.poi:hover .poi-dot { transform: scale(1.4); }
.poi.active .poi-dot { background: #fff; transform: scale(1.5); box-shadow: 0 0 16px var(--cyan); }
.poi.invented .poi-dot { background: var(--accent-bright); box-shadow: 0 0 10px var(--accent-bright); }

/* POI card + list */
.poi-card {
  background: var(--bg-dark);
  border: 1px solid rgba(0, 180, 255, 0.5);
  border-radius: 14px;
  padding: 18px 22px;
  margin: 18px 0;
  box-shadow: 0 0 20px rgba(0, 180, 255, 0.3);
}
.poi-card h3 { color: var(--accent); margin: 0 0 8px; }
.poi-card p { color: var(--text); line-height: 1.6; margin: 0; }
.invented-tag {
  display: inline-block;
  margin-top: 10px;
  font-size: 0.78rem;
  color: #d7b6ff;
  border: 1px dashed rgba(126, 63, 242, 0.6);
  border-radius: 8px;
  padding: 2px 8px;
}
.poi-list { margin-top: 20px; }
.poi-list h4 { color: var(--accent); text-align: center; margin: 0 0 12px; }
</style>
