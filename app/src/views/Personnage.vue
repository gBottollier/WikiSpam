<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { regions } from '../data/personnages.js'
import { asset } from '../lib/assets.js'

const activeKey = ref(regions[0].key)
const current = computed(() => regions.find((r) => r.key === activeKey.value))
const selected = ref(null)   // personnage ouvert dans la fiche

function selectRegion(key) {
  activeKey.value = key
  selected.value = null
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function openChar(c) { selected.value = c }
function closeChar() { selected.value = null }

function onKey(e) { if (e.key === 'Escape') closeChar() }
watch(selected, (v) => {
  document.body.style.overflow = v ? 'hidden' : ''
})
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' })
</script>

<template>
  <div class="perso">
    <!-- Sélecteur de régions -->
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

    <!-- En-tête région -->
    <header class="region-header">
      <img v-if="current.bg" :src="asset(current.bg)" :alt="current.name" class="region-bg" loading="lazy">
      <div class="region-header-inner">
        <h1>{{ current.name }}</h1>
        <span class="region-count">{{ current.characters.length }} personnage{{ current.characters.length > 1 ? 's' : '' }}</span>
      </div>
    </header>

    <!-- Grille de personnages -->
    <section class="char-grid">
      <button v-for="c in current.characters" :key="c.name" class="char-card" @click="openChar(c)">
        <div class="char-media">
          <img v-if="c.img" :src="asset(c.img)" :alt="c.alt" loading="lazy">
          <div v-else class="char-noimg" aria-hidden="true">✦</div>
        </div>
        <span class="char-name">{{ c.name }}</span>
      </button>
    </section>

    <!-- Fiche détaillée -->
    <transition name="modal">
      <div v-if="selected" class="char-modal" @click.self="closeChar">
        <div class="modal-card">
          <button class="modal-close" aria-label="Fermer" @click="closeChar">×</button>
          <div class="modal-media">
            <img v-if="selected.img" :src="asset(selected.img)" :alt="selected.alt">
            <div v-else class="char-noimg big" aria-hidden="true">✦</div>
          </div>
          <div class="modal-body">
            <h2>{{ selected.name }}</h2>
            <span class="modal-region">{{ current.name }}</span>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="modal-desc" v-html="selected.html"></div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.perso {
  max-width: 1400px;
  margin: 0 auto;
  padding: clamp(16px, 3vw, 44px) clamp(10px, 3vw, 36px) 60px;
}

/* Emblèmes */
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
  width: 60px; height: 60px;
  border-radius: 50%;
  background: var(--glass);
  border: 2px solid var(--glass-border);
  cursor: pointer;
  padding: 6px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.25s ease;
}
.emblem img { width: 100%; height: 100%; object-fit: contain; }
.emblem-fallback { color: var(--accent); font-weight: 800; font-size: 1.3rem; }
.emblem:hover { transform: translateY(-3px); box-shadow: 0 0 12px rgba(126, 63, 242, 0.5); }
.emblem.active { border-color: rgba(0, 180, 255, 0.7); box-shadow: 0 0 16px rgba(0, 180, 255, 0.5); background: rgba(126, 63, 242, 0.22); }

/* En-tête région */
.region-header {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid var(--glass-border);
  min-height: 150px;
  display: flex; align-items: center; justify-content: center;
  text-align: center;
  margin: 16px 0 30px;
}
.region-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.5; }
.region-header-inner { position: relative; width: 100%; padding: 28px 20px; background: radial-gradient(ellipse at center, rgba(10, 0, 40, 0.7), rgba(10, 0, 40, 0.35)); }
.region-header h1 { font-size: clamp(1.8rem, 5vw, 3rem); margin: 0; text-shadow: 0 0 16px var(--accent-bright); letter-spacing: 1px; }
.region-count { color: var(--accent); font-weight: 600; }

/* Grille : portraits ENTIERS (non rognés) */
.char-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 18px;
}
.char-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-dark);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  padding: 0 0 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.char-card:hover { transform: translateY(-4px); box-shadow: 0 0 20px rgba(0, 180, 255, 0.3); border-color: rgba(0, 180, 255, 0.5); }
.char-media {
  aspect-ratio: 3 / 4;
  background: radial-gradient(ellipse at center, rgba(126, 63, 242, 0.12), rgba(0, 0, 0, 0.35));
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.char-media img { width: 100%; height: 100%; object-fit: contain; }  /* contain = art complet */
.char-noimg { font-size: 2.6rem; color: rgba(126, 63, 242, 0.5); }
.char-noimg.big { font-size: 5rem; }
.char-name {
  color: var(--accent);
  font-weight: 700;
  font-size: 0.95rem;
  text-align: center;
  padding: 10px 8px 0;
  line-height: 1.25;
}

/* Fiche modale */
.char-modal {
  position: fixed;
  inset: 0;
  z-index: 20000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(3, 1, 12, 0.78);
  backdrop-filter: blur(6px);
}
.modal-card {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: 0;
  width: min(900px, 96vw);
  max-height: 88vh;
  background: #0b0620;
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(126, 63, 242, 0.3);
}
.modal-close {
  position: absolute;
  top: 10px; right: 12px;
  z-index: 2;
  width: 38px; height: 38px;
  border-radius: 50%;
  background: rgba(10, 0, 40, 0.7);
  border: 1px solid var(--glass-border);
  color: #fff;
  font-size: 1.4rem;
  line-height: 1;
  cursor: pointer;
}
.modal-close:hover { box-shadow: 0 0 12px rgba(0, 180, 255, 0.5); }
.modal-media {
  background: radial-gradient(ellipse at center, rgba(126, 63, 242, 0.18), rgba(0, 0, 0, 0.5));
  display: flex; align-items: center; justify-content: center;
  min-height: 260px;
}
.modal-media img { width: 100%; height: 100%; max-height: 88vh; object-fit: contain; }
.modal-body { padding: 26px 28px; overflow-y: auto; }
.modal-body h2 { color: var(--accent); font-size: clamp(1.4rem, 3vw, 2rem); text-shadow: 0 0 10px var(--accent); margin: 0 0 4px; }
.modal-region { display: inline-block; color: var(--accent-bright); font-weight: 600; margin-bottom: 16px; }
.modal-desc :deep(p) { color: var(--text); line-height: 1.7; margin: 0 0 14px; }

/* Transition modale */
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal-card, .modal-leave-active .modal-card { transition: transform 0.2s ease; }
.modal-enter-from .modal-card, .modal-leave-to .modal-card { transform: scale(0.95); }

@media (max-width: 760px) {
  .modal-card { grid-template-columns: 1fr; max-height: 90vh; }
  .modal-media { max-height: 42vh; }
  .modal-media img { max-height: 42vh; }
}
@media (max-width: 520px) {
  .char-grid { grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; }
}
</style>
