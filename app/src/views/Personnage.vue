<script setup>
import { ref, computed } from 'vue'
import { regions } from '../data/personnages.js'
import { asset } from '../lib/assets.js'

const activeKey = ref(regions[0].key)
const current = computed(() => regions.find((r) => r.key === activeKey.value))

function selectRegion(key) {
  activeKey.value = key
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="perso">
    <!-- Region emblems selector -->
    <nav class="emblem-bar" aria-label="Régions">
      <button
        v-for="r in regions"
        :key="r.key"
        class="emblem"
        :class="{ active: r.key === activeKey }"
        :title="r.name"
        @click="selectRegion(r.key)"
      >
        <img v-if="r.emblem" :src="asset(r.emblem)" :alt="r.name" loading="lazy">
        <span v-else class="emblem-fallback">{{ r.name.charAt(0) }}</span>
      </button>
    </nav>

    <!-- Region header -->
    <header class="region-header">
      <img v-if="current.bg" :src="asset(current.bg)" :alt="current.name" class="region-bg" loading="lazy">
      <div class="region-header-inner">
        <h1>{{ current.name }}</h1>
        <span class="region-count">{{ current.characters.length }} personnage{{ current.characters.length > 1 ? 's' : '' }}</span>
      </div>
    </header>

    <!-- Characters grid -->
    <section class="char-grid">
      <article v-for="c in current.characters" :key="c.name" class="char-card">
        <div class="char-media">
          <img v-if="c.img" :src="asset(c.img)" :alt="c.alt" loading="lazy">
          <div v-else class="char-noimg" aria-hidden="true">✦</div>
        </div>
        <div class="char-body">
          <h3 class="char-name">{{ c.name }}</h3>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="char-desc" v-html="c.html"></div>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.perso {
  max-width: 1300px;
  margin: 0 auto;
  padding: clamp(20px, 4vw, 50px) clamp(12px, 4vw, 40px) 60px;
}

/* Emblem selector */
.emblem-bar {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 10px 4px;
  position: sticky;
  top: calc(var(--nav-h) - 2px);
  z-index: 6;
  scrollbar-width: thin;
}
@media (max-width: 900px) { .emblem-bar { top: 6px; } }
.emblem {
  flex: 0 0 auto;
  width: 62px; height: 62px;
  border-radius: 50%;
  background: var(--glass);
  border: 2px solid var(--glass-border);
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
}
.emblem img { width: 100%; height: 100%; object-fit: contain; }
.emblem-fallback { color: var(--accent); font-weight: 800; font-size: 1.3rem; }
.emblem:hover { transform: translateY(-3px); box-shadow: 0 0 12px rgba(126, 63, 242, 0.5); }
.emblem.active {
  border-color: rgba(0, 180, 255, 0.7);
  box-shadow: 0 0 16px rgba(0, 180, 255, 0.5);
  background: rgba(126, 63, 242, 0.22);
}

/* Region header */
.region-header {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--glass-border);
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin: 18px 0 34px;
}
.region-bg {
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  opacity: 0.5;
}
.region-header-inner {
  position: relative;
  width: 100%;
  padding: 30px 20px;
  background: radial-gradient(ellipse at center, rgba(10, 0, 40, 0.7), rgba(10, 0, 40, 0.35));
}
.region-header h1 { font-size: clamp(1.8rem, 5vw, 3rem); margin: 0; text-shadow: 0 0 16px var(--accent-bright); letter-spacing: 1px; }
.region-count { color: var(--accent); font-weight: 600; }

/* Character grid */
.char-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  align-items: start;
}
.char-card {
  background: var(--bg-dark);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 0 16px rgba(126, 63, 242, 0.15);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.char-card:hover { transform: translateY(-4px); box-shadow: 0 0 22px rgba(0, 180, 255, 0.3); }
.char-media {
  aspect-ratio: 4 / 3;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.char-media img { width: 100%; height: 100%; object-fit: cover; }
.char-noimg { font-size: 3rem; color: rgba(126, 63, 242, 0.5); }
.char-body { padding: 18px 20px 22px; }
.char-name {
  color: var(--accent);
  font-size: 1.25rem;
  margin: 0 0 10px;
  text-shadow: 0 0 8px rgba(0, 180, 255, 0.4);
}
.char-desc :deep(p) { color: var(--text); line-height: 1.6; font-size: 0.92rem; margin: 0 0 10px; }
.char-desc :deep(p:last-child) { margin-bottom: 0; }

@media (max-width: 640px) {
  .char-grid { grid-template-columns: 1fr; gap: 18px; }
}
</style>
