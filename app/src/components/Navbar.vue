<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink } from 'vue-router'
import { asset } from '../lib/assets.js'

const links = [
  { to: '/chronologie', label: 'Chronologie', icon: '📜', short: 'Chrono' },
  { to: '/race', label: 'Races', icon: '🐉', short: 'Race' },
  { to: '/personnage', label: 'Personnages', icon: '👤', short: 'Perso' },
  { to: '/carte', label: 'Carte', icon: '🏰', short: 'Carte' },
]
const logo = asset('img/spam_lore.webp')

const hidden = ref(false)     // desktop nav slides up on scroll down
const showBtn = ref(false)    // butterfly scroll-to-top
const flying = ref(false)
let lastScroll = 0
let timer = null

function onScroll() {
  const y = window.pageYOffset
  const vh = window.innerHeight
  hidden.value = y > lastScroll && y > vh
  const shouldShow = y > vh
  if (shouldShow) {
    if (!timer && !showBtn.value) {
      timer = setTimeout(() => { showBtn.value = true; timer = null }, 400)
    }
  } else {
    clearTimeout(timer); timer = null
    showBtn.value = false
  }
  lastScroll = y
}

function flyUp() {
  flying.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
  setTimeout(() => { flying.value = false; showBtn.value = false }, 1000)
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(() => { window.removeEventListener('scroll', onScroll); clearTimeout(timer) })
</script>

<template>
  <!-- Desktop navbar -->
  <nav class="navbar" :class="{ 'nav-hidden': hidden }">
    <div class="nav-content">
      <RouterLink v-for="l in links.slice(0, 2)" :key="l.to" :to="l.to" class="nav-item">
        {{ l.label }}
      </RouterLink>

      <div class="center-icon">
        <RouterLink to="/"><img :src="logo" alt="SPAM LORE" class="logo"></RouterLink>
      </div>

      <RouterLink v-for="l in links.slice(2)" :key="l.to" :to="l.to" class="nav-item">
        {{ l.label }}
      </RouterLink>
    </div>
  </nav>

  <!-- Bottom navbar (mobile) -->
  <nav class="bottom-nav">
    <RouterLink v-for="l in links.slice(0, 2)" :key="l.to" :to="l.to">
      <i class="icon">{{ l.icon }}</i><span>{{ l.short }}</span>
    </RouterLink>
    <RouterLink to="/" class="center-icon">
      <img :src="logo" alt="SPAM LORE" class="bottom-logo">
    </RouterLink>
    <RouterLink v-for="l in links.slice(2)" :key="l.to" :to="l.to">
      <i class="icon">{{ l.icon }}</i><span>{{ l.short }}</span>
    </RouterLink>
  </nav>

  <!-- Butterfly scroll-to-top -->
  <div
    v-show="showBtn"
    class="butterfly-btn"
    :class="{ 'fly-top': flying }"
    :style="{ backgroundImage: `url(${asset('img/papillon.webp')})` }"
    role="button"
    aria-label="Remonter en haut"
    @click="flyUp"
  ></div>
</template>

<style scoped>
/* ---------- Desktop ---------- */
.navbar {
  position: sticky;
  top: 0;
  display: flex;
  justify-content: center;
  align-items: stretch;
  width: 100%;
  height: var(--nav-h);
  background: var(--glass);
  backdrop-filter: blur(14px) saturate(160%);
  border-bottom: 1px solid var(--glass-border);
  box-shadow: 0 4px 22px rgba(0, 0, 40, 0.6);
  z-index: 1000;
  overflow: hidden;
  transition: transform 0.35s ease;
}
.navbar.nav-hidden { transform: translateY(-100%); }

.nav-content {
  display: flex;
  width: 90%;
  max-width: 1600px;
  align-items: stretch;
}
.nav-item,
.center-icon {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: var(--accent);
  font-weight: 600;
  font-size: clamp(1rem, 1.2vw, 1.4rem);
  position: relative;
  transition: all 0.25s ease;
}
.nav-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--accent), var(--accent-bright), var(--cyan));
  transform: translateX(-50%);
  transition: width 0.35s ease;
  opacity: 0.85;
}
.nav-item:hover {
  background: rgba(126, 63, 242, 0.08);
  box-shadow: 0 0 12px rgba(126, 63, 242, 0.5);
  text-shadow: 0 0 8px rgba(126, 63, 242, 0.7);
}
.nav-item:hover::after { width: 80%; }
.nav-item.router-link-active::after {
  width: 80%;
  background: linear-gradient(90deg, var(--cyan), var(--accent-bright), var(--accent));
  box-shadow: 0 0 8px rgba(126, 63, 242, 0.5);
}
.center-icon a { display: flex; align-items: center; justify-content: center; height: 100%; }
.center-icon img.logo {
  max-height: clamp(50px, 8vw, 90px);
  width: auto;
  filter: drop-shadow(0 0 8px rgba(126, 63, 242, 0.5));
  transition: transform 0.25s ease, filter 0.25s ease;
}
.center-icon:hover img.logo {
  transform: scale(1.08);
  filter: drop-shadow(0 0 12px rgba(0, 255, 255, 0.7));
}

/* ---------- Bottom nav (mobile) : barre flottante "pill" ---------- */
.bottom-nav {
  display: none;
  position: fixed;
  bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 24px);
  max-width: 440px;
  height: 60px;
  padding: 0 8px;
  background: rgba(10, 0, 40, 0.6);
  backdrop-filter: blur(18px) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55), 0 0 20px rgba(126, 63, 242, 0.25);
  z-index: 10000;
  align-items: center;
  justify-content: space-around;
}
.bottom-nav a {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  text-decoration: none;
  color: #7fa0d8;
  font-weight: 700;
  font-size: 0.66rem;
  height: 46px;
  margin: 0 2px;
  border-radius: 18px;
  position: relative;
  transition: color 0.2s ease, background 0.2s ease;
}
.bottom-nav a .icon { font-style: normal; font-size: 1.2rem; line-height: 1; transition: transform 0.2s ease, filter 0.2s ease; }
.bottom-nav a.router-link-active {
  color: #fff;
  background: rgba(126, 63, 242, 0.28);
}
.bottom-nav a.router-link-active .icon {
  transform: translateY(-1px) scale(1.12);
  filter: drop-shadow(0 0 6px var(--cyan));
}
/* Logo central */
.bottom-nav .center-icon {
  flex: 0 0 auto;
  width: 52px;
  margin: 0 2px;
  background: transparent;
}
.bottom-nav .center-icon img.bottom-logo {
  max-height: 40px;
  width: auto;
  filter: drop-shadow(0 0 8px rgba(126, 63, 242, 0.55));
  transition: transform 0.2s ease;
}
.bottom-nav .center-icon:active img.bottom-logo { transform: scale(0.92); }
.bottom-nav .center-icon.router-link-active { background: transparent; }

/* ---------- Butterfly ---------- */
.butterfly-btn {
  position: fixed;
  bottom: 40px; right: 40px;
  width: 60px; height: 60px;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  cursor: pointer;
  z-index: 9999;
  transition: filter 0.3s;
}
.butterfly-btn:hover { filter: drop-shadow(0 0 12px var(--accent-bright)) brightness(1.2); }
.fly-top { animation: flyUp 1s forwards; }
@keyframes flyUp {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(-1000px) scale(0.5) rotate(720deg); opacity: 0; }
}

/* ---------- Responsive switch ---------- */
@media (max-width: 900px) {
  .navbar { display: none; }
  .bottom-nav { display: flex; }
  .butterfly-btn { bottom: calc(var(--bottom-nav-h) + 14px); right: 20px; }
}
</style>
