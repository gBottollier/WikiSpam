<script setup>
import { ref, onMounted } from 'vue'

const container = ref(null)

onMounted(() => {
  const el = container.value
  if (!el) return
  const frag = document.createDocumentFragment()
  const count = 200
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div')
    star.className = 'star'
    star.style.top = Math.random() * 100 + '%'
    star.style.left = Math.random() * 100 + '%'
    const size = Math.random() * 2 + 1
    star.style.width = size + 'px'
    star.style.height = size + 'px'
    star.style.opacity = String(Math.random() * 0.6 + 0.2)
    const duration = 5 + Math.random() * 15
    star.style.animationDuration = duration + 's'
    star.style.animationDelay = Math.random() * duration + 's'
    frag.appendChild(star)
  }
  el.appendChild(frag)
})
</script>

<template>
  <div ref="container" class="background-stars" aria-hidden="true"></div>
</template>

<style>
.background-stars {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}
.background-stars .star {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  width: 2px;
  height: 2px;
  animation: drift linear infinite;
}
@keyframes drift {
  0% { transform: translate(0, 0); opacity: 0.3; }
  50% { transform: translate(30px, -50px); opacity: 0.7; }
  100% { transform: translate(-30px, 50px); opacity: 0.3; }
}
</style>
