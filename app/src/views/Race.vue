<script setup>
import { ref, computed } from 'vue'
import { raceGroups, raceIntro } from '../data/races.js'
import { asset } from '../lib/assets.js'

const activeKey = ref('normal')
const selectedId = ref(null)

const group = computed(() => raceGroups.find((g) => g.key === activeKey.value))
const races = computed(() => group.value.races)
const maxH = computed(() => Math.max(...races.value.map((r) => r.naturalH)))

// Hauteur de la vignette dans la bande de comparaison (proportionnelle à
// la taille "réelle" de la race dans l'univers).
const STRIP_MAX = 300
function stripHeight(r) {
  return Math.max(26, Math.round((r.naturalH / maxH.value) * STRIP_MAX))
}

function selectRace(id) {
  selectedId.value = id
  requestAnimationFrame(() => {
    const el = document.getElementById(`race-${id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

function switchGroup(key) {
  activeKey.value = key
  selectedId.value = null
}
</script>

<template>
  <div class="race-page">
    <!-- Intro -->
    <section class="race-intro">
      <h1>{{ raceIntro.title }}</h1>
      <p v-for="(p, i) in raceIntro.paragraphs" :key="i">{{ p }}</p>
    </section>

    <!-- Sélecteur de groupe -->
    <div class="group-tabs" role="tablist">
      <button
        v-for="g in raceGroups"
        :key="g.key"
        class="group-tab"
        :class="{ active: g.key === activeKey }"
        role="tab"
        :aria-selected="g.key === activeKey"
        @click="switchGroup(g.key)"
      >
        {{ g.label }}
      </button>
    </div>

    <!-- Bande de comparaison des tailles -->
    <section class="size-compare" aria-label="Comparaison des tailles">
      <p class="compare-hint">Tailles comparées à l'échelle · touchez une race pour la découvrir</p>
      <div class="strip">
        <button
          v-for="r in races"
          :key="r.id"
          class="strip-item"
          :class="{ selected: r.id === selectedId }"
          @click="selectRace(r.id)"
        >
          <span class="strip-img-wrap" :style="{ height: stripHeight(r) + 'px' }">
            <img :src="asset('img/race/' + r.file)" :alt="r.display" loading="lazy">
          </span>
          <span class="strip-label">{{ r.display }}</span>
        </button>
      </div>
    </section>

    <!-- Descriptions -->
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
  </div>
</template>

<style scoped>
.race-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(40px, 6vw, 90px) clamp(16px, 5vw, 60px);
}

/* Intro */
.race-intro {
  background: var(--bg-dark);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  box-shadow: 0 0 24px rgba(126, 63, 242, 0.3);
  padding: clamp(24px, 4vw, 44px);
  text-align: center;
  margin-bottom: 40px;
}
.race-intro h1 { font-size: clamp(1.8rem, 5vw, 2.8rem); text-shadow: 0 0 12px var(--accent-bright); }
.race-intro p { color: var(--text); line-height: 1.7; font-size: clamp(0.95rem, 1.2vw, 1.1rem); }

/* Tabs */
.group-tabs {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-bottom: 24px;
  position: sticky;
  top: calc(var(--nav-h) - 2px);
  z-index: 5;
}
@media (max-width: 900px) { .group-tabs { top: 8px; } }
.group-tab {
  flex: 0 1 200px;
  padding: 12px 20px;
  font-size: clamp(1rem, 1.4vw, 1.2rem);
  font-weight: 700;
  color: var(--accent);
  background: var(--glass);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
}
.group-tab:hover { box-shadow: 0 0 12px rgba(126, 63, 242, 0.5); }
.group-tab.active {
  color: #fff;
  border-color: rgba(0, 180, 255, 0.6);
  box-shadow: 0 0 16px rgba(0, 180, 255, 0.45);
  background: rgba(126, 63, 242, 0.2);
}

/* Size comparison strip */
.size-compare {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  padding: 18px;
  margin-bottom: 48px;
}
.compare-hint { text-align: center; color: #9fc4ec; font-size: 0.85rem; margin: 0 0 14px; }
.strip {
  display: flex;
  align-items: flex-end;
  gap: clamp(10px, 2vw, 26px);
  overflow-x: auto;
  padding: 8px 4px 14px;
  min-height: 340px;
  scrollbar-width: thin;
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
.strip-item:hover { background: rgba(126, 63, 242, 0.12); transform: translateY(-3px); }
.strip-item.selected { background: rgba(0, 180, 255, 0.14); box-shadow: 0 0 12px rgba(0, 180, 255, 0.4); }
.strip-img-wrap { display: flex; align-items: flex-end; }
.strip-img-wrap img { height: 100%; width: auto; object-fit: contain; filter: drop-shadow(0 0 6px rgba(126, 63, 242, 0.4)); }
.strip-label { color: var(--accent); font-weight: 600; font-size: 0.85rem; white-space: nowrap; }

/* Description cards */
.race-descriptions { display: flex; flex-direction: column; gap: 28px; }
.race-card {
  display: grid;
  grid-template-columns: minmax(200px, 340px) 1fr;
  gap: clamp(20px, 3vw, 40px);
  align-items: center;
  background: var(--bg-dark);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  padding: clamp(20px, 3vw, 36px);
  scroll-margin-top: calc(var(--nav-h) + 70px);
  transition: box-shadow 0.3s ease, border-color 0.3s ease;
}
.race-card.reverse { direction: rtl; }
.race-card.reverse > * { direction: ltr; }
.race-card.highlight { border-color: rgba(0, 180, 255, 0.6); box-shadow: 0 0 22px rgba(0, 180, 255, 0.35); }
.race-card-img { display: flex; justify-content: center; }
.race-card-img img { max-height: 360px; width: auto; border-radius: 12px; filter: drop-shadow(0 0 10px rgba(126, 63, 242, 0.4)); }
.race-card-text h2 { color: var(--accent); font-size: clamp(1.4rem, 3vw, 2rem); text-shadow: 0 0 10px var(--accent); margin: 0 0 6px; }
.race-card-text .phrase { color: var(--accent-bright); font-style: italic; font-weight: 600; margin: 0 0 16px; }
.race-card-text :deep(.body p) { color: var(--text); line-height: 1.7; margin: 0 0 14px; }

@media (max-width: 820px) {
  .race-card { grid-template-columns: 1fr; scroll-margin-top: 16px; }
  .race-card.reverse { direction: ltr; }
  .race-card-img img { max-height: 280px; }
  .strip { min-height: 260px; }
}
</style>
