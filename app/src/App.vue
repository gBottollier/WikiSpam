<script setup>
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
import BackgroundStars from './components/BackgroundStars.vue'

const route = useRoute()
const showNav = computed(() => !route.meta.hideNav)
</script>

<template>
  <BackgroundStars />
  <Navbar v-if="showNav" />
  <main class="app-main">
    <RouterView v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </RouterView>
  </main>
</template>

<style>
.app-main { position: relative; z-index: 1; }

.fade-enter-active,
.fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
