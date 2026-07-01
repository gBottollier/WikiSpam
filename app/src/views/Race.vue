<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { raceGroups, raceIntro } from '../data/races.js'
import { asset } from '../lib/assets.js'

// Onglets : présentation + les deux groupes
const tabs = [
  { key: 'intro', label: 'Présentation' },
  ...raceGroups.map((g) => ({ key: g.key, label: g.label })),
]
const activeTab = ref('intro')
const selectedId = ref(null)

const group = computed(() => raceGroups.find((g) => g.key === activeTab.value) || null)
const races = computed(() => (group.value ? group.value.races : []))
const maxH = computed(() => (races.value.length ? Math.max(...races.value.map((r) => r.naturalH)) : 1))

const BASE_H = 300
function itemHeight(r) {
  return Math.max(24, Math.round((r.naturalH / maxH.value) * BASE_H))
}

// --- Ajustement de la bande pour tenir sans scroll ---
const stripOuter = ref(null)
const stripInner = ref(null)
const scale = ref(1)
const tx = ref(0)
const outerH = ref(BASE_H + 40)
let ro = null

const innerStyle = computed(() => ({
  transform: `translate(${tx.value}px, 0) scale(${scale.value})`,
  transformOrigin: '0 0',
}))

function fitStrip() {
  const o = stripOuter.value
  const inner = stripInner.value
  if (!o || !inner) return
  // offsetWidth/Height = layout size AVANT transform (fiable même scalé)
  const contentW = inner.offsetWidth
  const contentH = inner.offsetHeight
  const availW = o.clientWidth
  const k = contentW > 0 ? Math.min(1, availW / contentW) : 1
  scale.value = k
  tx.value = Math.max(0, (availW - contentW * k) / 2)
  outerH.value = Math.ceil(contentH * k)
}

function scheduleFit() {
  nextTick(() => requestAnimationFrame(fitStrip))
}

watch(activeTab, () => {
  selectedId.value = null
  scheduleFit()
})

onMounted(() => {
  scheduleFit()
  ro = new ResizeObserver(scheduleFit)
  if (stripOuter.value) ro.observe(stripOuter.value)
})
onBeforeUnmount(() => ro && ro.disconnect())

function selectRace(id) {
  selectedId.value = id
  requestAnimationFrame(() => {
    const el = document.getElementById(`race-${id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}
</script>

<template>
  <div class="race-page">
    <h1 class="page-title">Races du Monde</h1>

    <!-- Onglets -->
    <div class="tabs" role="tablist">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="tab"
        :class="{ active: t.key === activeTab }"
        role="tab"
        :aria-selected="t.key === activeTab"
        @click="activeTab = t.key"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- Présentation -->
    <section v-if="activeTab === 'intro'" class="intro-panel">
      <p v-for="(p, i) in raceIntro.paragraphs" :key="i">{{ p }}</p>
    </section>

    <!-- Groupe (Éveillés / Veilleurs) -->
    <template v-else>
      <section class="size-compare" aria-label="Comparaison des tailles">
        <p class="compare-hint">Tailles comparées à l'échelle · touchez une race pour la découvrir</p>
        <div ref="stripOuter" class="strip-outer" :style="{ height: outerH + 'px' }">
          <div
            ref="stripInner"
            class="strip-inner"
            :style="innerStyle"
          >
            <button
              v-for="r in races"
              :key="r.id"
              class="strip-item"
              :class="{ selected: r.id === selectedId }"
              @click="selectRace(r.id)"
            >
              <span class="strip-img-wrap" :style="{ height: itemHeight(r) + 'px' }">
                <img :src="asset('img/race/' + r.file)" :alt="r.display" loading="lazy" @load="scheduleFit">
              </span>
              <span class="strip-label">{{ r.display }}</span>
            </button>
          </div>
        </div>
      </section>

      <section class="race-descriptions">
        <article
          v-for="(r, i) in races"
          :id="`race-${r.id}`"
          :key="r.id"
          class="race-card"
          :class="{ reverse: i % 2 === 1, highlight: r.id === selectedId }"
        >
          <div class="race-card-img">
            <img :src="asset(r.img)" :alt="r.display" loading="lazy">
          </div>
          <div class="race-card-text">
            <h2>{{ r.title }}</h2>
            <p class="phrase">{{ r.phrase }}</p>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="body" v-html="r.html"></div>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>

<style scoped>
.race-page {
  max-width: 1600px;
  margin: 0 auto;
  padding: clamp(28px, 4vw, 70px) clamp(10px, 3vw, 48px) 70px;
}
.page-title {
  text-align: center;
  font-size: clamp(1.8rem, 5vw, 2.8rem);
  text-shadow: 0 0 12px var(--accent-bright);
  margin: 0 0 22px;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 26px;
  position: sticky;
  top: calc(var(--nav-h) - 2px);
  z-index: 5;
}
@media (max-width: 900px) { .tabs { top: 6px; } }
.tab {
  flex: 0 1 auto;
  padding: 11px 26px;
  font-size: clamp(0.95rem, 1.3vw, 1.15rem);
  font-weight: 700;
  color: var(--accent);
  background: var(--glass);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
}
.tab:hover { box-shadow: 0 0 12px rgba(126, 63, 242, 0.5); }
.tab.active {
  color: #fff;
  border-color: rgba(0, 180, 255, 0.6);
  box-shadow: 0 0 16px rgba(0, 180, 255, 0.45);
  background: rgba(126, 63, 242, 0.2);
}

/* Présentation */
.intro-panel {
  background: var(--bg-dark);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  box-shadow: 0 0 24px rgba(126, 63, 242, 0.3);
  padding: clamp(24px, 4vw, 48px);
  max-width: 1000px;
  margin: 0 auto;
}
.intro-panel p { color: var(--text); line-height: 1.8; font-size: clamp(0.98rem, 1.2vw, 1.12rem); }

/* Size comparison strip (auto-fit, jamais de scroll) */
.size-compare {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  padding: 16px;
  margin-bottom: 44px;
}
.compare-hint { text-align: center; color: #9fc4ec; font-size: 0.85rem; margin: 0 0 12px; }
.strip-outer { position: relative; width: 100%; overflow: hidden; }
.strip-inner {
  display: flex;
  align-items: flex-end;
  gap: clamp(10px, 2vw, 30px);
  width: max-content;
  transform-origin: 0 0;
}
.strip-item {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 12px;
  transition: background 0.2s ease, transform 0.2s ease;
}
.strip-item:hover { background: rgba(126, 63, 242, 0.12); }
.strip-item.selected { background: rgba(0, 180, 255, 0.14); box-shadow: 0 0 12px rgba(0, 180, 255, 0.4); }
.strip-img-wrap { display: flex; align-items: flex-end; }
.strip-img-wrap img { height: 100%; width: auto; object-fit: contain; filter: drop-shadow(0 0 6px rgba(126, 63, 242, 0.4)); }
.strip-label { color: var(--accent); font-weight: 600; font-size: 0.85rem; white-space: nowrap; }

/* Description cards */
.race-descriptions { display: flex; flex-direction: column; gap: 26px; }
.race-card {
  display: grid;
  grid-template-columns: minmax(220px, 380px) 1fr;
  gap: clamp(20px, 3vw, 44px);
  align-items: center;
  background: var(--bg-dark);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  padding: clamp(20px, 3vw, 38px);
  scroll-margin-top: calc(var(--nav-h) + 70px);
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}
.race-card.reverse { direction: rtl; }
.race-card.reverse > * { direction: ltr; }
.race-card.highlight { border-color: rgba(0, 180, 255, 0.6); box-shadow: 0 0 22px rgba(0, 180, 255, 0.35); }
.race-card-img { display: flex; justify-content: center; }
.race-card-img img { max-height: 380px; width: auto; border-radius: 12px; filter: drop-shadow(0 0 10px rgba(126, 63, 242, 0.4)); }
.race-card-text h2 { color: var(--accent); font-size: clamp(1.4rem, 3vw, 2rem); text-shadow: 0 0 10px var(--accent); margin: 0 0 6px; }
.race-card-text .phrase { color: var(--accent-bright); font-style: italic; font-weight: 600; margin: 0 0 16px; }
.race-card-text :deep(.body p) { color: var(--text); line-height: 1.7; margin: 0 0 14px; }

@media (max-width: 820px) {
  .race-card { grid-template-columns: 1fr; scroll-margin-top: 16px; }
  .race-card.reverse { direction: ltr; }
  .race-card-img img { max-height: 260px; }
}
</style>
