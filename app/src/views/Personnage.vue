<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { regions } from '../data/personnages.js'
import { REGION_BANNERS } from '../data/regionBanners.js'
import { asset } from '../lib/assets.js'

// ===== Voile de teasing =====
// Le jeu n'est pas sorti et les illustrations de cartes ne doivent pas fuiter :
// tant que TEASER vaut true, la page entiere est remplacee par le voile. Le
// reste de la page (regions, bandeaux, fiches) est intact dessous, il suffit de
// repasser TEASER a false le jour de la sortie.
//
// Important : les illustrations ne sont pas simplement floutees, elles ne sont
// PAS chargees. Un flou CSS se retire en deux clics dans les outils de
// developpement, et les images seraient quand meme telechargees ; ici il n'y a
// rien a devoiler dans la page.
const TEASER = true

// Phrase en clair, puis la meme intention en Oniyx (la police du lore) : qui
// veut la lire doit retrouver la police. Oniyx ne contient que les lettres,
// l'espace et le point, donc pas d'accents, pas d'apostrophes, pas de tirets.
const TEASER_CLEAR = 'Ils existent deja. Vous ne les verrez pas encore.'
const TEASER_RUNES = 'Six clefs dorment encore. Un seul sceau les retient toutes.'

// Le texte code ne s'affiche qu'une fois la police chargee : sinon il
// apparaitrait en clair et le secret tomberait tout seul.
const runesReady = ref(false)

const activeKey = ref(regions[0].key)
const current = computed(() => regions.find((r) => r.key === activeKey.value))
const selected = ref(null)   // personnage ouvert dans la fiche

// Bandeau de region : un decoupage de la carte du monde (genere par
// tools/make_region_banners.py), pas une illustration hors-carte. Deux formats
// figes dans le fichier — le navigateur n'en telecharge qu'un et n'a qu'une
// image a decoder, aucun calque ni filtre a recomposer a l'affichage.
const banner = computed(() => {
  const key = current.value.key
  if (!REGION_BANNERS.has(key)) return null
  return {
    desktop: asset(`img/region/banner/${key}.webp`),
    mobile: asset(`img/region/banner/${key}-m.webp`),
  }
})

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
// La police vit a la racine du site (partagee avec chronologie.html), donc on la
// charge via asset() plutot qu'avec un @font-face en dur : le chemin de base
// change entre le dev et GitHub Pages.
async function loadRunes() {
  if (!('FontFace' in window)) return
  try {
    const f = new FontFace('Oniyx', `url(${asset('font.otf')})`)
    await f.load()
    document.fonts.add(f)
    runesReady.value = true
  } catch {
    runesReady.value = false   // pas de police, pas de texte en clair
  }
}

onMounted(() => {
  if (TEASER) loadRunes()
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' })
</script>

<template>
  <section v-if="TEASER" class="teaser" aria-label="Personnages a venir">
    <!-- Page voilee tant que le jeu n'est pas sorti. Les tuiles du fond sont
         vides : elles donnent la silhouette d'une galerie sans rien en montrer. -->
    <div class="teaser-grid" aria-hidden="true">
      <span v-for="n in 24" :key="n" class="teaser-tile"></span>
    </div>
    <div class="teaser-veil" aria-hidden="true"></div>
    <div class="teaser-text">
      <p class="teaser-clear">{{ TEASER_CLEAR }}</p>
      <p v-if="runesReady" class="teaser-runes">{{ TEASER_RUNES }}</p>
    </div>
  </section>

  <div v-else class="perso">
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
      <!-- :key force le remplacement de <picture> au changement de region :
           modifier le srcset d'un <source> en place n'est pas toujours
           re-evalue par les navigateurs. -->
      <picture v-if="banner" :key="current.key">
        <source :srcset="banner.mobile" media="(max-width: 900px)">
        <img :src="banner.desktop" :alt="'Carte de ' + current.name" class="region-bg" decoding="async">
      </picture>
      <img v-else-if="current.bg" :src="asset(current.bg)" :alt="current.name" class="region-bg" loading="lazy">
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
/* ===== Voile de teasing =====
   Aucun filtre CSS ni backdrop-filter : les tuiles du fond sont deja vides,
   un simple aplat sombre par-dessus suffit et ne coute rien a repeindre. */
.teaser {
  position: relative;
  min-height: calc(100vh - var(--nav-h) - 40px);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: clamp(20px, 6vw, 60px);
}
.teaser-grid {
  position: absolute;
  inset: -10%;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  align-content: start;
  gap: 18px;
  opacity: 0.5;
}
.teaser-tile {
  /* Meme silhouette que les vraies cartes (.char-media) : on reconnait une
     galerie de personnages sans qu'il y ait quoi que ce soit a voir. */
  aspect-ratio: 3 / 4;
  border-radius: 16px;
  border: 1px solid var(--glass-border);
  background: linear-gradient(160deg, rgba(126, 63, 242, 0.16), rgba(0, 180, 255, 0.05));
}
.teaser-veil {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at center, rgba(10, 0, 40, 0.86), rgba(4, 0, 16, 0.97) 70%);
}
.teaser-text {
  position: relative;
  text-align: center;
  max-width: 880px;
}
.teaser-clear {
  margin: 0 0 clamp(20px, 4vw, 36px);
  color: var(--text);
  font-size: clamp(0.95rem, 2.4vw, 1.35rem);
  letter-spacing: 2px;
  text-transform: uppercase;
  opacity: 0.75;
}
/* Le texte code est la piece maitresse : nettement plus grand que la phrase en
   clair, et lisible seulement pour qui retrouve la police du lore. */
.teaser-runes {
  margin: 0;
  font-family: 'Oniyx', serif;
  font-size: clamp(1.9rem, 6.5vw, 4rem);
  line-height: 1.5;
  color: #d9ecff;
  text-shadow: 0 0 18px rgba(126, 63, 242, 0.75), 0 0 42px rgba(0, 180, 255, 0.35);
  animation: rune-pulse 7s ease-in-out infinite;
}
@keyframes rune-pulse {
  0%, 100% { opacity: 0.72; }
  50% { opacity: 1; }
}

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
  min-height: 180px;
  display: flex; align-items: center; justify-content: center;
  text-align: center;
  margin: 16px 0 30px;
}
/* Le bandeau est deja desature/assombri a la generation : pas d'opacite ni de
   filtre CSS ici, qui se repaieraient a chaque repaint. */
.region-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
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
