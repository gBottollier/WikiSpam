<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { eras } from '../data/chronologie.js'
import { asset } from '../lib/assets.js'

const activeEra = ref(eras[0].id)
let observer = null

function goToEra(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function formatYear(y) {
  const n = Number(y)
  if (Number.isNaN(n)) return y
  return n < 0 ? `An ${n}` : `An ${n}`
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) activeEra.value = e.target.id
      }
    },
    { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
  )
  eras.forEach((e) => {
    const el = document.getElementById(e.id)
    if (el) observer.observe(el)
  })
})
onBeforeUnmount(() => observer && observer.disconnect())
</script>

<template>
  <div class="chrono">
    <!-- Era navigation -->
    <nav class="era-nav" aria-label="Navigation des ères">
      <button
        v-for="e in eras"
        :key="e.id"
        class="era-dot"
        :class="{ active: e.id === activeEra }"
        :title="e.title"
        @click="goToEra(e.id)"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
        </svg>
        <span class="era-dot-label">{{ e.title }}</span>
      </button>
    </nav>

    <div class="timeline">
      <section
        v-for="era in eras"
        :id="era.id"
        :key="era.id"
        class="era"
      >
        <!-- Era header -->
        <header class="era-header">
          <img v-if="era.bg" :src="asset(era.bg)" :alt="era.title" class="era-bg" loading="lazy">
          <div class="era-header-inner">
            <h2>{{ era.title }}</h2>
            <span class="era-date">{{ era.date }}</span>
            <span v-if="era.duration" class="era-duration">{{ era.duration }}</span>
          </div>
        </header>

        <!-- Events -->
        <div class="events">
          <article
            v-for="(ev, i) in era.events"
            :key="ev.year + ev.title"
            class="event"
            :class="{ right: i % 2 === 1 }"
          >
            <div class="event-node" aria-hidden="true"></div>
            <div class="event-card">
              <span class="event-year">{{ formatYear(ev.year) }}</span>
              <h3 class="event-title">{{ ev.title }}</h3>
              <img
                v-if="ev.kingImg"
                :src="asset(ev.kingImg)"
                :alt="ev.kingAlt || ''"
                class="king-img"
                loading="lazy"
              >
              <p v-for="(p, j) in ev.paragraphs" :key="j" class="event-desc">{{ p }}</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.chrono { position: relative; }

/* ---------- Era nav ---------- */
.era-nav {
  position: fixed;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 14px;
  z-index: 50;
}
.era-dot {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  color: #6f86b8;
  border-radius: 50%;
  width: 44px; height: 44px;
  padding: 0;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.25s ease;
  justify-content: center;
  position: relative;
}
.era-dot .era-dot-label {
  position: absolute;
  left: 54px;
  white-space: nowrap;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--accent);
  background: var(--bg-dark);
  border: 1px solid var(--glass-border);
  padding: 4px 10px;
  border-radius: 8px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}
.era-dot:hover .era-dot-label { opacity: 1; }
.era-dot:hover,
.era-dot.active {
  color: #fff;
  border-color: rgba(0, 180, 255, 0.6);
  box-shadow: 0 0 14px rgba(0, 180, 255, 0.5);
  background: rgba(126, 63, 242, 0.25);
}

/* ---------- Timeline ---------- */
.timeline {
  position: relative;
  max-width: 1500px;
  margin: 0 auto;
  padding: clamp(20px, 3vw, 50px) clamp(8px, 2.5vw, 32px) 70px;
}
.timeline::before {
  content: '';
  position: absolute;
  top: 0; bottom: 0;
  left: 50%;
  width: 3px;
  transform: translateX(-50%);
  background: linear-gradient(180deg, rgba(0, 180, 255, 0.1), var(--accent-bright), rgba(0, 180, 255, 0.1));
  opacity: 0.5;
}

.era { scroll-margin-top: calc(var(--nav-h) + 16px); margin-bottom: 40px; }

.era-header {
  position: relative;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid var(--glass-border);
  margin-bottom: 30px;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.era-bg {
  position: absolute;
  inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  opacity: 0.45;
  filter: saturate(120%);
}
.era-header-inner {
  position: relative;
  padding: 28px 20px;
  background: radial-gradient(ellipse at center, rgba(10, 0, 40, 0.7), rgba(10, 0, 40, 0.35));
  width: 100%;
}
.era-header h2 { font-size: clamp(1.5rem, 4vw, 2.4rem); text-shadow: 0 0 14px var(--accent-bright); margin: 0; letter-spacing: 1px; }
.era-date { display: block; color: var(--accent); font-weight: 600; margin-top: 6px; }
.era-duration { display: block; color: #9fc4ec; font-size: 0.85rem; }

/* Events */
.events { position: relative; display: flex; flex-direction: column; gap: 24px; }
.event { position: relative; width: 50%; padding-right: 26px; }
.event.right { margin-left: 50%; padding-right: 0; padding-left: 26px; }
.event-node {
  position: absolute;
  top: 22px;
  right: -7px;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: var(--cyan);
  box-shadow: 0 0 12px var(--cyan);
}
.event.right .event-node { right: auto; left: -7px; }

.event-card {
  background: var(--bg-dark);
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  padding: 20px 22px;
  box-shadow: 0 0 18px rgba(126, 63, 242, 0.18);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.event-card:hover { transform: translateY(-3px); box-shadow: 0 0 22px rgba(0, 180, 255, 0.35); }
.event-year {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 700;
  color: #fff;
  background: rgba(126, 63, 242, 0.35);
  border: 1px solid var(--glass-border);
  padding: 2px 10px;
  border-radius: 20px;
  margin-bottom: 8px;
}
.event-title { color: var(--accent); font-size: 1.2rem; margin: 0 0 10px; text-shadow: 0 0 8px rgba(0, 180, 255, 0.4); }
.event-desc { color: var(--text); line-height: 1.65; margin: 0 0 12px; font-size: 0.96rem; }
.king-img {
  float: right;
  width: 130px;
  border-radius: 10px;
  margin: 0 0 10px 16px;
  border: 1px solid var(--glass-border);
  box-shadow: 0 0 12px rgba(126, 63, 242, 0.4);
}

/* ---------- Mobile ---------- */
@media (max-width: 820px) {
  .era-nav {
    flex-direction: row;
    left: 50%;
    top: auto;
    bottom: calc(var(--bottom-nav-h) + 12px);
    transform: translateX(-50%);
    gap: 10px;
    background: var(--bg-dark);
    padding: 8px 12px;
    border-radius: 30px;
    border: 1px solid var(--glass-border);
  }
  .era-dot { width: 38px; height: 38px; }
  .era-dot .era-dot-label { display: none; }

  .timeline::before { left: 13px; }
  .event, .event.right { width: 100%; margin-left: 0; padding-left: 30px; padding-right: 0; }
  .event-node, .event.right .event-node { left: 6px; right: auto; }
  .king-img { float: none; display: block; width: 100%; max-width: 220px; margin: 0 auto 14px; }
}
</style>
