<script setup>
defineProps({
  title: { type: String, required: true },
  emoji: { type: String, default: '✨' },
})
</script>

<template>
  <section class="wip">
    <div class="wip-emoji">{{ emoji }}</div>
    <h1>{{ title }}</h1>
    <p>Cette page est en cours de portage vers la nouvelle interface Vue.</p>
    <p class="hint">Le contenu original reste accessible sur le site principal en attendant.</p>
  </section>
</template>

<style scoped>
.wip {
  max-width: 720px;
  margin: 0 auto;
  padding: clamp(60px, 12vw, 140px) 24px;
  text-align: center;
}
.wip-emoji { font-size: clamp(3rem, 10vw, 5rem); filter: drop-shadow(0 0 16px var(--accent-bright)); }
.wip h1 { font-size: clamp(1.8rem, 5vw, 2.8rem); text-shadow: 0 0 12px var(--accent-bright); }
.wip p { color: var(--text); font-size: 1.05rem; line-height: 1.6; }
.wip .hint { color: #7fa8d8; font-size: 0.9rem; margin-top: 24px; }
</style>
